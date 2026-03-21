-- Migración: agregar columnas faltantes a catalogo_medicamentos
ALTER TABLE catalogo_medicamentos
  ADD COLUMN IF NOT EXISTS concentracion TEXT,
  ADD COLUMN IF NOT EXISTS forma         TEXT,
  ADD COLUMN IF NOT EXISTS mg_kg_min     NUMERIC,
  ADD COLUMN IF NOT EXISTS mg_kg_max     NUMERIC,
  ADD COLUMN IF NOT EXISTS nota_dosis    TEXT;

-- Hacer medico_id nullable (para entradas globales del seed)
ALTER TABLE catalogo_medicamentos
  ALTER COLUMN medico_id DROP NOT NULL;

-- Índice para entradas globales (medico_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogo_global
  ON catalogo_medicamentos (nombre)
  WHERE medico_id IS NULL;

-- Índice para entradas propias del médico
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogo_medico
  ON catalogo_medicamentos (medico_id, nombre)
  WHERE medico_id IS NOT NULL;

-- Recrear políticas limpias
DROP POLICY IF EXISTS "catalogo_medico_own" ON catalogo_medicamentos;
DROP POLICY IF EXISTS "catalogo_read"       ON catalogo_medicamentos;
DROP POLICY IF EXISTS "catalogo_insert"     ON catalogo_medicamentos;
DROP POLICY IF EXISTS "catalogo_update"     ON catalogo_medicamentos;

CREATE POLICY "catalogo_read" ON catalogo_medicamentos
  FOR SELECT
  USING (medico_id IS NULL OR medico_id = auth.uid());

CREATE POLICY "catalogo_insert" ON catalogo_medicamentos
  FOR INSERT
  WITH CHECK (medico_id = auth.uid());

CREATE POLICY "catalogo_update" ON catalogo_medicamentos
  FOR UPDATE
  USING (medico_id = auth.uid())
  WITH CHECK (medico_id = auth.uid());
