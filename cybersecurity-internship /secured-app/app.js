const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const winston = require('winston');
const rateLimit = require('express-rate-limit');

const app = express();
const db = new sqlite3.Database(':memory:');
const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// ========== SECURITY: Logging ==========
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'security.log' })
    ]
});

logger.info('Application started securely');

// ========== SECURITY: HTTP Headers ==========
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// ========== SECURITY: Rate Limiting ==========
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts, please try again later.'
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// ========== SECURITY: Database Setup ==========
db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        email TEXT
    )`);
    
    // Insert admin with hashed password
    const adminHash = bcrypt.hashSync('SecureAdmin123!', SALT_ROUNDS);
    db.run(`INSERT INTO users (username, password, email) 
            VALUES ('admin', ?, 'admin@test.com')`, [adminHash]);
});

// ========== SECURITY: JWT Middleware ==========
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        logger.warn('Access denied: No token provided');
        return res.status(401).send('Access denied. No token provided.');
    }
    
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            logger.warn('Invalid token attempted');
            return res.status(403).send('Invalid token.');
        }
        req.user = user;
        next();
    });
};

// ========== SECURITY: Input Sanitization Helper ==========
const sanitizeInput = (input) => {
    return validator.escape(input.trim());
};

// ========== ROUTES ==========

// Signup - SECURED
app.post('/signup', async (req, res) => {
    try {
        let { username, password, email } = req.body;
        
        // Validate inputs
        if (!username || !password || !email) {
            return res.status(400).send('All fields are required.');
        }
        
        // Sanitize username
        username = sanitizeInput(username);
        
        // Validate email format
        if (!validator.isEmail(email)) {
            logger.warn(`Invalid email format attempted: ${email}`);
            return res.status(400).send('Invalid email format.');
        }
        
        // Validate password strength
        if (password.length < 8) {
            return res.status(400).send('Password must be at least 8 characters.');
        }
        
        // Check if user exists
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
            if (err) {
                logger.error(`Database error during signup: ${err.message}`);
                return res.status(500).send('Internal server error.');
            }
            if (row) {
                return res.status(409).send('Username already exists.');
            }
            
            // Hash password securely
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            
            // Use parameterized query (prevents SQL Injection)
            db.run(
                'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
                [username, hashedPassword, email],
                function(err) {
                    if (err) {
                        logger.error(`Signup error: ${err.message}`);
                        return res.status(500).send('Error creating user.');
                    }
                    logger.info(`New user registered: ${username}`);
                    res.status(201).send('User registered successfully!');
                }
            );
        });
    } catch (error) {
        logger.error(`Signup exception: ${error.message}`);
        res.status(500).send('Internal server error.');
    }
});

// Login - SECURED
app.post('/login', authLimiter, (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).send('Username and password required.');
        }
        
        // Use parameterized query (prevents SQL Injection)
        db.get(
            'SELECT * FROM users WHERE username = ?',
            [username],
            async (err, row) => {
                if (err) {
                    logger.error(`Login database error: ${err.message}`);
                    return res.status(500).send('Internal server error.');
                }
                
                if (!row) {
                    logger.warn(`Failed login attempt for username: ${username}`);
                    return res.status(401).send('Invalid credentials.');
                }
                
                // Compare hashed password
                const validPassword = await bcrypt.compare(password, row.password);
                
                if (!validPassword) {
                    logger.warn(`Failed login attempt for username: ${username}`);
                    return res.status(401).send('Invalid credentials.');
                }
                
                // Generate JWT token
                const token = jwt.sign(
                    { id: row.id, username: row.username },
                    SECRET_KEY,
                    { expiresIn: '1h' }
                );
                
                logger.info(`Successful login: ${username}`);
                res.json({ 
                    message: 'Login successful!',
                    token: token,
                    user: { id: row.id, username: row.username, email: row.email }
                });
            }
        );
    } catch (error) {
        logger.error(`Login exception: ${error.message}`);
        res.status(500).send('Internal server error.');
    }
});

// Profile - SECURED (requires auth, output encoded)
app.get('/profile', authenticateToken, (req, res) => {
    const username = req.user.username;
    
    db.get('SELECT username, email FROM users WHERE id = ?', [req.user.id], (err, row) => {
        if (err || !row) {
            return res.status(404).send('User not found.');
        }
        
        // Output is automatically escaped by template engines, 
        // but we explicitly escape here for demonstration
        const safeUsername = validator.escape(row.username);
        const safeEmail = validator.escape(row.email);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><title>Profile</title></head>
            <body>
                <h1>Profile: ${safeUsername}</h1>
                <p>Email: ${safeEmail}</p>
                <p>User ID: ${req.user.id}</p>
            </body>
            </html>
        `);
    });
});

// Protected API endpoint example
app.get('/api/users', authenticateToken, (req, res) => {
    db.all('SELECT id, username, email FROM users', [], (err, rows) => {
        if (err) {
            return res.status(500).send('Database error.');
        }
        res.json(rows);
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(3000, () => {
    console.log('🔒 Secured app running on http://localhost:3000');
    logger.info('Server started on port 3000');
});
