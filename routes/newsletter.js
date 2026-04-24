const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe a new email to the newsletter
 * @access  Public
 */
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  try {
    const checkResult = await db.query('SELECT id FROM newsletter_subscriptions WHERE email = $1', [email]);
    if (checkResult.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'This email is already subscribed!' });
    }

    await db.query('INSERT INTO newsletter_subscriptions (email) VALUES ($1)', [email]);

    res.status(200).json({
      success: true,
      message: 'Subscription successful! You are now on the list for exclusive deals.'
    });
  } catch (error) {
    console.error('Newsletter Subscription Error:', error);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

/**
 * @route   POST /api/newsletter/send
 * @desc    Send a newsletter to all subscribers (Admin Only)
 * @access  Private (Admin)
 */
router.post('/send', async (req, res) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
  }

  const { subject, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ success: false, message: 'Please provide a subject and message content.' });
  }

  try {
    const subscribers = await db.query('SELECT email FROM newsletter_subscriptions');
    if (subscribers.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No subscribers found.' });
    }

    const emails = subscribers.rows.map(s => s.email);

    // We use batch send to generate unique unsubscribe links for each recipient
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const emailObjects = emails.map(email => {
      // Generate a secure HMAC token so others can't guess the unsubscribe link
      const token = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'fallback_secret').update(email).digest('hex');
      const unsubLink = `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
      
      // Print the link to the terminal so you can click it while testing locally!
      console.log(`[TESTING] Unsubscribe link for ${email}: ${unsubLink}`);
      
      return {
        from: 'ElectroHub <onboarding@resend.dev>', // Note: Use verified domain in production
        to: [email],
        subject: subject,
        html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; border-radius: 12px; padding: 40px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px;">
             <h1 style="color: #0062FF; margin: 0; font-size: 24px;">ElectroHub</h1>
             <p style="color: #666; font-size: 14px;">Premium Electronics Store</p>
          </div>
          <div style="font-size: 16px; line-height: 1.6; color: #333;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="font-size: 12px; color: #999;">
              You are receiving this because you subscribed to ElectroHub updates.
              <br>
              <a href="${unsubLink}" style="color: #0062FF; text-decoration: none;">Unsubscribe</a> | Nabatiye, Lebanon
            </p>
          </div>
        </div>
      `
      };
    });

    const { data, error } = await resend.batch.send(emailObjects);

    if (error) throw error;

    res.status(200).json({ success: true, message: `Newsletter sent successfully to ${emails.length} subscribers!`, data });
  } catch (error) {
    console.error('Newsletter Send Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send newsletter.' });
  }
});

/**
 * @route   GET /api/newsletter/unsubscribe
 * @desc    Unsubscribe an email from the newsletter
 * @access  Public
 */
router.get('/unsubscribe', async (req, res) => {
  const { email, token } = req.query;

  if (!email || !token) {
    return res.status(400).send('Invalid unsubscribe link.');
  }

  // Verify the secure token
  const expectedToken = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'fallback_secret').update(email).digest('hex');
  if (token !== expectedToken) {
    return res.status(403).send(`
      <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; text-align: center; padding: 20px;">
        <h2 style="color: #FF3B30;">Unauthorized Request</h2>
        <p>This unsubscribe link is invalid or has been tampered with. Please use the exact link from your email.</p>
      </div>
    `);
  }

  try {
    const deleteResult = await db.query('DELETE FROM newsletter_subscriptions WHERE email = $1 RETURNING id', [email]);
    if (deleteResult.rows.length === 0) {
      return res.status(400).send('This email is not subscribed or has already been unsubscribed.');
    }

    res.status(200).send(`
      <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; text-align: center; padding: 20px;">
        <h2 style="color: #0062FF;">Unsubscribed Successfully</h2>
        <p>You have been removed from the ElectroHub newsletter list. We're sorry to see you go!</p>
        <p><a href="/" style="color: #0062FF; text-decoration: none;">Return to ElectroHub</a></p>
      </div>
    `);
  } catch (error) {
    console.error('Newsletter Unsubscribe Error:', error);
    res.status(500).send('Server error. Please try again later.');
  }
});

module.exports = router;
