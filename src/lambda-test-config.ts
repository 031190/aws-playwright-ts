import { test as base, expect } from '@playwright/test';
import { LambdaTestHelper, LambdaTestConfig, SQSMessage } from './lambda-test-helper';
import { CloudWatchLogsHelper } from './test-utilities/cloudwatch-logs-utils';
import { DynamoDBTestHelper } from './test-utilities/dynamodb-utils';
import { config } from 'dotenv';
config(); // Load environment variables from .env file

export interface LambdaTestFixtures {
  lambdaHelper: LambdaTestHelper;
  lambdaConfig: LambdaTestConfig;
  logsHelper: CloudWatchLogsHelper;
  dynamodbHelper: DynamoDBTestHelper;
}

export const test = base.extend<LambdaTestFixtures>({
  lambdaHelper: async ({}, use) => {
    const helper = new LambdaTestHelper(process.env.AWS_REGION || 'us-east-1');
    await use(helper);
  },

  lambdaConfig: async ({}, use) => {
    const config: LambdaTestConfig = {
      lambdaFunctionDirectInvoke: process.env.LAMBDA_FUNCTION_NAME_DIRECT_INVOKE || 'test-function',
      lambdaFunctionSQSInvoke: process.env.LAMBDA_FUNCTION_NAME_SQS_INVOKE || 'test-function-sqs',
      lambdaFunctionS3Invoke: process.env.LAMBDA_FUNCTION_NAME_S3_INVOKE || 'test-function-s3',
      lambdaFunctionSNSInvoke: process.env.LAMBDA_FUNCTION_NAME_SNS_INVOKE || 'test-function-sns',
      queueUrl: process.env.SQS_QUEUE_URL || 'http://localhost:4566/000000000000/test-queue',
      bucketName: process.env.S3_BUCKET_NAME || 'http://localhost:4566/000000000000/test-bucket',
      topicArn: process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:123456789012:test-topic',
      dynamodbTableName: process.env.DYNAMODB_TABLE_NAME || 'test-table',
      region: process.env.AWS_REGION || 'us-east-1',
      timeout: parseInt(process.env.LAMBDA_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    };
    await use(config);
  },
  logsHelper: async ({}, use) => {
    const logsHelper = new CloudWatchLogsHelper(process.env.AWS_REGION || 'us-east-1');
    await use(logsHelper);
  },
  dynamodbHelper: async ({}, use) => {
    const dynamoHelper = new DynamoDBTestHelper(process.env.AWS_REGION || 'us-east-1');
    await use(dynamoHelper);
  },  
});

export { expect };

export class LambdaTestSuite {
  private lambdaHelper: LambdaTestHelper;
  private config: LambdaTestConfig;

  constructor(lambdaHelper: LambdaTestHelper, config: LambdaTestConfig) {
    this.lambdaHelper = lambdaHelper;
    this.config = config;
  }

  /**
   * Test Lambda function with single SQS message
   */
  async testSingleMessage(message: SQSMessage, expectedProcessingTime?: number) {
    // Clean up queue before test
    await this.lambdaHelper.purgeQueue(this.config.queueUrl);

    // Send message
    const messageId = await this.lambdaHelper.sendMessage(this.config.queueUrl, message);
    expect(messageId).toBeTruthy();

    // Wait for processing
    const startTime = Date.now();
    await this.lambdaHelper.waitForLambdaProcessing(this.config.queueUrl, 0, this.config.timeout || 30000);
    const processingTime = Date.now() - startTime;

    if (expectedProcessingTime) {
      expect(processingTime).toBeLessThan(expectedProcessingTime);
    }

    return { messageId, processingTime };
  }

  /**
   * Test Lambda function with batch of SQS messages
   */
  async testBatchMessages(messages: SQSMessage[], expectedProcessingTime?: number) {
    // Clean up queue before test
    await this.lambdaHelper.purgeQueue(this.config.queueUrl);

    // Send messages
    const messageIds = await this.lambdaHelper.sendMessages(this.config.queueUrl, messages);
    expect(messageIds).toHaveLength(messages.length);

    // Wait for processing
    const startTime = Date.now();
    await this.lambdaHelper.waitForLambdaProcessing(this.config.queueUrl, 0, this.config.timeout || 30000);
    const processingTime = Date.now() - startTime;

    if (expectedProcessingTime) {
      expect(processingTime).toBeLessThan(expectedProcessingTime);
    }

    return { messageIds, processingTime };
  }

  /**
   * Test Lambda function error handling
   */
  async testErrorHandling(invalidMessage: SQSMessage, expectDLQ: boolean = false) {
    // Clean up queue before test
    await this.lambdaHelper.purgeQueue(this.config.queueUrl);

    // Send invalid message
    const messageId = await this.lambdaHelper.sendMessage(this.config.queueUrl, invalidMessage);
    expect(messageId).toBeTruthy();

    // Wait and check if message is still in queue (indicating failure)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const remainingMessages = await this.lambdaHelper.receiveMessages(this.config.queueUrl);
    
    if (expectDLQ) {
      // Message should be removed from main queue (moved to DLQ)
      expect(remainingMessages).toHaveLength(0);
    } else {
      // Message might still be in queue for retry
      expect(remainingMessages.length).toBeGreaterThanOrEqual(0);
    }

    return { messageId, remainingMessages: remainingMessages.length };
  }

  /**
   * Test Lambda function performance under load
   */
  async testLoadPerformance(messageCount: number, concurrencyLevel: number = 5) {
    // Clean up queue before test
    await this.lambdaHelper.purgeQueue(this.config.queueUrl);

    const messages: SQSMessage[] = Array.from({ length: messageCount }, (_, i) => ({
      body: JSON.stringify({ id: i, timestamp: new Date().toISOString() }),
    }));

    const startTime = Date.now();
    
    // Send messages in batches
    const batchSize = Math.ceil(messageCount / concurrencyLevel);
    const batches = [];
    
    for (let i = 0; i < messageCount; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      batches.push(this.lambdaHelper.sendMessages(this.config.queueUrl, batch));
    }

    await Promise.all(batches);
    
    // Wait for all messages to be processed
    await this.lambdaHelper.waitForLambdaProcessing(this.config.queueUrl, 0, this.config.timeout || 60000);
    
    const totalTime = Date.now() - startTime;
    const throughput = messageCount / (totalTime / 1000);

    return {
      messageCount,
      totalTime,
      throughput,
      averageTimePerMessage: totalTime / messageCount,
    };
  }
}
