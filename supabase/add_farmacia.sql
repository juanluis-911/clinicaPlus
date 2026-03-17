-- ============================================================
-- MediFlow: Módulo Farmacia
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Columna atiende_farmacia en perfiles (para asistentes)
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS atiende_farmacia BOOLEAN NOT NULL DEFAULT false;

-- 2. Tabla productos_farmacia — inventario de la farmacia
CREATE TABLE IF NOT EXISTS productos_farmacia (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id    UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  descripcion  TEXT,
  categoria    TEXT,
  sku          TEXT,
  precio       NUMERIC(10,2) NOT NULL DEFAULT 0,
  costo        NUMERIC(10,2),
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 0,
  unidad       TEXT NOT NULL DEFAULT 'pieza',
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE productos_farmacia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prod_select" ON productos_farmacia
  FOR SELECT USING (medico_id = get_effective_medico_id());

CREATE POLICY "prod_insert" ON productos_farmacia
  FOR INSERT WITH CHECK (medico_id = get_effective_medico_id());

CREATE POLICY "prod_update" ON productos_farmacia
  FOR UPDATE USING (medico_id = get_effective_medico_id());

CREATE POLICY "prod_delete" ON productos_farmacia
  FOR DELETE USING (medico_id = get_effective_medico_id());

CREATE TRIGGER set_updated_at_productos_farmacia
  BEFORE UPDATE ON productos_farmacia
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 3. Tabla ventas_farmacia — cabecera de cada venta en el POS
CREATE TABLE IF NOT EXISTS ventas_farmacia (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id    UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  atendido_por UUID NOT NULL REFERENCES perfiles(id),
  paciente_id  UUID REFERENCES pacientes(id) ON DELETE SET NULL,
  cita_id      UUID REFERENCES citas(id) ON DELETE SET NULL,
  subtotal     NUMERIC(10,2) NOT NULL DEFAULT 0,
  descuento    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total        NUMERIC(10,2) NOT NULL DEFAULT 0,
  metodo_pago  TEXT NOT NULL DEFAULT 'efectivo' CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
  estado       TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada', 'cancelada')),
  notas        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE ventas_farmacia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ventas_select" ON ventas_farmacia
  FOR SELECT USING (medico_id = get_effective_medico_id());

CREATE POLICY "ventas_insert" ON ventas_farmacia
  FOR INSERT WITH CHECK (medico_id = get_effective_medico_id());

CREATE POLICY "ventas_update" ON ventas_farmacia
  FOR UPDATE USING (medico_id = get_effective_medico_id());

-- 4. Tabla detalle_ventas_farmacia — líneas de cada venta
CREATE TABLE IF NOT EXISTS detalle_ventas_farmacia (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id        UUID NOT NULL REFERENCES ventas_farmacia(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL DEFAULT 'producto' CHECK (tipo IN ('producto', 'consulta')),
  producto_id     UUID REFERENCES productos_farmacia(id) ON DELETE SET NULL,
  descripcion     TEXT NOT NULL,
  cantidad        NUMERIC(10,3) NOT NULL DEFAULT 1,
  precio_unitario NUMERIC(10,2) NOT NULL,
  subtotal        NUMERIC(10,2) NOT NULL
);

ALTER TABLE detalle_ventas_farmacia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "detalle_select" ON detalle_ventas_farmacia
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ventas_farmacia v
      WHERE v.id = venta_id AND v.medico_id = get_effective_medico_id()
    )
  );

CREATE POLICY "detalle_insert" ON detalle_ventas_farmacia
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM ventas_farmacia v
      WHERE v.id = venta_id AND v.medico_id = get_effective_medico_id()
    )
  );

-- 5. Índices
CREATE INDEX IF NOT EXISTS idx_productos_farmacia_medico ON productos_farmacia(medico_id);
CREATE INDEX IF NOT EXISTS idx_productos_farmacia_activo ON productos_farmacia(medico_id, activo);
CREATE INDEX IF NOT EXISTS idx_ventas_farmacia_medico ON ventas_farmacia(medico_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_farmacia_paciente ON ventas_farmacia(paciente_id);
CREATE INDEX IF NOT EXISTS idx_detalle_ventas_venta ON detalle_ventas_farmacia(venta_id);
