# Getting Started with Lambda SQS Testing Framework

This guide will help you get up and running with the Lambda SQS Testing Framework quickly.

## Prerequisites

- Node.js 16+ and npm
- Docker (for LocalStack) - **Install Docker Desktop from https://docker.com/get-started**
- AWS CLI (optional, for LocalStack setup)

## Setup Options

You have three options for testing:

### Option 1: Framework Testing Only (No Docker/AWS Required) ⚡
Test the framework utilities and data factories without any external dependencies.

### Option 2: LocalStack Testing (Requires Docker) 🐳
Test with a local AWS environment using LocalStack.

### Option 3: Real AWS Testing (Requires AWS Account) ☁️
Test against real AWS Lambda and SQS services.

---

## Option 1: Framework Testing Only (Fastest)

### 1. Install Dependencies
```bash
npm install
```

### 2. Build and Test
```bash
npm run build
npm run test:basic
```

This will run tests that validate:
- Test data factory utilities
- Message validation
- Mock AWS services
- Framework components

**Perfect for**: Learning the framework, CI/CD, development without AWS setup

---

## Option 2: LocalStack Testing (Recommended for Development)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
# For LocalStack (recommended for getting started):
# AWS_ENDPOINT_URL=http://localhost:4566
# AWS_ACCESS_KEY_ID=test
# AWS_SECRET_ACCESS_KEY=test
```

### 3. Start LocalStack (Recommended for Testing)

**Option A: Using Direct Docker Command (Recommended)**
```bash
npm run localstack:start
```

**Option B: Using Docker Compose (if you have docker-compose)**
```bash
npm run localstack:start-compose
```

**Option C: Manual Docker Command**
```bash
docker run --rm -d --name lambda-testing-localstack \
  -p 4566:4566 -p 4571:4571 \
  -e SERVICES=sqs,lambda,iam \
  -e DEBUG=1 \
  localstack/localstack
```

### 4. Wait for LocalStack and Setup Resources

```bash
# Wait a moment for LocalStack to start, then setup resources
sleep 10
npm run localstack:setup
```

### 5. Build and Setup

```bash
npm run setup
```

### 6. Run Your First Test

```bash
npm test
```

## Testing Without LocalStack (Using Real AWS)

If you prefer to test against real AWS services:

### 1. Configure AWS Credentials
```bash
# Set up AWS credentials
aws configure
# OR export environment variables:
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_REGION=us-east-1
```

### 2. Update .env File
```bash
# Remove or comment out the LocalStack endpoint
# AWS_ENDPOINT_URL=http://localhost:4566

# Set your real AWS configuration
AWS_REGION=us-east-1
LAMBDA_FUNCTION_NAME=your-actual-lambda-function
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/your-queue
```

### 3. Create AWS Resources
Create your Lambda function and SQS queue in the AWS console or using AWS CLI.

## Example Test

Here's a simple test to get you started:

```typescript
import { test, expect } from '../src/lambda-test-suite';
import { LambdaTestSuite } from '../src/lambda-test-suite';

test('my first lambda test', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const message = {
    body: JSON.stringify({
      userId: '12345',
      action: 'test_action',
    }),
  };

  const result = await testSuite.testSingleMessage(message);
  expect(result.messageId).toBeTruthy();
});
```

## Testing Your Own Lambda Function

### 1. Deploy Your Function to LocalStack

```bash
# Zip your function
zip function.zip index.js

# Create function in LocalStack
aws --endpoint-url=http://localhost:4566 lambda create-function \
  --function-name my-function \
  --runtime nodejs18.x \
  --role arn:aws:iam::000000000000:role/lambda-role \
  --handler index.handler \
  --zip-file fileb://function.zip
```

### 2. Update Environment Variables

```bash
# In your .env file
LAMBDA_FUNCTION_NAME=my-function
SQS_QUEUE_URL=http://localhost:4566/000000000000/my-queue
```

### 3. Create Your Test

```typescript
test('test my lambda function', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const result = await testSuite.testSingleMessage({
    body: JSON.stringify({ /* your test data */ }),
  });
  
  expect(result.processingTime).toBeLessThan(5000);
});
```

## Common Patterns

### Testing Different Message Types

```typescript
import { TestDataFactory } from '../src/test-utilities';

test('test user events', async ({ sqsHelper, lambdaConfig }) => {
  const userEvent = TestDataFactory.createTestMessage('user_event', {
    userId: 'test-123',
    action: 'created'
  });
  
  // Test the message...
});
```

### Performance Testing

```typescript
test('performance test', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const result = await testSuite.testLoadPerformance(50, 5);
  
  expect(result.throughput).toBeGreaterThan(10); // messages/sec
});
```

### Error Handling

```typescript
test('error handling', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const invalidMessage = { body: 'invalid json {' };
  
  await testSuite.testErrorHandling(invalidMessage);
});
```

## Troubleshooting

### LocalStack Not Starting
- Check Docker is running
- Ensure port 4566 is available
- Check logs: `npm run localstack:logs`

### Tests Failing
- Verify LocalStack is running and setup
- Check environment variables in `.env`
- Run tests in debug mode: `npm run test:debug`

### Function Not Found
- Ensure Lambda function is deployed to LocalStack
- Check function name in environment variables
- Verify IAM role exists

## Next Steps

1. **Read the full documentation** in README.md
2. **Explore example tests** in the `tests/` directory
3. **Check out the sample Lambda function** in `examples/`
4. **Customize the framework** for your specific needs

## Support

- Review the troubleshooting section
- Check existing test examples
- Read the API documentation in README.md

Happy testing! 🚀
