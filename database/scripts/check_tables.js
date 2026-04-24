const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
  .then(res => {
    console.log("Tables in public schema:", res.rows.map(r => r.tablename));
    pool.end();
  })
  .catch(err => {
    console.error(err);
    pool.end();
  });
