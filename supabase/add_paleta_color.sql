-- ── Paleta de color por clínica ───────────────────────────────────────────────
-- Agrega la columna paleta_color a configuracion_clinica.
-- Valores permitidos: 'sky' | 'violet' | 'emerald' | 'rose' | 'amber'
-- Default: 'sky' (el color original de la interfaz)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE configuracion_clinica
  ADD COLUMN IF NOT EXISTS paleta_color TEXT NOT NULL DEFAULT 'sky'
  CHECK (paleta_color IN ('sky', 'violet', 'emerald', 'rose', 'amber'));

-- Verificación
SELECT id, paleta_color FROM configuracion_clinica LIMIT 5;
