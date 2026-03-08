const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const db = req.app.locals.db;
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1 AND active = true', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/verify
router.get('/verify', requireAuth, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// GET /api/auth/users — admin only
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query('SELECT id, name, email, role, active, last_login, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/users — admin only, create user
router.post('/users', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, active, created_at',
      [name, email.toLowerCase().trim(), hash, role || 'technician']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/users/:id — admin only
router.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  const { name, role, active, password } = req.body;
  try {
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await db.query('UPDATE users SET name=$1, role=$2, active=$3, password_hash=$4 WHERE id=$5', [name, role, active, hash, req.params.id]);
    } else {
      await db.query('UPDATE users SET name=$1, role=$2, active=$3 WHERE id=$4', [name, role, active, req.params.id]);
    }
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Middleware
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = router;
module.exports.requireAuth = requireAuth;
