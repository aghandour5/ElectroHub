const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function alterTables() {
  try {
    // Add new columns to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `);
    console.log('Successfully altered users table.');

    // Ensure status column exists in orders table (db_check confirmed it does exist, but good to be safe if checking constraints)
    // We already confirmed `status` exists as `character varying`.

  } catch (err) {
    console.error('Error altering tables:', err.message);
  } finally {
    await pool.end();
  }
}

alterTables();
