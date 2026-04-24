/**
 * seed_testimonials.js
 * Purpose: Creates the testimonials table and seeds it with customer reviews.
 * Run with: node database/scripts/seed_testimonials.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function seedTestimonials() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id         SERIAL PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        role       VARCHAR(100),
        avatar_initials VARCHAR(4),
        rating     INTEGER DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
        message    TEXT NOT NULL,
        product    VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Testimonials table ready.');

    // Clear existing and reseed
    await client.query('DELETE FROM testimonials');

    await client.query(`
      INSERT INTO testimonials (name, role, avatar_initials, rating, message, product) VALUES
      ('Ahmed Al-Rashid',  'Software Engineer',        'AA', 5, 'The MacBook Air M3 is an absolute beast. Silent, fast, and the battery lasts my entire workday. Best laptop I have ever owned.', 'MacBook Air M3'),
      ('Sarah Mitchell',   'Graphic Designer',         'SM', 5, 'Sony WH-1000XM5 headphones are incredible. I use them during long design sessions and the noise cancellation lets me focus completely.', 'Sony WH-1000XM5'),
      ('Omar Khalil',      'University Student',       'OK', 5, 'Got the iPhone 15 Pro from ElectroHub and I am blown away by the camera quality. Fast delivery and great packaging too!', 'iPhone 15 Pro'),
      ('Emily Chen',       'Content Creator',          'EC', 5, 'The AirPods Pro 2 are life-changing for someone who records content daily. The Adaptive ANC is genuinely magical.', 'AirPods Pro 2nd Gen'),
      ('James Thornton',   'IT Consultant',            'JT', 4, 'Picked up the Dell XPS 15 OLED for work and the display is stunning. The OLED panel makes everything look vibrant. Very happy with my purchase.', 'Dell XPS 15 OLED'),
      ('Lina Hamdan',      'Fitness Trainer',          'LH', 5, 'My Garmin Fenix 7X has completely transformed how I track my training. The battery lasts nearly two weeks — no charging anxiety!', 'Garmin Fenix 7X'),
      ('Carlos Rivera',    'Gamer',                    'CR', 5, 'The PS5 I got from ElectroHub was in perfect condition and arrived faster than expected. Customer service was excellent too.', 'PlayStation 5'),
      ('Nour Abdallah',    'Entrepreneur',             'NA', 5, 'Ordered the Samsung S26 Ultra and the camera is on another level. The S Pen is incredibly useful for signing documents on the go.', 'Samsung Galaxy S26 Ultra')
    `);

    await client.query('COMMIT');
    console.log('✅ Successfully seeded 8 customer testimonials!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed testimonials:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedTestimonials();
