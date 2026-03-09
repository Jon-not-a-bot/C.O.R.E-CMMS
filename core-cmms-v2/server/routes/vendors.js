const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

// GET all vendors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendors ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// GET single vendor
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendors WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// POST create vendor
router.post('/', async (req, res) => {
  const { name, scope, phone, email, primary_contact, website, notes, contract_start, contract_end, contract_notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Vendor name is required' });
  try {
    const result = await pool.query(
      `INSERT INTO vendors (name, scope, phone, email, primary_contact, website, notes, contract_start, contract_end, contract_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [name, scope, phone || null, email || null, primary_contact || null, website || null, notes || null,
       contract_start || null, contract_end || null, contract_notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// PUT update vendor
router.put('/:id', async (req, res) => {
  const { name, scope, phone, email, primary_contact, website, notes, contract_start, contract_end, contract_notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE vendors SET
        name=$1, scope=$2, phone=$3, email=$4, primary_contact=$5,
        website=$6, notes=$7, contract_start=$8, contract_end=$9,
        contract_notes=$10, updated_at=NOW()
       WHERE id=$11 RETURNING *`,
      [name, scope, phone || null, email || null, primary_contact || null, website || null, notes || null,
       contract_start || null, contract_end || null, contract_notes || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// DELETE vendor
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vendors WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

module.exports = router;
