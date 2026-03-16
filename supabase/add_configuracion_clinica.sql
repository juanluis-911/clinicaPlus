-- ============================================================
-- MediFlow — Tabla configuracion_clinica
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE configuracion_clinica (
  id                      UUID PRIMARY KEY REFERENCES perfiles(id) ON DELETE CASCADE,
  -- Datos generales de la clínica
  clinica_nombre          TEXT,
  clinica_especialidad    TEXT,
  clinica_telefono        TEXT,
  clinica_telefono2       TEXT,
  clinica_email           TEXT,
  clinica_direccion       TEXT,
  clinica_ciudad          TEXT,
  clinica_cp              TEXT,
  clinica_sitio_web       TEXT,
  clinica_logo_url        TEXT,
  -- Horario de consulta
  hora_inicio             TIME NOT NULL DEFAULT '08:00',
  hora_fin                TIME NOT NULL DEFAULT '18:00',
  duracion_cita_minutos   INTEGER NOT NULL DEFAULT 30 CHECK (duracion_cita_minutos > 0),
  -- Días hábiles (array de: 'lunes','martes','miercoles','jueves','viernes','sabado','domingo')
  dias_consulta           TEXT[] NOT NULL DEFAULT ARRAY['lunes','martes','miercoles','jueves','viernes'],
  -- Días festivos o de descanso adicionales (fechas específicas)
  dias_festivos           DATE[] NOT NULL DEFAULT '{}',
  -- Tiempo entre citas (buffer)
  buffer_entre_citas      INTEGER NOT NULL DEFAULT 0 CHECK (buffer_entre_citas >= 0),
  -- Número máximo de citas por día (0 = sin límite)
  max_citas_dia           INTEGER NOT NULL DEFAULT 0 CHECK (max_citas_dia >= 0),
  -- Notas / políticas de la clínica
  politica_cancelacion    TEXT,
  notas_internas          TEXT,
  -- Moneda y cobros (referencia)
  moneda                  TEXT NOT NULL DEFAULT 'MXN',
  costo_consulta          NUMERIC(10,2),
  -- Timestamps
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE TRIGGER set_updated_at_configuracion
  BEFORE UPDATE ON configuracion_clinica
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- RLS
ALTER TABLE configuracion_clinica ENABLE ROW LEVEL SECURITY;

-- Solo el médico propietario puede ver y modificar su configuración
CREATE POLICY "config_select" ON configuracion_clinica FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "config_insert" ON configuracion_clinica FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "config_update" ON configuracion_clinica FOR UPDATE
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Los asistentes pueden ver la configuración del médico empleador
CREATE POLICY "config_select_asistente" ON configuracion_clinica FOR SELECT
  USING (id = get_my_medico_empleador_id());
