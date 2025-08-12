import { test, expect } from '@playwright/test';
import { PostgresTestHelper } from '../src/test-utilities/postgres-utils';

const pgConfig = {
  user: 'postgres',
  password: 'yourpassword',
  host: 'localhost',
  port: 5432,
  database: 'postgres'
};

test.describe('PostgresTestHelper Demo', () => {
  const pgHelper = new PostgresTestHelper(pgConfig);

  test('should query PostgreSQL', async () => {
    const result = await pgHelper.query('SELECT 1 AS value');
    expect(result[0].value).toBe(1);
  });
});
