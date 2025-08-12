import { test, expect } from '../src/lambda-test-config';
import { CloudWatchLogFilter } from '../src/test-utilities/cloudwatch-logs-utils';
import { S3UploadObject } from '../src/lambda-test-helper';

// S3 file upload trigger Lambda test
test('upload file to S3 and verify Lambda processes it', async ({ lambdaHelper, lambdaConfig, logsHelper }) => {

    // Arrange
    const s3Object: S3UploadObject = {
        filename: `test-file-${Date.now()}.txt`,
        filecontent: `Test content for Lambda trigger - ${new Date().toISOString()}`,
    };

    const testLogFilter: CloudWatchLogFilter = {
        filterPattern: `"${s3Object.filename}"`, // Wrap in quotes to handle special characters "-"
        startTime: Date.now() - 1000
    };

    console.log('✓ Preparing to upload file to S3:', s3Object.filename);
    // Act
    const result = await lambdaHelper.uploadFileToS3(lambdaConfig.bucketName, s3Object);
    console.log('✓ File uploaded to S3:', result);
    console.log('✓ Waiting for Lambda to be processed, the queue to be empty and wait 10 seconds for logs to be created');
    const logs = await logsHelper.getLogEvents(lambdaConfig.lambdaFunctionS3Invoke, testLogFilter);
    console.log('✓ TEST', lambdaConfig.lambdaFunctionS3Invoke);

    // Assert
    expect(result).toBeDefined();
    expect(logs.length).toBeGreaterThan(0);
    logs.forEach(event => {
        console.log(`- ${event.message}`);
    });
});