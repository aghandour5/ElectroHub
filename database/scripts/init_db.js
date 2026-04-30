const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initializeDatabase() {
  // Connect to the Supabase database to create tables
  const pool = new Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  const createTablesSql = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      phone VARCHAR(40),
      address TEXT,
      reset_token VARCHAR(255),
      reset_token_expiry TIMESTAMP,
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
      brand VARCHAR(100),
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      stock INTEGER DEFAULT 0,
      image_path VARCHAR(255),
      rating NUMERIC(2, 1) DEFAULT 0.0,
      is_featured BOOLEAN DEFAULT false,
      is_new BOOLEAN DEFAULT false,
      specs JSONB DEFAULT '{}'::jsonb,
      reviews_data JSONB DEFAULT '[]'::jsonb,
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

    CREATE TABLE IF NOT EXISTS contact_messages (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      subject VARCHAR(255),
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupon_codes (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      discount_amount NUMERIC(10, 2) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      role VARCHAR(255),
      message TEXT NOT NULL,
      rating INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
      avatar_initials VARCHAR(5),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('Creating tables...');
    await pool.query(createTablesSql);
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(40);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS reviews_data JSONB DEFAULT '[]'::jsonb;
    `);
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
        ('Wearables', 'wearables'),
        ('Gaming & VR', 'gaming-vr'),
        ('Smart Home', 'smart-home')
      `);

      // Insert dummy products matching the front-end
      await pool.query(`
        INSERT INTO products (category_id, name, description, price, stock, image_path, rating, is_featured, specs) VALUES 
        ((SELECT id FROM categories WHERE slug='computing'), 'Quantum Book X1 Elite', 'Premium 14-inch computing companion with dedicated AI chips.', 1999.00, 50, 'laptop.png', 4.8, true, '{"Processor": "Aura M3 Ultra", "Memory": "32GB Unified", "Storage": "1TB SSD", "Display": "14.2\\" Liquid Retina"}'),
        ((SELECT id FROM categories WHERE slug='acoustics'), 'Vortex Sound Pro', 'Next-gen noise-cancelling headphones.', 299.00, 200, 'headphones.png', 4.9, true, '{"Type": "Over-Ear", "Battery": "Up to 40 hours", "Noise Cancellation": "Active Hybrid", "Drivers": "40mm Beryllium"}'),
        ((SELECT id FROM categories WHERE slug='mobile'), 'Aether Phone Zeta', 'A seamless mobile device.', 1199.00, 120, 'laptop.png', 4.5, true, '{"Processor": "Zeta A15 Bionic", "Display": "6.7\\" OLED 120Hz", "Camera": "Pro 48MP Triple", "Battery": "5000mAh"}'),
        ((SELECT id FROM categories WHERE slug='wearables'), 'Horizon Smart Wear', 'The smart wearable for the future.', 449.00, 300, 'hero.png', 4.7, true, '{"Sensors": "Heart Rate, SpO2, ECG", "Water Resistance": "50m", "Battery": "7 Days", "Compatibility": "iOS & Android"}')
      `);
      console.log('Database seeded with standard categories and products.');
    } else {
      console.log('Categories already populated, skipping seed.');
    }

    // Insert coupon codes if empty
    const couponCheck = await pool.query('SELECT COUNT(*) FROM coupon_codes');
    if (parseInt(couponCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO coupon_codes (code, discount_amount) VALUES 
        ('ELECTROHUB10', 50.00),
        ('WELCOME20', 100.00),
        ('SAVE15', 75.00)
      `);
      console.log('Coupon codes seeded.');
    }

    const testimonialCheck = await pool.query('SELECT COUNT(*) FROM testimonials');
    if (parseInt(testimonialCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO testimonials (name, role, message, rating, avatar_initials) VALUES
        ('Maya Haddad', 'Verified Customer', 'Fast delivery and the product pages made it easy to compare specs before checkout.', 5, 'MH'),
        ('Omar Karam', 'Audio Enthusiast', 'The cart and checkout flow were smooth, and my order updates were clear.', 5, 'OK'),
        ('Lina Farah', 'Tech Buyer', 'ElectroHub feels polished and trustworthy from browsing to post-purchase support.', 5, 'LF')
      `);
      console.log('Testimonials seeded.');
    }

    if (process.env.DEFAULT_ADMIN_EMAIL && process.env.DEFAULT_ADMIN_PASSWORD) {
      const adminName = process.env.DEFAULT_ADMIN_NAME || 'ElectroHub Admin';
      const adminHash = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD, 10);
      await pool.query(
        `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, 'admin')
         ON CONFLICT (email) DO UPDATE SET role = 'admin'`,
        [adminName, process.env.DEFAULT_ADMIN_EMAIL.toLowerCase(), adminHash]
      );
      console.log(`Admin account ready: ${process.env.DEFAULT_ADMIN_EMAIL}`);
    } else {
      console.log('Skipping admin bootstrap. Set DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD to create one.');
    }

  } catch (err) {
    console.error('Error executing schema creation:', err);
  } finally {
    await pool.end();
  }
}

initializeDatabase();
