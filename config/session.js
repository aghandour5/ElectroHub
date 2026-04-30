const crypto = require('crypto');
let cachedSecret;

function getSessionSecret() {
  if (cachedSecret) {
    return cachedSecret;
  }

  if (process.env.SESSION_SECRET) {
    cachedSecret = process.env.SESSION_SECRET;
    return cachedSecret;
  }

  if (process.env.NODE_ENV === 'production') {
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
