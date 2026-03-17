-- ── Tema de la barra lateral por clínica ─────────────────────────────────────
-- Agrega la columna tema_sidebar a configuracion_clinica.
-- Valores: 'oscuro' (default) | 'claro' | 'sistema'
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE configuracion_clinica
  ADD COLUMN IF NOT EXISTS tema_sidebar TEXT NOT NULL DEFAULT 'oscuro'
  CHECK (tema_sidebar IN ('oscuro', 'claro', 'sistema'));

-- Verificación
SELECT id, paleta_color, tema_sidebar FROM configuracion_clinica LIMIT 5;
