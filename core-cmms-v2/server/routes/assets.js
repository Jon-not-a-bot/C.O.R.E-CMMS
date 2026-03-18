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
  params: { folder: 'core-cmms/assets', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }
});
const upload = multer({ storage });

// GET all assets
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { category, criticality, status, search } = req.query;
    let query = 'SELECT * FROM assets WHERE 1=1';
    const params = [];
    let idx = 1;

    if (category) { query += ` AND category = $${idx++}`; params.push(category); }
    if (criticality) { query += ` AND criticality = $${idx++}`; params.push(criticality); }
    if (status) { query += ` AND status = $${idx++}`; params.push(status); }
    if (search) {
      query += ` AND (name ILIKE $${idx} OR asset_id ILIKE $${idx} OR location ILIKE $${idx})`;
      params.push(`%${search}%`); idx++;
    }

    query += ' ORDER BY criticality ASC, name ASC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single asset
router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create asset
router.post('/', upload.array('photos', 10), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const {
      asset_id, name, category, subcategory, location, criticality,
      manufacturer, model, serial_number, install_date, condition,
      pm_frequency, last_pm_date, next_pm_date, assigned_tech,
      management_type, vendor_name, notes, warranty_expiry,
      purchase_date, purchase_cost, year, ownership
    } = req.body;

    const photos = req.files ? req.files.map(f => f.path) : [];

    const result = await db.query(`
      INSERT INTO assets (
        asset_id, name, category, subcategory, location, criticality,
        manufacturer, model, serial_number, install_date, condition,
        pm_frequency, last_pm_date, next_pm_date, assigned_tech,
        management_type, vendor_name, notes, warranty_expiry, photos,
        purchase_date, purchase_cost, year, ownership
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      RETURNING *
    `, [
      asset_id || null, name, category, subcategory, location, criticality,
      manufacturer, model, serial_number, install_date || null, condition,
      pm_frequency, last_pm_date || null, next_pm_date || null, assigned_tech,
      management_type, vendor_name, notes, warranty_expiry || null,
      JSON.stringify(photos),
      purchase_date || null, purchase_cost || null, year || null, ownership || 'Owned'
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update asset
router.put('/:id', upload.array('photos', 10), async (req, res) => {
  const db = req.app.locals.db;
  try {
    const existing = await db.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Asset not found' });

    const current = existing.rows[0];
    const {
      asset_id, name, category, subcategory, location, criticality,
      manufacturer, model, serial_number, install_date, condition,
      pm_frequency, last_pm_date, next_pm_date, assigned_tech,
      management_type, vendor_name, notes, warranty_expiry,
      purchase_date, purchase_cost, year, ownership
    } = req.body;

    const existingPhotos = current.photos || [];
    const newPhotos = req.files ? req.files.map(f => f.path) : [];
    const allPhotos = [...existingPhotos, ...newPhotos];

    // Only update asset_id if it changed AND is not already taken by another asset
    const newAssetId = asset_id || null;
    if (newAssetId && newAssetId !== current.asset_id) {
      const conflict = await db.query(
        'SELECT id FROM assets WHERE asset_id = $1 AND id != $2',
        [newAssetId, req.params.id]
      );
      if (conflict.rows.length > 0) {
        return res.status(400).json({ error: `Asset ID "${newAssetId}" is already in use by another asset.` });
      }
    }

    const result = await db.query(`
      UPDATE assets SET
        asset_id=$1, name=$2, category=$3, subcategory=$4, location=$5, criticality=$6,
        manufacturer=$7, model=$8, serial_number=$9, install_date=$10, condition=$11,
        pm_frequency=$12, last_pm_date=$13, next_pm_date=$14, assigned_tech=$15,
        management_type=$16, vendor_name=$17, notes=$18, warranty_expiry=$19, photos=$20,
        purchase_date=$21, purchase_cost=$22, year=$23, ownership=$24,
        updated_at=NOW()
      WHERE id=$25 RETURNING *
    `, [
      newAssetId, name, category, subcategory, location, criticality,
      manufacturer, model, serial_number, install_date || null, condition,
      pm_frequency, last_pm_date || null, next_pm_date || null, assigned_tech,
      management_type, vendor_name, notes, warranty_expiry || null,
      JSON.stringify(allPhotos),
      purchase_date || null, purchase_cost || null, year || null, ownership || 'Owned',
      req.params.id
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE asset
router.delete('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM assets WHERE id = $1', [req.params.id]);
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stats for dashboard
router.get('/meta/stats', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const total = await db.query('SELECT COUNT(*) FROM assets');
    const byCriticality = await db.query('SELECT criticality, COUNT(*) FROM assets GROUP BY criticality');
    const byCategory = await db.query('SELECT category, COUNT(*) FROM assets GROUP BY category');
    const byStatus = await db.query('SELECT status, COUNT(*) FROM assets GROUP BY status');
    const pmDueSoon = await db.query(`SELECT COUNT(*) FROM assets WHERE next_pm_date <= NOW() + INTERVAL '30 days' AND next_pm_date IS NOT NULL`);

    res.json({
      total: parseInt(total.rows[0].count),
      byCriticality: byCriticality.rows,
      byCategory: byCategory.rows,
      byStatus: byStatus.rows,
      pmDueSoon: parseInt(pmDueSoon.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
