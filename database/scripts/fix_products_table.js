const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixProductsTable() {
  try {
    console.log('Fixing products table: Adding missing columns...');
    
    // Add reviews_data column
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS reviews_data JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('- reviews_data column added (or already exists).');

    // Add is_new column
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
    `);
    console.log('- is_new column added (or already exists).');

    // Ensure specs is JSONB (it should be, but let's be safe)
    await pool.query(`
      ALTER TABLE products 
      ALTER COLUMN specs SET DATA TYPE JSONB USING specs::jsonb;
    `);
    console.log('- specs column type verified.');

    console.log('Database fix completed successfully.');
  } catch (err) {
    console.error('Error fixing products table:', err);
  } finally {
    await pool.end();
  }
}

fixProductsTable();
