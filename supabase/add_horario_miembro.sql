-- ============================================================
-- MediFlow: Configuración personal por miembro del equipo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Horario personal (null = usa el horario de la clínica)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS horario_hora_inicio   TIME;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS horario_hora_fin      TIME;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS horario_dias          TEXT[];
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS horario_duracion_min  INTEGER;

-- Honorarios propios (null = usa el costo de la clínica)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS costo_consulta_propio NUMERIC(10,2);
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS moneda_propia         TEXT;

-- Permisos granulares (JSON de overrides para asistentes)
-- Ej: { "crear_consulta": true, "eliminar_paciente": false }
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS permisos JSONB NOT NULL DEFAULT '{}';

-- Bio / descripción corta
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS bio TEXT;
