/**
 * Week 4: Advanced Threat Detection & Web Security Enhancements
 * Secured Express.js API Server
 */

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
const { apiKeyAuth, oauthMiddleware } = require('./middleware/auth');
const { csrfProtection } = require('./middleware/csrf');
const securityHeaders = require('./config/securityHeaders');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Body Parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan('combined'));

// ─── Security Headers via Helmet + Custom CSP ────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:     ["'self'"],
        scriptSrc:      ["'self'"],
        styleSrc:       ["'self'", "'unsafe-inline'"],
        imgSrc:         ["'self'", "data:", "https:"],
        connectSrc:     ["'self'"],
        fontSrc:        ["'self'"],
        objectSrc:      ["'none'"],
        mediaSrc:       ["'self'"],
        frameSrc:       ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000,          // 1 year
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    permissionsPolicy: {
      features: {
        camera:      [],
        microphone:  [],
        geolocation: [],
      },
    },
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: origin ${origin} not allowed`));
    },
    methods:            ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders:     ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials:        true,
    optionsSuccessStatus: 200,
  })
);

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs:  15 * 60 * 1000,   // 15 minutes
  max:       100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use(globalLimiter);

// ─── Strict Auth Rate Limiter ─────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs:  15 * 60 * 1000,
  max:       5,
  message: { error: 'Too many login attempts. Account temporarily locked.' },
  skipSuccessfulRequests: true,
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public login — strict rate limited
app.post('/api/auth/login', authLimiter, require('./routes/auth').login);

// Protected API routes — require API key or OAuth
app.use('/api', apiKeyAuth);
app.use('/api/v1', require('./routes/users'));
app.use('/api/v1', require('./routes/data'));

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${err.message}`);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
