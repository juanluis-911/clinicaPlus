-- ============================================================
-- MediFlow — Seed Log de Inventario de Farmacia
-- Ejecutar en Supabase SQL Editor
-- ¡Ejecutar DESPUÉS de seed_farmacia.sql y add_log_inventario.sql!
-- ============================================================
--
-- Estrategia:
--  • DO block: entradas iniciales de apertura + movimientos manuales
--    (reposiciones, salidas por caducidad, ajustes de conteo)
--  • CTE INSERT (fuera del DO): movimientos "venta" calculados
--    automáticamente desde ventas_farmacia + detalle_ventas_farmacia,
--    reconstruyendo stock_antes/despues con una ventana acumulativa.
--
-- Stocks iniciales de apertura (hace 90 días):
--   = stock_actual_en_DB + unidades_vendidas_en_seed + buffer_redondo
-- ============================================================

DO $$
DECLARE
  med_id    UUID := 'b6b38207-01c3-4408-96ff-64b4c69b5316';
  dr_nombre TEXT;

  -- IDs de productos (resueltos por SKU para robustez)
  pr_para    UUID; pr_ibup    UUID; pr_napro   UUID; pr_keto    UUID;
  pr_meta    UUID; pr_aspi    UUID; pr_diclo   UUID;
  pr_amoxi   UUID; pr_azitro  UUID; pr_cipro   UUID; pr_clari   UUID; pr_cefal   UUID;
  pr_ome     UUID; pr_rani    UUID; pr_lope    UUID; pr_dimen   UUID;
  pr_metf    UUID; pr_glib    UUID; pr_gluco   UUID;
  pr_losar   UUID; pr_amlo    UUID; pr_enal    UUID;
  pr_vitc    UUID; pr_compb   UUID; pr_calcio  UUID; pr_hierro  UUID;
  pr_alco    UUID; pr_gasas   UUID; pr_guantes UUID; pr_jeringas UUID; pr_curitas UUID;
  pr_salbu   UUID; pr_lorata  UUID; pr_flutic  UUID;

BEGIN

  -- Nombre del médico para denormalizarlo en el log
  SELECT nombre_completo INTO dr_nombre FROM perfiles WHERE id = med_id;

  -- ── Fetch IDs de los 34 productos por SKU ───────────────────────────────
  SELECT id INTO pr_para     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANA-001';
  SELECT id INTO pr_ibup     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANA-002';
  SELECT id INTO pr_napro    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANA-003';
  SELECT id INTO pr_keto     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANA-004';
  SELECT id INTO pr_meta     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANA-005';
  SELECT id INTO pr_aspi     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANA-006';
  SELECT id INTO pr_diclo    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANA-007';
  SELECT id INTO pr_amoxi    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANT-001';
  SELECT id INTO pr_azitro   FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANT-002';
  SELECT id INTO pr_cipro    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANT-003';
  SELECT id INTO pr_clari    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANT-004';
  SELECT id INTO pr_cefal    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'ANT-005';
  SELECT id INTO pr_ome      FROM productos_farmacia WHERE medico_id = med_id AND sku = 'GAS-001';
  SELECT id INTO pr_rani     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'GAS-002';
  SELECT id INTO pr_lope     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'GAS-003';
  SELECT id INTO pr_dimen    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'GAS-004';
  SELECT id INTO pr_metf     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'DIA-001';
  SELECT id INTO pr_glib     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'DIA-002';
  SELECT id INTO pr_gluco    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'DIA-003';
  SELECT id INTO pr_losar    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'HTA-001';
  SELECT id INTO pr_amlo     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'HTA-002';
  SELECT id INTO pr_enal     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'HTA-003';
  SELECT id INTO pr_vitc     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'VIT-001';
  SELECT id INTO pr_compb    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'VIT-002';
  SELECT id INTO pr_calcio   FROM productos_farmacia WHERE medico_id = med_id AND sku = 'VIT-003';
  SELECT id INTO pr_hierro   FROM productos_farmacia WHERE medico_id = med_id AND sku = 'VIT-004';
  SELECT id INTO pr_alco     FROM productos_farmacia WHERE medico_id = med_id AND sku = 'INS-001';
  SELECT id INTO pr_gasas    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'INS-002';
  SELECT id INTO pr_guantes  FROM productos_farmacia WHERE medico_id = med_id AND sku = 'INS-003';
  SELECT id INTO pr_jeringas FROM productos_farmacia WHERE medico_id = med_id AND sku = 'INS-004';
  SELECT id INTO pr_curitas  FROM productos_farmacia WHERE medico_id = med_id AND sku = 'INS-005';
  SELECT id INTO pr_salbu    FROM productos_farmacia WHERE medico_id = med_id AND sku = 'RES-001';
  SELECT id INTO pr_lorata   FROM productos_farmacia WHERE medico_id = med_id AND sku = 'RES-002';
  SELECT id INTO pr_flutic   FROM productos_farmacia WHERE medico_id = med_id AND sku = 'RES-003';

  -- ================================================================
  -- 1. STOCK INICIAL DE APERTURA (hace 90 días)
  --    stock_inicial = stock_actual_en_DB + unidades_vendidas + buffer
  --    (así el stock llega exactamente al estado actual tras las ventas)
  -- ================================================================
  INSERT INTO log_inventario_farmacia
    (medico_id, producto_id, producto_nombre, usuario_id, usuario_nombre,
     tipo, cantidad, stock_antes, stock_despues, motivo, created_at)
  VALUES
  -- ─── Analgésicos ──────────────────────────────────────────────────────
  (med_id, pr_para,    'Paracetamol 500 mg',              med_id, dr_nombre, 'inicial',  60, 0,  60, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_ibup,    'Ibuprofeno 400 mg',               med_id, dr_nombre, 'inicial',  40, 0,  40, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_napro,   'Naproxeno 250 mg',                med_id, dr_nombre, 'inicial',  25, 0,  25, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_keto,    'Ketorolaco 10 mg',                med_id, dr_nombre, 'inicial',  30, 0,  30, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_meta,    'Metamizol 500 mg',                med_id, dr_nombre, 'inicial',  20, 0,  20, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_aspi,    'Ácido acetilsalicílico 100 mg',   med_id, dr_nombre, 'inicial',  70, 0,  70, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_diclo,   'Diclofenaco gel 1%',              med_id, dr_nombre, 'inicial',  20, 0,  20, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  -- ─── Antibióticos ─────────────────────────────────────────────────────
  (med_id, pr_amoxi,   'Amoxicilina 500 mg',              med_id, dr_nombre, 'inicial',  35, 0,  35, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_azitro,  'Azitromicina 500 mg',             med_id, dr_nombre, 'inicial',  28, 0,  28, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_cipro,   'Ciprofloxacino 500 mg',           med_id, dr_nombre, 'inicial',  22, 0,  22, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_clari,   'Claritromicina 250 mg',           med_id, dr_nombre, 'inicial',  18, 0,  18, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_cefal,   'Cefalexina 500 mg',               med_id, dr_nombre, 'inicial',  16, 0,  16, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  -- ─── Gastrointestinal ─────────────────────────────────────────────────
  (med_id, pr_ome,     'Omeprazol 20 mg',                 med_id, dr_nombre, 'inicial',  50, 0,  50, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_rani,    'Ranitidina 150 mg',               med_id, dr_nombre, 'inicial',  30, 0,  30, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_lope,    'Loperamida 2 mg',                 med_id, dr_nombre, 'inicial',  25, 0,  25, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_dimen,   'Dimenhidrinato 50 mg',            med_id, dr_nombre, 'inicial',  35, 0,  35, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  -- ─── Antidiabéticos ───────────────────────────────────────────────────
  (med_id, pr_metf,    'Metformina 850 mg',               med_id, dr_nombre, 'inicial',  50, 0,  50, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_glib,    'Glibenclamida 5 mg',              med_id, dr_nombre, 'inicial',  26, 0,  26, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_gluco,   'Tiras reactivas glucómetro c/50', med_id, dr_nombre, 'inicial',  15, 0,  15, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  -- ─── Antihipertensivos ────────────────────────────────────────────────
  (med_id, pr_losar,   'Losartán 50 mg',                  med_id, dr_nombre, 'inicial',  50, 0,  50, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_amlo,    'Amlodipino 5 mg',                 med_id, dr_nombre, 'inicial',  40, 0,  40, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_enal,    'Enalapril 10 mg',                 med_id, dr_nombre, 'inicial',  35, 0,  35, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  -- ─── Vitaminas ────────────────────────────────────────────────────────
  (med_id, pr_vitc,    'Vitamina C 500 mg',               med_id, dr_nombre, 'inicial',  55, 0,  55, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_compb,   'Complejo B',                      med_id, dr_nombre, 'inicial',  30, 0,  30, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_calcio,  'Calcio 500 mg + Vitamina D3',     med_id, dr_nombre, 'inicial',  20, 0,  20, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_hierro,  'Sulfato ferroso 100 mg',          med_id, dr_nombre, 'inicial',  15, 0,  15, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  -- ─── Insumos ──────────────────────────────────────────────────────────
  (med_id, pr_alco,    'Alcohol isopropílico 70% 500 ml', med_id, dr_nombre, 'inicial',  32, 0,  32, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_gasas,   'Gasas estériles 10 x 10 cm',      med_id, dr_nombre, 'inicial',  65, 0,  65, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_guantes, 'Guantes de látex c/100',          med_id, dr_nombre, 'inicial',  18, 0,  18, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_jeringas,'Jeringas 3 ml con aguja c/10',    med_id, dr_nombre, 'inicial',  24, 0,  24, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_curitas, 'Curitas adhesivas surtidas c/20', med_id, dr_nombre, 'inicial',  42, 0,  42, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  -- ─── Respiratorio ─────────────────────────────────────────────────────
  (med_id, pr_salbu,   'Salbutamol 100 mcg inhalador',    med_id, dr_nombre, 'inicial',  15, 0,  15, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_lorata,  'Loratadina 10 mg',                med_id, dr_nombre, 'inicial',  36, 0,  36, 'Apertura de farmacia',         NOW() - INTERVAL '90 days'),
  (med_id, pr_flutic,  'Fluticasona 50 mcg spray nasal',  med_id, dr_nombre, 'inicial',   8, 0,   8, 'Apertura de farmacia',         NOW() - INTERVAL '90 days');

  -- ================================================================
  -- 2. SALIDAS MANUALES — Caducidad / Merma (hace 55-70 días)
  --    Explican por qué algunos productos bajaron más de lo que
  --    indican sólo las ventas (Metamizol, Claritromicina, Hierro…)
  -- ================================================================
  INSERT INTO log_inventario_farmacia
    (medico_id, producto_id, producto_nombre, usuario_id, usuario_nombre,
     tipo, cantidad, stock_antes, stock_despues, motivo, created_at)
  VALUES
  (med_id, pr_meta,  'Metamizol 500 mg',         med_id, dr_nombre, 'salida',  -9,  20, 11, 'Lote vencido — fecha de caducidad 2025-08', NOW() - INTERVAL '65 days'),
  (med_id, pr_clari, 'Claritromicina 250 mg',    med_id, dr_nombre, 'salida',  -8,  18, 10, 'Lote vencido — fecha de caducidad 2025-09', NOW() - INTERVAL '62 days'),
  (med_id, pr_hierro,'Sulfato ferroso 100 mg',   med_id, dr_nombre, 'salida', -15,  15,  0, 'Lote completo vencido — retirado del anaquel', NOW() - INTERVAL '58 days'),
  (med_id, pr_flutic,'Fluticasona 50 mcg spray', med_id, dr_nombre, 'salida',  -2,   8,  6, 'Frascos dañados (tapa rota) en recepción',   NOW() - INTERVAL '55 days'),
  (med_id, pr_gluco, 'Tiras reactivas glucómetro c/50', med_id, dr_nombre, 'salida', -3, 15, 12, 'Tiras fuera de rango por exposición a humedad', NOW() - INTERVAL '52 days');

  -- ================================================================
  -- 3. ENTRADAS — Reposición de stock (hace 30-50 días)
  -- ================================================================
  INSERT INTO log_inventario_farmacia
    (medico_id, producto_id, producto_nombre, usuario_id, usuario_nombre,
     tipo, cantidad, stock_antes, stock_despues, motivo, created_at)
  VALUES
  -- Reposición grande al mes de apertura
  (med_id, pr_para,   'Paracetamol 500 mg',             med_id, dr_nombre, 'entrada',  20, 55, 75, 'Reposición mensual — pedido a proveedor',     NOW() - INTERVAL '50 days'),
  (med_id, pr_aspi,   'Ácido acetilsalicílico 100 mg',  med_id, dr_nombre, 'entrada',  25, 66, 91, 'Reposición mensual — pedido a proveedor',     NOW() - INTERVAL '50 days'),
  (med_id, pr_metf,   'Metformina 850 mg',              med_id, dr_nombre, 'entrada',  20, 45, 65, 'Reposición mensual — alta rotación',          NOW() - INTERVAL '49 days'),
  (med_id, pr_losar,  'Losartán 50 mg',                 med_id, dr_nombre, 'entrada',  15, 48, 63, 'Reposición mensual — pedido a proveedor',     NOW() - INTERVAL '49 days'),
  (med_id, pr_vitc,   'Vitamina C 500 mg',              med_id, dr_nombre, 'entrada',  20, 50, 70, 'Reposición mensual — pedido a proveedor',     NOW() - INTERVAL '48 days'),
  (med_id, pr_gasas,  'Gasas estériles 10 x 10 cm',     med_id, dr_nombre, 'entrada',  30, 58, 88, 'Reposición mensual — insumos quirúrgicos',    NOW() - INTERVAL '48 days'),
  (med_id, pr_ome,    'Omeprazol 20 mg',                med_id, dr_nombre, 'entrada',  20, 47, 67, 'Reposición quincenal — alta demanda',         NOW() - INTERVAL '45 days'),
  -- Reposición urgente por stock bajo
  (med_id, pr_meta,   'Metamizol 500 mg',               med_id, dr_nombre, 'entrada',   8, 11, 19, 'Reposición urgente tras detección de stock bajo', NOW() - INTERVAL '40 days'),
  (med_id, pr_clari,  'Claritromicina 250 mg',          med_id, dr_nombre, 'entrada',   8, 10, 18, 'Reposición urgente — antibiótico de segunda línea', NOW() - INTERVAL '38 days'),
  (med_id, pr_flutic, 'Fluticasona 50 mcg spray nasal', med_id, dr_nombre, 'entrada',   6,  6, 12, 'Reposición urgente — temporada de rinitis',   NOW() - INTERVAL '35 days'),
  -- Segunda reposición mensual (hace ~30 días)
  (med_id, pr_azitro, 'Azitromicina 500 mg',            med_id, dr_nombre, 'entrada',  10, 24, 34, 'Reposición quincenal',                        NOW() - INTERVAL '30 days'),
  (med_id, pr_metf,   'Metformina 850 mg',              med_id, dr_nombre, 'entrada',  10, 56, 66, 'Reposición quincenal — alta rotación',        NOW() - INTERVAL '30 days'),
  (med_id, pr_alco,   'Alcohol isopropílico 70% 500 ml',med_id, dr_nombre, 'entrada',  10, 27, 37, 'Reposición mensual',                          NOW() - INTERVAL '29 days');

  -- ================================================================
  -- 4. AJUSTES DE INVENTARIO — Conteos físicos (hace 14-21 días)
  -- ================================================================
  INSERT INTO log_inventario_farmacia
    (medico_id, producto_id, producto_nombre, usuario_id, usuario_nombre,
     tipo, cantidad, stock_antes, stock_despues, motivo, created_at)
  VALUES
  -- Conteo físico reveló diferencias menores
  (med_id, pr_cefal,  'Cefalexina 500 mg',              med_id, dr_nombre, 'ajuste',  -2, 16, 14, 'Conteo físico mensual — diferencia encontrada', NOW() - INTERVAL '21 days'),
  (med_id, pr_curitas,'Curitas adhesivas surtidas c/20',med_id, dr_nombre, 'ajuste',  -3, 41, 38, 'Conteo físico — cajas abiertas para uso clínico', NOW() - INTERVAL '21 days'),
  (med_id, pr_dimen,  'Dimenhidrinato 50 mg',           med_id, dr_nombre, 'ajuste',  -2, 33, 31, 'Conteo físico — diferencia vs sistema',         NOW() - INTERVAL '21 days'),
  (med_id, pr_compb,  'Complejo B',                     med_id, dr_nombre, 'ajuste',  -2, 27, 25, 'Conteo físico mensual — diferencia de 2 cajas',  NOW() - INTERVAL '20 days'),
  (med_id, pr_rani,   'Ranitidina 150 mg',              med_id, dr_nombre, 'ajuste',   1, 27, 28, 'Conteo físico — caja extra encontrada en bodega', NOW() - INTERVAL '20 days'),
  -- Corrección de stock por error de registro anterior
  (med_id, pr_guantes,'Guantes de látex c/100',         med_id, dr_nombre, 'ajuste',  -4, 17, 13, 'Corrección — cajas usadas internamente no registradas', NOW() - INTERVAL '14 days');

END $$;

-- ================================================================
-- 5. MOVIMIENTOS "VENTA" — Calculados desde ventas reales
--    Reconstruye stock_antes y stock_despues usando ventana acumulativa
--    DESC para llegar exactamente al stock_actual de la DB.
-- ================================================================
WITH sales_ranked AS (
  SELECT
    d.producto_id,
    pf.stock_actual                                            AS current_stock,
    pf.nombre                                                  AS prod_nombre,
    d.cantidad::INTEGER                                        AS qty,
    v.created_at,
    v.id                                                       AS venta_id,
    v.atendido_por,
    v.medico_id,
    perf.nombre_completo                                       AS user_name,
    -- Suma acumulativa de qty de ventas MÁS RECIENTES que la actual
    -- (orden DESC → la más reciente tiene cum_before = 0)
    SUM(d.cantidad::INTEGER) OVER (
      PARTITION BY d.producto_id
      ORDER BY v.created_at DESC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) - d.cantidad::INTEGER                                    AS cum_before
  FROM ventas_farmacia v
  JOIN detalle_ventas_farmacia d ON d.venta_id   = v.id
  JOIN productos_farmacia      pf ON pf.id        = d.producto_id
  JOIN perfiles                perf ON perf.id    = v.atendido_por
  WHERE d.tipo            = 'producto'
    AND d.producto_id     IS NOT NULL
    AND v.medico_id       = 'b6b38207-01c3-4408-96ff-64b4c69b5316'
    AND v.estado          = 'completada'
)
INSERT INTO log_inventario_farmacia (
  medico_id, producto_id, producto_nombre, usuario_id, usuario_nombre,
  tipo, cantidad, stock_antes, stock_despues, referencia_id, motivo, created_at
)
SELECT
  medico_id,
  producto_id,
  prod_nombre,
  atendido_por,
  user_name,
  'venta',
  -qty,
  -- Trabajando hacia atrás desde el estado actual de la DB:
  current_stock + cum_before + qty   AS stock_antes,
  current_stock + cum_before         AS stock_despues,
  venta_id,
  'Venta registrada en POS',
  created_at
FROM sales_ranked;

-- ================================================================
-- Verificación rápida
-- ================================================================
SELECT tipo, COUNT(*)::TEXT AS entradas
FROM log_inventario_farmacia
WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316'
GROUP BY tipo
ORDER BY tipo;

SELECT COUNT(*)::TEXT AS total_movimientos
FROM log_inventario_farmacia
WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316';
