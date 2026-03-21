-- Catálogo de medicamentos
-- medico_id = NULL  → entrada global (seed)
-- medico_id = uuid  → entrada propia del médico
CREATE TABLE IF NOT EXISTS catalogo_medicamentos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medico_id     UUID REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  concentracion TEXT,
  forma         TEXT,
  mg_kg_min     NUMERIC,
  mg_kg_max     NUMERIC,
  nota_dosis    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Entradas globales: único por nombre
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogo_global
  ON catalogo_medicamentos (nombre)
  WHERE medico_id IS NULL;

-- Entradas del médico: único por (medico_id, nombre)
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogo_medico
  ON catalogo_medicamentos (medico_id, nombre)
  WHERE medico_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_catalogo_nombre
  ON catalogo_medicamentos (nombre);

ALTER TABLE catalogo_medicamentos ENABLE ROW LEVEL SECURITY;

-- Lectura: entradas globales o propias
CREATE POLICY "catalogo_read" ON catalogo_medicamentos
  FOR SELECT
  USING (medico_id IS NULL OR medico_id = auth.uid());

-- Escritura: solo entradas propias
CREATE POLICY "catalogo_insert" ON catalogo_medicamentos
  FOR INSERT
  WITH CHECK (medico_id = auth.uid());

CREATE POLICY "catalogo_update" ON catalogo_medicamentos
  FOR UPDATE
  USING (medico_id = auth.uid())
  WITH CHECK (medico_id = auth.uid());
