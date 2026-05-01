const express = require('express');
const router = express.Router();
const db = require('../config/db');

function parsePositiveInteger(value) {
  const parsed = Number.parseInt(value, 10); // parseInt will attempt to convert the value to an integer, and the second argument 10 specifies that it should be parsed as a base-10 number. This is important to prevent unexpected behavior with values that start with '0' (which could be interpreted as octal) or '0x' (which could be interpreted as hexadecimal).
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

// @route   GET /api/cart
// @desc    Get current cart items from session (or DB if logged in)
router.get('/', async (req, res) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }

  try {
    // If cart is empty, return empty
    if (req.session.cart.length === 0) {
      req.session.coupon = null;
      return res.json({ items: [], subtotal: 0, coupon: null });
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
          price: p.price, // use DB price to prevent tampering
          image_path: p.image_path,
          quantity: item.quantity, // quantity from session
          itemTotal: itemTotal
        });
      }
    });

    res.json({ items: enhancedCart, subtotal: subtotal, coupon: req.session.coupon || null });
  } catch (err) {
    console.error('Cart Fetch Error:', err);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
});

// @route   POST /api/cart/add
// @desc    Add item to session cart
router.post('/add', async (req, res) => {
  const productId = parsePositiveInteger(req.body.product_id);
  const qty = parsePositiveInteger(req.body.quantity || 1);
  if (!productId) return res.status(400).json({ error: 'Valid product ID required.' });
  if (!qty) return res.status(400).json({ error: 'Quantity must be a positive whole number.' });

  if (!req.session.cart) req.session.cart = [];

  const existingIndex = req.session.cart.findIndex(i => i.product_id === productId);
  const currentQtyInCart = existingIndex > -1 ? req.session.cart[existingIndex].quantity : 0;
  const totalRequested = currentQtyInCart + qty;

  try {
    const productCheck = await db.query('SELECT name, stock FROM products WHERE id = $1', [productId]);
    if (productCheck.rows.length === 0) return res.status(404).json({ error: 'Product not found.' });
    
    if (productCheck.rows[0].stock < totalRequested) {
      return res.status(400).json({ error: `Only ${productCheck.rows[0].stock} units of ${productCheck.rows[0].name} available.` });
    }
  } catch (error) {
    console.error('Product check error:', error);
    return res.status(500).json({ error: 'Failed to validate product.' });
  }

  if (existingIndex > -1) { // If product already in cart, increase quantity
    req.session.cart[existingIndex].quantity += qty;
  } else { // Add new product to cart
    req.session.cart.push({ product_id: productId, quantity: qty });
  }

  res.json({ message: 'Added to cart', cartCount: req.session.cart.length });
});

// @route   POST /api/cart/remove
// @desc    Remove item from session cart
router.post('/remove', (req, res) => {
  const productId = parsePositiveInteger(req.body.product_id);
  if (!productId) return res.status(400).json({ error: 'Valid product ID required.' });
  if (!req.session.cart) return res.status(400).json({ error: 'Cart is empty' });

  req.session.cart = req.session.cart.filter(i => i.product_id !== productId); // filter will return a new array without the removed item
  res.json({ message: 'Item removed', cartCount: req.session.cart.length });
});

// @route   DELETE /api/cart/remove/:id
// @desc    Remove item from session cart (REST-style alias for the POST route above)
router.delete('/remove/:id', (req, res) => {
  const productId = parsePositiveInteger(req.params.id);
  if (!productId) return res.status(400).json({ error: 'Valid product ID required.' });
  if (!req.session.cart) return res.status(400).json({ error: 'Cart is empty' });

  req.session.cart = req.session.cart.filter(i => i.product_id !== productId);
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

  const shippingAddress = typeof req.body.shipping_address === 'string' ? req.body.shipping_address.trim() : '';
  if (shippingAddress.length < 10 || shippingAddress.length > 500) {
    return res.status(400).json({ error: 'Please provide a valid shipping address.' });
  }

  // Start Transaction
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Calculate total from DB prices
    const productIds = req.session.cart.map(i => i.product_id); // map will return an array of product IDs from the cart
    const dbProds = await client.query('SELECT id, price, stock FROM products WHERE id = ANY($1::int[])', [productIds]);

    let prodMap = {}; // dict to quickly lookup product details by ID
    dbProds.rows.forEach(p => prodMap[p.id] = p);

    let totalAmount = 0;

    // Check stock and calculate total
    for (const item of req.session.cart) {
      const p = prodMap[item.product_id];
      if (!p) {
        throw new Error(`Product ${item.product_id} no longer exists.`);
      }
      
      const requestedQty = Number(item.quantity);
      const availableStock = Number(p.stock);
      
      if (availableStock < requestedQty) {
        throw new Error(`Not enough stock for "${p.name}". Only ${availableStock} left.`);
      }
      
      totalAmount += p.price * requestedQty;
    }

    const couponDiscount = req.session.coupon ? Number.parseFloat(req.session.coupon.discount) || 0 : 0;
    const afterDiscount = Math.max(0, totalAmount - couponDiscount);
    const shippingCost = totalAmount > 0 && totalAmount < 99 ? 10 : 0;
    const tax = afterDiscount * 0.08;
    totalAmount = afterDiscount + shippingCost + tax;

    // Insert Order
    const orderRes = await client.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address) VALUES ($1, $2, $3) RETURNING id',
      [req.session.user.id, totalAmount, shippingAddress]
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
    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [req.session.user.id, `Order #${orderId} was placed successfully.`]
    );
    // Clear cart
    req.session.cart = [];
    req.session.coupon = null;

    res.json({ message: 'Order placed successfully!', orderId: orderId });

  } catch (error) {
    await client.query('ROLLBACK'); // Undo any changes if error occurs
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message || 'Checkout failed.' });
  } finally {
    client.release();
  }
});

// @route   POST /api/cart/update
// @desc    Set quantity of an item
router.post('/update', async (req, res) => {
  const productId = parsePositiveInteger(req.body.product_id);
  const parsedQuantity = Number.parseInt(req.body.quantity, 10);
  if (!productId || !Number.isInteger(parsedQuantity)) {
    return res.status(400).json({ error: 'Valid product ID and quantity required.' });
  }
  if (!req.session.cart) return res.status(400).json({ error: 'Cart is empty' });
  const idx = req.session.cart.findIndex(i => i.product_id === productId);
  if (idx === -1) return res.status(404).json({ error: 'Item not in cart' });
  if (parsedQuantity <= 0) { // Remove item if quantity set to 0 or less
    req.session.cart.splice(idx, 1);
    return res.json({ message: 'Item removed', cartCount: req.session.cart.length });
  }

  // Stock check for update
  try {
    const productRes = await db.query('SELECT name, stock FROM products WHERE id = $1', [productId]);
    if (productRes.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    
    const stock = productRes.rows[0].stock;
    if (stock < parsedQuantity) {
      return res.status(400).json({ error: `Only ${stock} units of ${productRes.rows[0].name} available.` });
    }
    
    req.session.cart[idx].quantity = parsedQuantity;
    res.json({ message: 'Cart updated', cartCount: req.session.cart.length });
  } catch (err) {
    console.error('Update cart stock check error:', err);
    res.status(500).json({ error: 'Failed to update cart.' });
  }
});

// @route   POST /api/cart/apply-coupon
// @desc    Validate a coupon code server-side and return discount amount
router.post('/apply-coupon', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Please provide a coupon code.' });

  try {
    const result = await db.query(
      'SELECT * FROM coupon_codes WHERE UPPER(code) = UPPER($1) AND is_active = true',
      [code.trim()]
    );

    if (result.rows.length === 0) {
      req.session.coupon = null;
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code.' });
    }

    const coupon = result.rows[0];
    req.session.coupon = {
      code: coupon.code,
      discount: parseFloat(coupon.discount_amount)
    };

    res.json({
      success: true,
      message: `Coupon applied! -$${parseFloat(coupon.discount_amount).toFixed(2)} off`,
      discount: parseFloat(coupon.discount_amount)
    });
  } catch (err) {
    console.error('Coupon validation error:', err);
    res.status(500).json({ success: false, message: 'Coupon is not valid.' });
  }
});

// @route   POST /api/cart/remove-coupon
// @desc    Clear the applied coupon from the session
router.post('/remove-coupon', (req, res) => {
  req.session.coupon = null;
  res.json({ success: true, message: 'Coupon removed.' });
});

module.exports = router;
