const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ 
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

const names = ['John Doe', 'Sarah Smith', 'Michael Chen', 'Emma Wilson', 'David Miller', 'Sophie Taylor', 'Alex Johnson', 'Maria Garcia'];
const comments = [
  'Absolutely love this product! The quality is top-notch.',
  'Great value for the price. Would definitely recommend.',
  'Excellent performance and sleek design.',
  'A bit expensive but worth every penny.',
  'Delivery was fast and the product exceeded my expectations.',
  'Solid build quality, feels very premium.',
  'Best purchase I have made this year!',
  'Works exactly as described. Very happy with it.',
  'The customer support was also very helpful.',
  'A game changer in my daily routine.'
];

async function seedReviews() {
  try {
    console.log('Fetching products...');
    const productsRes = await pool.query('SELECT id, name FROM products');
    const products = productsRes.rows;

    console.log(`Found ${products.length} products. Seeding reviews...`);

    for (let product of products) {
      const reviewCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 reviews per product
      const reviews = [];

      for (let i = 0; i < reviewCount; i++) {
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars for a "premium" feel
        const author = names[Math.floor(Math.random() * names.length)];
        const text = comments[Math.floor(Math.random() * comments.length)];
        const date = new Date(Date.now() - Math.floor(Math.random() * 1000000000)).toISOString();

        reviews.push({ author, rating, text, date });
      }

      await pool.query('UPDATE products SET reviews_data = $1 WHERE id = $2', [JSON.stringify(reviews), product.id]);
      console.log(`Seeded ${reviewCount} reviews for: ${product.name}`);
    }

    console.log('Seeding completed successfully!');
  } catch (e) {
    console.error('Seeding error:', e);
  } finally {
    await pool.end();
  }
}

seedReviews();
