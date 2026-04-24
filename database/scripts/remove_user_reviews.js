/**
 * One-off script: Remove all reviews written by a specific user from products.reviews_data.
 * Usage: node database/scripts/remove_user_reviews.js
 */

require('dotenv').config();
const db = require('../../config/db');

const TARGET_EMAIL = 'aghandour098@gmail.com';

async function removeUserReviews() {
  try {
    // 1. Find the user by email
    const userRes = await db.query('SELECT id, name FROM users WHERE email = $1', [TARGET_EMAIL]);
    if (userRes.rows.length === 0) {
      console.log(`❌ No user found with email: ${TARGET_EMAIL}`);
      process.exit(0);
    }
    const { id: userId, name: userName } = userRes.rows[0];
    console.log(`✅ Found user: "${userName}" (id=${userId})`);

    // 2. Preview: which products have their reviews?
    const preview = await db.query(`
      SELECT id, name,
        (SELECT count(*) FROM jsonb_array_elements(reviews_data) AS r
         WHERE r->>'author' = $1 OR (r->>'userId')::int = $2) AS review_count
      FROM products
      WHERE reviews_data IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(reviews_data) AS r
          WHERE r->>'author' = $1 OR (r->>'userId')::int = $2
        )
    `, [userName, userId]);

    if (preview.rows.length === 0) {
      console.log('ℹ️  No reviews found for this user across any products.');
      process.exit(0);
    }

    console.log(`\n📋 Found reviews in ${preview.rows.length} product(s):`);
    preview.rows.forEach(p => console.log(`   - [${p.id}] ${p.name} (${p.review_count} review(s))`));

    // 3. Remove their reviews from all products
    const updateRes = await db.query(`
      UPDATE products
      SET reviews_data = (
        SELECT jsonb_agg(r)
        FROM jsonb_array_elements(reviews_data) AS r
        WHERE r->>'author' != $1
          AND (r->>'userId' IS NULL OR (r->>'userId')::int != $2)
      )
      WHERE reviews_data IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(reviews_data) AS r
          WHERE r->>'author' = $1 OR (r->>'userId')::int = $2
        )
    `, [userName, userId]);

    console.log(`\n🗑️  Removed reviews from ${updateRes.rowCount} product(s).`);
    console.log('✅ Done! User reviews have been cleared.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

removeUserReviews();
