import { SQSEvent, SQSRecord } from 'aws-lambda';

/**
 * Utility functions for creating test data and mocking AWS services
 */

export class TestDataFactory {
  /**
   * Create a mock SQS record
   */
  static createLambdaRecord() {
    const defaultRecord= {
      message: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      body: JSON.stringify({ key1: 'value1', key2: 'value2', key3: 'value3' }),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: Date.now().toString(),
        ApproximateFirstReceiveTimestamp: Date.now().toString(),
        SenderId: 'test-sender-id',
      } as any,
      messageAttributes: {},
      md5OfBody: 'test-md5-hash',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
      awsRegion: 'us-east-1',
    };

    return defaultRecord;
  }

  /**
   * Create a mock SQS record
   */
  static createSQSRecord(overrides: Partial<SQSRecord> = {}): SQSRecord {
    const defaultRecord: SQSRecord = {
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      receiptHandle: `receipt-${Date.now()}`,
      body: JSON.stringify({ test: 'data', timestamp: new Date().toISOString() }),
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: Date.now().toString(),
        ApproximateFirstReceiveTimestamp: Date.now().toString(),
        SenderId: 'test-sender-id',
      } as any,
      messageAttributes: {},
      md5OfBody: 'test-md5-hash',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:test-queue',
      awsRegion: 'us-east-1',
    };

    return { ...defaultRecord, ...overrides };
  }

  /**
   * Create a mock SQS event with multiple records
   */
  static createSQSEvent(recordCount: number = 1, recordOverrides: Partial<SQSRecord> = {}): SQSEvent {
    const records = Array.from({ length: recordCount }, () => 
      this.createSQSRecord(recordOverrides)
    );

    return { Records: records };
  }

  /**
   * Create test message with specific structure
   */
  static createTestMessage(type: 'user_event' | 'order_event' | 'notification', data: any = {}) {
    const baseMessage = {
      id: `${type}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type,
    };

    switch (type) {
      case 'user_event':
        return {
          ...baseMessage,
          userId: data.userId || '12345',
          action: data.action || 'created',
          metadata: data.metadata || {},
        };
      case 'order_event':
        return {
          ...baseMessage,
          orderId: data.orderId || 'order-123',
          customerId: data.customerId || 'customer-456',
          amount: data.amount || 100.00,
          status: data.status || 'pending',
        };
      case 'notification':
        return {
          ...baseMessage,
          recipient: data.recipient || 'user@example.com',
          subject: data.subject || 'Test Notification',
          body: data.body || 'This is a test notification',
          priority: data.priority || 'normal',
        };
      default:
        return { ...baseMessage, ...data };
    }
  }

  /**
   * Create invalid/malformed message for error testing
   */
  static createInvalidMessage(type: 'malformed_json' | 'missing_required_fields' | 'invalid_type') {
    switch (type) {
      case 'malformed_json':
        return 'invalid json { missing bracket';
      case 'missing_required_fields':
        return JSON.stringify({ id: 'missing-fields' }); // Missing required fields
      case 'invalid_type':
        return JSON.stringify({ type: 'unknown_type', data: {} });
      default:
        return 'unknown error type';
    }
  }
}

export class MockAWSServices {
  /**
   * Create a mock lambda context
   */
  static createLambdaContext(overrides: any = {}) {
    return {
      callbackWaitsForEmptyEventLoop: true,
      functionName: 'test-function',
      functionVersion: '$LATEST',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
      memoryLimitInMB: '128',
      awsRequestId: `request-${Date.now()}`,
      logGroupName: '/aws/lambda/test-function',
      logStreamName: `2023/01/01/[$LATEST]${Date.now()}`,
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
      ...overrides,
    };
  }

  /**
   * Mock SQS client responses
   */
  static mockSQSResponses = {
    sendMessage: {
      MessageId: 'mock-message-id',
      MD5OfBody: 'mock-md5-hash',
    },
    receiveMessage: {
      Messages: [
        {
          MessageId: 'mock-received-id',
          ReceiptHandle: 'mock-receipt-handle',
          Body: JSON.stringify({ test: 'received message' }),
          Attributes: {},
        },
      ],
    },
    deleteMessage: {},
  };

  /**
   * Mock Lambda client responses
   */
  static mockLambdaResponses = {
    invoke: {
      StatusCode: 200,
      Payload: JSON.stringify({ statusCode: 200, body: 'Success' }),
    },
  };
}

export class TestValidators {
  /**
   * Validate SQS message structure
   */
  static validateSQSMessage(message: any): boolean {
    const required = ['messageId', 'receiptHandle', 'body', 'eventSource'];
    return required.every(field => field in message);
  }

  /**
   * Validate Lambda response structure
   */
  static validateLambdaResponse(response: any): boolean {
    return 'statusCode' in response && typeof response.statusCode === 'number';
  }

  /**
   * Validate message processing time
   */
  static validateProcessingTime(startTime: number, endTime: number, maxTime: number): boolean {
    const processingTime = endTime - startTime;
    return processingTime <= maxTime;
  }
}
