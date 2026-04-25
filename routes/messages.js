const express = require('express');
const router = express.Router();
const db = require('../config/db');
const https = require('https');

/**
 * Helper to send a notification to Slack
 */
const sendToSlack = (name, email, subject, message) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('your_slack_webhook_url_here')) {
    return;
  }

  const payload = JSON.stringify({
    text: `*New Contact Form Submission - ElectroHub*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*New Contact Form Submission - ElectroHub*\n*From:* ${name} (<mailto:${email}|${email}>)\n*Subject:* ${subject}`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `>>>${message}`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Submitted at: ${new Date().toLocaleString()}`
          }
        ]
      }
    ]
  });

  const url = new URL(webhookUrl);
  const options = {
    hostname: url.hostname,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = https.request(options);
  req.on('error', (e) => console.error(`Slack Notification Error: ${e.message}`));
  req.write(payload);
  req.end();
};

/**
 * @route   POST /api/messages/send
 * @desc    Submit a contact form message
 * @access  Public
 */
router.post('/send', async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Basic validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide all required fields: name, email, subject, and message.' 
    });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Please provide a valid email address.' 
    });
  }

  try {
    // Insert message into database
    const result = await db.query(
      'INSERT INTO public.contact_messages (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, subject, message]
    );

    // Send notification to Slack asynchronously
    sendToSlack(name, email, subject, message);

    res.status(201).json({
      success: true,
      message: 'Your message has been received! We will get back to you shortly.',
      messageId: result.rows[0].id
    });
  } catch (error) {
    console.error('Contact Message Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Failed to save your message. Please try again later.' 
    });
  }
});

/**
 * @route   GET /api/messages
 * @desc    Get all contact messages (Admin only)
 * @access  Private (Admin)
 */
router.get('/', async (req, res) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }

  try {
    const result = await db.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch Messages Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages.' });
  }
});

module.exports = router;
