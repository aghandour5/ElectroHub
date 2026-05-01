const crypto = require('crypto'); // Used for generating a random session secret in development if not provided via environment variable
let cachedSecret;

function getSessionSecret() {
  if (cachedSecret) {
    return cachedSecret; // Return cached secret if already generated or loaded from environment variable
  }

  if (process.env.SESSION_SECRET) {
    cachedSecret = process.env.SESSION_SECRET;
    return cachedSecret;
  }

  if (process.env.NODE_ENV === 'production') { // In production, we require a SESSION_SECRET to be set for security reasons
    throw new Error('SESSION_SECRET must be set in production.');
  }

  cachedSecret = crypto.randomBytes(32).toString('hex');
  console.warn('SESSION_SECRET is not set. Using an ephemeral development-only secret.');
  return cachedSecret;
}

function isSecureCookieEnabled() {
  if (process.env.SESSION_COOKIE_SECURE) {
    return process.env.SESSION_COOKIE_SECURE === 'true';
  }

  return process.env.NODE_ENV === 'production';
}

module.exports = {
  getSessionSecret,
  isSecureCookieEnabled
};
