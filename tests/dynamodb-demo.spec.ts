//import { test, expect } from '@playwright/test';
import { test, expect } from '../src/lambda-test-config';
import { DynamoDBTestHelper } from '../src/test-utilities/dynamodb-utils';

test.describe('DynamoDBTestHelper Demo', ()  => {

  test('should put and get an item', async ({dynamodbHelper, lambdaConfig}) => {
    // Prepare item and key
    const item = DynamoDBTestHelper.toDynamoFormat({ poc_id: 'demo1', name: 'Test User', age: 42 });
    const key = DynamoDBTestHelper.toDynamoFormat({ poc_id: 'demo1' });

    // Put item
    await dynamodbHelper.putItem(lambdaConfig.dynamodbTableName, item);

    // Get item
    const result = await dynamodbHelper.getItem(lambdaConfig.dynamodbTableName, key);

    // Validate
    expect(result.Item).toBeTruthy();
    expect(result.Item?.poc_id?.S).toBe('demo1');
    expect(result.Item?.name?.S).toBe('Test User');
    expect(result.Item?.age?.N).toBe('42');
  });

  test('should scan table', async ({dynamodbHelper, lambdaConfig}) => {
    const scanResult = await dynamodbHelper.scan(lambdaConfig.dynamodbTableName );
    expect(scanResult.Items).toBeInstanceOf(Array);
  });
});