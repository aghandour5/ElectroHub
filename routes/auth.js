const express = require('express');
const router = express.Router(); // Router for authentication-related routes
const bcrypt = require('bcryptjs'); // bcrypt for hashing passwords securely
const crypto = require('crypto'); // crypto for generating secure tokens for password reset
const { Resend } = require('resend'); // Resend SDK for sending transactional emails (like password resets)
const rateLimit = require('express-rate-limit'); // Rate limiting to prevent brute-force attacks
const db = require('../config/db');
const { passwordResetEmail } = require('../config/emailTemplates');
const { createClient } = require('@supabase/supabase-js');

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);
// Initialize Supabase Client for backend verification
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

// Rate limiter: max 10 auth attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts from this IP, please try again after 15 minutes.' }
});

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', authLimiter, async (req, res) => {
  const name = cleanString(req.body.name);
  const email = cleanString(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please enter all fields.' });
  }

  if (name.length < 2 || name.length > 120) {
    return res.status(400).json({ error: 'Name must be between 2 and 120 characters.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    // Check if user exists
    const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists with this email.' });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10); // Generate salt with 10 rounds (default)
    const hashedPassword = await bcrypt.hash(password, salt); // Hash the password with the generated salt

    // Save to Database
    const newUser = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, role',
      [name, email, hashedPassword] // parameterized query to prevent SQL injection
    );

    // Log the user in via session
    const user = newUser.rows[0];
    req.session.user = { id: user.id, name: user.name, role: user.role };

    await db.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [user.id, 'Welcome to ElectroHub. Your account is ready.']
    );

    res.status(201).json({ message: 'Registration successful', user: req.session.user });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate User & create session
router.post('/login', authLimiter, async (req, res) => {
  const email = cleanString(req.body.email).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
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

// @route   GET /api/auth/config
// @desc    Get Supabase public config
router.get('/config', (req, res) => {
  res.json({
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  });
});

// @route   POST /api/auth/session-sync
// @desc    Sync Supabase session to Express session
router.post('/session-sync', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ error: 'Access token required.' });

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(access_token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // Find the user in our public.users table by email
    let dbUserResult = await db.query('SELECT * FROM users WHERE email = $1', [user.email]);
    
    // If the database trigger hasn't fired yet or the user doesn't exist, fallback to insert
    if (dbUserResult.rows.length === 0) {
        const name = user.user_metadata?.name || user.user_metadata?.full_name || 'User';
        dbUserResult = await db.query(
            'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) RETURNING *',
            [name, user.email, 'customer']
        );
    }

    const dbUser = dbUserResult.rows[0];

    // Setup Express Session
    req.session.user = { id: dbUser.id, name: dbUser.name, role: dbUser.role };

    res.json({ message: 'Session synchronized successfully', user: req.session.user });
  } catch (error) {
    console.error('Session sync error:', error);
    res.status(500).json({ error: 'Server error during session sync.' });
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
  if (req.session.user) { // If user is logged in, fetch their profile data to return (instead of just session info)
    try {
      const userResult = await db.query('SELECT id, name, email, role, phone, address, created_at FROM users WHERE id = $1', [req.session.user.id]);
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
    // Single JOIN query to avoid N+1 DB calls (fetching all orders + items in one shot)
    const result = await db.query(`
      SELECT 
        o.id, o.total_amount, o.status, o.shipping_address, o.created_at,
        oi.product_id, oi.quantity, oi.price AS item_price,
        p.name AS product_name, p.image_path
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [req.session.user.id]);

    // Group flat rows into nested orders[].items[] structure
    const ordersMap = new Map();
    result.rows.forEach(row => {
      if (!ordersMap.has(row.id)) {
        ordersMap.set(row.id, {
          id: row.id,
          total_amount: row.total_amount,
          status: row.status,
          shipping_address: row.shipping_address,
          created_at: row.created_at,
          items: []
        });
      }
      // Only push item if there was a matching order_item row
      if (row.product_id) {
        ordersMap.get(row.id).items.push({
          product_id: row.product_id,
          name: row.product_name,
          image_path: row.image_path,
          quantity: row.quantity,
          price: row.item_price
        });
      }
    });

    res.json(Array.from(ordersMap.values()));
  } catch (e) {
    console.error('Order history error:', e);
    res.status(500).json({ error: 'Server error fetching orders.' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile (name, email, phone, address)
router.put('/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated.' });
  const name = cleanString(req.body.name);
  const email = cleanString(req.body.email).toLowerCase();
  const phone = cleanString(req.body.phone);
  const address = cleanString(req.body.address);

  if (name.length < 2 || name.length > 120) {
    return res.status(400).json({ error: 'Name must be between 2 and 120 characters.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  if (phone && !/^[+\d][+\d\s().-]{6,24}$/.test(phone)) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  if (address.length > 500) {
    return res.status(400).json({ error: 'Address must be 500 characters or fewer.' });
  }

  try {
    // Check if new email is already taken by someone else
    if (email) {
      const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.session.user.id]); // req.session.user.id is the current user's ID provided in the session, so we check if any other user has the same email.
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
  const oldPassword = typeof req.body.oldPassword === 'string' ? req.body.oldPassword : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Please provide old and new password.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  if (oldPassword === newPassword) return res.status(400).json({ error: 'New password must be different from the current password.' });

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
  const email = cleanString(req.body.email).toLowerCase();
  if (!email) return res.status(400).json({ error: 'Please provide an email.' });
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });

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
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

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
