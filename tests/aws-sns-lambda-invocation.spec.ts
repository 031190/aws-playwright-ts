import { test, expect } from '../src/lambda-test-config';
import { CloudWatchLogFilter } from '../src/test-utilities/cloudwatch-logs-utils';
import { SNSMessage } from '../src/lambda-test-helper';

test('should invoke lambda function directly with SNS event', async ({ lambdaHelper, lambdaConfig, logsHelper }) => {
    
    // Arrange
    const snsMessage: SNSMessage = {
        message: 'Test Mihail SNS Framework2'
    };

    const testLogFilter: CloudWatchLogFilter = {
        filterPattern: snsMessage.message,
        startTime: Date.now() - 1000, // 1 second ago
    };
    
    // Act
    const result = await lambdaHelper.publishSNSMessage(lambdaConfig.topicArn, snsMessage);
    console.log('✓ Message sent to SNS:', result);
    console.log('✓ Getting CloudWatch logs');
    const logs = await logsHelper.getLogEvents(lambdaConfig.lambdaFunctionSNSInvoke, testLogFilter);

    // Assert
    expect(result).toBeDefined();
    expect(logs.length).toBeGreaterThan(0);
    logs.forEach(event => {
        console.log("Log event timestamp: ", new Date(event.timestamp!).toISOString());
        expect(event.message).toContain(snsMessage.message);
    });
    console.log("How many times found: ", logs.length);
});