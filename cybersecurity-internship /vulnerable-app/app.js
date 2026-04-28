const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database(':memory:');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

// ========== VULNERABLE DATABASE SETUP ==========
db.serialize(() => {
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        password TEXT,
        email TEXT
    )`);
    
    // Insert test admin user with WEAK plaintext password
    db.run(`INSERT INTO users (username, password, email) 
            VALUES ('admin', 'password123', 'admin@test.com')`);
});

// ========== VULNERABLE ROUTES ==========

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// VULNERABLE: No input validation, SQL Injection possible
app.post('/signup', (req, res) => {
    const { username, password, email } = req.body;
    
    // SQL INJECTION VULNERABILITY: Direct string concatenation
    const query = `INSERT INTO users (username, password, email) 
                   VALUES ('${username}', '${password}', '${email}')`;
    
    db.run(query, function(err) {
        if (err) {
            return res.status(500).send('Error: ' + err.message);
        }
        res.send('User registered successfully!');
    });
});

// VULNERABLE: SQL Injection in login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // SQL INJECTION VULNERABILITY
    const query = `SELECT * FROM users 
                   WHERE username = '${username}' 
                   AND password = '${password}'`;
    
    db.get(query, (err, row) => {
        if (err) {
            return res.status(500).send('Error: ' + err.message);
        }
        if (row) {
            // XSS VULNERABILITY: No output encoding
            res.send(`Welcome, ${row.username}! <br>Email: ${row.email}`);
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

// VULNERABLE: XSS - No output encoding, no auth
app.get('/profile', (req, res) => {
    const username = req.query.username || 'Guest';
    // XSS VULNERABILITY: Direct rendering of user input
    res.send(`<h1>Profile: ${username}</h1><p>Welcome to your profile!</p>`);
});

app.listen(3000, () => {
    console.log('🔓 VULNERABLE app running on http://localhost:3000');
});
