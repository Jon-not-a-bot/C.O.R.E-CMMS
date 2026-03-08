const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });

app.locals.db = pool;

app.use(cors());
app.use(express.json());

async function initDB() {
  await pool.query(`CREATE TABLE IF NOT EXISTS assets (id SERIAL PRIMARY KEY, asset_id VARCHAR(50), name VARCHAR(255) NOT NULL, category VARCHAR(100), subcategory VARCHAR(100), location VARCHAR(100), criticality CHAR(1) DEFAULT 'B', manufacturer VARCHAR(100), model VARCHAR(100), serial_number VARCHAR(100), install_date DATE, warranty_expiry DATE, condition VARCHAR(50) DEFAULT 'Good', pm_frequency VARCHAR(50), last_pm_date DATE, next_pm_date DATE, assigned_tech VARCHAR(100), management_type VARCHAR(50) DEFAULT 'In-House', vendor_name VARCHAR(100), notes TEXT, photos JSONB DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS work_orders (id SERIAL PRIMARY KEY, wo_number VARCHAR(20) UNIQUE, title VARCHAR(255) NOT NULL, description TEXT, type VARCHAR(50) DEFAULT 'Repair', priority VARCHAR(20) DEFAULT 'Medium', status VARCHAR(20) DEFAULT 'Open', category VARCHAR(100) DEFAULT 'General', asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL, location VARCHAR(100), due_date DATE, assigned_to VARCHAR(100), requester_name VARCHAR(100), source VARCHAR(20) DEFAULT 'Internal', resolution_notes TEXT, photos JSONB DEFAULT '[]', closed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
  console.log('Database initialized');
}

initDB().catch(console.error);

const assetsRouter = require('./routes/assets');
const scanRouter = require('./routes/scan');
const workOrdersRouter = require('./routes/workorders');

app.use('/api/assets', assetsRouter);
app.use('/api/scan-nameplate', scanRouter);
app.use('/api/workorders', workOrdersRouter);

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch (e) { res.status(500).json({ status: 'error', database: 'disconnected' }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
