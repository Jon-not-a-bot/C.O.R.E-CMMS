require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.locals.db = pool;

async function initDB() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS assets (id SERIAL PRIMARY KEY, asset_id VARCHAR(50) UNIQUE, name VARCHAR(255) NOT NULL, category VARCHAR(100) NOT NULL, subcategory VARCHAR(100), location VARCHAR(255), criticality VARCHAR(10) DEFAULT 'B', manufacturer VARCHAR(255), model VARCHAR(255), serial_number VARCHAR(255), install_date DATE, condition VARCHAR(50) DEFAULT 'Good', status VARCHAR(50) DEFAULT 'Active', pm_frequency VARCHAR(100), last_pm_date DATE, next_pm_date DATE, assigned_tech VARCHAR(255), management_type VARCHAR(50) DEFAULT 'In-House', vendor_name VARCHAR(255), warranty_expiry DATE, notes TEXT, photos JSONB DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`);
    console.log('Database schema ready');
  } catch (err) {
    console.error('Schema init error:', err.message);
  }
}
initDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const assetsRouter = require('./routes/assets');
app.use('/api/assets', assetsRouter);

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`C.O.R.E. CMMS server running on port ${PORT}`);
});
