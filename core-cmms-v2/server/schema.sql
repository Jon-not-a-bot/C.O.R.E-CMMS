-- C.O.R.E. CMMS Database Schema
-- Run this once after creating your Railway PostgreSQL database

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
  next_pm_date      DATE,
  assigned_tech     VARCHAR(255),
  management_type   VARCHAR(50) CHECK (management_type IN ('In-House','Vendor','Landlord','Utility')) DEFAULT 'In-House',
  vendor_name       VARCHAR(255),
  warranty_expiry   DATE,
  notes             TEXT,
  photos            JSONB DEFAULT '[]',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_criticality ON assets(criticality);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_next_pm ON assets(next_pm_date);

-- Seed: Asset categories
-- Categories: PIT Fleet, Dock Equipment, HVAC & Heating, Electrical, Life Safety, Building Envelope, Utilities

SELECT 'Schema created successfully' AS result;
