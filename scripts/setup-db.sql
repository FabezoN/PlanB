-- =============================================================
-- Plan B – Script de création de la base de données Supabase
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query
-- =============================================================

-- Table principale (key-value store pour bars et avis)
CREATE TABLE IF NOT EXISTS kv_store (
  key   TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Index pour accélérer les recherches par préfixe (getByPrefix)
CREATE INDEX IF NOT EXISTS kv_store_key_prefix_idx ON kv_store (key text_pattern_ops);

-- Active Row Level Security
ALTER TABLE kv_store ENABLE ROW LEVEL SECURITY;

-- Politique : lecture publique (tout le monde peut lire les bars)
CREATE POLICY "Lecture publique" ON kv_store
  FOR SELECT USING (true);

-- Politique : écriture via le service role uniquement (Edge Function)
CREATE POLICY "Écriture service role" ON kv_store
  FOR ALL USING (auth.role() = 'service_role');
