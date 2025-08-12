# Lambda SQS Testing Framework

A comprehensive testing framework for AWS Lambda functions triggered via SQS using Playwright and TypeScript. This framework provides tools for testing Lambda functions both through direct invocation and SQS message processing scenarios.

## Features

- 🚀 **End-to-End Testing**: Test Lambda functions triggered by SQS messages
- 🎯 **Direct Invocation**: Test Lambda functions directly with custom payloads
- 📊 **Performance Testing**: Load testing and performance metrics collection
- 🔧 **Error Handling**: Test error scenarios and failure cases
- 🛠️ **Test Utilities**: Rich set of utilities for creating test data
- 🌐 **LocalStack Support**: Works with LocalStack for local development
- 📝 **TypeScript**: Full TypeScript support with type safety
- 🎭 **Playwright Integration**: Leverages Playwright's robust testing framework

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- AWS CLI configured (for real AWS testing)
- Docker (optional, for LocalStack/local testing)

### Basic Framework Testing (No Docker Required)

You can test the framework utilities without Docker or AWS:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run basic framework tests
npm run test:basic
```

### With LocalStack (Requires Docker)

If you have Docker installed:

1. Clone this repository or copy the framework files to your project
2. Install dependencies:

```bash
npm install
```

3. Set up your environment variables:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Build the project:

```bash
npm run build
```

### Configuration

Create a `.env` file based on `.env.example`:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# For LocalStack (local testing)
AWS_ENDPOINT_URL=http://localhost:4566

# Lambda Configuration
LAMBDA_FUNCTION_NAME=your-lambda-function-name

# SQS Configuration
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/your-queue
```

## Usage

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI mode
npm run test:ui

# Run tests in headed mode (with browser)
npm run test:headed

# Debug tests
npm run test:debug

# View test reports
npm run test:report
```

### Example Test Cases

#### Basic SQS Message Processing

```typescript
import { test, expect } from '../src/lambda-test-suite';
import { LambdaTestSuite } from '../src/lambda-test-suite';

test('should process SQS message', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const message = {
    body: JSON.stringify({
      userId: '12345',
      action: 'user_created',
    }),
  };

  const result = await testSuite.testSingleMessage(message);
  expect(result.messageId).toBeTruthy();
});
```

#### Performance Testing

```typescript
test('should handle load testing', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const result = await testSuite.testLoadPerformance(100, 10);
  
  expect(result.throughput).toBeGreaterThan(10); // messages per second
  expect(result.averageTimePerMessage).toBeLessThan(1000); // ms
});
```

#### Error Handling

```typescript
test('should handle invalid messages', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const invalidMessage = { body: 'invalid json {' };
  
  const result = await testSuite.testErrorHandling(invalidMessage);
  expect(result.messageId).toBeTruthy();
});
```

## Framework Components

### Core Classes

#### `SQSTestHelper`
Provides utilities for interacting with SQS and Lambda services:
- Send/receive messages
- Invoke Lambda functions
- Queue management
- Wait for processing completion

#### `LambdaTestSuite`
High-level testing utilities for common testing scenarios:
- Single message testing
- Batch message testing
- Error handling testing
- Performance testing

#### `TestDataFactory`
Utilities for creating test data:
- SQS records and events
- Test messages of different types
- Invalid messages for error testing

### Test Utilities

The framework includes comprehensive utilities for:

- **Message Creation**: Generate realistic SQS messages and events
- **Data Validation**: Validate message structure and responses
- **Performance Metrics**: Collect and analyze performance data
- **Error Simulation**: Create various error conditions for testing

## LocalStack Integration

For local development, you can use LocalStack to simulate AWS services:

1. Start LocalStack:

```bash
docker run --rm -it -p 4566:4566 -p 4571:4571 localstack/localstack
```

2. Create test resources:

```bash
# Create SQS queue
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name test-queue

# Create Lambda function (deploy your function to LocalStack)
aws --endpoint-url=http://localhost:4566 lambda create-function --function-name test-function --runtime nodejs18.x --role arn:aws:iam::123456789012:role/lambda-role --handler index.handler --zip-file fileb://function.zip
```

3. Update your `.env` file to use LocalStack endpoints

## Project Structure

```
lambda-sqs-testing-framework/
├── src/
│   ├── sqs-test-helper.ts      # Core SQS and Lambda utilities
│   ├── lambda-test-suite.ts    # High-level test suite
│   └── test-utilities.ts       # Test data and validation utilities
├── tests/
│   ├── lambda-sqs-integration.spec.ts    # Integration tests
│   ├── lambda-direct-invocation.spec.ts  # Direct invocation tests
│   └── test-utilities.spec.ts            # Utility tests
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json              # TypeScript configuration
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## API Reference

### SQSTestHelper Methods

- `sendMessage(queueUrl, message)` - Send a single message to SQS
- `sendMessages(queueUrl, messages)` - Send multiple messages to SQS
- `receiveMessages(queueUrl, maxMessages)` - Receive messages from SQS
- `deleteMessage(queueUrl, receiptHandle)` - Delete a message from SQS
- `purgeQueue(queueUrl)` - Remove all messages from queue
- `invokeLambda(functionName, payload)` - Invoke Lambda function directly
- `waitForLambdaProcessing(queueUrl, expectedCount, timeout)` - Wait for processing

### LambdaTestSuite Methods

- `testSingleMessage(message, expectedTime)` - Test single message processing
- `testBatchMessages(messages, expectedTime)` - Test batch processing
- `testErrorHandling(invalidMessage, expectDLQ)` - Test error scenarios
- `testLoadPerformance(messageCount, concurrency)` - Performance testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check that LocalStack is running and accessible
2. **Lambda Function Not Found**: Ensure the function exists and the name is correct
3. **Permission Denied**: Verify AWS credentials and IAM permissions
4. **Timeout Errors**: Increase timeout values in configuration

### Debug Mode

Run tests in debug mode to step through test execution:

```bash
npm run test:debug
```

### Logging

Enable detailed logging by setting environment variables:

```bash
DEBUG=true npm test
PLAYWRIGHT_DEBUG=1 npm test
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review test examples in the `tests/` directory
3. Create an issue in the repository
