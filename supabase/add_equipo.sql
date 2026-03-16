-- ============================================================
-- MediFlow: Gestión de Equipo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Columna activo en perfiles (desactivar miembros sin borrarlos)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true;

-- 2. Tabla invitaciones
CREATE TABLE IF NOT EXISTS invitaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id   UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  rol         TEXT NOT NULL CHECK (rol IN ('asistente', 'medico')),
  codigo      TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  email       TEXT,
  nombre      TEXT,
  usado       BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);

-- 3. RLS para invitaciones
ALTER TABLE invitaciones ENABLE ROW LEVEL SECURITY;

-- El médico dueño ve y borra sus invitaciones
CREATE POLICY "inv_select" ON invitaciones
  FOR SELECT USING (medico_id = auth.uid());

CREATE POLICY "inv_insert" ON invitaciones
  FOR INSERT WITH CHECK (
    medico_id = auth.uid()
    AND (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'medico'
    AND (SELECT medico_empleador_id FROM perfiles WHERE id = auth.uid()) IS NULL
  );

CREATE POLICY "inv_delete" ON invitaciones
  FOR DELETE USING (medico_id = auth.uid());

-- 4. Actualizar get_effective_medico_id para soportar médicos asociados
--    (medico con medico_empleador_id set comparte pool de pacientes del dueño)
CREATE OR REPLACE FUNCTION get_effective_medico_id()
RETURNS UUID AS $$
  SELECT CASE
    WHEN rol = 'medico' AND medico_empleador_id IS NULL THEN id
    WHEN rol = 'medico' AND medico_empleador_id IS NOT NULL THEN medico_empleador_id
    WHEN rol = 'asistente' THEN medico_empleador_id
  END
  FROM perfiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
