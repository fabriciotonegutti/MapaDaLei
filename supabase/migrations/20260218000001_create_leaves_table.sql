-- Migration: Create leaves table for MapaDaLei Sprint 2
CREATE TABLE IF NOT EXISTS leaves (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  category_path text       NOT NULL,
  ncm          text,
  coverage_pct numeric     DEFAULT 0,
  status       text        DEFAULT 'incomplete',
  tasks_total  integer     DEFAULT 0,
  tasks_done   integer     DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves (status);
CREATE INDEX IF NOT EXISTS idx_leaves_created_at ON leaves (created_at DESC);

-- Enable RLS
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;

-- Policies (DROP first to allow re-runs)
DROP POLICY IF EXISTS "Service role full access" ON leaves;
CREATE POLICY "Service role full access" ON leaves
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anon read" ON leaves;
CREATE POLICY "Anon read" ON leaves
  FOR SELECT USING (true);
