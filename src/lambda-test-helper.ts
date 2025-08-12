import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export interface SQSMessage {
  id?: string;
  body: string;
  attributes?: Record<string, string>;
  messageAttributes?: Record<string, any>;
}

export interface LambdaTestConfig {
  lambdaFunctionDirectInvoke: string;
  lambdaFunctionSQSInvoke: string;
  lambdaFunctionS3Invoke: string;
  lambdaFunctionSNSInvoke: string;
  queueUrl: string;
  bucketName: string;
  topicArn: string;
  dynamodbTableName: string;
  region?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface S3UploadObject {
  filename: string,
  filecontent: string,
};

export interface SNSMessage {
  message: string;
  subject?: string;
  attributes?: Record<string, any>;
}

export class LambdaTestHelper {
  private sqsClient: SQSClient;
  private lambdaClient: LambdaClient;
  private s3Client: S3Client;
  private snsClient: SNSClient;

  constructor(region: string = 'us-east-1') {
    this.sqsClient = new SQSClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
      endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    });

    this.lambdaClient = new LambdaClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
      endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    });

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
      endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    });

    this.snsClient = new SNSClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
      endpoint: process.env.AWS_ENDPOINT_URL || undefined,
    });
  }

  /**
   * Send a message to SQS queue
   */
  async sendMessage(queueUrl: string, message: SQSMessage): Promise<string> {
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: message.body,
      MessageAttributes: message.messageAttributes,
    });

    const response = await this.sqsClient.send(command);
    return response.MessageId || '';
  }

  /**
   * Send multiple messages to SQS queue
   */
  async sendMessages(queueUrl: string, messages: SQSMessage[]): Promise<string[]> {
    const messageIds = [];
    for (const message of messages) {
      const messageId = await this.sendMessage(queueUrl, message);
      messageIds.push(messageId);
    }
    return messageIds;
  }

  /**
   * Receive messages from SQS queue
   */
  async receiveMessages(queueUrl: string, maxMessages: number = 10): Promise<any[]> {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 1,
    });

    const response = await this.sqsClient.send(command);
    return response.Messages || [];
  }

  /**
   * Delete a message from SQS queue
   */
  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });

    await this.sqsClient.send(command);
  }

  /**
   * Purge all messages from SQS queue (for testing)
   */
  async purgeQueue(queueUrl: string): Promise<void> {
    let messages = await this.receiveMessages(queueUrl);
    while (messages.length > 0) {
      for (const message of messages) {
        await this.deleteMessage(queueUrl, message.ReceiptHandle);
      }
      messages = await this.receiveMessages(queueUrl);
    }
  }

  /**
   * Invoke Lambda function directly
   */
  async invokeLambda(functionName: string, payload: any): Promise<any> {
    const command = new InvokeCommand({
      FunctionName: functionName,
      Payload: JSON.stringify(payload),
    });

    const response = await this.lambdaClient.send(command);
    const responsePayload = response.Payload ?
      JSON.parse(new TextDecoder().decode(response.Payload)) : null;

    return {
      statusCode: response.StatusCode,
      payload: responsePayload,
      logResult: response.LogResult,
    };
  }

  /**
   * Wait for Lambda function to process SQS messages
   */
  async waitForLambdaProcessing(
    queueUrl: string,
    expectedMessageCount: number = 0,
    timeoutMs: number = 30000
  ): Promise<void> {
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 10000));

    while (Date.now() - startTime < timeoutMs) {
      const messages = await this.receiveMessages(queueUrl);
      if (messages.length === expectedMessageCount) {
        return;
      }
    }

    throw new Error(`Timeout waiting for Lambda processing. Expected ${expectedMessageCount} messages`);
  }

  /**
   * Upload a file to S3 and trigger Lambda function
   */
  async uploadFileToS3(bucketName: string, uploadObject: S3UploadObject): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: uploadObject.filename,
      Body: uploadObject.filecontent,
      ContentType: 'text/plain',
      Metadata: {
        'test-identifier': 'lambda-trigger-test'
      }
    });

    const response = await this.s3Client.send(command);
    return response.ETag || '';
  }

  /**
     * Publish a message to SNS topic
     */
  async publishSNSMessage(topicArn: string, message: SNSMessage): Promise<string> {
    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: message.message,
      Subject: message.subject,
      MessageAttributes: message.attributes,
    });

    const response = await this.snsClient.send(command);
    return response.MessageId || '';
  }
  /**
   * Delete file from S3 bucket (for cleanup after tests)
   */
  async deleteS3Object(bucketName: string, fileName: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName
    });

    await this.s3Client.send(command);
    console.log(`✓ Test file ${fileName} cleaned up from S3`);
  }
}
