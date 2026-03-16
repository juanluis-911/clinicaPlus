-- ============================================================
-- MediFlow: Asignación múltiple de doctores a asistentes
-- Reemplaza doctor_asignado_id (UUID) por doctores_asignados (UUID[])
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar la nueva columna array
ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS doctores_asignados UUID[] NOT NULL DEFAULT '{}';

-- 2. Migrar datos existentes (si ya había doctor_asignado_id con valor)
UPDATE perfiles
  SET doctores_asignados = ARRAY[doctor_asignado_id]
  WHERE doctor_asignado_id IS NOT NULL
    AND doctores_asignados = '{}';

-- 3. Eliminar la columna anterior
ALTER TABLE perfiles
  DROP COLUMN IF EXISTS doctor_asignado_id;
