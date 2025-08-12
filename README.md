# Lambda SQS Testing Framework

A comprehensive testing framework for AWS Lambda functions triggered via SQS using Playwright and TypeScript. This framework provides tools for testing Lambda functions both through direct invocation and SQS message processing scenarios.

## Features

- 🚀 **End-to-End Testing**: Test Lambda functions triggered by SQS,SNS,S3 messages
- 🎯 **Direct Invocation**: Test Lambda functions directly with custom payloads
- 🛠️ **Test Utilities**: Rich set of utilities for creating test data
- 📝 **TypeScript**: Full TypeScript support with type safety
- 🎭 **Playwright Integration**: Leverages Playwright's robust testing framework
- 📊 **Performance Testing**: Load testing and performance metrics collection

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- AWS account.
- Create .env file with AWS details ( credentials, lambdas/sqs/sns/s3 etc names
- Install playwright test extention

### Basic Framework Testing (No Docker Required)

You can test the framework utilities without Docker or AWS:

```bash
# Install dependencies
npm install

# Run basic framework tests`

### Configuration

Create a `.env` file based on `.env.example`:

```bash

SQS_QUEUE_URL=https://sqs.eu-north-1.amazonaws.com/171294308714/demo-sqs

LAMBDA_FUNCTION_NAME_SQS_INVOKE=HelloWorld

LAMBDA_FUNCTION_NAME_SNS_INVOKE=HelloWorld1

LAMBDA_FUNCTION_NAME_DIRECT_INVOKE=HelloWorld2

LAMBDA_FUNCTION_NAME_S3_INVOKE=HelloWorld3

S3_BUCKET_NAME=demomihail-bucket

SNS_TOPIC_ARN=arn:aws:sns:eu-north-1:171294308714:DemoTopic

DYNAMODB_TABLE_NAME=Demotable
# AWS Configuration
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Lambda Configuration
LAMBDA_FUNCTION_NAME_DIRECT_INVOKE=your-lambda-function-name-direct-invocation
LAMBDA_FUNCTION_NAME_SQS_INVOKE=your-lambda-function-name-triggered-by-sqs
LAMBDA_FUNCTION_NAME_SNS_INVOKE=your-lambda-function-name-triggered-by-sns
LAMBDA_FUNCTION_NAME_S3_INVOKE=your-lambda-function-name-triggered-by-s3

# SQS Configuration
SQS_QUEUE_URL=your-queue-url

# SNS Configuration
SNS_TOPIC_ARN=your-sns-topic

# S3 Configuration:
S3_BUCKET_NAME=your-s3-name

# DynamoDB Configuration:
DYNAMODB_TABLE_NAME=your-dynamo-db-table-name
```

## Usage

### Running Tests

```bash
# Run all tests
npm test

# Debug tests
npm run test:debug

# View test reports
npm run test:report
```

## Framework Components

### Core Classes

#### `LambdaTestHelper`
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

## Project Structure

```
lambda-sqs-testing-framework/
├── src/
│   ├── test-utilities      # Core AWS and Parsers etc utilities
│   ├── lambda-test-config.ts    # Init
│   └── lambda-test-helper.ts       # Test data and validation utilities
├── tests/
│   ├── aws-lambda-direct-invocation.spec.ts  # Direct invocation tests
│   └── rest of tests
├── .env.example               # Environment variables template
└── README.md                  # This file
```

## API Reference

### LambdaTestHelper Methods

- `sendMessage(queueUrl, message)` - Send a single message to SQS
- `sendMessages(queueUrl, messages)` - Send multiple messages to SQS
- `receiveMessages(queueUrl, maxMessages)` - Receive messages from SQS
- `deleteMessage(queueUrl, receiptHandle)` - Delete a message from SQS
- `purgeQueue(queueUrl)` - Remove all messages from queue
- `invokeLambda(functionName, payload)` - Invoke Lambda function directly
- `waitForLambdaProcessing(queueUrl, expectedCount, timeout)` - Wait for processing
