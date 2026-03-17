-- ============================================================
-- MediFlow: Log de movimientos de inventario de farmacia
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Tabla de log de movimientos
CREATE TABLE IF NOT EXISTS log_inventario_farmacia (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id       UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  producto_id     UUID REFERENCES productos_farmacia(id) ON DELETE SET NULL,
  producto_nombre TEXT NOT NULL,   -- denormalizado para historial permanente
  usuario_id      UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  usuario_nombre  TEXT NOT NULL,   -- denormalizado igual
  tipo            TEXT NOT NULL CHECK (tipo IN ('inicial', 'entrada', 'salida', 'ajuste', 'venta')),
  cantidad        INTEGER NOT NULL, -- positivo = entrada, negativo = salida
  stock_antes     INTEGER NOT NULL,
  stock_despues   INTEGER NOT NULL,
  referencia_id   UUID,            -- venta_id cuando tipo = 'venta'
  motivo          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE log_inventario_farmacia ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario de la clínica con acceso a farmacia puede leer el log
CREATE POLICY "log_inv_select" ON log_inventario_farmacia
  FOR SELECT USING (medico_id = get_effective_medico_id());

-- Solo usuarios de la clínica pueden insertar
CREATE POLICY "log_inv_insert" ON log_inventario_farmacia
  FOR INSERT WITH CHECK (medico_id = get_effective_medico_id());

-- Índices
CREATE INDEX IF NOT EXISTS idx_log_inv_medico     ON log_inventario_farmacia(medico_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_inv_producto   ON log_inventario_farmacia(producto_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_log_inv_tipo       ON log_inventario_farmacia(medico_id, tipo);
CREATE INDEX IF NOT EXISTS idx_log_inv_referencia ON log_inventario_farmacia(referencia_id);
