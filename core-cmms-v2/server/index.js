require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Make pool available to routes
app.locals.db = pool;

// Auto-run schema migrations on startup
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id                SERIAL PRIMARY KEY,
        asset_id          VARCHAR(50) UNIQUE,
        name              VARCHAR(255) NOT NULL,
        category          VARCHAR(100) NOT NULL,
        subcategory       VARCHAR(100),
        location          VARCHAR(255),
        criticality       VARCHAR(10) CHECK (criticality IN ('A', 'B', 'C')) DEFAULT 'B',
        manufacturer      VARCHAR(255),
        model             VARCHAR(255),
        serial_number     VARCHAR(255),
        install_date      DATE,
        condition         VARCHAR(50) CHECK (condition IN ('New','Good','Fair','Poor','Critical')) DEFAULT 'Good',
        status            VARCHAR(50) CHECK (status IN ('Active','Inactive','Out of Service','Decommissioned')) DEFAULT 'Active',
        pm_frequency      VARCHAR(100),
        last_pm_date      DATE,
        next_p
});
