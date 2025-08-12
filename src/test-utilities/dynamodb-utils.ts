import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

export class DynamoDBTestHelper {
  private client: DynamoDBClient;

  constructor(region: string = 'us-east-1', endpoint?: string) {
    this.client = new DynamoDBClient({
      region,
      endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
      }
    });
  }

  async putItem(tableName: string, item: Record<string, any>) {
    const command = new PutItemCommand({
      TableName: tableName,
      Item: item
    });
    return this.client.send(command);
  }

  async getItem(tableName: string, key: Record<string, any>) {
    const command = new GetItemCommand({
      TableName: tableName,
      Key: key
    });
    return this.client.send(command);
  }

  async query(params: Omit<QueryCommand["input"], "TableName"> & { TableName: string }) {
    const command = new QueryCommand(params);
    return this.client.send(command);
  }

  async scan(tableName: string) {
    const command = new ScanCommand({ TableName: tableName });
    return this.client.send(command);
  }

  // Utility to convert JS object to DynamoDB attribute format
  static toDynamoFormat(data: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        result[key] = { S: value };
      } else if (typeof value === 'number') {
        result[key] = { N: value.toString() };
      } else if (typeof value === 'boolean') {
        result[key] = { BOOL: value };
      } else if (Array.isArray(value)) {
        // Recursively convert array elements
        result[key] = { L: value.map(v => {
          if (typeof v === 'string') return { S: v };
          if (typeof v === 'number') return { N: v.toString() };
          if (typeof v === 'boolean') return { BOOL: v };
          if (Array.isArray(v) || (v && typeof v === 'object')) return { M: DynamoDBTestHelper.toDynamoFormat(v) };
          return { NULL: true };
        }) };
      } else if (value && typeof value === 'object') {
        result[key] = { M: DynamoDBTestHelper.toDynamoFormat(value) };
      } else if (value === null || value === undefined) {
        result[key] = { NULL: true };
      }
    }
    return result;
  }
}
