import { test, expect } from '../src/lambda-test-config';
import { SQSMessage } from '../src/lambda-test-helper';
import { CloudWatchLogFilter } from '../src/test-utilities/cloudwatch-logs-utils';
import { TestDataFactory, TestValidators, MockAWSServices } from '../src/test-utilities/test-utilities';

test('should invoke lambda function directly with SQS event', async ({ lambdaHelper, lambdaConfig, logsHelper }) => {
    
    // Arrange
    const sqsMessage : SQSMessage = {
        body: 'Test Mihail Lambda Framework'
    };

    const testLogFilter: CloudWatchLogFilter = {
        filterPattern: sqsMessage.body,
        startTime: Date.now() - 1000, // 1 second ago
    };
    
    // Act
    const result = await lambdaHelper.sendMessage(lambdaConfig.queueUrl, sqsMessage);
    console.log('✓ Message sent to SQS:', result);
    console.log('✓ Waiting for Lambda to be processed, the queue to be empty and wait 10 seconds for logs to be created');
    await lambdaHelper.waitForLambdaProcessing(lambdaConfig.queueUrl);
    console.log('✓ Lambda processing completed, getting CloudWatch logs');
    const logs = await logsHelper.getLogEvents(lambdaConfig.lambdaFunctionSQSInvoke, testLogFilter);

    // Assert
    expect(result).toBeDefined();
    expect(logs.length).toBeGreaterThan(0);
    logs.forEach(event => {
        console.log("Log event timestamp: ", new Date(event.timestamp!).toISOString());
        expect(event.message).toContain(sqsMessage.body);
    });
    console.log("How many times found: ", logs.length);
});
