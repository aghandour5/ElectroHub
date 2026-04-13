const { Pool, Client } = require('pg');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  password: process.env.DB_PASSWORD || '793079',
  port: process.env.DB_PORT || 5432,
};

async function initializeDatabase() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    // Check if database exists, create if it doesn't
    const res = await client.query(`SELECT datname FROM pg_catalog.pg_database WHERE datname = 'auratech_db'`);
    if (res.rowCount === 0) {
      console.log('Database does not exist. Creating auratech_db...');
      await client.query(`CREATE DATABASE "auratech_db"`);
      console.log('Database auratech_db created successfully.');
    } else {
      console.log('Database auratech_db already exists.');
    }
  } catch (err) {
    console.error('Error ensuring database exists:', err);
  } finally {
    await client.end();
  }

  // Connect to the specific database to create tables
  const pool = new Pool({ ...dbConfig, database: 'auratech_db' });

  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      stock INTEGER DEFAULT 0,
      image_path VARCHAR(255),
      rating NUMERIC(2, 1) DEFAULT 0.0,
      is_featured BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255),
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      total_amount NUMERIC(10, 2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      shipping_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL,
      price NUMERIC(10, 2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('Creating tables...');
    await pool.query(createTablesSql);
    console.log('Tables created successfully.');

    // Seed Data
    console.log('Seeding initial data...');
    
    // Insert categories if empty
    const catCheck = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(catCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO categories (name, slug) VALUES 
        ('Computing', 'computing'),
        ('Acoustics', 'acoustics'),
        ('Mobile', 'mobile'),
        ('Wearables', 'wearables')
      `);

      // Insert dummy products matching the front-end
      await pool.query(`
        INSERT INTO products (category_id, name, description, price, stock, image_path, rating, is_featured) VALUES 
        ((SELECT id FROM categories WHERE slug='computing'), 'Quantum Book X1 Elite', 'Premium 14-inch computing companion with dedicated AI chips.', 1999.00, 50, 'laptop.png', 4.8, true),
        ((SELECT id FROM categories WHERE slug='acoustics'), 'Vortex Sound Pro', 'Next-gen noise-cancelling headphones.', 299.00, 200, 'headphones.png', 4.9, true),
        ((SELECT id FROM categories WHERE slug='mobile'), 'Aether Phone Zeta', 'A seamless mobile device.', 1199.00, 120, 'laptop.png', 4.5, true),
        ((SELECT id FROM categories WHERE slug='wearables'), 'Horizon Smart Wear', 'The smart wearable for the future.', 449.00, 300, 'hero.png', 4.7, true)
      `);
      console.log('Database seeded with standard categories and products.');
    } else {
      console.log('Categories already populated, skipping seed.');
    }

  } catch (err) {
    console.error('Error executing schema creation:', err);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
