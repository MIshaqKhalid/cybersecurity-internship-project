/**
 * Authentication Middleware
 * Supports API Key and OAuth 2.0 Bearer Token validation
 */

const crypto = require('crypto');

// ─── API Key Authentication ───────────────────────────────────────────────────
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }

  // Constant-time comparison to prevent timing attacks
  const validKey = process.env.API_KEY || 'dev-secret-key-change-in-production';
  const isValid  = crypto.timingSafeEqual(
    Buffer.from(apiKey.padEnd(64)),
    Buffer.from(validKey.padEnd(64))
  );

  if (!isValid) {
    console.warn(`[AUTH] Invalid API key attempt from ${req.ip}`);
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

// ─── OAuth 2.0 Bearer Token Middleware ───────────────────────────────────────
const jwt = require('jsonwebtoken');

const oauthMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Bearer token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret');
    req.user = decoded;
    next();
  } catch (err) {
    console.warn(`[AUTH] Invalid token from ${req.ip}: ${err.message}`);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ─── Role-Based Access Control ────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { apiKeyAuth, oauthMiddleware, requireRole };
