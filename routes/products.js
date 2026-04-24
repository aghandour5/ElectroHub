const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/products
// @desc    Get all products (filter by category slug & name search)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let args = [];
    let sql = `
      SELECT p.*, 
             c.name    AS category_name,
             c.slug    AS category_slug
      FROM   products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE  1=1
    `;
    if (category) {
      args.push(category);
      sql += ` AND c.slug = $${args.length}`;
    }
    if (search) {
      args.push(`%${search}%`);
      sql += ` AND p.name ILIKE $${args.length}`;
    }
    sql += ` ORDER BY p.is_featured DESC, p.created_at DESC`;
    const result = await db.query(sql, args);
    res.json(result.rows);
  } catch (e) {
    console.error('Products fetch error:', e);
    res.status(500).json({ error: 'Server error fetching products.' });
  }
});

// @route   GET /api/products/categories/all
router.get('/categories/all', async (req, res) => {
  try {
    const cats = await db.query('SELECT * FROM categories ORDER BY name');
    res.json(cats.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/products/testimonials/all
// @desc    Get all testimonials for homepage sliders
router.get('/testimonials/all', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM testimonials ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (e) {
    console.error('Testimonials fetch error:', e);
    res.status(500).json({ error: 'Server error fetching testimonials.' });
  }
});

// @route   GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, c.name AS category_name, c.slug AS category_slug
      FROM   products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE  p.id = $1
    `, [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// @route   GET /api/products/:id/review-eligibility
// @desc    Check if current user can review this product (purchased + not already reviewed)
router.get('/:id/review-eligibility', async (req, res) => {
  if (!req.session.user) return res.json({ canReview: false });

  try {
    // 1. Check user has a delivered/completed order for this product
    const orderCheck = await db.query(`
      SELECT 1 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1 AND oi.product_id = $2 AND (o.status = 'completed' OR o.status = 'delivered')
      LIMIT 1
    `, [req.session.user.id, req.params.id]);

    if (orderCheck.rows.length === 0) return res.json({ canReview: false });

    // 2. Get the user's name to check if they already reviewed
    const userRes = await db.query('SELECT name FROM users WHERE id = $1', [req.session.user.id]);
    const userName = userRes.rows[0]?.name;

    // 3. Check if user already reviewed (by userId for new reviews, or by name as fallback for older ones)
    const alreadyReviewed = await db.query(`
      SELECT 1 FROM products
      WHERE id = $1
        AND reviews_data IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements(reviews_data) AS r
          WHERE (r->>'userId')::int = $2
             OR r->>'author' = $3
        )
    `, [req.params.id, req.session.user.id, userName]);

    res.json({ canReview: alreadyReviewed.rows.length === 0 });
  } catch (e) {
    console.error('Eligibility check error:', e);
    res.status(500).json({ error: 'Server error checking eligibility.' });
  }
});

// @route   POST /api/products/:id/review
// @desc    Submit a product review
router.post('/:id/review', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Login required.' });

  const { rating, text } = req.body;
  if (!rating || !text) return res.status(400).json({ error: 'Rating and text required.' });

  try {
    // 1. Double check eligibility
    const eligibility = await db.query(`
      SELECT 1 FROM orders o JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1 AND oi.product_id = $2 AND (o.status = 'completed' OR o.status = 'delivered')
      LIMIT 1
    `, [req.session.user.id, req.params.id]);

    if (eligibility.rows.length === 0) {
      return res.status(403).json({ error: 'You must complete an order for this product first.' });
    }

    // 2. Get user name
    const userRes = await db.query('SELECT name FROM users WHERE id = $1', [req.session.user.id]);
    const author = userRes.rows[0].name;

    // 3. Build review object — include userId for reliable duplicate detection
    const newReview = { userId: req.session.user.id, author, rating: parseInt(rating), text, date: new Date().toISOString() };
    
    await db.query(`
      UPDATE products 
      SET reviews_data = COALESCE(reviews_data, '[]'::jsonb) || $1::jsonb 
      WHERE id = $2
    `, [JSON.stringify([newReview]), req.params.id]);

    res.json({ message: 'Review submitted successfully!', review: newReview });
  } catch (e) {
    console.error('Review submission error:', e);
    res.status(500).json({ error: 'Server error submitting review.' });
  }
});

module.exports = router;
