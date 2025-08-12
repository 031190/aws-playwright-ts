#!/usr/bin/env node

/**
 * Lambda SQS Testing Framework Demo
 * 
 * This script demonstrates the framework capabilities without requiring AWS or Docker
 */

const { TestDataFactory, TestValidators, MockAWSServices } = require('./dist/test-utilities');

console.log('🚀 Lambda SQS Testing Framework Demo\n');

// Demo 1: Create test messages
console.log('📝 Demo 1: Creating Test Messages');
console.log('================================');

const userEvent = TestDataFactory.createTestMessage('user_event', {
  userId: 'demo-user-123',
  action: 'login',
  metadata: { ip: '192.168.1.1' }
});

const orderEvent = TestDataFactory.createTestMessage('order_event', {
  orderId: 'order-456',
  customerId: 'customer-789',
  amount: 99.99
});

console.log('User Event:', JSON.stringify(userEvent, null, 2));
console.log('\nOrder Event:', JSON.stringify(orderEvent, null, 2));

// Demo 2: Create SQS records
console.log('\n📬 Demo 2: Creating SQS Records');
console.log('==============================');

const sqsRecord = TestDataFactory.createSQSRecord({
  body: JSON.stringify(userEvent)
});

console.log('SQS Record:', JSON.stringify(sqsRecord, null, 2));

// Demo 3: Validate data
console.log('\n✅ Demo 3: Data Validation');
console.log('==========================');

const isValidMessage = TestValidators.validateSQSMessage(sqsRecord);
console.log('SQS Record is valid:', isValidMessage);

// Demo 4: Create full SQS event
console.log('\n📋 Demo 4: Creating SQS Event');
console.log('=============================');

const sqsEvent = TestDataFactory.createSQSEvent(2, {
  body: JSON.stringify(orderEvent)
});

console.log(`SQS Event with ${sqsEvent.Records.length} records:`);
sqsEvent.Records.forEach((record, index) => {
  console.log(`  Record ${index + 1}: ${record.messageId}`);
});

// Demo 5: Mock Lambda context
console.log('\n⚡ Demo 5: Mock Lambda Context');
console.log('=============================');

const lambdaContext = MockAWSServices.createLambdaContext({
  functionName: 'demo-function'
});

console.log('Lambda Context:');
console.log(`  Function Name: ${lambdaContext.functionName}`);
console.log(`  Request ID: ${lambdaContext.awsRequestId}`);
console.log(`  Remaining Time: ${lambdaContext.getRemainingTimeInMillis()}ms`);

// Demo 6: Performance testing simulation
console.log('\n⏱️  Demo 6: Performance Simulation');
console.log('==================================');

const startTime = Date.now();
// Simulate processing
setTimeout(() => {
  const endTime = Date.now();
  const isWithinSLA = TestValidators.validateProcessingTime(startTime, endTime, 1000);
  console.log(`Processing took ${endTime - startTime}ms`);
  console.log(`Within 1000ms SLA: ${isWithinSLA}`);
}, 100);

// Demo 7: Error testing
console.log('\n❌ Demo 7: Error Testing');
console.log('========================');

const invalidMessages = [
  TestDataFactory.createInvalidMessage('malformed_json'),
  TestDataFactory.createInvalidMessage('missing_required_fields'),
  TestDataFactory.createInvalidMessage('invalid_type')
];

console.log('Invalid message examples:');
invalidMessages.forEach((msg, index) => {
  console.log(`  ${index + 1}. ${msg.substring(0, 50)}...`);
});

console.log('\n🎉 Demo Complete!');
console.log('\nNext steps:');
console.log('  1. Run framework tests: npm run test:basic');
console.log('  2. Install Docker and try LocalStack: npm run localstack:start');
console.log('  3. Create your own Lambda tests using the framework');
console.log('\nFor more information, see README.md and GETTING_STARTED.md');
