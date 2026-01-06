-- =============================================
-- SA Marketing Calendar - Supabase Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- Brands table
CREATE TABLE brands (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  primary_color TEXT NOT NULL DEFAULT '#6b7280',
  timezone TEXT NOT NULL DEFAULT 'Africa/Johannesburg',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table (both global SA events and brand-specific)
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  tags TEXT[] NOT NULL DEFAULT '{}',
  importance TEXT NOT NULL DEFAULT 'med',
  visibility TEXT NOT NULL DEFAULT 'client',
  channels TEXT[],
  objective TEXT,
  notes TEXT,
  links JSONB,
  recurrence JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hidden events per brand (when user hides a global event for their brand)
CREATE TABLE hidden_events (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id, event_id)
);

-- Month notes per brand
CREATE TABLE month_notes (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id, year, month)
);

-- Create indexes for performance
CREATE INDEX idx_events_brand_id ON events(brand_id);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_hidden_events_brand_id ON hidden_events(brand_id);
CREATE INDEX idx_month_notes_brand_id ON month_notes(brand_id);

-- Enable Row Level Security (but allow all access for now - no auth)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE month_notes ENABLE ROW LEVEL SECURITY;

-- Policies to allow all access (since we don't have auth in v1)
CREATE POLICY "Allow all access to brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to hidden_events" ON hidden_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to month_notes" ON month_notes FOR ALL USING (true) WITH CHECK (true);

