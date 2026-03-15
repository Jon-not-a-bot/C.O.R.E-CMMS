const express = require('express');
const router = express.Router();

// Helper: calculate next due date based on frequency
function calcNextDue(frequency, fromDate) {
  const d = fromDate ? new Date(fromDate) : new Date();
  switch (frequency) {
    case 'Daily':     d.setDate(d.getDate() + 1); break;
    case 'Weekly':    d.setDate(d.getDate() + 7); break;
    case 'Bi-Weekly': d.setDate(d.getDate() + 14); break;
    case 'Monthly':   d.setMonth(d.getMonth() + 1); break;
    case 'Quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'Semi-Annual': d.setMonth(d.getMonth() + 6); break;
    case 'Annual':    d.setFullYear(d.getFullYear() + 1); break;
    default:          d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split('T')[0];
}

// GET all PM templates
router.get('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query(`
      SELECT pt.*, 
        COUNT(wo.id) FILTER (WHERE wo.status != 'Closed') as open_wo_count,
        COUNT(wo.id) FILTER (WHERE wo.status = 'Closed') as completed_wo_count
      FROM pm_templates pt
      LEFT JOIN work_orders wo ON wo.pm_template_id = pt.id
      GROUP BY pt.id
      ORDER BY pt.next_due_date ASC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET single PM template
router.get('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query('SELECT * FROM pm_templates WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    // Get associated work orders
    const wos = await db.query(
      'SELECT * FROM work_orders WHERE pm_template_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json({ ...result.rows[0], work_orders: wos.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create PM template + generate first WO
router.post('/', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { name, description, frequency, asset_ids, assigned_to, vendor_id, checklist, start_date } = req.body;
    const next_due = start_date || calcNextDue(frequency, new Date());

    const result = await db.query(`
      INSERT INTO pm_templates (name, description, frequency, asset_ids, assigned_to, vendor_id, checklist, next_due_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *
    `, [name, description, frequency, asset_ids || [], assigned_to, vendor_id || null,
        JSON.stringify(checklist || []), next_due]);

    const template = result.rows[0];

    // Generate initial work order(s)
    await generateWOs(db, template);

    res.status(201).json(template);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update PM template
router.put('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const { name, description, frequency, asset_ids, assigned_to, vendor_id, checklist, active, next_due_date } = req.body;
    const result = await db.query(`
      UPDATE pm_templates SET name=$1, description=$2, frequency=$3, asset_ids=$4, assigned_to=$5,
        vendor_id=$6, checklist=$7, active=$8, next_due_date=$9, updated_at=NOW()
      WHERE id=$10 RETURNING *
    `, [name, description, frequency, asset_ids || [], assigned_to, vendor_id || null,
        JSON.stringify(checklist || []), active !== false, next_due_date, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE PM template
router.delete('/:id', async (req, res) => {
  const db = req.app.locals.db;
  try {
    await db.query('DELETE FROM pm_templates WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/pm-templates/:id/generate — manually trigger WO generation
router.post('/:id/generate', async (req, res) => {
  const db = req.app.locals.db;
  try {
    const result = await db.query('SELECT * FROM pm_templates WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const wos = await generateWOs(db, result.rows[0]);
    res.json({ generated: wos.length, work_orders: wos });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Helper: generate WO(s) for a template
async function generateWOs(db, template) {
  const assetIds = template.asset_ids && template.asset_ids.length > 0 ? template.asset_ids : [null];
  const created = [];

  for (const assetId of assetIds) {
    let assetName = null;
    let assetLocation = null;
    if (assetId) {
      const assetRes = await db.query('SELECT name, location FROM assets WHERE id = $1', [assetId]);
      if (assetRes.rows.length > 0) {
        assetName = assetRes.rows[0].name;
        assetLocation = assetRes.rows[0].location;
      }
    }

    const title = assetName ? `${template.name} — ${assetName}` : template.name;
    const wo_number = `PM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*100)}`;

    const wo = await db.query(`
      INSERT INTO work_orders 
        (wo_number, title, description, type, priority, status, asset_id, location, assigned_to, source, category, pm_template_id, checklist, due_date)
      VALUES ($1,$2,$3,'PM','Medium','Open',$4,$5,$6,'PM','Preventive Maintenance',$7,$8,$9)
      RETURNING *
    `, [wo_number, title, template.description || '', assetId, assetLocation,
        template.assigned_to, template.id, JSON.stringify(template.checklist || []),
        template.next_due_date]);

    created.push(wo.rows[0]);
  }

  // Update last_generated_at and next_due_date on template
  const nextDue = calcNextDue(template.frequency, template.next_due_date);
  await db.query(
    'UPDATE pm_templates SET last_generated_at=NOW(), next_due_date=$1 WHERE id=$2',
    [nextDue, template.id]
  );

  return created;
}

// Export helper for use in workorders route (auto-generate on WO close)
router.generateWOs = generateWOs;
router.calcNextDue = calcNextDue;

module.exports = router;
