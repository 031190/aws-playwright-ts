import { test, expect } from '@playwright/test';
import { SqlServerTestHelper } from '../src/test-utilities/sqlserver-utils';

const sqlConfig = {
  user: 'sa',
  password: 'yourStrong(!)Password',
  server: 'localhost',
  port: 1433,
  database: 'master',
  options: {
    trustServerCertificate: true
  }
};

test.describe('SqlServerTestHelper Demo', () => {
  const sqlHelper = new SqlServerTestHelper(sqlConfig);

  test('should query SQL Server', async () => {
    const result = await sqlHelper.query('SELECT 1 AS value');
    expect(result[0].value).toBe(1);
  });
});
