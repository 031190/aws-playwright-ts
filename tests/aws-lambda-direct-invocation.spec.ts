import { test, expect } from '../src/lambda-test-config';
import { CloudWatchLogFilter } from '../src/test-utilities/cloudwatch-logs-utils';

// Direct lambda invoke
test('invoke lambda directly with AWS SDK', async ({ lambdaHelper, lambdaConfig, logsHelper }) => {

    // Arrange
    const payload = {
        key1: "value1",
        key2: "value2",
        key3: "value3"
    };

    const testLogFilter: CloudWatchLogFilter = {
        filterPattern: payload.key1,
        startTime: Date.now() - 1000, // 1 second ago
    };

    // Act
    const result = await lambdaHelper.invokeLambda(lambdaConfig.lambdaFunctionDirectInvoke, payload);
    const logs = await logsHelper.getLogEvents(lambdaConfig.lambdaFunctionDirectInvoke, testLogFilter);


    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.payload).toBeDefined();
    expect(result.payload).toEqual(payload.key1);
    expect(logs.length).toBeGreaterThan(0);
    console.log('How many logs found: ', logs.length);
    logs.forEach(event => {
        console.log("Log event timestamp: ", new Date(event.timestamp!).toISOString());
        expect(event.message).toContain(payload.key1);
    });
    console.log('Lambda response:', result.payload);
});