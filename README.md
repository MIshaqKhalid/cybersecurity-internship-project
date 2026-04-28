# 🔒 Cybersecurity Internship Project  
### Strengthening Security Measures for a Web Application  

**Intern:** Muhammad Ishaq Khalid  
**Period:** April 7, 2026 – April 28, 2026  
**Submission:** April 28, 2026  

---

## 📋 Overview

This project demonstrates the complete lifecycle of web application security hardening over 3 weeks:

| Week | Focus                | Key Activities |
|------|---------------------|---------------|
| 1    | Security Assessment | Identified 7 vulnerabilities in a mock User Management System |
| 2    | Implementation      | Applied 7 security layers using industry-standard libraries |
| 3    | Verification        | Conducted penetration testing — all attacks blocked |

The project follows **OWASP Top 10:2025** and **Node.js 2026 security best practices**.

---

## 🗂️ Repository Structure

```
cybersecurity-internship-project/
├── README.md
├── SECURITY_CHECKLIST.md
├── reports/
│   ├── week1-report.md
│   ├── week2-report.md
│   ├── week3-report.md
│   └── final-report.md
├── vulnerable-app/
│   ├── app.js
│   ├── package.json
│   └── public/
│       └── index.html
├── secured-app/
│   ├── app.js
│   ├── package.json
│   ├── .env.example
│   ├── security.log
│   └── public/
│       └── index.html
└── screenshots/
    ├── xss-vulnerable.png
    ├── xss-fixed.png
    ├── sql-injection.png
    ├── sql-injection-fixed.png
    ├── weak-password.png
    ├── security-headers.png
    ├── rate-limit.png
    ├── security-logs.png
    ├── nmap-scan.png
    └── auth-test.png
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- npm
- Git

---

### 1. Clone Repository
```bash
git clone https://github.com/MIshaqKhalid/cybersecurity-internship-project.git
cd cybersecurity-internship-project
```

---

### 2. Run Vulnerable App (Week 1)
```bash
cd vulnerable-app
npm install
npm start
```

Open: http://localhost:3000  

**Test Cases:**
- XSS → Click *Test XSS Attack* → Alert appears  
- SQL Injection → `admin' OR '1'='1` → Login bypass  
- Weak Password → Check plaintext in code  

---

### 3. Run Secured App (Week 2–3)
```bash
cd ../secured-app
npm install
cp .env.example .env
```

Edit `.env`:
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2026
NODE_ENV=production
PORT=3000
```

Start server:
```bash
npm start
```

---

## 🔍 Vulnerabilities Fixed

| # | Vulnerability                  | Severity | Status |
|--|-------------------------------|----------|--------|
| 1 | Cross-Site Scripting (XSS)    | High     | ✅ Fixed |
| 2 | SQL Injection                 | Critical | ✅ Fixed |
| 3 | Weak Password Storage         | Critical | ✅ Fixed |
| 4 | Missing Authentication        | High     | ✅ Fixed |
| 5 | Missing Security Headers      | Medium   | ✅ Fixed |
| 6 | No Rate Limiting              | Medium   | ✅ Fixed |
| 7 | No Security Logging           | Low      | ✅ Fixed |

---

## 🛡️ Security Measures Implemented

| Control              | Technology           | Purpose |
|---------------------|---------------------|---------|
| Input Validation    | validator           | Sanitization & XSS prevention |
| Password Hashing    | bcrypt (12 rounds)  | Secure storage |
| Authentication      | jsonwebtoken        | Token-based auth |
| Security Headers    | helmet              | Protect HTTP layer |
| Rate Limiting       | express-rate-limit  | Prevent brute-force |
| Logging             | winston             | Security monitoring |
| Secret Management   | dotenv              | Secure env variables |

---

## 📊 OWASP Top 10:2025 Compliance

| Category | Status |
|----------|--------|
| A01 — Broken Access Control | ✅ |
| A02 — Security Misconfiguration | ✅ |
| A03 — Supply Chain | ✅ |
| A04 — Cryptographic Failures | ✅ |
| A05 — Injection | ✅ |
| A06 — Insecure Design | ✅ |
| A07 — Authentication Failures | ✅ |
| A08 — Integrity Failures | ✅ |
| A09 — Logging & Monitoring | ✅ |
| A10 — Exception Handling | ✅ |

---

## 🧪 Testing Guide

### Week 1 (Vulnerable App)

| Test | Action | Result |
|------|--------|--------|
| XSS | Click button | Alert pops |
| SQLi | Use injection | Admin login |
| Weak Password | Inspect code | Plaintext |

---

### Week 2–3 (Secured App)

| Test | Result |
|------|--------|
| Signup | User registered |
| Login | Token issued |
| XSS | Blocked (401) |
| SQLi | Blocked (401) |
| No Auth | Blocked |
| Rate Limit | 429 triggered |

---

## 📄 Reports

| Report | File |
|--------|------|
| Week 1 | reports/week1-report.docx |
| Week 2 | reports/week2-report.docx |
| Week 3 | reports/week3-report.docx |
| Final  | reports/final-report.docx |

---

## 🛠️ Tools Used

- OWASP ZAP  
- Chrome DevTools  
- Postman / curl  
- Nmap  
- VS Code  

---
