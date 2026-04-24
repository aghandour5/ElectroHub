const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function testInsert() {
  try {
    const query = `
      INSERT INTO products (category_id, name, description, price, stock, image_path, is_featured, is_new, specs, reviews_data) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    const values = [1, 'Test', 'Desc', 10, 10, 'img.png', false, true, {}, []];
    await pool.query(query, values);
    console.log('Test INSERT successful!');
  } catch (err) {
    console.error('Test INSERT failed:');
    console.error(err);
  } finally {
    await pool.end();
  }
}

testInsert();
