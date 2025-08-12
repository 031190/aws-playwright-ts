# Lambda SQS Testing Framework - Complete Overview

## 🎯 **Framework Purpose**

This is a comprehensive TypeScript testing framework designed specifically for testing AWS Lambda functions triggered by SQS (Simple Queue Service) messages. It uses Playwright as the test runner and provides utilities for both local development (with LocalStack) and real AWS testing.

The framework addresses the complex challenges of testing serverless applications by providing:
- **End-to-end integration testing** for SQS → Lambda workflows
- **Performance and load testing** capabilities
- **Error handling validation** including dead letter queues
- **Multi-environment support** (LocalStack, AWS, framework-only testing)
- **Type-safe utilities** for test data generation and validation

## 🏗️ **Architecture Overview**

The framework follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│           Test Layer (Playwright)           │
│         Custom Fixtures & Tests            │
├─────────────────────────────────────────────┤
│        High-Level Testing Utilities        │
│            (LambdaTestSuite)               │
│     • End-to-end test orchestration       │
│     • Performance testing                 │
│     • Resource management                 │
├─────────────────────────────────────────────┤
│         Low-Level AWS Operations           │
│            (SQSTestHelper)                 │
│     • SQS message operations              │
│     • Lambda function invocation          │
│     • Queue management                    │
├─────────────────────────────────────────────┤
│    Test Data & Validation Utilities       │
│    (TestDataFactory, TestValidators)      │
│     • Test message generation             │
│     • Data validation                     │
│     • Mock AWS services                   │
├─────────────────────────────────────────────┤
│            AWS SDK v3 Layer                │
│      (SQS Client, Lambda Client)          │
│     • Native AWS service integration      │
└─────────────────────────────────────────────┘
```

## 🔧 **Core Components**

### 1. **SQSTestHelper** (`src/sqs-test-helper.ts`)

Low-level AWS operations providing direct SQS and Lambda interactions.

**Key Capabilities:**
- Send/receive SQS messages with proper error handling
- Invoke Lambda functions directly with timeout management
- Manage queue attributes, purging, and status monitoring
- Handle AWS client configuration for both LocalStack and real AWS
- Support for dead letter queue operations

```typescript
// Example usage following framework patterns
const helper = new SQSTestHelper(awsConfig);

// Send message with validation
const messageId = await helper.sendMessage(queueUrl, messageBody, attributes);

// Direct Lambda invocation with performance tracking
const result = await helper.invokeLambda(functionName, sqsEvent);
expect(result.statusCode).toBe(200);
expect(result.executionTime).toBeLessThan(5000);
```

**Error Handling Pattern:**
```typescript
try {
  const result = await helper.sendMessage(queueUrl, messageBody);
  return result;
} catch (error) {
  const errorMessage = (error as Error).message;
  throw new Error(`SQS operation failed: ${errorMessage}`);
}
```

### 2. **LambdaTestSuite** (`src/lambda-test-suite.ts`)

High-level testing utilities that orchestrate complex testing scenarios.

**Key Capabilities:**
- End-to-end message processing workflows
- Performance and load testing with configurable parameters
- Error handling validation and recovery testing
- Resource cleanup and queue management
- Batch processing validation

```typescript
// Example usage with AAA pattern
test('should process order events end-to-end', async ({ sqsHelper, lambdaConfig }) => {
  // Arrange
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  await testSuite.purgeTestQueues();
  
  const orderData = TestDataFactory.createTestMessage('order_event', {
    orderId: 'order-123',
    customerId: 'customer-456'
  });

  // Act
  const result = await testSuite.testSingleMessage({ 
    body: JSON.stringify(orderData) 
  });

  // Assert
  expect(result.messageId).toBeTruthy();
  expect(result.status).toBe('sent');
  
  await testSuite.waitForProcessing(5000);
  const queueStatus = await testSuite.getQueueStatus();
  expect(queueStatus.messagesInQueue).toBe(0);
});
```

**Performance Testing Pattern:**
```typescript
const performanceResult = await testSuite.testPerformance(100, {
  messageType: 'user_event',
  customData: { userId: 'perf-test-user' }
});

expect(performanceResult.successfulMessages).toBe(100);
expect(performanceResult.averageProcessingTime).toBeLessThan(1000);
```

### 3. **TestDataFactory** (`src/test-utilities.ts`)

Generates realistic test data that mirrors production message formats.

**Key Capabilities:**
- Create properly formatted SQS records and events
- Generate different message types with typed interfaces
- Create invalid messages for comprehensive error testing
- Mock AWS Lambda contexts for unit testing

```typescript
// Message type generation with strict typing
const userEvent = TestDataFactory.createTestMessage('user_event', {
  userId: 'test-123',
  action: 'login',
  timestamp: new Date().toISOString()
});

// SQS event creation for integration testing
const sqsEvent = TestDataFactory.createSQSEvent(3, {
  body: JSON.stringify(userEvent)
});

// Invalid message generation for error testing
const malformedMessage = TestDataFactory.createInvalidMessage('malformed_json');
const missingFieldsMessage = TestDataFactory.createInvalidMessage('missing_required_fields');
```

**Mock Service Pattern:**
```typescript
const mockContext = MockAWSServices.createLambdaContext({
  functionName: 'test-function',
  memoryLimitInMB: '256'
});

expect(mockContext.getRemainingTimeInMillis()).toBeGreaterThan(0);
```

### 4. **TestValidators** (`src/test-utilities.ts`)

Validation utilities for ensuring data integrity and performance compliance.

**Key Capabilities:**
- Validate SQS message structure with type safety
- Check processing time against SLA requirements
- Validate Lambda response formats
- Comprehensive error handling validation

```typescript
// SQS message validation
const isValidMessage = TestValidators.validateSQSMessage(sqsRecord);
expect(isValidMessage).toBe(true);

// Performance validation against SLA
const startTime = Date.now();
// ... processing ...
const endTime = Date.now();
const withinSLA = TestValidators.validateProcessingTime(startTime, endTime, 5000);
expect(withinSLA).toBe(true);

// Lambda response validation
const response = { statusCode: 200, body: 'Success' };
const isValidResponse = TestValidators.validateLambdaResponse(response);
expect(isValidResponse).toBe(true);
```

## 🧪 **Testing Patterns & Best Practices**

### **Custom Test Fixtures**

The framework extends Playwright with custom fixtures following dependency injection patterns:

```typescript
export const test = baseTest.extend<TestFixtures>({
  sqsHelper: async ({}, use) => {
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.AWS_ENDPOINT_URL,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
    };
    
    const helper = new SQSTestHelper(config);
    await use(helper);
    
    // Cleanup is handled automatically
    await helper.cleanup();
  },

  lambdaConfig: async ({}, use) => {
    const config: LambdaConfig = {
      functionName: process.env.LAMBDA_FUNCTION_NAME || 'test-function',
      region: process.env.AWS_REGION || 'us-east-1',
      timeout: parseInt(process.env.LAMBDA_TIMEOUT || '30000'),
      queueUrl: process.env.SQS_QUEUE_URL || 'http://localhost:4566/000000000000/test-queue',
      dlqUrl: process.env.SQS_DLQ_URL
    };
    
    await use(config);
  }
});
```

### **AAA Testing Pattern Implementation**

All tests strictly follow the Arrange-Act-Assert pattern with proper TypeScript typing:

```typescript
test('should handle batch processing with performance validation', async ({ sqsHelper, lambdaConfig }) => {
  // Arrange
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  await testSuite.purgeTestQueues();
  
  const batchSize = 5;
  const testMessages = Array.from({ length: batchSize }, (_, index) => 
    TestDataFactory.createTestMessage('order_event', {
      orderId: `batch-order-${index + 1}`,
      customerId: 'batch-customer-123'
    })
  );

  // Act
  const startTime = Date.now();
  const results = await testSuite.testBatchMessages(
    testMessages.map(msg => ({ body: JSON.stringify(msg) }))
  );
  const endTime = Date.now();

  // Assert
  expect(results).toHaveLength(batchSize);
  results.forEach(result => {
    expect(result.messageId).toBeTruthy();
    expect(result.status).toBe('sent');
  });
  
  const processingTime = endTime - startTime;
  expect(processingTime).toBeLessThan(10000); // 10 second SLA
  
  await testSuite.waitForProcessing(8000);
  const finalStatus = await testSuite.getQueueStatus();
  expect(finalStatus.messagesInQueue).toBe(0);
});
```

### **Error Handling Pattern**

Comprehensive error handling with typed exceptions:

```typescript
test('should handle invalid messages gracefully', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const invalidMessage = TestDataFactory.createInvalidMessage('malformed_json');
  
  try {
    const result = await testSuite.testErrorHandling({ body: invalidMessage });
    
    // Should handle error gracefully
    expect(result.messageId).toBeTruthy();
    
  } catch (error) {
    // Expected error path
    const errorMessage = (error as Error).message;
    expect(errorMessage).toBeTruthy();
    console.log('Handled expected error:', errorMessage);
  }
});
```

## 🌍 **Environment Support & Configuration**

### **Three Testing Modes with Environment Variables:**

#### **1. Framework Testing Only** ⚡
```bash
# .env configuration
NODE_ENV=test
# No AWS configuration needed
```

```typescript
// Tests run without any AWS dependencies
test('framework validation', async () => {
  const message = TestDataFactory.createTestMessage('test');
  const isValid = TestValidators.validateSQSMessage(
    TestDataFactory.createSQSRecord({ body: JSON.stringify(message) })
  );
  expect(isValid).toBe(true);
});
```

#### **2. LocalStack Testing** 🐳
```bash
# .env configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566
LAMBDA_FUNCTION_NAME=test-lambda-function
SQS_QUEUE_URL=http://localhost:4566/000000000000/test-queue
SQS_DLQ_URL=http://localhost:4566/000000000000/test-dlq
```

#### **3. Real AWS Testing** ☁️
```bash
# .env configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-real-access-key
AWS_SECRET_ACCESS_KEY=your-real-secret-key
LAMBDA_FUNCTION_NAME=your-production-function
SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789012/your-queue
SQS_DLQ_URL=https://sqs.us-east-1.amazonaws.com/123456789012/your-dlq
```

## 📊 **Comprehensive Test Types**

### **Integration Tests** (`tests/lambda-sqs-integration.spec.ts`)

Full end-to-end testing of SQS → Lambda workflows:

```typescript
test('complete integration workflow', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  // Test single message processing
  const singleResult = await testSuite.testSingleMessage({
    body: JSON.stringify(TestDataFactory.createTestMessage('user_event'))
  });
  expect(singleResult.status).toBe('sent');
  
  // Test batch processing
  const batchResults = await testSuite.testBatchMessages([
    { body: JSON.stringify(TestDataFactory.createTestMessage('order_event')) },
    { body: JSON.stringify(TestDataFactory.createTestMessage('notification')) }
  ]);
  expect(batchResults).toHaveLength(2);
  
  // Validate final state
  await testSuite.waitForProcessing(10000);
  const queueStatus = await testSuite.getQueueStatus();
  expect(queueStatus.messagesInQueue).toBe(0);
});
```

### **Performance Tests**

Load testing with configurable parameters and SLA validation:

```typescript
test('performance under load', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const messageCount = 50;
  const maxProcessingTime = 30000; // 30 second SLA
  
  const performanceResult = await testSuite.testPerformance(messageCount, {
    messageType: 'high_volume_event',
    customData: { batchId: `perf-test-${Date.now()}` }
  });
  
  expect(performanceResult.totalMessages).toBe(messageCount);
  expect(performanceResult.successfulMessages).toBe(messageCount);
  expect(performanceResult.failedMessages).toBe(0);
  expect(performanceResult.totalProcessingTime).toBeLessThan(maxProcessingTime);
  
  const avgTimePerMessage = performanceResult.averageProcessingTime;
  expect(avgTimePerMessage).toBeLessThan(1000); // 1 second per message SLA
});
```

### **Unit Tests** (`tests/framework-basic.spec.ts`)

Component validation without AWS dependencies:

```typescript
test('test data factory creates valid messages', async () => {
  const userEvent = TestDataFactory.createTestMessage('user_event', {
    userId: 'test-123',
    action: 'login'
  });
  
  expect(userEvent.type).toBe('user_event');
  expect(userEvent.userId).toBe('test-123');
  expect(userEvent.action).toBe('login');
  expect(userEvent.id).toBeTruthy();
  expect(userEvent.timestamp).toBeTruthy();
});

test('validators work correctly', async () => {
  const validResponse = { statusCode: 200, body: 'Success' };
  const invalidResponse = { body: 'Missing status code' };
  
  expect(TestValidators.validateLambdaResponse(validResponse)).toBe(true);
  expect(TestValidators.validateLambdaResponse(invalidResponse)).toBe(false);
});
```

### **Error Handling Tests**

Comprehensive error scenario validation:

```typescript
test('handles timeout scenarios', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  const timeoutMessage = TestDataFactory.createTestMessage('timeout_test', {
    simulateDelay: 45000 // Longer than Lambda timeout
  });

  try {
    const result = await testSuite.testWithTimeout({
      body: JSON.stringify(timeoutMessage)
    }, 5000); // 5 second test timeout
    
    expect(result.messageId).toBeTruthy();
    
  } catch (error) {
    const errorMessage = (error as Error).message;
    expect(errorMessage).toContain('timeout');
    console.log('Timeout handled correctly:', errorMessage);
  }
});
```

## 🔄 **Typical Test Workflow & Resource Management**

### **Complete Test Lifecycle**

```typescript
test('complete test lifecycle example', async ({ sqsHelper, lambdaConfig }) => {
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  
  // 1. Setup Phase - Clean environment
  await testSuite.purgeTestQueues();
  
  // 2. Data Preparation - Create realistic test data
  const testMessage = TestDataFactory.createTestMessage('order_event', {
    orderId: 'order-lifecycle-123',
    customerId: 'customer-lifecycle-456',
    amount: 299.99,
    items: [
      { sku: 'item-1', quantity: 2, price: 149.99 },
      { sku: 'item-2', quantity: 1, price: 149.99 }
    ]
  });
  
  // 3. Execution Phase - Send and process message
  const startTime = Date.now();
  const result = await testSuite.testSingleMessage({
    body: JSON.stringify(testMessage)
  });
  
  // 4. Immediate Validation - Check message sent successfully
  expect(result.messageId).toBeTruthy();
  expect(result.status).toBe('sent');
  expect(result.timestamp).toBeTruthy();
  
  // 5. Processing Validation - Wait for Lambda execution
  await testSuite.waitForProcessing(5000);
  const endTime = Date.now();
  
  // 6. Final State Validation - Verify processing completed
  const queueStatus = await testSuite.getQueueStatus();
  expect(queueStatus.messagesInQueue).toBe(0);
  expect(queueStatus.messagesInFlight).toBe(0);
  
  // 7. Performance Validation - Check SLA compliance
  const totalProcessingTime = endTime - startTime;
  expect(totalProcessingTime).toBeLessThan(10000); // 10 second SLA
  
  // 8. Cleanup Phase - Handled automatically by fixtures
  console.log(`Test completed successfully in ${totalProcessingTime}ms`);
});
```

## 🛠️ **Advanced Configuration Management**

### **Environment-Specific Configuration**

```typescript
interface LambdaConfig {
  functionName: string;
  region: string;
  timeout: number;
  queueUrl: string;
  dlqUrl?: string;
}

// Configuration factory pattern
class ConfigurationFactory {
  static createConfig(): LambdaConfig {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'test':
        return {
          functionName: 'test-function',
          region: 'us-east-1',
          timeout: 30000,
          queueUrl: 'http://localhost:4566/000000000000/test-queue',
          dlqUrl: 'http://localhost:4566/000000000000/test-dlq'
        };
      
      case 'development':
        return {
          functionName: process.env.LAMBDA_FUNCTION_NAME || 'dev-function',
          region: process.env.AWS_REGION || 'us-east-1',
          timeout: parseInt(process.env.LAMBDA_TIMEOUT || '30000'),
          queueUrl: process.env.SQS_QUEUE_URL!,
          dlqUrl: process.env.SQS_DLQ_URL
        };
      
      case 'production':
        return {
          functionName: process.env.LAMBDA_FUNCTION_NAME!,
          region: process.env.AWS_REGION!,
          timeout: parseInt(process.env.LAMBDA_TIMEOUT || '60000'),
          queueUrl: process.env.SQS_QUEUE_URL!,
          dlqUrl: process.env.SQS_DLQ_URL!
        };
      
      default:
        throw new Error(`Unknown environment: ${env}`);
    }
  }
}
```

## 🚀 **Key Benefits & Framework Advantages**

### **1. Comprehensive Testing Coverage**
- **Integration Testing**: End-to-end SQS → Lambda workflows
- **Performance Testing**: Load testing with configurable parameters
- **Error Handling**: Invalid messages, timeouts, and failure scenarios
- **Unit Testing**: Individual component validation without AWS dependencies

### **2. Developer Experience**
- **Type Safety**: Full TypeScript support with strict typing
- **Rich Tooling**: Playwright UI, debugging support, and detailed reporting
- **Clear Error Messages**: Descriptive failures with actionable information
- **Hot Reloading**: Fast feedback loops during development

### **3. Environment Flexibility**
- **LocalStack Integration**: Full local development environment
- **AWS Compatibility**: Seamless transition to real AWS testing
- **CI/CD Ready**: Framework-only tests that run without external dependencies
- **Multi-Environment**: Support for development, staging, and production

### **4. Production Readiness**
- **Realistic Scenarios**: Handles timeouts, retries, dead letter queues
- **Performance Monitoring**: Built-in SLA validation and metrics
- **Error Recovery**: Comprehensive error handling and recovery testing
- **Scalability**: Tests from single messages to high-volume scenarios

### **5. Maintenance & Extensibility**
- **Modular Design**: Clear separation of concerns with pluggable components
- **Extensible Patterns**: Easy to add new message types and test scenarios
- **Documentation**: Comprehensive inline documentation and examples
- **Best Practices**: Follows established testing patterns and TypeScript conventions

## 📈 **Framework Usage Patterns**

### **Common Test Scenarios**

```typescript
// Single message processing
await testSuite.testSingleMessage({ body: JSON.stringify(message) });

// Batch processing validation
await testSuite.testBatchMessages(messageArray);

// Performance testing with SLA validation
await testSuite.testPerformance(messageCount, options);

// Error handling and recovery
await testSuite.testErrorHandling(invalidMessage);

// Direct Lambda invocation
await sqsHelper.invokeLambda(functionName, sqsEvent);

// Dead letter queue validation
const dlqStatus = await testSuite.getDLQStatus();
```

### **Message Type Patterns**

```typescript
// User events
const userEvent = TestDataFactory.createTestMessage('user_event', {
  userId: 'user-123',
  action: 'profile_updated',
  metadata: { source: 'web_app' }
});

// Order processing
const orderEvent = TestDataFactory.createTestMessage('order_event', {
  orderId: 'order-456',
  customerId: 'customer-789',
  amount: 299.99,
  status: 'pending'
});

// Notification events
const notification = TestDataFactory.createTestMessage('notification', {
  recipient: 'user@example.com',
  subject: 'Order Confirmation',
  template: 'order_confirmation'
});
```

### **Resource Management Pattern**

```typescript
test.beforeEach(async ({ sqsHelper }) => {
  // Clean environment before each test
  const testSuite = new LambdaTestSuite(sqsHelper, lambdaConfig);
  await testSuite.purgeTestQueues();
  console.log('Test environment cleaned');
});

test.afterEach(async ({ sqsHelper }) => {
  // Optional: Additional cleanup if needed
  const helper = sqsHelper;
  await helper.cleanup();
  console.log('Test resources cleaned up');
});
```

This framework provides a complete solution for testing AWS Lambda functions triggered by SQS messages, covering everything from development through production validation with a focus on developer productivity, test reliability, and comprehensive coverage of real-world scenarios.