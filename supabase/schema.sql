-- ============================================================
-- MediFlow Database Schema
-- Run this file in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: perfiles
-- ============================================================
CREATE TABLE perfiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo       TEXT NOT NULL,
  telefono              TEXT,
  rol                   TEXT NOT NULL CHECK (rol IN ('medico', 'asistente')),
  especialidad          TEXT,
  cedula_profesional    TEXT,
  medico_empleador_id   UUID REFERENCES perfiles(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: pacientes
-- ============================================================
CREATE TABLE pacientes (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre                TEXT NOT NULL,
  apellido              TEXT NOT NULL,
  fecha_nacimiento      DATE,
  telefono              TEXT,
  email                 TEXT,
  direccion             TEXT,
  alergias              TEXT,
  condiciones_cronicas  TEXT,
  medicacion_actual     TEXT,
  notas                 TEXT,
  medico_id             UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  created_by            UUID NOT NULL REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pacientes_medico_id ON pacientes(medico_id);
CREATE INDEX idx_pacientes_nombre ON pacientes(nombre, apellido);

-- ============================================================
-- TABLE: citas
-- ============================================================
CREATE TABLE citas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id       UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id         UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  fecha_hora        TIMESTAMPTZ NOT NULL,
  duracion_minutos  INTEGER NOT NULL DEFAULT 30 CHECK (duracion_minutos > 0),
  tipo              TEXT NOT NULL DEFAULT 'consulta',
  estado            TEXT NOT NULL DEFAULT 'programada'
                      CHECK (estado IN ('programada','confirmada','cancelada','completada')),
  notas             TEXT,
  creado_por        UUID NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_citas_medico_id ON citas(medico_id);
CREATE INDEX idx_citas_paciente_id ON citas(paciente_id);
CREATE INDEX idx_citas_fecha_hora ON citas(fecha_hora);
CREATE INDEX idx_citas_estado ON citas(estado);

-- ============================================================
-- TABLE: consultas
-- ============================================================
CREATE TABLE consultas (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id         UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id           UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  cita_id             UUID REFERENCES citas(id) ON DELETE SET NULL,
  fecha               DATE NOT NULL DEFAULT CURRENT_DATE,
  motivo_consulta     TEXT NOT NULL,
  exploracion_fisica  TEXT,
  diagnostico         TEXT,
  plan_tratamiento    TEXT,
  notas               TEXT,
  creado_por          UUID NOT NULL REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consultas_paciente_id ON consultas(paciente_id);
CREATE INDEX idx_consultas_medico_id ON consultas(medico_id);
CREATE INDEX idx_consultas_fecha ON consultas(fecha DESC);

-- ============================================================
-- TABLE: prescripciones
-- ============================================================
CREATE TABLE prescripciones (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consulta_id     UUID REFERENCES consultas(id) ON DELETE SET NULL,
  paciente_id     UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id       UUID NOT NULL REFERENCES perfiles(id) ON DELETE RESTRICT,
  fecha           DATE NOT NULL DEFAULT CURRENT_DATE,
  medicamentos    JSONB NOT NULL DEFAULT '[]',
  instrucciones   TEXT,
  vigencia_dias   INTEGER NOT NULL DEFAULT 30 CHECK (vigencia_dias > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescripciones_paciente_id ON prescripciones(paciente_id);
CREATE INDEX idx_prescripciones_medico_id ON prescripciones(medico_id);
CREATE INDEX idx_prescripciones_fecha ON prescripciones(fecha DESC);

-- ============================================================
-- TABLE: documentos
-- ============================================================
CREATE TABLE documentos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL,
  tipo        TEXT NOT NULL DEFAULT 'otro'
                CHECK (tipo IN ('laboratorio','imagen','otro')),
  url         TEXT NOT NULL,
  tamano      BIGINT,
  subido_por  UUID NOT NULL REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_documentos_paciente_id ON documentos(paciente_id);

-- ============================================================
-- TABLE: recordatorios
-- ============================================================
CREATE TABLE recordatorios (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cita_id     UUID NOT NULL REFERENCES citas(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL DEFAULT 'email' CHECK (tipo IN ('email','sms')),
  estado      TEXT NOT NULL DEFAULT 'pendiente'
                CHECK (estado IN ('pendiente','enviado','fallido')),
  enviado_en  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recordatorios_cita_id ON recordatorios(cita_id);
CREATE INDEX idx_recordatorios_estado ON recordatorios(estado);

-- ============================================================
-- TRIGGER: Auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_perfiles
  BEFORE UPDATE ON perfiles FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_pacientes
  BEFORE UPDATE ON pacientes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_citas
  BEFORE UPDATE ON citas FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_consultas
  BEFORE UPDATE ON consultas FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_prescripciones
  BEFORE UPDATE ON prescripciones FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TRIGGER: Auto-create perfil on user registration
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfiles (id, nombre_completo, rol, medico_empleador_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'asistente'),
    NULLIF(NEW.raw_user_meta_data->>'medico_empleador_id', '')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- HELPER: Get effective medico_id for current user
-- ============================================================
CREATE OR REPLACE FUNCTION get_effective_medico_id()
RETURNS UUID AS $$
  SELECT
    CASE
      WHEN rol = 'medico' THEN id
      WHEN rol = 'asistente' THEN medico_empleador_id
    END
  FROM perfiles
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ENABLE RLS
-- ============================================================
ALTER TABLE perfiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescripciones   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordatorios    ENABLE ROW LEVEL SECURITY;

-- Helper para evitar recursión infinita en la política de perfiles
CREATE OR REPLACE FUNCTION get_my_medico_empleador_id()
RETURNS UUID AS $$
  SELECT medico_empleador_id FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================
-- RLS: perfiles
-- ============================================================
CREATE POLICY "perfiles_select" ON perfiles FOR SELECT
  USING (id = auth.uid() OR id = get_my_medico_empleador_id());

CREATE POLICY "perfiles_insert" ON perfiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "perfiles_update" ON perfiles FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- RLS: pacientes
-- ============================================================
CREATE POLICY "pacientes_select" ON pacientes FOR SELECT
  USING (medico_id = get_effective_medico_id());

CREATE POLICY "pacientes_insert" ON pacientes FOR INSERT
  WITH CHECK (medico_id = get_effective_medico_id() AND created_by = auth.uid());

CREATE POLICY "pacientes_update" ON pacientes FOR UPDATE
  USING (medico_id = get_effective_medico_id())
  WITH CHECK (medico_id = get_effective_medico_id());

CREATE POLICY "pacientes_delete" ON pacientes FOR DELETE
  USING (medico_id = auth.uid() AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico');

-- ============================================================
-- RLS: citas
-- ============================================================
CREATE POLICY "citas_select" ON citas FOR SELECT
  USING (medico_id = get_effective_medico_id());

CREATE POLICY "citas_insert" ON citas FOR INSERT
  WITH CHECK (medico_id = get_effective_medico_id() AND creado_por = auth.uid());

CREATE POLICY "citas_update" ON citas FOR UPDATE
  USING (medico_id = get_effective_medico_id())
  WITH CHECK (medico_id = get_effective_medico_id());

CREATE POLICY "citas_delete" ON citas FOR DELETE
  USING (medico_id = get_effective_medico_id()
    AND (creado_por = auth.uid() OR (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico'));

-- ============================================================
-- RLS: consultas
-- ============================================================
CREATE POLICY "consultas_select" ON consultas FOR SELECT
  USING (medico_id = get_effective_medico_id());

CREATE POLICY "consultas_insert" ON consultas FOR INSERT
  WITH CHECK (medico_id = auth.uid() AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico' AND creado_por = auth.uid());

CREATE POLICY "consultas_update" ON consultas FOR UPDATE
  USING (medico_id = auth.uid() AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico');

-- ============================================================
-- RLS: prescripciones
-- ============================================================
CREATE POLICY "prescripciones_select" ON prescripciones FOR SELECT
  USING (medico_id = get_effective_medico_id());

CREATE POLICY "prescripciones_insert" ON prescripciones FOR INSERT
  WITH CHECK (medico_id = auth.uid() AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico');

CREATE POLICY "prescripciones_update" ON prescripciones FOR UPDATE
  USING (medico_id = auth.uid() AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico');

-- ============================================================
-- RLS: documentos
-- ============================================================
CREATE POLICY "documentos_select" ON documentos FOR SELECT
  USING (paciente_id IN (SELECT id FROM pacientes WHERE medico_id = get_effective_medico_id()));

CREATE POLICY "documentos_insert" ON documentos FOR INSERT
  WITH CHECK (
    paciente_id IN (SELECT id FROM pacientes WHERE medico_id = get_effective_medico_id())
    AND subido_por = auth.uid()
  );

CREATE POLICY "documentos_delete" ON documentos FOR DELETE
  USING (subido_por = auth.uid() OR (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico');

-- ============================================================
-- RLS: recordatorios (read only for authenticated users)
-- ============================================================
CREATE POLICY "recordatorios_select" ON recordatorios FOR SELECT
  USING (cita_id IN (SELECT id FROM citas WHERE medico_id = get_effective_medico_id()));
