const express = require('express');
const router = express.Router();
const db = require('../config/db');

// @route   GET /api/cart
// @desc    Get current cart items from session (or DB if logged in)
router.get('/', async (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  try {
    // If cart is empty, return empty
    if (req.session.cart.length === 0) {
      return res.json({ items: [], subtotal: 0 });
    }

    // Enhance cart with latest DB prices to prevent tampering
    const productIds = req.session.cart.map(item => item.product_id);
    const result = await db.query('SELECT id, name, price, image_path FROM products WHERE id = ANY($1::int[])', [productIds]);
    
    let dbProducts = {};
    result.rows.forEach(p => { dbProducts[p.id] = p; });

    let enhancedCart = [];
    let subtotal = 0;

    req.session.cart.forEach(item => {
      let p = dbProducts[item.product_id];
      if (p) {
        let itemTotal = p.price * item.quantity;
        subtotal += itemTotal;
        enhancedCart.push({
          product_id: p.id,
          name: p.name,
          price: p.price,
          image_path: p.image_path,
          quantity: item.quantity,
          itemTotal: itemTotal
        });
      }
    });

    res.json({ items: enhancedCart, subtotal: subtotal });
  } catch (err) {
    console.error('Cart Fetch Error:', err);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to session cart
router.post('/add', async (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id) return res.status(400).json({ error: 'Product ID required' });
  
  if (!req.session.cart) req.session.cart = [];
  
  let qty = parseInt(quantity) || 1;
  const existingIndex = req.session.cart.findIndex(i => i.product_id === parseInt(product_id));

  if (existingIndex > -1) {
    req.session.cart[existingIndex].quantity += qty;
  } else {
    req.session.cart.push({ product_id: parseInt(product_id), quantity: qty });
  }

  res.json({ message: 'Added to cart', cartCount: req.session.cart.length });
});

// @route   POST /api/cart/remove
// @desc    Remove item from session cart
router.post('/remove', (req, res) => {
  const { product_id } = req.body;
  if (!req.session.cart) return res.status(400).json({ error: 'Cart is empty' });

  req.session.cart = req.session.cart.filter(i => i.product_id !== parseInt(product_id));
  res.json({ message: 'Item removed', cartCount: req.session.cart.length });
});

// @route   POST /api/cart/checkout
// @desc    Create order and process checkout
router.post('/checkout', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Must be logged in to checkout.' });
  }
  if (!req.session.cart || req.session.cart.length === 0) {
    return res.status(400).json({ error: 'Cart is empty.' });
  }

  const { shipping_address } = req.body;
  
  // Start Transaction
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Calculate total from DB prices
    const productIds = req.session.cart.map(i => i.product_id);
    const dbProds = await client.query('SELECT id, price, stock FROM products WHERE id = ANY($1::int[])', [productIds]);
    
    let prodMap = {};
    dbProds.rows.forEach(p => prodMap[p.id] = p);

    let totalAmount = 0;
    
    // Check stock
    for (const item of req.session.cart) {
      const p = prodMap[item.product_id];
      if (!p || p.stock < item.quantity) {
        throw new Error('Product ' + item.product_id + ' is out of stock or does not exist.');
      }
      totalAmount += p.price * item.quantity;
    }

    // Insert Order
    const orderRes = await client.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address) VALUES ($1, $2, $3) RETURNING id',
      [req.session.user.id, totalAmount, shipping_address || 'Provided during Checkout']
    );
    const orderId = orderRes.rows[0].id;

    // Insert Order Items and Update Stock
    for (const item of req.session.cart) {
      const p = prodMap[item.product_id];
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, p.price]
      );
      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    await client.query('COMMIT');
    // Clear cart
    req.session.cart = [];
    
    res.json({ message: 'Order placed successfully!', orderId: orderId });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message || 'Checkout failed.' });
  } finally {
    client.release();
  }
});

// @route   POST /api/cart/update
// @desc    Set quantity of an item
router.post('/update', (req, res) => {
  const { product_id, quantity } = req.body;
  if (!req.session.cart) return res.status(400).json({ error: 'Cart is empty' });
  const idx = req.session.cart.findIndex(i => i.product_id === parseInt(product_id));
  if (idx === -1) return res.status(404).json({ error: 'Item not in cart' });
  if (quantity <= 0) {
    req.session.cart.splice(idx, 1);
  } else {
    req.session.cart[idx].quantity = parseInt(quantity);
  }
  res.json({ message: 'Cart updated', cartCount: req.session.cart.length });
});

module.exports = router;
