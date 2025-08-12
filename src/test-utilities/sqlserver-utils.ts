import sql from 'mssql';

export class SqlServerTestHelper {
  private config: sql.config;

  constructor(config: sql.config) {
    this.config = config;
  }

  async query<T = any>(queryString: string, params?: Record<string, any>): Promise<T[]> {
    const pool = await sql.connect(this.config);
    let request = pool.request();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        request = request.input(key, value);
      }
    }
    const result = await request.query(queryString);
    await pool.close();
    return result.recordset;
  }
}
