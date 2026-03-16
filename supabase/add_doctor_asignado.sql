-- ============================================================
-- MediFlow: Asistentes asignados a médico específico
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Columna doctor_asignado_id: permite a un asistente tener un médico "principal"
-- dentro de la clínica (para autocompletar en nuevas citas)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS doctor_asignado_id UUID REFERENCES perfiles(id);
