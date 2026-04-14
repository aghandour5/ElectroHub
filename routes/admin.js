const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware to check if Admin
const isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admins only.' });
  }
};

// Apply isAdmin middleware to all admin routes
router.use(isAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get dashboard summary statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await db.query('SELECT COUNT(*) FROM users');
    const totalProducts = await db.query('SELECT COUNT(*) FROM products');
    const totalOrders = await db.query('SELECT COUNT(*) FROM orders');
    const recentOrders = await db.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalProducts: parseInt(totalProducts.rows[0].count),
      totalOrders: parseInt(totalOrders.rows[0].count),
      recentOrders: recentOrders.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error generating dashboard data.' });
  }
});

// @route   POST /api/admin/products
// @desc    Add new product
router.post('/products', async (req, res) => {
  const { category_id, name, description, price, stock, image_path, is_featured, specs, reviews_data } = req.body;
  try {
    await db.query(
      `INSERT INTO products (category_id, name, description, price, stock, image_path, is_featured, specs, reviews_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [category_id || 1, name, description, price, stock, image_path || 'hero.png', is_featured || false, specs || {}, reviews_data || []]
    );
    res.status(201).json({ message: 'Product created successfully' });
  } catch (error) {
    console.error('Add product error', error);
    res.status(500).json({ error: 'Failed to add product.' });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update product
router.put('/products/:id', async (req, res) => {
  const { name, price, stock, is_new, specs, reviews_data } = req.body;
  try {
    await db.query(
      `UPDATE products SET name = $1, price = $2, stock = $3, is_new = $4, specs = $5, reviews_data = $6 WHERE id = $7`,
      [name, price, stock, is_new !== undefined ? is_new : false, specs || {}, reviews_data || [], req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// @route   DELETE /api/admin/products/:id
// @desc    Delete product
router.delete('/products/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM products WHERE id = $1`, [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// @route   PUT /api/admin/orders/:id
// @desc    Update order status
router.put('/orders/:id', async (req, res) => {
  const { status } = req.body;
  try {
    await db.query(`UPDATE orders SET status = $1 WHERE id = $2`, [status, req.params.id]);
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

module.exports = router;
