CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS only_one_active_purchase
  ON purchases (status)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL DEFAULT '',
  category VARCHAR(60) NOT NULL DEFAULT 'Geral',
  purchase_mode VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (purchase_mode IN ('standard', 'weighted')),
  target_quantity NUMERIC(10, 3) NOT NULL DEFAULT 0 CHECK (target_quantity >= 0),
  quantity NUMERIC(10, 3) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit VARCHAR(10) NOT NULL DEFAULT 'un',
  unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  picked BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchase_items_purchase_id_idx
  ON purchase_items (purchase_id, position, created_at);

CREATE TABLE IF NOT EXISTS item_weighings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES purchase_items(id) ON DELETE CASCADE,
  weight_kg NUMERIC(10, 3) NOT NULL CHECK (weight_kg > 0),
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS item_weighings_item_id_idx
  ON item_weighings (item_id, position, created_at);
