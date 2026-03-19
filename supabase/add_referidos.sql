-- ============================================================
-- add_referidos.sql
-- Sistema de referidos: médicos invitando a colegas independientes
-- a unirse a la red MediFlow.
--
-- DIFERENCIA con invitaciones (equipo):
--   - invitaciones → asistentes o médicos bajo una clínica
--   - referidos    → médicos independientes que se unen a la red
--
-- Beneficio futuro: por cada referido que se suscriba,
-- el médico referidor obtiene 3 meses gratis de plataforma.
-- ============================================================

-- Tabla principal
CREATE TABLE IF NOT EXISTS referidos (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_referidor_id UUID        NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  email               TEXT,
  nombre              TEXT,
  codigo              TEXT        UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  estado              TEXT        NOT NULL DEFAULT 'pendiente'
                                  CHECK (estado IN ('pendiente', 'registrado')),
  -- Se llena cuando el referido completa el registro
  medico_referido_id  UUID        REFERENCES perfiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Los links de referido no expiran (son links permanentes de red)
  -- pero se pueden cancelar manualmente
  cancelado           BOOLEAN     NOT NULL DEFAULT false
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_referidos_referidor ON referidos(medico_referidor_id);
CREATE INDEX IF NOT EXISTS idx_referidos_codigo    ON referidos(codigo);
CREATE INDEX IF NOT EXISTS idx_referidos_estado    ON referidos(estado);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE referidos ENABLE ROW LEVEL SECURITY;

-- El médico referidor puede ver sus propios referidos
CREATE POLICY "medico_ve_sus_referidos"
  ON referidos FOR SELECT
  USING (medico_referidor_id = auth.uid());

-- El médico referidor puede crear referidos
CREATE POLICY "medico_crea_referidos"
  ON referidos FOR INSERT
  WITH CHECK (medico_referidor_id = auth.uid());

-- El médico referidor puede cancelar (UPDATE cancelado=true) sus referidos
CREATE POLICY "medico_cancela_referidos"
  ON referidos FOR UPDATE
  USING (medico_referidor_id = auth.uid())
  WITH CHECK (medico_referidor_id = auth.uid());

-- Solo service_role puede marcar como registrado (desde el API de validación)
-- Esta política se ejecuta via createServiceClient() que bypasea RLS.

-- ── Función helper: código personal permanente de un médico ─────────────────
-- Cada médico tiene UN link personal de referido permanente.
-- Si ya existe uno activo lo devuelve, si no lo crea.
CREATE OR REPLACE FUNCTION get_or_create_referido_personal(p_medico_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_codigo TEXT;
BEGIN
  -- Busca referido personal (sin email/nombre = link genérico)
  SELECT codigo INTO v_codigo
  FROM referidos
  WHERE medico_referidor_id = p_medico_id
    AND email IS NULL
    AND nombre IS NULL
    AND cancelado = false
  ORDER BY created_at ASC
  LIMIT 1;

  -- Si no existe, crea uno
  IF v_codigo IS NULL THEN
    INSERT INTO referidos (medico_referidor_id)
    VALUES (p_medico_id)
    RETURNING codigo INTO v_codigo;
  END IF;

  RETURN v_codigo;
END;
$$;
