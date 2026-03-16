-- ============================================================
-- MediFlow — Agregar zona_horaria a configuracion_clinica
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE configuracion_clinica
  ADD COLUMN IF NOT EXISTS zona_horaria TEXT NOT NULL DEFAULT 'America/Mexico_City';
