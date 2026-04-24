/**
 * reseed_products.js
 * Purpose: Clears dummy products/categories and re-inserts real products
 *          that match the actual images in public/images/.
 * Run with: node database/scripts/reseed_products.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function reseed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Clearing old products, categories, and orders...');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM categories');

    console.log('Inserting categories...');
    await client.query(`
      INSERT INTO categories (name, slug) VALUES
      ('Computing', 'computing'),
      ('Acoustics', 'acoustics'),
      ('Mobile', 'mobile'),
      ('Wearables', 'wearables'),
      ('Gaming', 'gaming'),
      ('Smart Home', 'smart-home')
    `);

    console.log('Inserting real products...');
    await client.query(`
      INSERT INTO products (category_id, name, description, price, stock, image_path, rating, is_featured, specs) VALUES

      -- Computing
      ((SELECT id FROM categories WHERE slug='computing'),
        'MacBook Air M3', 'Apple MacBook Air with the blazing M3 chip. Incredibly thin, silent fanless design, and all-day battery life.', 1299.00, 30, 'macbook-air-m3.webp', 4.9, true,
        '{"Processor": "Apple M3", "Memory": "16GB Unified", "Storage": "512GB SSD", "Display": "15.3\\\" Liquid Retina", "Battery": "Up to 18 hours"}'),

      ((SELECT id FROM categories WHERE slug='computing'),
        'ASUS ROG Zephyrus', 'High-performance gaming laptop with a stunning OLED display and RTX 4070 GPU.', 1899.00, 20, 'Asus-Transparent.png', 4.8, true,
        '{"Processor": "AMD Ryzen 9", "GPU": "RTX 4070", "Memory": "32GB DDR5", "Storage": "1TB NVMe SSD", "Display": "16\\\" QHD OLED 165Hz"}'),

      ((SELECT id FROM categories WHERE slug='computing'),
        'Lenovo Legion 5', 'Powerful gaming laptop with exceptional thermals and vibrant display.', 1099.00, 25, 'legion.png', 4.7, true,
        '{"Processor": "Intel Core i7-13700H", "GPU": "RTX 4060", "Memory": "16GB DDR5", "Storage": "512GB SSD", "Display": "15.6\\\" FHD 144Hz"}'),

      ((SELECT id FROM categories WHERE slug='computing'),
        'Dell XPS 15 OLED', 'Professional ultrabook with a stunning OLED touch display and premium build quality.', 1899.99, 15, 'dell-xps-15.avif', 4.8, false,
        '{"Processor": "Intel Core i9-13900H", "GPU": "NVIDIA RTX 4060", "Memory": "32GB DDR5", "Storage": "1TB NVMe SSD", "Display": "15.6\\\" OLED Touch"}'),

      -- Acoustics
      ((SELECT id FROM categories WHERE slug='acoustics'),
        'Sony WH-1000XM5', 'Industry-leading noise cancelling headphones with exceptional sound quality and 30-hour battery.', 349.99, 80, 'sony-wh1000xm5.webp', 4.9, true,
        '{"Type": "Over-Ear", "Noise Cancellation": "Active (30 microphones)", "Battery": "30 hours", "Connectivity": "Bluetooth 5.2", "Quick Charge": "3 min = 3 hours"}'),

      ((SELECT id FROM categories WHERE slug='acoustics'),
        'Apple AirPods Pro (2nd Gen)', 'Active Noise Cancellation, Transparency mode, and Adaptive Audio in a compact design.', 249.00, 120, 'airpods-pro.webp', 4.8, true,
        '{"Type": "In-Ear TWS", "Noise Cancellation": "Adaptive ANC", "Battery": "6 hours (30 with case)", "Chip": "Apple H2", "Features": "Spatial Audio, Find My"}'),

      -- Mobile
      ((SELECT id FROM categories WHERE slug='mobile'),
        'iPhone 15 Pro', 'Apple iPhone 15 Pro with the A17 Pro chip, titanium design, and ProRes video.', 999.00, 60, 'iphone-15.webp', 4.9, true,
        '{"Processor": "Apple A17 Pro", "Display": "6.1\\\" Super Retina XDR", "Camera": "48MP Triple ProRes", "Battery": "Up to 23 hours", "Build": "Titanium"}'),

      ((SELECT id FROM categories WHERE slug='mobile'),
        'Samsung Galaxy S26 Ultra', 'The ultimate Samsung flagship with a built-in S Pen, 200MP camera, and AI features.', 1199.00, 45, 's26_ultra.png', 4.8, true,
        '{"Processor": "Snapdragon 8 Elite", "Display": "6.9\\\" Dynamic AMOLED 120Hz", "Camera": "200MP Quad", "Battery": "5000mAh 45W", "S Pen": "Included"}'),

      ((SELECT id FROM categories WHERE slug='mobile'),
        'Samsung Galaxy S24', 'Compact flagship with Galaxy AI, Snapdragon 8 Gen 3, and stunning AMOLED display.', 799.00, 70, 'samsung-s24.webp', 4.7, false,
        '{"Processor": "Snapdragon 8 Gen 3", "Display": "6.2\\\" Dynamic AMOLED 120Hz", "Camera": "50MP Triple", "Battery": "4000mAh 25W"}'),

      -- Wearables
      ((SELECT id FROM categories WHERE slug='wearables'),
        'Apple Watch Series 10', 'Thinnest Apple Watch ever with a larger display, advanced health sensors, and ECG.', 399.00, 90, 'apple-watch.webp', 4.8, true,
        '{"Display": "Always-On Retina", "Health": "ECG, Blood Oxygen, Temperature", "Battery": "18 hours", "Water Resistance": "50m", "Chip": "S9 SiP"}'),

      ((SELECT id FROM categories WHERE slug='wearables'),
        'Garmin Fenix 7X', 'Premium GPS multisport smartwatch built for the most demanding athletes.', 699.99, 35, 'garmin-fenix.webp', 4.7, false,
        '{"Battery": "Up to 37 days", "GPS": "Multi-band GPS", "Health": "Heart Rate, SpO2, Body Battery", "Material": "Titanium", "Water Resistance": "100m"}'),

      -- Gaming
      ((SELECT id FROM categories WHERE slug='gaming'),
        'PlayStation 5', 'Sony PS5 with ultra-high speed SSD, ray tracing, and 4K gaming at up to 120fps.', 499.99, 20, 'ps5.jpg', 4.9, true,
        '{"CPU": "AMD Zen 2 8-core", "GPU": "10.28 TFLOPS RDNA 2", "Storage": "825GB SSD", "Resolution": "Up to 8K", "Features": "Ray Tracing, 3D Audio"}'),

      ((SELECT id FROM categories WHERE slug='gaming'),
        'Meta Quest 3', 'Mixed reality headset for gaming, fitness, and productivity. Pancake lenses and next-gen performance.', 499.00, 25, 'meta-quest-3.jpg', 4.7, true,
        '{"Processor": "Snapdragon XR2 Gen 2", "Resolution": "2064x2208 per eye", "Storage": "128GB", "Battery": "2-3 hours", "Features": "Mixed Reality, Hand Tracking"}'),

      -- Smart Home
      ((SELECT id FROM categories WHERE slug='smart-home'),
        'Google Nest Hub Max', '10-inch smart home display with Google Assistant, built-in camera, and premium speaker.', 229.00, 40, 'Google--Nest-Hub-Max.webp', 4.6, false,
        '{"Display": "10\\\" HD Touchscreen", "Assistant": "Google Assistant", "Camera": "6.5MP", "Audio": "Neo speaker", "Smart Home": "Matter compatible"}'),

      ((SELECT id FROM categories WHERE slug='smart-home'),
        'Philips Hue Starter Kit', 'Smart color LED bulbs with the Hue Bridge. Millions of colors, voice control, and automations.', 149.99, 55, 'philips-hue.webp', 4.6, false,
        '{"Bulbs": "3x A19 E27", "Colors": "16 million", "Protocol": "Zigbee + Matter", "Voice": "Alexa, Google, Siri", "App": "Hue iOS & Android"}')
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully seeded all real products!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Reseed failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

reseed();
