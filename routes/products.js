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

module.exports = router;
