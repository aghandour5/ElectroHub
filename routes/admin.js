const express = require('express');
const router = express.Router();
const db = require('../config/db');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
    const totalUsers = await db.query('SELECT COUNT(*) FROM users'); // Get total number of users in the system
    const totalProducts = await db.query('SELECT COUNT(*) FROM products'); // Get total number of products available in the store
    const totalOrders = await db.query('SELECT COUNT(*) FROM orders'); // Get total number of orders placed by customers
    const totalRevenue = await db.query("SELECT SUM(total_amount) FROM orders WHERE status != 'cancelled'"); // Calculate total revenue from completed orders (excluding cancelled ones)
    
    const recentOrders = await db.query(`
      SELECT o.*, u.name as customer_name 
      FROM orders o 
      LEFT JOIN users u ON o.user_id = u.id 
      ORDER BY o.created_at DESC LIMIT 5
    `);

    // Revenue History (last 7 days)
    const revenueHistory = await db.query(`
      SELECT DATE(created_at) as date, SUM(total_amount) as daily_revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `);

    // Performance Data (orders by status)
    const performanceData = await db.query(`
      SELECT status, COUNT(*) as count
      FROM orders
      GROUP BY status
    `);

    // Recent Activity Feed
    const recentActivity = await db.query(`
      SELECT * FROM (
        SELECT 'new_user' as type, name as title, created_at, 'Success' as badge 
        FROM users 
        UNION ALL
        SELECT 'new_order' as type, 'Order #' || id as title, created_at, status as badge 
        FROM orders
      ) as activities
      ORDER BY created_at DESC LIMIT 10
    `);

    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      totalProducts: parseInt(totalProducts.rows[0].count),
      totalOrders: parseInt(totalOrders.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].sum || 0),
      recentOrders: recentOrders.rows,
      revenueHistory: revenueHistory.rows,
      performanceData: performanceData.rows,
      recentActivity: recentActivity.rows
    });
  } catch (error) {
    console.error('Dashboard API Error:', error);
    res.status(500).json({ error: 'Server error generating dashboard data.' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (Admin only)
router.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// @route   GET /api/admin/orders
// @desc    Get all orders (Admin only)
router.get('/orders', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, u.name as customer_name, u.email as customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

// @route   GET /api/admin/categories
// @desc    Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
});

// @route   POST /api/admin/products
// @desc    Add new product (with optional image upload)
router.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { category_id, name, description, price, stock, is_featured, is_new, specs, reviews_data } = req.body;
    let image_path = req.body.image_path || 'laptop.png'; // image_path can come from body (for testing) or from file upload

    if (req.file) {
      if (!req.file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: 'Uploaded file must be an image.' });
      }

      const baseName = req.file.originalname.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${Date.now()}_${baseName}.webp`; // Sanitize filename and prepend timestamp for uniqueness
      const optimizedBuffer = await sharp(req.file.buffer)
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      const { error } = await supabase.storage.from('product-images').upload(fileName, optimizedBuffer, {
        contentType: 'image/webp',
        upsert: true // Overwrite if file with same name exists (since we prepend timestamp, collisions are unlikely)
      });
      if (error) throw error;
      image_path = `${process.env.SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}`;
    }

    const parsedSpecs = typeof specs === 'string' ? JSON.parse(specs) : (specs || {});
    const parsedReviews = typeof reviews_data === 'string' ? JSON.parse(reviews_data) : (reviews_data || []);
    const isFeaturedBool = is_featured === 'true' || is_featured === true || is_featured === 'on';
    const isNewBool = is_new === 'true' || is_new === true || is_new === 'on';

    await db.query(
      `INSERT INTO public.products (category_id, name, description, price, stock, image_path, is_featured, is_new, specs, reviews_data) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [category_id || 1, name, description, price, stock, image_path, isFeaturedBool, isNewBool, parsedSpecs, parsedReviews]
    );
    res.status(201).json({ message: 'Product created successfully' });
  } catch (error) {
    console.error('Detailed Add Product Error:', {
      message: error.message,
      detail: error.detail,
      code: error.code,
      body: req.body,
      file: req.file ? req.file.originalname : 'none'
    });
    res.status(500).json({ error: `Failed to add product: ${error.message}` });
  }
});

// @route   PUT /api/admin/products/:id
// @desc    Update product
router.put('/products/:id', async (req, res) => {
  const { name, price, stock, is_featured, is_new, specs, reviews_data } = req.body;
  const isFeaturedBool = is_featured === 'true' || is_featured === true || is_featured === 'on';
  const isNewBool = is_new === 'true' || is_new === true || is_new === 'on';

  try {
    await db.query(
      `UPDATE public.products SET name = $1, price = $2, stock = $3, is_featured = $4, is_new = $5, specs = $6, reviews_data = $7 WHERE id = $8`,
      [name, price, stock, isFeaturedBool, isNewBool, specs || {}, reviews_data || [], req.params.id]
    );
    res.json({ message: 'Product updated' });
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ error: `Failed to update product: ${error.message}` });
  }
});

// @route   PUT /api/admin/products/:id/stock
// @desc    Update product stock only
router.put('/products/:id/stock', async (req, res) => {
  const { stock } = req.body;
  try {
    await db.query('UPDATE products SET stock = $1 WHERE id = $2', [stock, req.params.id]);
    res.json({ message: 'Stock updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stock.' });
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
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid order status.' });

    const orderResult = await db.query(`UPDATE orders SET status = $1 WHERE id = $2 RETURNING user_id`, [status, req.params.id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });

    if (orderResult.rows[0].user_id) {
      await db.query(
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
        [orderResult.rows[0].user_id, `Order #${req.params.id} status changed to ${status}.`]
      );
    }
    res.json({ message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

// @route   GET /api/admin/orders/:id/items
// @desc    Get order items
router.get('/orders/:id/items', async (req, res) => {
  try {
    const items = await db.query(`
      SELECT oi.*, p.name, p.image_path 
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `, [req.params.id]);
    res.json(items.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order items.' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
router.put('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  try {
    if (role !== 'admin' && role !== 'customer') return res.status(400).json({error: 'Invalid role'});
    await db.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, req.params.id]);
    res.json({ message: 'User role updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
router.delete('/users/:id', async (req, res) => {
  // Prevent admin from deleting their own account (would break the active session)
  if (parseInt(req.params.id) === req.session.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account.' });
  }
  try {
    await db.query(`DELETE FROM users WHERE id = $1`, [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

module.exports = router;
