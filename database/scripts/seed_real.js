const pool = require('../../config/db');

const realProducts = [
  // 1: Computing
  { name: 'Apple MacBook Air M3 (13-inch)', description: 'Supercharged by the M3 chip. Features a Liquid Retina display, up to 18 hours of battery life.', price: 1099.00, image_path: 'macbook-air-m3.webp', category_id: 1, stock: 45, is_featured: true },
  { name: 'Dell XPS 15 OLED', description: 'Next-level performance with a stunning 15.6-inch OLED touchscreen display, Intel Core i7, and NVIDIA RTX 4070 graphics.', price: 1899.99, image_path: 'dell-xps-15.webp', category_id: 1, stock: 12, is_featured: false },
  
  // 2: Acoustics
  { name: 'Sony WH-1000XM5 Wireless Headphones', description: 'Industry-leading noise cancellation, crystal clear hands-free calling, and up to 30 hours of battery life.', price: 398.00, image_path: 'sony-wh1000xm5.webp', category_id: 2, stock: 120, is_featured: true },
  { name: 'Apple AirPods Pro (2nd Gen)', description: 'Rich audio experience with Active Noise Cancellation, Adaptive Transparency, and personalized Spatial Audio.', price: 249.00, image_path: 'airpods-pro.webp', category_id: 2, stock: 200, is_featured: false },
  
  // 3: Mobile
  { name: 'Apple iPhone 15 Pro Max', description: 'Forged in titanium. Features the breakthrough A17 Pro chip, a customizable Action button, and the pro camera system.', price: 1199.00, image_path: 'iphone-15.webp', category_id: 3, stock: 85, is_featured: true },
  { name: 'Samsung Galaxy S24 Ultra', description: 'AI-powered smartphone with a massive 200MP camera, built-in S-Pen, and a super-smooth 6.8" 120Hz display.', price: 1299.99, image_path: 'samsung-s24.webp', category_id: 3, stock: 65, is_featured: false },

  // 4: Wearables
  { name: 'Apple Watch Series 9', description: 'Powerful fitness and health tracking with a brilliant always-on display, ECG monitoring, and crash detection.', price: 399.00, image_path: 'apple-watch.webp', category_id: 4, stock: 110, is_featured: true },
  { name: 'Garmin Fenix 7 Pro Sapphire Solar', description: 'Ultimate multisport GPS smartwatch with solar charging capabilities and advanced performance metrics.', price: 899.99, image_path: 'garmin-fenix.webp', category_id: 4, stock: 25, is_featured: false },

  // 5: Gaming & VR
  { name: 'Sony PlayStation 5 Slim Console', description: 'Experience lightning-fast loading with an ultra-high-speed SSD, deeper immersion with haptic feedback.', price: 499.00, image_path: 'ps5.webp', category_id: 5, stock: 50, is_featured: true },
  { name: 'Meta Quest 3 (128GB)', description: 'Breakthrough mixed reality headset with full-color passthrough and massive resolution leaps over the previous generation.', price: 499.99, image_path: 'meta-quest-3.webp', category_id: 5, stock: 80, is_featured: false },

  // 6: Smart Home
  { name: 'Google Nest Hub Max', description: 'Control your smart home devices, make Duo video calls, and watch YouTube on a beautiful 10-inch HD screen with stereo sound.', price: 229.00, image_path: 'google-nest.webp', category_id: 6, stock: 40, is_featured: true },
  { name: 'Philips Hue White & Color Ambiance Starter Kit', description: 'Transform your home with 16 million colors and shades of white light. Includes Hub and 3 standard A19 bulbs.', price: 179.99, image_path: 'philips-hue.webp', category_id: 6, stock: 60, is_featured: false }
];

async function seed() {
  try {
    await pool.query('TRUNCATE TABLE products CASCADE;');
    for (let p of realProducts) {
      await pool.query(
        'INSERT INTO products (name, description, price, image_path, category_id, stock, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [p.name, p.description, p.price, p.image_path, p.category_id, p.stock, p.is_featured]
      );
    }
    console.log('Successfully updated DB with isolated filenames!');
    process.exit(0);
  } catch (e) {
    console.error('Error seeding DB:', e);
    process.exit(1);
  }
}

seed();
