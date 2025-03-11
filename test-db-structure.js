const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

async function getTableStructure() {
  try {
    console.log('Connecting to database...');
    const pool = await sql.connect(dbConfig);
    console.log('Connected to database');

    // Get column information
    const result = await pool.request().query(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        CHARACTER_MAXIMUM_LENGTH,
        IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'ai_statistik'
      ORDER BY ORDINAL_POSITION;
    `);

    console.log('\nTable structure for ai_statistik:');
    console.table(result.recordset);

    await sql.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

getTableStructure();