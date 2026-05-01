const { Pool } = require('pg'); // PostgreSQL client for Node.js
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false // For local development, set this to false. In production, ensure database has a valid SSL certificate.
  }
});

module.exports = pool;
