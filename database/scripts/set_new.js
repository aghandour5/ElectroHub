/**
 * Helper script to toggle the "NEW" badge on products.
 * Usage: node set_new.js <product_id> <true|false>
 */
const pool = require('../../config/db');

const id = process.argv[2];
const isNew = process.argv[3] === 'true';

if (!id) {
  console.log('Usage: node set_new.js <product_id> <true|false>');
  process.exit(1);
}

async function update() {
  try {
    const res = await pool.query('UPDATE products SET is_new = $1 WHERE id = $2 RETURNING name, is_new', [isNew, id]);
    if (res.rows.length === 0) {
      console.log('Product not found.');
    } else {
      console.log(`Updated: ${res.rows[0].name} | is_new: ${res.rows[0].is_new}`);
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

update();
