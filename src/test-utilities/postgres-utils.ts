import { Client, ClientConfig } from 'pg';

export class PostgresTestHelper {
  private config: ClientConfig;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  async query<T = any>(queryString: string, params?: any[]): Promise<T[]> {
    const client = new Client(this.config);
    await client.connect();
    const result = await client.query(queryString, params);
    await client.end();
    return result.rows;
  }
}
