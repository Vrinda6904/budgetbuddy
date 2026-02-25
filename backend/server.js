const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const app = express();
app.use(express.json());

/* =========================
   🌐 CORS — allow YOUR Vercel site
========================= */
app.use(cors({
  origin: true,
  credentials: true
}));

/* =========================
   🗄️ DATABASE — Railway MySQL
========================= */
const db = mysql.createConnection({
  host: 'maglev.proxy.rlwy.net',
  user: 'root',
  password: 'JjSUsTIsbHFylJhErZfUxYbbzegPoAOu',
  database: 'railway',
  port: 53662
});

db.connect(err => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to Railway MySQL");
});

/* =========================
   🍪 SESSION STORE (MySQL)
========================= */
const sessionStore = new MySQLStore({
  host: 'maglev.proxy.rlwy.net',
  user: 'root',
  password: 'JjSUsTIsbHFylJhErZfUxYbbzegPoAOu',
  database: 'railway',
  port: 53662
});

app.use(session({
  key: 'budgetbuddy_sid',
  secret: 'supersecret_key',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2,
    httpOnly: true,
    secure: true,      // 🔥 required for HTTPS (Vercel)
    sameSite: 'none'   // 🔥 required for cross-site cookies
  }
}));

/* =========================
   🧠 ROUTES
========================= */

// Health check
app.get("/", (req, res) => {
  res.send("BudgetBuddy Backend Running 🚀");
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ? AND password = ?',
    [email, password],
    (err, results) => {
      if (err) return res.status(500).json({ message: 'DB error' });

      if (results.length > 0) {
        const user = results[0];
        req.session.user = { id: user.id, name: user.name };

        res.json({
          success: true,
          name: user.name,
          id: user.id
        });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }
  );
});

// Register
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, password],
    err => {
      if (err) return res.status(500).json({ message: 'Registration failed' });
      res.json({ message: 'User registered successfully' });
    }
  );
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('budgetbuddy_sid');
    res.json({ message: 'Logged out' });
  });
});

/* =========================
   🚀 START SERVER (Render)
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});