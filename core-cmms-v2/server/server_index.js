const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false });
app.locals.db = pool;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts, try again later' } });
app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);

async function initDB() {
  await pool.query(`CREATE TABLE IF NOT EXISTS assets (id SERIAL PRIMARY KEY, asset_id VARCHAR(50), name VARCHAR(255) NOT NULL, category VARCHAR(100), subcategory VARCHAR(100), location VARCHAR(100), criticality CHAR(1) DEFAULT 'B', manufacturer VARCHAR(100), model VARCHAR(100), serial_number VARCHAR(100), install_date DATE, warranty_expiry DATE, condition VARCHAR(50) DEFAULT 'Good', pm_frequency VARCHAR(50), last_pm_date DATE, next_pm_date DATE, assigned_tech VARCHAR(100), management_type VARCHAR(50) DEFAULT 'In-House', vendor_name VARCHAR(100), notes TEXT, photos JSONB DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS work_orders (id SERIAL PRIMARY KEY, wo_number VARCHAR(20) UNIQUE, title VARCHAR(255) NOT NULL, description TEXT, type VARCHAR(50) DEFAULT 'Repair', priority VARCHAR(20) DEFAULT 'Medium', status VARCHAR(20) DEFAULT 'Open', category VARCHAR(100) DEFAULT 'General', asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL, location VARCHAR(100), due_date DATE, assigned_to VARCHAR(100), requester_name VARCHAR(100), source VARCHAR(20) DEFAULT 'Internal', resolution_notes TEXT, photos JSONB DEFAULT '[]', closed_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`);
  await pool.query(`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role VARCHAR(20) DEFAULT 'technician', active BOOLEAN DEFAULT true, last_login TIMESTAMP, created_at TIMESTAMP DEFAULT NOW())`);

  const userCount = await pool.query('SELECT COUNT(*) FROM users');
  if (parseInt(userCount.rows[0].count) === 0) {
    const hash = await bcrypt.hash('CORE2026!', 12);
    await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Administrator', 'admin@core.local', $1, 'admin')", [hash]);
    console.log('Default admin created: admin@core.local / CORE2026!');
  }
  console.log('Database initialized');
}

initDB().catch(console.error);

const { requireAuth } = require('./routes/auth');
const authRouter = require('./routes/auth');
const assetsRouter = require('./routes/assets');
const scanRouter = require('./routes/scan');
const scanVendorRouter = require('./routes/scan-vendor');
const workOrdersRouter = require('./routes/workorders');
const vendorsRouter = require('./routes/vendors');
const pmTemplatesRouter = require('./routes/pm-templates');

app.use('/api/auth', authRouter);

app.use('/api/assets', requireAuth, assetsRouter);
app.use('/api/scan-nameplate', requireAuth, scanRouter);
app.use('/api/scan-vendor-contact', requireAuth, scanVendorRouter);
app.use('/api/vendors', requireAuth, vendorsRouter);
app.use('/api/pm-templates', requireAuth, pmTemplatesRouter);

// Allow POST to create work orders without auth (public request form)
app.use('/api/workorders', (req, res, next) => {
  if (req.method === 'POST' && req.path === '/') return next();
  requireAuth(req, res, next);
}, workOrdersRouter);

app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch (e) { res.status(500).json({ status: 'error', database: 'disconnected' }); }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
