-- Añade configuración de formato de receta a configuracion_clinica
-- Ejecutar en Supabase SQL Editor

ALTER TABLE configuracion_clinica
  ADD COLUMN IF NOT EXISTS receta_formato JSONB DEFAULT '{}';

COMMENT ON COLUMN configuracion_clinica.receta_formato IS
  'Configuración del formato PDF de recetas: tamaño de papel, color, campos visibles, nota al pie, etc.';
