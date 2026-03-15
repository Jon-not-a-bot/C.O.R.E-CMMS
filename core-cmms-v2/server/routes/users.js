const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// GET all users
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query(
      'SELECT id, name, email, role, active, last_login, created_at FROM users ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create user
router.post('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required.' });
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'A user with that email already exists.' });
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, active, created_at',
      [name, email, hash, role || 'technician']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update role (promote/demote)
router.put('/:id/role', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { role } = req.body;
    if (!['admin', 'technician'].includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User removed.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
