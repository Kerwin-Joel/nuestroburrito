-- ═══════════════════════════════════════════════════════════
-- Migration: Crear tablas categories y zones
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════

-- ─── Tabla: categories ───────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,               -- ej: 'playa', 'gastronomia'
  label TEXT NOT NULL,               -- ej: 'Playa', 'Gastronomía'
  emoji TEXT NOT NULL DEFAULT '📌',  -- ej: '🏖️'
  color TEXT NOT NULL DEFAULT '#ff5500', -- color hex
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Tabla: zones ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Seed: datos iniciales ───────────────────────────────
INSERT INTO categories (id, label, emoji, color, sort_order) VALUES
  ('playa',       'Playa',        '🏖️', '#00b4d8', 1),
  ('gastronomia', 'Gastronomía',  '🍽️', '#e63946', 2),
  ('cultura',     'Cultura',      '🎨', '#7209b7', 3),
  ('sierra',      'Sierra',       '🏔️', '#2d6a4f', 4),
  ('aventura',    'Aventura',     '🌊', '#0077b6', 5),
  ('mercados',    'Mercados',     '🛍️', '#f4a261', 6),
  ('relax',       'Relax',        '☕', '#8b5e3c', 7)
ON CONFLICT (id) DO NOTHING;

INSERT INTO zones (name, sort_order) VALUES
  ('Piura', 1), ('Catacaos', 2), ('Paita', 3), ('Colán', 4), ('Yacila', 5),
  ('Talara', 6), ('Lobitos', 7), ('Canchaque', 8), ('Chulucanas', 9),
  ('Huancabamba', 10), ('Sechura', 11), ('Sullana', 12)
ON CONFLICT (name) DO NOTHING;

-- ─── RLS ─────────────────────────────────────────────────
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;

-- Políticas idempotentes (se pueden re-ejecutar sin error)
DO $$ BEGIN
  -- SELECT público
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'categories_select_all') THEN
    CREATE POLICY "categories_select_all" ON categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'zones_select_all') THEN
    CREATE POLICY "zones_select_all" ON zones FOR SELECT USING (true);
  END IF;

  -- INSERT/UPDATE/DELETE para usuarios autenticados
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'categories_insert_auth') THEN
    CREATE POLICY "categories_insert_auth" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'categories_update_auth') THEN
    CREATE POLICY "categories_update_auth" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'categories_delete_auth') THEN
    CREATE POLICY "categories_delete_auth" ON categories FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'zones_insert_auth') THEN
    CREATE POLICY "zones_insert_auth" ON zones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'zones_update_auth') THEN
    CREATE POLICY "zones_update_auth" ON zones FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'zones_delete_auth') THEN
    CREATE POLICY "zones_delete_auth" ON zones FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
