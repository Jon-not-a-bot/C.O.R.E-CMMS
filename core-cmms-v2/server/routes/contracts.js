const express = require('express');
const router = express.Router();

// GET all contracts
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query(`
      SELECT c.*, 
        v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email,
        a.name as asset_name, a.location as asset_location
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      LEFT JOIN assets a ON c.asset_id = a.id
      ORDER BY c.end_date ASC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single contract
router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query(`
      SELECT c.*, 
        v.name as vendor_name, v.phone as vendor_phone, v.email as vendor_email,
        a.name as asset_name, a.location as asset_location
      FROM contracts c
      LEFT JOIN vendors v ON c.vendor_id = v.id
      LEFT JOIN assets a ON c.asset_id = a.id
      WHERE c.id = $1
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create contract
router.post('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { name, vendor_id, asset_id, type, status, start_date, end_date, notice_period_days, auto_renew, value, notes, document_url } = req.body;
    const result = await db.query(`
      INSERT INTO contracts (name, vendor_id, asset_id, type, status, start_date, end_date, notice_period_days, auto_renew, value, notes, document_url)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *
    `, [name, vendor_id || null, asset_id || null, type || 'Service', status || 'Active',
        start_date || null, end_date || null, notice_period_days || 30,
        auto_renew || false, value || null, notes || '', document_url || null]);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update contract
router.put('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { name, vendor_id, asset_id, type, status, start_date, end_date, notice_period_days, auto_renew, value, notes, document_url } = req.body;
    const result = await db.query(`
      UPDATE contracts SET name=$1, vendor_id=$2, asset_id=$3, type=$4, status=$5,
        start_date=$6, end_date=$7, notice_period_days=$8, auto_renew=$9, value=$10, notes=$11, document_url=$12, updated_at=NOW()
      WHERE id=$13 RETURNING *
    `, [name, vendor_id || null, asset_id || null, type || 'Service', status || 'Active',
        start_date || null, end_date || null, notice_period_days || 30,
        auto_renew || false, value || null, notes || '', document_url || null, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE contract
router.delete('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM contracts WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
