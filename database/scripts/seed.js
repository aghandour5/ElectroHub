const pool = require('../../config/db');

const realProducts = [
  // 1: Computing
  { name: 'Apple MacBook Air M3 (13-inch)', description: 'Supercharged by the M3 chip. Features a Liquid Retina display, up to 18 hours of battery life.', price: 1099.00, image_path: 'macbook-air-m3.webp', category_id: 1, stock: 45, is_featured: true },
  { name: 'Dell XPS 15 OLED', description: 'Next-level performance with a stunning 15.6-inch OLED touchscreen display, Intel Core i7, and NVIDIA RTX 4070 graphics.', price: 1899.99, image_path: 'dell-xps-15.avif', category_id: 1, stock: 12, is_featured: false },
  { name: 'Asus ROG Zephyrus G14', description: 'The ultimate compact gaming laptop featuring an AMD Ryzen 9 processor, RTX 4060 GPU, and an incredible ROG Nebula HDR Display.', price: 1599.00, image_path: 'asus-rog-g14.webp', category_id: 1, stock: 20, is_featured: false },
  { name: 'Apple iPad Pro 12.9-inch (M2)', description: 'Astonishing performance. Incredibly advanced displays. Superfast wireless connectivity. Next-level Apple Pencil capabilities.', price: 1099.00, image_path: 'ipad-pro-m2.webp', category_id: 1, stock: 60, is_featured: true },
  
  // 2: Acoustics
  { name: 'Sony WH-1000XM5 Wireless Headphones', description: 'Industry-leading noise cancellation, crystal clear hands-free calling, and up to 30 hours of battery life.', price: 398.00, image_path: 'sony-wh1000xm5.webp', category_id: 2, stock: 120, is_featured: true },
  { name: 'Apple AirPods Pro (2nd Gen)', description: 'Rich audio experience with Active Noise Cancellation, Adaptive Transparency, and personalized Spatial Audio.', price: 249.00, image_path: 'airpods-pro.webp', category_id: 2, stock: 200, is_featured: false },
  { name: 'Bose QuietComfort Ultra Earbuds', description: 'World-class noise cancellation, spatial audio for more immersive listening, and custom-tune technology that adapts sound to your ears.', price: 299.00, image_path: 'bose-qc-ultra.webp', category_id: 2, stock: 85, is_featured: false },
  { name: 'Sennheiser Momentum 4 Wireless', description: 'Signature sound with outstanding music quality, adaptive noise cancellation, and a massive 60-hour battery life.', price: 349.95, image_path: 'sennheiser-momentum-4.webp', category_id: 2, stock: 40, is_featured: false },
  
  // 3: Mobile
  { name: 'Apple iPhone 15 Pro Max', description: 'Forged in titanium. Features the breakthrough A17 Pro chip, a customizable Action button, and the pro camera system.', price: 1199.00, image_path: 'iphone-15.webp', category_id: 3, stock: 85, is_featured: true },
  { name: 'Samsung Galaxy S24 Ultra', description: 'AI-powered smartphone with a massive 200MP camera, built-in S-Pen, and a super-smooth 6.8" 120Hz display.', price: 1299.99, image_path: 'samsung-s24.webp', category_id: 3, stock: 65, is_featured: false },
  { name: 'Google Pixel 8 Pro', description: 'Engineered by Google, featuring the new Tensor G3 chip, advanced AI photography tools, and a polished aluminum frame.', price: 999.00, image_path: 'pixel-8-pro.webp', category_id: 3, stock: 45, is_featured: false },
  { name: 'Samsung Galaxy Z Fold 5', description: 'Unfold a massive 7.6" main display that transforms your phone into a tablet for ultimate productivity and immersive gaming.', price: 1799.99, image_path: 'galaxy-z-fold-5.webp', category_id: 3, stock: 15, is_featured: true },

  // 4: Wearables
  { name: 'Apple Watch Series 9', description: 'Powerful fitness and health tracking with a brilliant always-on display, ECG monitoring, and crash detection.', price: 399.00, image_path: 'apple-watch.webp', category_id: 4, stock: 110, is_featured: true },
  { name: 'Garmin Fenix 7 Pro Sapphire Solar', description: 'Ultimate multisport GPS smartwatch with solar charging capabilities and advanced performance metrics.', price: 899.99, image_path: 'garmin-fenix.webp', category_id: 4, stock: 25, is_featured: false },
  { name: 'Samsung Galaxy Watch 6 Classic', description: 'Timeless design with a rotating bezel. Comprehensive health tracking, advanced sleep coaching, and seamless Galaxy ecosystem integration.', price: 399.99, image_path: 'galaxy-watch-6.webp', category_id: 4, stock: 55, is_featured: false },
  { name: 'Oura Ring Gen3 Horizon', description: 'Sleek, titanium smart ring that provides highly accurate, personalized health data including sleep analysis, heart rate, and readiness scores.', price: 349.00, image_path: 'oura-ring-3.webp', category_id: 4, stock: 30, is_featured: false },

  // 5: Gaming & VR
  { name: 'Sony PlayStation 5 Slim Console', description: 'Experience lightning-fast loading with an ultra-high-speed SSD, deeper immersion with haptic feedback.', price: 499.00, image_path: 'ps5.jpg', category_id: 5, stock: 50, is_featured: true },
  { name: 'Meta Quest 3 (128GB)', description: 'Breakthrough mixed reality headset with full-color passthrough and massive resolution leaps over the previous generation.', price: 499.99, image_path: 'meta-quest-3.jpg', category_id: 5, stock: 80, is_featured: false },
  { name: 'Xbox Series X 1TB Console', description: 'The fastest, most powerful Xbox ever. Explore rich new worlds with 12 teraflops of raw graphic processing power and 4K gaming.', price: 499.99, image_path: 'xbox-series-x.webp', category_id: 5, stock: 40, is_featured: false },
  { name: 'Nintendo Switch OLED Model', description: 'Play at home or on the go with a vibrant 7-inch OLED screen, a wide adjustable stand, and enhanced audio.', price: 349.99, image_path: 'switch-oled.webp', category_id: 5, stock: 90, is_featured: true },

  // 6: Smart Home
  { name: 'Philips Hue White & Color Ambiance Starter Kit', description: 'Transform your home with 16 million colors and shades of white light. Includes Hub and 3 standard A19 bulbs.', price: 179.99, image_path: 'philips-hue.webp', category_id: 6, stock: 60, is_featured: true },
  { name: 'Ring Video Doorbell Pro 2', description: 'Premium wired video doorbell with 1536p HD Head-to-Toe Video, 3D Motion Detection, and built-in Alexa Greetings.', price: 249.99, image_path: 'ring-doorbell-pro-2.webp', category_id: 6, stock: 35, is_featured: false },
  { name: 'Amazon Echo Studio', description: 'High-fidelity smart speaker with 3D audio and Alexa. Features 5 speakers that produce powerful bass and crisp highs.', price: 199.99, image_path: 'echo-studio.webp', category_id: 6, stock: 75, is_featured: false }
];

async function seed() {
  try {
    // Upsert categories
    const categories = [
      { name: 'Computing', slug: 'computing' },
      { name: 'Acoustics', slug: 'acoustics' },
      { name: 'Mobile', slug: 'mobile' },
      { name: 'Wearables', slug: 'wearables' },
      { name: 'Gaming & VR', slug: 'gaming-vr' },
      { name: 'Smart Home', slug: 'smart-home' }
    ];

    for (let c of categories) {
      await pool.query(
        'INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING',
        [c.name, c.slug]
      );
    }

    // Get a map of category IDs
    const res = await pool.query('SELECT id, slug FROM categories');
    const catMap = {};
    res.rows.forEach(r => catMap[r.slug] = r.id);

    // Map hardcoded 1-6 to slugs
    const idToSlug = {
      1: 'computing',
      2: 'acoustics',
      3: 'mobile',
      4: 'wearables',
      5: 'gaming-vr',
      6: 'smart-home'
    };

    await pool.query('TRUNCATE TABLE products CASCADE;');
    for (let p of realProducts) {
      const actualCatId = catMap[idToSlug[p.category_id]];
      await pool.query(
        'INSERT INTO products (name, description, price, image_path, category_id, stock, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [p.name, p.description, p.price, p.image_path, actualCatId, p.stock, p.is_featured]
      );
    }
    console.log('Successfully seeded database with all products and categories!');
    process.exit(0);
  } catch (e) {
    console.error('Error seeding DB:', e);
    process.exit(1);
  }
}

seed();
