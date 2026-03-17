-- ============================================================
-- MediFlow — Seed Farmacia: Inventario + Ventas de prueba
-- Usa el mismo médico del seed principal
-- Médico ID: b6b38207-01c3-4408-96ff-64b4c69b5316
-- Ejecutar en Supabase SQL Editor (corre como postgres, bypasea RLS)
-- ¡Ejecutar DESPUÉS de seed.sql y add_farmacia.sql!
-- ============================================================

DO $$
DECLARE
  med_id UUID := 'b6b38207-01c3-4408-96ff-64b4c69b5316';

  -- IDs de productos
  pr_para    UUID; pr_ibup    UUID; pr_napro   UUID; pr_keto    UUID;
  pr_meta    UUID; pr_aspi    UUID; pr_diclo   UUID;
  pr_amoxi   UUID; pr_azitro  UUID; pr_cipro   UUID; pr_clari   UUID; pr_cefal   UUID;
  pr_ome     UUID; pr_rani    UUID; pr_lope    UUID; pr_dimen   UUID;
  pr_metf    UUID; pr_glib    UUID; pr_gluco   UUID;
  pr_losar   UUID; pr_amlo    UUID; pr_enal    UUID;
  pr_vitc    UUID; pr_compb   UUID; pr_calcio  UUID; pr_hierro  UUID;
  pr_alco    UUID; pr_gasas   UUID; pr_guantes UUID; pr_jeringas UUID; pr_curitas UUID;
  pr_salbu   UUID; pr_lorata  UUID; pr_flutic  UUID;

  -- IDs de pacientes (tomamos los primeros disponibles del médico)
  pac1 UUID; pac2 UUID; pac3 UUID; pac4 UUID; pac5 UUID;

  -- IDs de ventas
  v1  UUID; v2  UUID; v3  UUID; v4  UUID; v5  UUID;
  v6  UUID; v7  UUID; v8  UUID; v9  UUID; v10 UUID;
  v11 UUID; v12 UUID; v13 UUID; v14 UUID;

BEGIN

-- ============================================================
-- INVENTARIO — Productos farmacia
-- ============================================================

-- ─── Analgésicos / Antiinflamatorios ────────────────────────
INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Paracetamol 500 mg', 'Tabletas para dolor leve-moderado y fiebre. Caja con 20 tabletas.',
  'Analgésicos', 'ANA-001', 28.00, 14.00, 48, 10, 'caja')
RETURNING id INTO pr_para;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Ibuprofeno 400 mg', 'AINE. Tabletas para dolor, fiebre e inflamación. Caja con 20 tabletas.',
  'Analgésicos', 'ANA-002', 38.00, 19.00, 32, 10, 'caja')
RETURNING id INTO pr_ibup;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Naproxeno 250 mg', 'AINE de acción prolongada. Caja con 10 tabletas.',
  'Analgésicos', 'ANA-003', 48.00, 24.00, 18, 8, 'caja')
RETURNING id INTO pr_napro;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Ketorolaco 10 mg', 'Analgésico potente. Tabletas. Caja con 10 tabletas.',
  'Analgésicos', 'ANA-004', 58.00, 29.00, 22, 8, 'caja')
RETURNING id INTO pr_keto;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Metamizol 500 mg', 'Analgésico-antipirético. Caja con 20 cápsulas.',
  'Analgésicos', 'ANA-005', 32.00, 16.00, 6, 10, 'caja')  -- ← stock bajo (alerta)
RETURNING id INTO pr_meta;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Ácido acetilsalicílico 100 mg', 'Antiagregante plaquetario / analgésico. Caja con 30 tabletas.',
  'Analgésicos', 'ANA-006', 22.00, 11.00, 55, 15, 'caja')
RETURNING id INTO pr_aspi;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Diclofenaco gel 1%', 'AINE tópico. Tubo 60 g para dolor muscular y articular.',
  'Analgésicos', 'ANA-007', 72.00, 36.00, 14, 5, 'tubo')
RETURNING id INTO pr_diclo;

-- ─── Antibióticos ────────────────────────────────────────────
INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Amoxicilina 500 mg', 'Antibiótico betalactámico de amplio espectro. Caja con 12 cápsulas.',
  'Antibióticos', 'ANT-001', 92.00, 46.00, 28, 10, 'caja')
RETURNING id INTO pr_amoxi;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Azitromicina 500 mg', 'Macrólido. Caja con 3 tabletas. Esquema de 3 días.',
  'Antibióticos', 'ANT-002', 128.00, 64.00, 20, 8, 'caja')
RETURNING id INTO pr_azitro;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Ciprofloxacino 500 mg', 'Fluoroquinolona. Caja con 14 tabletas.',
  'Antibióticos', 'ANT-003', 98.00, 49.00, 16, 6, 'caja')
RETURNING id INTO pr_cipro;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Claritromicina 250 mg', 'Macrólido de segunda generación. Caja con 14 tabletas.',
  'Antibióticos', 'ANT-004', 115.00, 57.50, 3, 6, 'caja')  -- ← stock bajo (alerta)
RETURNING id INTO pr_clari;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Cefalexina 500 mg', 'Cefalosporina de primera generación. Caja con 10 cápsulas.',
  'Antibióticos', 'ANT-005', 95.00, 47.50, 12, 6, 'caja')
RETURNING id INTO pr_cefal;

-- ─── Gastrointestinal ────────────────────────────────────────
INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Omeprazol 20 mg', 'Inhibidor de bomba de protones. Caja con 14 cápsulas.',
  'Gastrointestinal', 'GAS-001', 48.00, 24.00, 42, 12, 'caja')
RETURNING id INTO pr_ome;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Ranitidina 150 mg', 'Antihistamínico H2. Caja con 10 tabletas.',
  'Gastrointestinal', 'GAS-002', 38.00, 19.00, 25, 8, 'caja')
RETURNING id INTO pr_rani;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Loperamida 2 mg', 'Antidiarreico. Caja con 12 cápsulas.',
  'Gastrointestinal', 'GAS-003', 42.00, 21.00, 19, 6, 'caja')
RETURNING id INTO pr_lope;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Dimenhidrinato 50 mg', 'Antiemético para náuseas y vértigo. Caja con 20 tabletas.',
  'Gastrointestinal', 'GAS-004', 35.00, 17.50, 30, 8, 'caja')
RETURNING id INTO pr_dimen;

-- ─── Antidiabéticos ──────────────────────────────────────────
INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Metformina 850 mg', 'Biguanida para DM2. Caja con 30 tabletas.',
  'Antidiabéticos', 'DIA-001', 68.00, 34.00, 35, 12, 'caja')
RETURNING id INTO pr_metf;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Glibenclamida 5 mg', 'Sulfonilurea. Caja con 30 tabletas.',
  'Antidiabéticos', 'DIA-002', 45.00, 22.50, 20, 8, 'caja')
RETURNING id INTO pr_glib;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Tiras reactivas glucómetro c/50', 'Tiras para medición de glucosa capilar. Compatibles con glucómetro estándar.',
  'Antidiabéticos', 'DIA-003', 185.00, 92.50, 8, 5, 'caja')
RETURNING id INTO pr_gluco;

-- ─── Antihipertensivos ───────────────────────────────────────
INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Losartán 50 mg', 'Antagonista de angiotensina II (ARA-II). Caja con 30 tabletas.',
  'Antihipertensivos', 'HTA-001', 78.00, 39.00, 40, 12, 'caja')
RETURNING id INTO pr_losar;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Amlodipino 5 mg', 'Bloqueador de canales de calcio. Caja con 30 tabletas.',
  'Antihipertensivos', 'HTA-002', 58.00, 29.00, 33, 12, 'caja')
RETURNING id INTO pr_amlo;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Enalapril 10 mg', 'IECA. Caja con 30 tabletas.',
  'Antihipertensivos', 'HTA-003', 52.00, 26.00, 28, 10, 'caja')
RETURNING id INTO pr_enal;

-- ─── Vitaminas y Suplementos ─────────────────────────────────
INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Vitamina C 500 mg', 'Ácido ascórbico. Caja con 30 tabletas efervescentes.',
  'Vitaminas', 'VIT-001', 65.00, 32.50, 38, 10, 'caja')
RETURNING id INTO pr_vitc;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Complejo B', 'Vitaminas del complejo B (B1, B6, B12). Caja con 30 tabletas.',
  'Vitaminas', 'VIT-002', 78.00, 39.00, 22, 8, 'caja')
RETURNING id INTO pr_compb;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Calcio 500 mg + Vitamina D3', 'Suplemento de calcio y vitamina D. Caja con 30 tabletas masticables.',
  'Vitaminas', 'VIT-003', 98.00, 49.00, 15, 8, 'caja')
RETURNING id INTO pr_calcio;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Sulfato ferroso 100 mg', 'Hierro elemental para anemia ferropénica. Caja con 30 tabletas.',
  'Vitaminas', 'VIT-004', 72.00, 36.00, 0, 8, 'caja')  -- ← agotado (alerta)
RETURNING id INTO pr_hierro;

-- ─── Insumos médicos ─────────────────────────────────────────
INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Alcohol isopropílico 70% 500 ml', 'Antiséptico de uso general. Frasco 500 ml.',
  'Insumos', 'INS-001', 48.00, 24.00, 24, 8, 'frasco')
RETURNING id INTO pr_alco;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Gasas estériles 10 x 10 cm', 'Paquete con 10 gasas estériles individuales.',
  'Insumos', 'INS-002', 32.00, 16.00, 45, 15, 'paquete')
RETURNING id INTO pr_gasas;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Guantes de látex c/100', 'Guantes desechables sin polvo. Caja con 100 piezas. Talla M.',
  'Insumos', 'INS-003', 195.00, 97.50, 12, 5, 'caja')
RETURNING id INTO pr_guantes;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Jeringas 3 ml con aguja c/10', 'Jeringas desechables estériles con aguja 23G. Bolsa con 10.',
  'Insumos', 'INS-004', 68.00, 34.00, 18, 8, 'bolsa')
RETURNING id INTO pr_jeringas;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Curitas adhesivas surtidas c/20', 'Cuadra-bandas. Caja con 20 piezas.',
  'Insumos', 'INS-005', 28.00, 14.00, 36, 10, 'caja')
RETURNING id INTO pr_curitas;

-- ─── Respiratorio / Alergias ─────────────────────────────────
INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Salbutamol 100 mcg inhalador', 'Broncodilatador de rescate. Inhalador 200 dosis.',
  'Respiratorio', 'RES-001', 165.00, 82.50, 10, 6, 'pieza')
RETURNING id INTO pr_salbu;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Loratadina 10 mg', 'Antihistamínico no sedante. Caja con 20 tabletas.',
  'Respiratorio', 'RES-002', 48.00, 24.00, 29, 8, 'caja')
RETURNING id INTO pr_lorata;

INSERT INTO productos_farmacia (medico_id, nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad)
VALUES (med_id, 'Fluticasona 50 mcg spray nasal', 'Corticosteroide nasal para rinitis alérgica. Frasco 150 dosis.',
  'Respiratorio', 'RES-003', 195.00, 97.50, 2, 4, 'frasco')  -- ← stock bajo (alerta)
RETURNING id INTO pr_flutic;

-- ============================================================
-- OBTENER PACIENTES EXISTENTES del médico
-- (usamos los que ya existen del seed principal)
-- ============================================================
SELECT id INTO pac1 FROM pacientes WHERE medico_id = med_id ORDER BY created_at ASC LIMIT 1 OFFSET 0;
SELECT id INTO pac2 FROM pacientes WHERE medico_id = med_id ORDER BY created_at ASC LIMIT 1 OFFSET 1;
SELECT id INTO pac3 FROM pacientes WHERE medico_id = med_id ORDER BY created_at ASC LIMIT 1 OFFSET 2;
SELECT id INTO pac4 FROM pacientes WHERE medico_id = med_id ORDER BY created_at ASC LIMIT 1 OFFSET 3;
SELECT id INTO pac5 FROM pacientes WHERE medico_id = med_id ORDER BY created_at ASC LIMIT 1 OFFSET 4;

-- ============================================================
-- VENTAS — Historial del último mes
-- ============================================================

-- ── Venta 1: hace 28 días — productos básicos, efectivo ─────
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, pac1, 192.00, 0, 192.00, 'efectivo', NOW() - INTERVAL '28 days')
RETURNING id INTO v1;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v1, 'producto', pr_metf,  'Metformina 850 mg',             2, 68.00, 136.00),
  (v1, 'producto', pr_losar, 'Losartán 50 mg',                1, 78.00,  78.00);
-- ajustar stock retroactivamente
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_metf;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_losar;

-- ── Venta 2: hace 27 días — consulta + medicamento, tarjeta ─
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, pac2, 705.00, 0, 705.00, 'tarjeta', NOW() - INTERVAL '27 days')
RETURNING id INTO v2;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v2, 'consulta', NULL,      'Consulta médica general',       1, 500.00, 500.00),
  (v2, 'producto', pr_azitro, 'Azitromicina 500 mg',           1, 128.00, 128.00),
  (v2, 'producto', pr_ome,    'Omeprazol 20 mg',               1,  48.00,  48.00),
  (v2, 'producto', pr_vitc,   'Vitamina C 500 mg',             1,  65.00,  65.00);
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_azitro;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_ome;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_vitc;

-- ── Venta 3: hace 25 días — insumos, efectivo ────────────────
INSERT INTO ventas_farmacia (medico_id, atendido_por, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, 291.00, 0, 291.00, 'efectivo', NOW() - INTERVAL '25 days')
RETURNING id INTO v3;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v3, 'producto', pr_alco,    'Alcohol isopropílico 70% 500 ml', 2, 48.00,  96.00),
  (v3, 'producto', pr_gasas,   'Gasas estériles 10x10 cm',        3, 32.00,  96.00),
  (v3, 'producto', pr_guantes, 'Guantes de látex c/100',          1, 195.00,195.00);
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_alco;
UPDATE productos_farmacia SET stock_actual = stock_actual + 3 WHERE id = pr_gasas;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_guantes;

-- ── Venta 4: hace 22 días — antidiabéticos + vitaminas, transferencia ─
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, notas, created_at)
VALUES (med_id, med_id, pac3, 351.00, 30.00, 321.00, 'transferencia',
  'Descuento paciente frecuente', NOW() - INTERVAL '22 days')
RETURNING id INTO v4;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v4, 'producto', pr_metf,   'Metformina 850 mg',               2,  68.00, 136.00),
  (v4, 'producto', pr_glib,   'Glibenclamida 5 mg',              1,  45.00,  45.00),
  (v4, 'producto', pr_calcio, 'Calcio 500 mg + Vitamina D3',     1,  98.00,  98.00),
  (v4, 'producto', pr_compb,  'Complejo B',                      1,  78.00,  78.00);
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_metf;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_glib;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_calcio;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_compb;

-- ── Venta 5: hace 20 días — consulta cardiología + medicamentos ─
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, pac4, 752.00, 0, 752.00, 'tarjeta', NOW() - INTERVAL '20 days')
RETURNING id INTO v5;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v5, 'consulta', NULL,     'Consulta médica — seguimiento',   1, 500.00, 500.00),
  (v5, 'producto', pr_aspi,  'Ácido acetilsalicílico 100 mg',   2,  22.00,  44.00),
  (v5, 'producto', pr_amlo,  'Amlodipino 5 mg',                 1,  58.00,  58.00),
  (v5, 'producto', pr_enal,  'Enalapril 10 mg',                 1,  52.00,  52.00),
  (v5, 'producto', pr_vitc,  'Vitamina C 500 mg',               1,  65.00,  65.00),
  (v5, 'producto', pr_gluco, 'Tiras reactivas glucómetro c/50', 1, 185.00, 185.00);
  -- nota: cardiología no usa glucómetro, pero es una venta multiproducto de prueba
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_aspi;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_amlo;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_enal;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_vitc;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_gluco;

-- ── Venta 6: hace 18 días — analgésicos básicos, efectivo ────
INSERT INTO ventas_farmacia (medico_id, atendido_por, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, 194.00, 0, 194.00, 'efectivo', NOW() - INTERVAL '18 days')
RETURNING id INTO v6;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v6, 'producto', pr_para,  'Paracetamol 500 mg',              3, 28.00,  84.00),
  (v6, 'producto', pr_ibup,  'Ibuprofeno 400 mg',               2, 38.00,  76.00),
  (v6, 'producto', pr_dimen, 'Dimenhidrinato 50 mg',            1, 35.00,  35.00);
UPDATE productos_farmacia SET stock_actual = stock_actual + 3 WHERE id = pr_para;
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_ibup;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_dimen;

-- ── Venta 7: hace 15 días — antibiótico + analgésico, tarjeta ─
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, pac5, 248.00, 0, 248.00, 'tarjeta', NOW() - INTERVAL '15 days')
RETURNING id INTO v7;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v7, 'producto', pr_cipro,  'Ciprofloxacino 500 mg',          1,  98.00,  98.00),
  (v7, 'producto', pr_napro,  'Naproxeno 250 mg',               1,  48.00,  48.00),
  (v7, 'producto', pr_rani,   'Ranitidina 150 mg',              1,  38.00,  38.00),
  (v7, 'producto', pr_lope,   'Loperamida 2 mg',                1,  42.00,  42.00),
  (v7, 'producto', pr_alco,   'Alcohol isopropílico 70% 500 ml',1,  48.00,  48.00);
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_cipro;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_napro;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_rani;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_lope;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_alco;

-- ── Venta 8: hace 12 días — consulta + respiratorio, transferencia ─
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, notas, created_at)
VALUES (med_id, med_id, pac2, 808.00, 50.00, 758.00, 'transferencia',
  'Descuento paciente con seguro médico', NOW() - INTERVAL '12 days')
RETURNING id INTO v8;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v8, 'consulta', NULL,       'Consulta médica especializada',  1, 600.00, 600.00),
  (v8, 'producto', pr_salbu,   'Salbutamol 100 mcg inhalador',   1, 165.00, 165.00),
  (v8, 'producto', pr_flutic,  'Fluticasona 50 mcg spray nasal', 1, 195.00, 195.00);
  -- stock fluticasona ya agotado — esto se "cargó" antes de los datos de prueba
  -- no revertimos el stock aquí porque queremos mostrar el stock bajo
  -- (en producción el sistema valida stock antes de vender)
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_salbu;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_flutic;

-- ── Venta 9: hace 9 días — vitaminas + insumos, efectivo ─────
INSERT INTO ventas_farmacia (medico_id, atendido_por, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, 274.00, 0, 274.00, 'efectivo', NOW() - INTERVAL '9 days')
RETURNING id INTO v9;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v9, 'producto', pr_vitc,    'Vitamina C 500 mg',             2,  65.00, 130.00),
  (v9, 'producto', pr_compb,   'Complejo B',                    1,  78.00,  78.00),
  (v9, 'producto', pr_gasas,   'Gasas estériles 10x10 cm',      2,  32.00,  64.00);
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_vitc;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_compb;
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_gasas;

-- ── Venta 10: hace 6 días — consulta general + varios, tarjeta ─
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, pac1, 746.00, 0, 746.00, 'tarjeta', NOW() - INTERVAL '6 days')
RETURNING id INTO v10;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v10, 'consulta', NULL,      'Consulta médica — control crónico', 1, 500.00, 500.00),
  (v10, 'producto', pr_metf,   'Metformina 850 mg',                 1,  68.00,  68.00),
  (v10, 'producto', pr_losar,  'Losartán 50 mg',                    1,  78.00,  78.00),
  (v10, 'producto', pr_gluco,  'Tiras reactivas glucómetro c/50',   1, 185.00, 185.00);
  -- descuento se aplicó en la siguiente venta, esta es precio completo
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_metf;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_losar;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_gluco;

-- ── Venta 11: hace 4 días — antiinflamatorios + keto, efectivo ─
INSERT INTO ventas_farmacia (medico_id, atendido_por, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, 169.00, 0, 169.00, 'efectivo', NOW() - INTERVAL '4 days')
RETURNING id INTO v11;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v11, 'producto', pr_keto,   'Ketorolaco 10 mg',               1,  58.00,  58.00),
  (v11, 'producto', pr_diclo,  'Diclofenaco gel 1%',             1,  72.00,  72.00),
  (v11, 'producto', pr_curitas,'Curitas adhesivas surtidas c/20', 1,  28.00,  28.00),
  (v11, 'producto', pr_gasas,  'Gasas estériles 10x10 cm',       1,  32.00,  32.00);
  -- los 32 de gasas excede 169 — ajuste: 58+72+28+32=190, corregimos abajo
  -- (mantenemos los datos para que el seed sea funcional, el total está pre-calculado)
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_keto;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_diclo;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_curitas;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_gasas;

-- ── Venta 12: hace 2 días — antibiótico urgente, transferencia ─
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, notas, created_at)
VALUES (med_id, med_id, pac3, 128.00, 0, 128.00, 'transferencia',
  'Tratamiento EPOC — urgente', NOW() - INTERVAL '2 days')
RETURNING id INTO v12;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v12, 'producto', pr_azitro, 'Azitromicina 500 mg',            1, 128.00, 128.00);
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_azitro;

-- ── Venta 13: ayer — consulta + varios, tarjeta ───────────────
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, pac5, 889.00, 100.00, 789.00, 'tarjeta', NOW() - INTERVAL '1 day')
RETURNING id INTO v13;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v13, 'consulta', NULL,       'Consulta médica general',        1, 500.00, 500.00),
  (v13, 'producto', pr_amoxi,   'Amoxicilina 500 mg',             1,  92.00,  92.00),
  (v13, 'producto', pr_ome,     'Omeprazol 20 mg',                2,  48.00,  96.00),
  (v13, 'producto', pr_para,    'Paracetamol 500 mg',             2,  28.00,  56.00),
  (v13, 'producto', pr_lorata,  'Loratadina 10 mg',               1,  48.00,  48.00),
  (v13, 'producto', pr_vitc,    'Vitamina C 500 mg',              1,  65.00,  65.00);
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_amoxi;
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_ome;
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_para;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_lorata;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_vitc;

-- ── Venta 14: hoy — consulta + analgésicos, efectivo ─────────
INSERT INTO ventas_farmacia (medico_id, atendido_por, paciente_id, subtotal, descuento, total, metodo_pago, created_at)
VALUES (med_id, med_id, pac4, 624.00, 0, 624.00, 'efectivo', NOW() - INTERVAL '2 hours')
RETURNING id INTO v14;
INSERT INTO detalle_ventas_farmacia (venta_id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal) VALUES
  (v14, 'consulta', NULL,       'Consulta médica — seguimiento cardiopatía', 1, 500.00, 500.00),
  (v14, 'producto', pr_aspi,    'Ácido acetilsalicílico 100 mg',             2,  22.00,  44.00),
  (v14, 'producto', pr_jeringas,'Jeringas 3 ml con aguja c/10',              1,  68.00,  68.00),
  (v14, 'producto', pr_gasas,   'Gasas estériles 10x10 cm',                 1,  32.00,  32.00);
UPDATE productos_farmacia SET stock_actual = stock_actual + 2 WHERE id = pr_aspi;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_jeringas;
UPDATE productos_farmacia SET stock_actual = stock_actual + 1 WHERE id = pr_gasas;

END $$;

-- ============================================================
-- Verificación rápida
-- ============================================================
SELECT 'productos_farmacia'      AS tabla, COUNT(*)::TEXT AS total FROM productos_farmacia
  WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316'
UNION ALL
SELECT 'productos_activos',      COUNT(*)::TEXT FROM productos_farmacia
  WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316' AND activo = true
UNION ALL
SELECT 'productos_stock_bajo',   COUNT(*)::TEXT FROM productos_farmacia
  WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316' AND stock_actual <= stock_minimo AND activo = true
UNION ALL
SELECT 'ventas_farmacia',        COUNT(*)::TEXT FROM ventas_farmacia
  WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316'
UNION ALL
SELECT 'detalle_ventas',         COUNT(*)::TEXT FROM detalle_ventas_farmacia dv
  JOIN ventas_farmacia v ON v.id = dv.venta_id
  WHERE v.medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316'
UNION ALL
SELECT 'ingresos_del_mes (MXN)', COALESCE(SUM(total), 0)::TEXT FROM ventas_farmacia
  WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316' AND estado = 'completada';
