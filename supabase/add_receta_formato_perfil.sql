-- Mueve el formato de receta a perfiles (por médico, no por clínica)
-- Esto permite que cada médico tenga su propio formato de prescripción
-- Ejecutar en Supabase SQL Editor

ALTER TABLE perfiles
  ADD COLUMN IF NOT EXISTS receta_formato JSONB DEFAULT '{}';

COMMENT ON COLUMN perfiles.receta_formato IS
  'Configuración personal del formato PDF de recetas para cada médico.';
