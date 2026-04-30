const pool = require('./config/db');

async function check() {
  try {
    const res = await pool.query('SELECT id, name FROM products');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
