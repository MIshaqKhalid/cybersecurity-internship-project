/**
 * CSRF Protection Middleware
 * Uses double-submit cookie pattern (csurf-compatible)
 */

const crypto = require('crypto');

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf-token';
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Generate a cryptographically secure CSRF token
const generateToken = () => crypto.randomBytes(32).toString('hex');

const csrfProtection = (req, res, next) => {
  // Set CSRF token cookie on first visit
  if (!req.cookies?.[CSRF_COOKIE]) {
    const token = generateToken();
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false,   // Must be readable by JS to embed in headers
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge:   3600000, // 1 hour
    });
    req.csrfToken = token;
    return next();
  }

  // Skip validation for safe methods
  if (SAFE_METHODS.has(req.method)) return next();

  // Validate token for state-changing requests
  const cookieToken  = req.cookies[CSRF_COOKIE];
  const headerToken  = req.headers[CSRF_HEADER];

  if (!headerToken || cookieToken !== headerToken) {
    console.warn(`[CSRF] Token mismatch from ${req.ip} on ${req.method} ${req.path}`);
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

module.exports = { csrfProtection, generateToken };
