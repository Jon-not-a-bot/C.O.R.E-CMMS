const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'core-cmms/workorders', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }
});
const upload = multer({ storage });

const CATEGORY_ASSIGNMENTS = {
  'PIT Fleet': 'PIT Tech',
  'Dock Equipment': 'Dock Tech',
  'HVAC & Heating': 'HVAC Tech',
  'Electrical': 'Electrical Tech',
  'Life Safety': 'Safety Tech',
  'Building Envelope': 'Facilities Tech',
  'Utilities': 'Facilities Tech',
  'General': 'Facilities Tech'
};

router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { status, priority } = req.query;
    let query = `SELECT wo.*, a.name as asset_name, a.category as asset_category, a.location as asset_location FROM work_orders wo LEFT JOIN assets a ON wo.asset_id = a.id WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (status) { query += ` AND wo.status = $${idx++}`; params.push(status); }
    if (priority) { query += ` AND wo.priority = $${idx++}`; params.push(priority); }
    query += " ORDER BY CASE wo.priority WHEN 'Emergency' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 END, wo.created_at DESC";
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/meta/stats', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const open = await db.query("SELECT COUNT(*) FROM work_orders WHERE status NOT IN ('Closed')");
    const overdue = await db.query("SELECT COUNT(*) FROM work_orders WHERE due_date < NOW() AND status NOT IN ('Closed')");
    const byStatus = await db.query("SELECT status, COUNT(*) FROM work_orders GROUP BY status");
    const byPriority = await db.query("SELECT priority, COUNT(*) FROM work_orders GROUP BY priority");
    res.json({ open: parseInt(open.rows[0].count), overdue: parseInt(overdue.rows[0].count), byStatus: byStatus.rows, byPriority: byPriority.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query(`SELECT wo.*, a.name as asset_name, a.category as asset_category, a.location as asset_location FROM work_orders wo LEFT JOIN assets a ON wo.asset_id = a.id WHERE wo.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', upload.array('photos', 5), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { title, description, type, priority, asset_id, location, due_date, requester_name, source, category } = req.body;
    const photos = req.files ? req.files.map(f => f.path) : [];
    const assigned_to = CATEGORY_ASSIGNMENTS[category] || CATEGORY_ASSIGNMENTS['General'];
    const wo_number = `WO-${Date.now().toString().slice(-6)}`;
    const result = await db.query(`INSERT INTO work_orders (wo_number, title, description, type, priority, status, asset_id, location, due_date, assigned_to, requester_name, source, photos, category) VALUES ($1,$2,$3,$4,$5,'Open',$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [wo_number, title, description, type || 'Repair', priority || 'Medium', asset_id || null, location, due_date || null, assigned_to, requester_name || 'CORE User', source || 'Internal', JSON.stringify(photos), category || 'General']);
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { title, description, type, priority, status, asset_id, location, due_date, assigned_to, resolution_notes, category } = req.body;
    const result = await db.query(`UPDATE work_orders SET title=$1, description=$2, type=$3, priority=$4, status=$5, asset_id=$6, location=$7, due_date=$8, assigned_to=$9, resolution_notes=$10, category=$11, closed_at=${status === 'Closed' ? 'NOW()' : 'closed_at'}, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [title, description, type, priority, status, asset_id || null, location, due_date || null, assigned_to, resolution_notes, category || 'General', req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM work_orders WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
