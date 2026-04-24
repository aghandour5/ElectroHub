const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { Resend } = require('resend');
const db = require('../config/db');
const { passwordResetEmail } = require('../config/emailTemplates');

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save to Database
    const newUser = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hashedPassword]
    );

    // Log the user in via session
    const user = newUser.rows[0];
    req.session.user = { id: user.id, name: user.name, role: user.role };

    res.status(201).json({ message: 'Registration successful', user: req.session.user });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate User & create session
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  try {
    // Find user
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    // Setup Session
    req.session.user = { id: user.id, name: user.name, role: user.role };

    res.json({ message: 'Login successful', user: req.session.user });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// @route   POST /api/auth/logout
// @desc    Destroy session and logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: 'Could not log out.' });
    res.json({ message: 'Logout successful' });
  });
});

// @route   GET /api/auth/me
// @desc    Get current session context & profile data
router.get('/me', async (req, res) => {
  if (req.session.user) {
    try {
      const userResult = await db.query('SELECT id, name, email, role, phone, address FROM users WHERE id = $1', [req.session.user.id]);
      if (userResult.rows.length > 0) {
        return res.json({ isAuthenticated: true, user: userResult.rows[0] });
      }
    } catch (e) {
      console.error('Auth me error:', e);
    }
    res.json({ isAuthenticated: true, user: req.session.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// @route   GET /api/auth/orders
// @desc    Get order history with items for the logged-in user
router.get('/orders', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  try {
    const ordersResult = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.session.user.id]
    );

    const orders = ordersResult.rows;

    for (let order of orders) {
      const itemsResult = await db.query(`
        SELECT oi.*, p.name, p.image_path 
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `, [order.id]);
      order.items = itemsResult.rows;
    }

    res.json(orders);
  } catch (e) {
    console.error('Order history error:', e);
    res.status(500).json({ error: 'Server error fetching orders.' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (name, email, phone, address)
router.put('/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  const { name, email, phone, address } = req.body;
  try {
    // Check if new email is already taken by someone else
    if (email) {
      const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.session.user.id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ error: 'Email is already in use.' });
      }
    }

    await db.query(
      'UPDATE users SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5',
      [name, email, phone, address, req.session.user.id]
    );
    // Update session user name just in case it was changed
    if (name) req.session.user.name = name;
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
router.put('/change-password', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Please provide old and new password.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters.' });

  try {
    const userResult = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.session.user.id]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const isMatch = await bcrypt.compare(oldPassword, userResult.rows[0].password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Incorrect old password.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, req.session.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Generate password reset token and send via Resend
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Please provide an email.' });

  try {
    const userResult = await db.query('SELECT id, name FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // For security, don't reveal if email exists
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate a cryptographically secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    await db.query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3',
      [resetToken, expiry, email]
    );

    // Build the reset link (uses the current request origin)
    const resetLink = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;
    const userName = userResult.rows[0].name;

    // Send the email via Resend using the branded template
    const { error: emailError } = await resend.emails.send({
      from: 'ElectroHub <onboarding@resend.dev>',
      to: email,
      subject: 'Reset Your ElectroHub Password',
      html: passwordResetEmail(userName, resetLink)
    });

    if (emailError) {
      console.error('Resend email error:', emailError);
      return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
    }

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error during forgot password' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Please provide token and new password.' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

  try {
    const userResult = await db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()',
      [token]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
      [hashedPassword, userResult.rows[0].id]
    );

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

module.exports = router;
