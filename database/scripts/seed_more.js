const pool = require('../../config/db');
async function seed() {
  await pool.query("INSERT INTO categories (id, name, slug) VALUES (5, 'Gaming & VR', 'gaming'), (6, 'Smart Home', 'smarthome') ON CONFLICT DO NOTHING;");
  const products = [
    { name: 'Quantum VR Headset', description: 'Immersive next-gen virtual reality experience.', price: 399.99, image_path: 'cat_computing.png', category_id: 5, stock: 15 },
    { name: 'Pro Wireless Controller', description: 'Ergonomic controller with haptic feedback.', price: 69.99, image_path: 'cat_acoustics.png', category_id: 5, stock: 40 },
    { name: 'Smart Home Hub X', description: 'Centralized control for all your smart devices.', price: 149.99, image_path: 'cat_mobile.png', category_id: 6, stock: 20 },
    { name: 'SecureCam Pro', description: '4K smart security camera with night vision.', price: 129.99, image_path: 'hero_workspace.png', category_id: 6, stock: 30 }
  ];
  for (let p of products) {
    await pool.query(
      'INSERT INTO products (name, description, price, image_path, category_id, stock, is_featured) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [p.name, p.description, p.price, p.image_path, p.category_id, p.stock, true]
    );
  }
  console.log('Done');
  process.exit(0);
}
seed().catch(err => { console.error(err); process.exit(1); });
