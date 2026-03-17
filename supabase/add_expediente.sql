-- ============================================================
-- MediFlow — Expediente Clínico
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- ── 1. Enriquecer tabla consultas ─────────────────────────────────────────
ALTER TABLE consultas
  ADD COLUMN IF NOT EXISTS tipo_consulta     TEXT DEFAULT 'seguimiento'
    CHECK (tipo_consulta IN ('primera_vez','seguimiento','urgencia','procedimiento','resultado')),
  ADD COLUMN IF NOT EXISTS cie10_codigo      TEXT,
  ADD COLUMN IF NOT EXISTS cie10_descripcion TEXT;

-- ── 2. Tabla signos_vitales ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS signos_vitales (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id     UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id       UUID NOT NULL REFERENCES perfiles(id)  ON DELETE RESTRICT,
  consulta_id     UUID REFERENCES consultas(id) ON DELETE SET NULL,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  peso            NUMERIC(5,2),   -- kg
  talla           NUMERIC(5,2),   -- cm
  ta_sistolica    INTEGER,        -- mmHg
  ta_diastolica   INTEGER,        -- mmHg
  fc              INTEGER,        -- lpm
  fr              INTEGER,        -- rpm
  temperatura     NUMERIC(4,1),   -- °C
  saturacion_o2   NUMERIC(5,2),   -- %
  glucosa         INTEGER,        -- mg/dL
  perimetro_abd   NUMERIC(5,2),   -- cm
  creado_por      UUID NOT NULL REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sv_paciente_id ON signos_vitales(paciente_id);
CREATE INDEX IF NOT EXISTS idx_sv_fecha       ON signos_vitales(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_sv_consulta_id ON signos_vitales(consulta_id);

-- ── 3. Tabla antecedentes (1:1 con pacientes) ─────────────────────────────
CREATE TABLE IF NOT EXISTS antecedentes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id           UUID NOT NULL UNIQUE REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id             UUID NOT NULL REFERENCES perfiles(id),
  -- Personales patológicos
  diabetes              BOOLEAN DEFAULT false,
  hipertension          BOOLEAN DEFAULT false,
  cardiopatia           BOOLEAN DEFAULT false,
  asma_epoc             BOOLEAN DEFAULT false,
  cancer                BOOLEAN DEFAULT false,
  otras_enfermedades    TEXT,
  -- Quirúrgicos y hospitalarios
  cirugias              TEXT,
  hospitalizaciones     TEXT,
  -- Heredofamiliares
  antecedentes_fam      TEXT,
  -- Alergias detalladas
  alergias_medicamentos TEXT,
  alergias_alimentos    TEXT,
  alergias_otras        TEXT,
  -- Hábitos
  tabaquismo            TEXT DEFAULT 'no'
    CHECK (tabaquismo IN ('no','ex','activo')),
  tabaquismo_cigarros   INTEGER,
  tabaquismo_anos       INTEGER,
  alcoholismo           TEXT DEFAULT 'no'
    CHECK (alcoholismo IN ('no','social','habitual')),
  ejercicio             TEXT DEFAULT 'no'
    CHECK (ejercicio IN ('no','ocasional','regular')),
  -- Gineco-obstétrico (opcional)
  gestas                INTEGER,
  partos                INTEGER,
  cesareas              INTEGER,
  abortos               INTEGER,
  fum                   DATE,           -- Fecha última menstruación
  -- Medicación crónica
  medicacion_cronica    TEXT,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_antecedentes_paciente ON antecedentes(paciente_id);

-- Trigger updated_at para antecedentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_antecedentes'
  ) THEN
    CREATE TRIGGER set_updated_at_antecedentes
      BEFORE UPDATE ON antecedentes
      FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
  END IF;
END$$;

-- ── 4. RLS — signos_vitales ───────────────────────────────────────────────
ALTER TABLE signos_vitales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sv_select" ON signos_vitales;
DROP POLICY IF EXISTS "sv_insert" ON signos_vitales;
DROP POLICY IF EXISTS "sv_update" ON signos_vitales;
DROP POLICY IF EXISTS "sv_delete" ON signos_vitales;

CREATE POLICY "sv_select" ON signos_vitales FOR SELECT
  USING (medico_id = get_effective_medico_id());

CREATE POLICY "sv_insert" ON signos_vitales FOR INSERT
  WITH CHECK (
    medico_id  = auth.uid()
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico'
    AND creado_por = auth.uid()
  );

CREATE POLICY "sv_update" ON signos_vitales FOR UPDATE
  USING (medico_id = auth.uid()
         AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico');

CREATE POLICY "sv_delete" ON signos_vitales FOR DELETE
  USING (medico_id = auth.uid()
         AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico');

-- ── 5. RLS — antecedentes ─────────────────────────────────────────────────
ALTER TABLE antecedentes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ant_select" ON antecedentes;
DROP POLICY IF EXISTS "ant_insert" ON antecedentes;
DROP POLICY IF EXISTS "ant_update" ON antecedentes;

CREATE POLICY "ant_select" ON antecedentes FOR SELECT
  USING (medico_id = get_effective_medico_id());

CREATE POLICY "ant_insert" ON antecedentes FOR INSERT
  WITH CHECK (medico_id = get_effective_medico_id());

CREATE POLICY "ant_update" ON antecedentes FOR UPDATE
  USING (medico_id = get_effective_medico_id())
  WITH CHECK (medico_id = get_effective_medico_id());
