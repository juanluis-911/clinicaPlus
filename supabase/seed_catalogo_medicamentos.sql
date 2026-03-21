-- Seed global del catálogo de medicamentos (~200 entradas)
-- medico_id = NULL indica entradas globales visibles para todos los médicos
-- mg_kg_min / mg_kg_max solo se incluyen donde aplica dosificación por peso

INSERT INTO catalogo_medicamentos (medico_id, nombre, concentracion, forma, mg_kg_min, mg_kg_max, nota_dosis)
VALUES

-- ══════════════════════════════════════════════
-- ANALGÉSICOS / ANTIPIRÉTICOS / AINEs
-- ══════════════════════════════════════════════
(NULL, 'Paracetamol',                   '500 mg',        'tableta',    10,    15,   'c/4-6h; máx 5 dosis/día'),
(NULL, 'Paracetamol',                   '1 g',           'tableta',    10,    15,   'c/6-8h en adultos'),
(NULL, 'Paracetamol gotas',             '100 mg/ml',     'gotas',      10,    15,   'c/4-6h; máx 5 dosis/día'),
(NULL, 'Paracetamol jarabe',            '160 mg/5 ml',   'jarabe',     10,    15,   'c/4-6h; máx 5 dosis/día'),
(NULL, 'Ibuprofeno',                    '400 mg',        'tableta',    5,     10,   'c/6-8h con alimentos'),
(NULL, 'Ibuprofeno',                    '600 mg',        'tableta',    5,     10,   'c/6-8h con alimentos'),
(NULL, 'Ibuprofeno jarabe',             '100 mg/5 ml',   'jarabe',     5,     10,   'c/6-8h con alimentos'),
(NULL, 'Naproxeno',                     '250 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Naproxeno',                     '500 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Ketorolaco',                    '10 mg',         'tableta',    NULL,  NULL, 'máx 5 días'),
(NULL, 'Ketorolaco',                    '30 mg/ml',      'inyectable', NULL,  NULL, 'máx 5 días'),
(NULL, 'Diclofenaco',                   '50 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Diclofenaco',                   '75 mg/3 ml',    'inyectable', NULL,  NULL, NULL),
(NULL, 'Diclofenaco gel',               '1%',            'crema',      NULL,  NULL, 'aplicar 2-3 veces al día'),
(NULL, 'Metamizol',                     '500 mg',        'tableta',    10,    15,   'c/6-8h'),
(NULL, 'Metamizol gotas',               '500 mg/ml',     'gotas',      10,    15,   'c/6-8h'),
(NULL, 'Ácido acetilsalicílico',        '500 mg',        'tableta',    NULL,  NULL, 'no usar en < 12 años'),
(NULL, 'Ácido acetilsalicílico',        '100 mg',        'tableta',    NULL,  NULL, 'antiagregante plaquetario'),
(NULL, 'Meloxicam',                     '7.5 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Meloxicam',                     '15 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Celecoxib',                     '200 mg',        'cápsula',    NULL,  NULL, NULL),
(NULL, 'Tramadol',                      '50 mg',         'cápsula',    NULL,  NULL, 'analgésico opioide'),
(NULL, 'Tramadol',                      '100 mg/2 ml',   'inyectable', NULL,  NULL, 'analgésico opioide'),
(NULL, 'Etoricoxib',                    '90 mg',         'tableta',    NULL,  NULL, NULL),

-- ══════════════════════════════════════════════
-- ANTIBIÓTICOS
-- ══════════════════════════════════════════════
(NULL, 'Amoxicilina',                   '500 mg',        'cápsula',    25,    50,   'dosis/día dividida c/8h'),
(NULL, 'Amoxicilina suspensión',        '250 mg/5 ml',   'suspensión', 25,    50,   'dosis/día dividida c/8h'),
(NULL, 'Amoxicilina/Clavulanato',       '875/125 mg',    'tableta',    40,    45,   'dosis/día dividida c/12h'),
(NULL, 'Amoxicilina/Clavulanato sus.',  '400/57 mg/5ml', 'suspensión', 40,    45,   'dosis/día dividida c/8-12h'),
(NULL, 'Azitromicina',                  '500 mg',        'tableta',    10,    10,   '1 vez/día × 3-5 días'),
(NULL, 'Azitromicina suspensión',       '200 mg/5 ml',   'suspensión', 10,    10,   '1 vez/día × 3 días'),
(NULL, 'Claritromicina',                '500 mg',        'tableta',    15,    15,   'c/12h'),
(NULL, 'Claritromicina suspensión',     '125 mg/5 ml',   'suspensión', 15,    15,   'c/12h'),
(NULL, 'Ciprofloxacino',                '500 mg',        'tableta',    NULL,  NULL, 'no usar en < 18 años salvo indicación'),
(NULL, 'Ciprofloxacino',                '250 mg',        'tableta',    NULL,  NULL, 'no usar en < 18 años salvo indicación'),
(NULL, 'Levofloxacino',                 '500 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Metronidazol',                  '500 mg',        'tableta',    20,    30,   'dosis/día dividida c/8h'),
(NULL, 'Metronidazol suspensión',       '250 mg/5 ml',   'suspensión', 20,    30,   'dosis/día dividida c/8h'),
(NULL, 'Metronidazol óvulo',            '500 mg',        'otro',       NULL,  NULL, '1 óvulo vaginal c/noche × 7 días'),
(NULL, 'Cefalexina',                    '500 mg',        'cápsula',    25,    50,   'dosis/día dividida c/6-8h'),
(NULL, 'Cefalexina suspensión',         '250 mg/5 ml',   'suspensión', 25,    50,   'dosis/día dividida c/8h'),
(NULL, 'Cefadroxilo',                   '500 mg',        'cápsula',    30,    30,   'dosis/día dividida c/12h'),
(NULL, 'Ceftriaxona',                   '1 g',           'inyectable', 50,    75,   'dosis/día IM o IV'),
(NULL, 'Doxiciclina',                   '100 mg',        'cápsula',    NULL,  NULL, 'no usar en < 8 años'),
(NULL, 'Trimetoprim/Sulfametoxazol',    '800/160 mg',    'tableta',    6,     12,   'mg/kg/día de TMP, dividida c/12h'),
(NULL, 'Trimetoprim/Sulfametoxazol s.', '200/40 mg/5ml', 'suspensión', 6,     12,   'mg/kg/día de TMP, dividida c/12h'),
(NULL, 'Nitrofurantoína',               '100 mg',        'cápsula',    5,     7,    'dosis/día dividida c/6h'),
(NULL, 'Clindamicina',                  '300 mg',        'cápsula',    10,    30,   'dosis/día dividida c/6-8h'),
(NULL, 'Eritromicina',                  '500 mg',        'tableta',    30,    50,   'dosis/día dividida c/6h'),
(NULL, 'Clindamicina crema vaginal',    '2%',            'crema',      NULL,  NULL, 'aplicar c/noche × 7 días'),

-- ══════════════════════════════════════════════
-- ANTIPARASITARIOS / ANTIVIRALES / ANTIFÚNGICOS
-- ══════════════════════════════════════════════
(NULL, 'Albendazol',                    '400 mg',        'tableta',    7.5,   7.5,  'dosis única; < 2 años: 200 mg'),
(NULL, 'Albendazol suspensión',         '200 mg/5 ml',   'suspensión', 7.5,   7.5,  'dosis única'),
(NULL, 'Ivermectina',                   '6 mg',          'tableta',    0.2,   0.2,  'dosis única con el estómago vacío'),
(NULL, 'Metronidazol',                  '500 mg',        'tableta',    20,    30,   'ya listado en antibióticos'),
(NULL, 'Aciclovir',                     '200 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Aciclovir',                     '800 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Aciclovir crema',               '5%',            'crema',      NULL,  NULL, 'aplicar 5 veces al día × 5 días'),
(NULL, 'Fluconazol',                    '150 mg',        'cápsula',    3,     12,   'dosis única o c/24h según indicación'),
(NULL, 'Itraconazol',                   '100 mg',        'cápsula',    NULL,  NULL, NULL),
(NULL, 'Terbinafina',                   '250 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Ketoconazol crema',             '2%',            'crema',      NULL,  NULL, 'aplicar 1-2 veces al día'),
(NULL, 'Clotrimazol crema',             '1%',            'crema',      NULL,  NULL, 'aplicar 2-3 veces al día'),

-- ══════════════════════════════════════════════
-- ANTIHISTAMÍNICOS
-- ══════════════════════════════════════════════
(NULL, 'Loratadina',                    '10 mg',         'tableta',    0.2,   0.2,  '1 vez/día'),
(NULL, 'Loratadina jarabe',             '5 mg/5 ml',     'jarabe',     0.2,   0.2,  '1 vez/día'),
(NULL, 'Cetirizina',                    '10 mg',         'tableta',    0.25,  0.25, '1 vez/día'),
(NULL, 'Cetirizina jarabe',             '5 mg/5 ml',     'jarabe',     0.25,  0.25, '1 vez/día'),
(NULL, 'Fexofenadina',                  '120 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Fexofenadina',                  '180 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Difenhidramina',                '25 mg',         'cápsula',    1,     1.25, 'c/6h; produce somnolencia'),
(NULL, 'Clorfeniramina',                '4 mg',          'tableta',    0.35,  0.35, 'c/4-6h; produce somnolencia'),
(NULL, 'Desloratadina',                 '5 mg',          'tableta',    NULL,  NULL, NULL),

-- ══════════════════════════════════════════════
-- GASTROINTESTINALES
-- ══════════════════════════════════════════════
(NULL, 'Omeprazol',                     '20 mg',         'cápsula',    0.7,   1,    'ayuno; 1 vez/día'),
(NULL, 'Omeprazol',                     '40 mg',         'cápsula',    NULL,  NULL, 'adultos con ERGE grave'),
(NULL, 'Lansoprazol',                   '30 mg',         'cápsula',    NULL,  NULL, NULL),
(NULL, 'Pantoprazol',                   '40 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Ranitidina',                    '150 mg',        'tableta',    2,     4,    'dosis/día dividida c/12h'),
(NULL, 'Domperidona',                   '10 mg',         'tableta',    0.25,  0.25, 'c/8h antes de comidas'),
(NULL, 'Metoclopramida',                '10 mg',         'tableta',    0.1,   0.2,  'c/8h antes de comidas'),
(NULL, 'Ondansetrón',                   '4 mg',          'tableta',    0.1,   0.15, 'c/8h'),
(NULL, 'Ondansetrón',                   '8 mg',          'tableta',    NULL,  NULL, 'adultos'),
(NULL, 'Loperamida',                    '2 mg',          'cápsula',    NULL,  NULL, 'no usar en < 6 años'),
(NULL, 'Dimeticona',                    '80 mg',         'tableta',    20,    20,   'c/8h'),
(NULL, 'Simeticona gotas',              '75 mg/ml',      'gotas',      NULL,  NULL, '20-40 mg por toma en lactantes'),
(NULL, 'Bismuto',                       '262 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Sucralfato',                    '1 g',           'tableta',    NULL,  NULL, 'antes de comidas y al acostarse'),
(NULL, 'Lactuclosa',                    '3.3 g/5 ml',    'jarabe',     0.5,   1,    'ml/kg/día'),
(NULL, 'Macrogol',                      '3350 17 g',     'otro',       NULL,  NULL, 'disolver en agua'),
(NULL, 'Mesalazina',                    '400 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Colestipol',                    '5 g',           'otro',       NULL,  NULL, NULL),

-- ══════════════════════════════════════════════
-- RESPIRATORIOS / BRONCODILATADORES
-- ══════════════════════════════════════════════
(NULL, 'Salbutamol inhalador',          '100 mcg/dosis', 'inhalador',  NULL,  NULL, '1-2 pulsaciones c/4-6h'),
(NULL, 'Salbutamol nebulizar',          '5 mg/ml',       'solución',   0.15,  0.3,  'c/20min en crisis, luego c/4-6h'),
(NULL, 'Salbutamol jarabe',             '2 mg/5 ml',     'jarabe',     0.1,   0.2,  'c/6-8h'),
(NULL, 'Ipratropio inhalador',          '20 mcg/dosis',  'inhalador',  NULL,  NULL, '2 pulsaciones c/6-8h'),
(NULL, 'Budesonida inhalador',          '200 mcg/dosis', 'inhalador',  NULL,  NULL, '1-2 pulsaciones c/12h'),
(NULL, 'Fluticasona inhalador',         '50 mcg/dosis',  'inhalador',  NULL,  NULL, '2 pulsaciones c/12h'),
(NULL, 'Beclometasona inhalador',       '50 mcg/dosis',  'inhalador',  NULL,  NULL, '2 pulsaciones c/12h'),
(NULL, 'Montelukast',                   '10 mg',         'tableta',    0.2,   0.2,  '1 vez/día al acostarse'),
(NULL, 'Montelukast',                   '5 mg',          'tableta',    0.2,   0.2,  'masticable; 6-14 años'),
(NULL, 'Montelukast',                   '4 mg',          'tableta',    0.2,   0.2,  'masticable; 2-5 años'),
(NULL, 'Ambroxol',                      '30 mg',         'tableta',    1.2,   1.6,  'c/8h'),
(NULL, 'Ambroxol jarabe',               '15 mg/5 ml',    'jarabe',     1.2,   1.6,  'c/8-12h'),
(NULL, 'N-acetilcisteína',              '600 mg',        'otro',       10,    10,   'efervescente; 1 vez/día'),
(NULL, 'Dextrometorfano jarabe',        '15 mg/5 ml',    'jarabe',     0.25,  0.5,  'c/6-8h; no usar < 4 años'),
(NULL, 'Teofilina',                     '100 mg',        'tableta',    5,     5,    'c/8h; monitorear niveles'),

-- ══════════════════════════════════════════════
-- CARDIOVASCULARES
-- ══════════════════════════════════════════════
(NULL, 'Enalapril',                     '5 mg',          'tableta',    0.1,   0.1,  '1 vez/día; iniciar con dosis baja'),
(NULL, 'Enalapril',                     '10 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Enalapril',                     '20 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Losartán',                      '50 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Losartán',                      '100 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Amlodipino',                    '5 mg',          'tableta',    NULL,  NULL, NULL),
(NULL, 'Amlodipino',                    '10 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Metoprolol',                    '50 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Metoprolol',                    '100 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Atenolol',                      '50 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Carvedilol',                    '6.25 mg',       'tableta',    NULL,  NULL, NULL),
(NULL, 'Carvedilol',                    '25 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Hidroclorotiazida',             '25 mg',         'tableta',    1,     2,    'dosis/día'),
(NULL, 'Furosemida',                    '40 mg',         'tableta',    1,     2,    'c/24h; ajustar según respuesta'),
(NULL, 'Espironolactona',               '25 mg',         'tableta',    1,     3,    'dosis/día'),
(NULL, 'Verapamilo',                    '80 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Digoxina',                      '0.25 mg',       'tableta',    NULL,  NULL, 'margen terapéutico estrecho'),
(NULL, 'Clopidogrel',                   '75 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Warfarina',                     '5 mg',          'tableta',    NULL,  NULL, 'monitorear INR'),
(NULL, 'Rivaroxabán',                   '20 mg',         'tableta',    NULL,  NULL, 'tomar con la cena'),
(NULL, 'Apixabán',                      '5 mg',          'tableta',    NULL,  NULL, NULL),
(NULL, 'Simvastatina',                  '20 mg',         'tableta',    NULL,  NULL, 'tomar en la noche'),
(NULL, 'Atorvastatina',                 '20 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Atorvastatina',                 '40 mg',         'tableta',    NULL,  NULL, NULL),

-- ══════════════════════════════════════════════
-- ENDOCRINOLOGÍA / METABOLISMO
-- ══════════════════════════════════════════════
(NULL, 'Metformina',                    '500 mg',        'tableta',    NULL,  NULL, 'tomar con alimentos'),
(NULL, 'Metformina',                    '850 mg',        'tableta',    NULL,  NULL, 'tomar con alimentos'),
(NULL, 'Metformina',                    '1000 mg',       'tableta',    NULL,  NULL, 'tomar con alimentos'),
(NULL, 'Glibenclamida',                 '5 mg',          'tableta',    NULL,  NULL, NULL),
(NULL, 'Glipizida',                     '5 mg',          'tableta',    NULL,  NULL, NULL),
(NULL, 'Sitagliptina',                  '100 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Empagliflozina',                '10 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Dapagliflozina',                '10 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Insulina glargina',             '100 UI/ml',     'inyectable', NULL,  NULL, 'SC 1 vez/día'),
(NULL, 'Insulina regular',              '100 UI/ml',     'inyectable', NULL,  NULL, 'SC o IV'),
(NULL, 'Insulina NPH',                  '100 UI/ml',     'inyectable', NULL,  NULL, 'SC 1-2 veces/día'),
(NULL, 'Insulina lispro',               '100 UI/ml',     'inyectable', NULL,  NULL, 'SC antes de comidas'),
(NULL, 'Levotiroxina',                  '50 mcg',        'tableta',    NULL,  NULL, 'ayuno 30 min antes del desayuno'),
(NULL, 'Levotiroxina',                  '100 mcg',       'tableta',    NULL,  NULL, 'ayuno 30 min antes del desayuno'),
(NULL, 'Metimazol',                     '5 mg',          'tableta',    0.2,   0.5,  'dosis/día dividida c/8h'),
(NULL, 'Propiltiouracilo',              '50 mg',         'tableta',    NULL,  NULL, NULL),

-- ══════════════════════════════════════════════
-- NEUROLOGÍA / PSIQUIATRÍA
-- ══════════════════════════════════════════════
(NULL, 'Amitriptilina',                 '25 mg',         'tableta',    NULL,  NULL, 'tomar en la noche'),
(NULL, 'Fluoxetina',                    '20 mg',         'cápsula',    NULL,  NULL, NULL),
(NULL, 'Sertralina',                    '50 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Escitalopram',                  '10 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Venlafaxina',                   '75 mg',         'cápsula',    NULL,  NULL, NULL),
(NULL, 'Alprazolam',                    '0.25 mg',       'tableta',    NULL,  NULL, 'riesgo de dependencia'),
(NULL, 'Clonazepam',                    '0.5 mg',        'tableta',    NULL,  NULL, 'riesgo de dependencia'),
(NULL, 'Diazepam',                      '5 mg',          'tableta',    0.1,   0.3,  'c/8-12h; riesgo de dependencia'),
(NULL, 'Carbamazepina',                 '200 mg',        'tableta',    10,    20,   'dosis/día dividida c/8-12h'),
(NULL, 'Ácido valproico',               '250 mg',        'cápsula',    15,    60,   'dosis/día dividida c/8-12h'),
(NULL, 'Ácido valproico jarabe',        '250 mg/5 ml',   'jarabe',     15,    60,   'dosis/día dividida c/8-12h'),
(NULL, 'Levetiracetam',                 '500 mg',        'tableta',    10,    60,   'dosis/día dividida c/12h'),
(NULL, 'Fenitoína',                     '100 mg',        'cápsula',    NULL,  NULL, 'monitorear niveles séricos'),
(NULL, 'Topiramato',                    '25 mg',         'tableta',    1,     9,    'dosis/día dividida c/12h'),
(NULL, 'Gabapentina',                   '300 mg',        'cápsula',    NULL,  NULL, NULL),
(NULL, 'Pregabalina',                   '75 mg',         'cápsula',    NULL,  NULL, NULL),
(NULL, 'Sumatriptán',                   '50 mg',         'tableta',    NULL,  NULL, 'para migraña; máx 2 dosis/día'),
(NULL, 'Haloperidol',                   '5 mg',          'tableta',    NULL,  NULL, NULL),
(NULL, 'Risperidona',                   '2 mg',          'tableta',    NULL,  NULL, NULL),
(NULL, 'Quetiapina',                    '25 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Zolpidem',                      '10 mg',         'tableta',    NULL,  NULL, 'no usar en < 18 años'),
(NULL, 'Melatonina',                    '5 mg',          'tableta',    0.05,  0.15, '30 min antes de dormir'),

-- ══════════════════════════════════════════════
-- CORTICOSTEROIDES
-- ══════════════════════════════════════════════
(NULL, 'Prednisona',                    '5 mg',          'tableta',    1,     2,    'dosis/día con desayuno'),
(NULL, 'Prednisona',                    '50 mg',         'tableta',    1,     2,    'dosis/día con desayuno'),
(NULL, 'Prednisolona jarabe',           '15 mg/5 ml',    'jarabe',     1,     2,    'dosis/día con desayuno'),
(NULL, 'Dexametasona',                  '0.5 mg',        'tableta',    0.15,  0.6,  'según indicación; potencia alta'),
(NULL, 'Dexametasona',                  '4 mg/ml',       'inyectable', 0.15,  0.6,  'IM o IV'),
(NULL, 'Metilprednisolona',             '16 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Hidrocortisona',                '100 mg',        'inyectable', NULL,  NULL, 'crisis suprarrenal'),
(NULL, 'Budesonida nebulizar',          '0.5 mg/ml',     'solución',   0.5,   1,    'nebulizar c/12h; total mg/día'),
(NULL, 'Betametasona',                  '0.05%',         'crema',      NULL,  NULL, 'aplicar capa delgada 1-2 veces/día'),
(NULL, 'Hidrocortisona crema',          '1%',            'crema',      NULL,  NULL, 'aplicar 2-3 veces/día'),

-- ══════════════════════════════════════════════
-- DERMATOLOGÍA
-- ══════════════════════════════════════════════
(NULL, 'Mupirocina crema',              '2%',            'crema',      NULL,  NULL, 'aplicar 3 veces/día × 5-10 días'),
(NULL, 'Permetrina crema',              '5%',            'crema',      NULL,  NULL, 'aplicar 8-14h; enjuagar; 1 aplicación'),
(NULL, 'Tretinoína crema',              '0.025%',        'crema',      NULL,  NULL, 'aplicar en noche; evitar sol'),
(NULL, 'Isotretinoína',                 '10 mg',         'cápsula',    NULL,  NULL, 'teratogénico; requiere seguimiento'),
(NULL, 'Eritromicina gel',              '2%',            'gel',        NULL,  NULL, 'aplicar 2 veces/día en acné'),
(NULL, 'Ciclopirox crema',              '1%',            'crema',      NULL,  NULL, 'aplicar 2 veces/día'),
(NULL, 'Tacrolimus ungüento',           '0.1%',          'crema',      NULL,  NULL, 'para dermatitis atópica'),
(NULL, 'Lidocaína gel',                 '2%',            'gel',        NULL,  NULL, 'anestésico tópico'),

-- ══════════════════════════════════════════════
-- VITAMINAS / SUPLEMENTOS
-- ══════════════════════════════════════════════
(NULL, 'Vitamina C',                    '500 mg',        'tableta',    10,    15,   '1-2 veces/día'),
(NULL, 'Vitamina D3',                   '1000 UI',       'tableta',    NULL,  NULL, NULL),
(NULL, 'Vitamina D3',                   '2000 UI',       'tableta',    NULL,  NULL, NULL),
(NULL, 'Vitamina D3',                   '5000 UI',       'tableta',    NULL,  NULL, 'déficit severo'),
(NULL, 'Vitamina B12',                  '1000 mcg',      'tableta',    NULL,  NULL, NULL),
(NULL, 'Complejo B',                    '---',           'tableta',    NULL,  NULL, NULL),
(NULL, 'Hierro',                        '300 mg',        'tableta',    3,     6,    'mg/kg/día de hierro elemental'),
(NULL, 'Sulfato ferroso',               '300 mg',        'tableta',    3,     6,    'mg/kg/día de hierro elemental'),
(NULL, 'Sulfato ferroso jarabe',        '25 mg/ml',      'jarabe',     3,     6,    'mg/kg/día de hierro elemental'),
(NULL, 'Ácido fólico',                  '5 mg',          'tableta',    NULL,  NULL, NULL),
(NULL, 'Calcio + Vitamina D',           '600 mg/400 UI', 'tableta',    NULL,  NULL, 'tomar con alimentos'),
(NULL, 'Zinc',                          '20 mg',         'tableta',    1,     1,    'mg/kg/día; no más de 20 mg/día'),
(NULL, 'Magnesio',                      '300 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Omega 3',                       '1000 mg',       'cápsula',    NULL,  NULL, NULL),
(NULL, 'Hierro + Ácido fólico',         '200/0.35 mg',   'tableta',    NULL,  NULL, 'embarazo'),
(NULL, 'Vitamina A',                    '5000 UI',       'cápsula',    NULL,  NULL, NULL),

-- ══════════════════════════════════════════════
-- OFTALMOLOGÍA
-- ══════════════════════════════════════════════
(NULL, 'Cloranfenicol gotas',           '0.5%',          'gotas',      NULL,  NULL, '1-2 gotas c/4-6h'),
(NULL, 'Tobramicina gotas',             '0.3%',          'gotas',      NULL,  NULL, '1-2 gotas c/4h'),
(NULL, 'Ciprofloxacino gotas',          '0.3%',          'gotas',      NULL,  NULL, '1-2 gotas c/2-6h'),
(NULL, 'Lágrimas artificiales',         '---',           'gotas',      NULL,  NULL, 'según necesidad'),
(NULL, 'Atropina gotas',                '1%',            'gotas',      NULL,  NULL, 'midriático/ciclopléjico'),
(NULL, 'Prednisolona gotas',            '1%',            'gotas',      NULL,  NULL, '1-2 gotas c/4-6h'),
(NULL, 'Timolol gotas',                 '0.5%',          'gotas',      NULL,  NULL, 'glaucoma: 1 gota c/12h'),
(NULL, 'Dorzolamida gotas',             '2%',            'gotas',      NULL,  NULL, 'glaucoma: 1 gota c/8h'),

-- ══════════════════════════════════════════════
-- OTROS FRECUENTES
-- ══════════════════════════════════════════════
(NULL, 'Escopolamina',                  '10 mg',         'tableta',    NULL,  NULL, 'espasmolítico'),
(NULL, 'Hioscina',                      '10 mg',         'tableta',    0.3,   0.6,  'c/6-8h'),
(NULL, 'Dimenhidrinato',                '50 mg',         'tableta',    1,     1.5,  'c/6h; produce somnolencia'),
(NULL, 'Betahistina',                   '16 mg',         'tableta',    NULL,  NULL, 'vértigo: c/8h con comidas'),
(NULL, 'Colchicina',                    '0.5 mg',        'tableta',    NULL,  NULL, 'gota aguda'),
(NULL, 'Alopurinol',                    '100 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Alopurinol',                    '300 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Piridoxina',                    '25 mg',         'tableta',    NULL,  NULL, NULL),
(NULL, 'Ácido tranexámico',             '500 mg',        'tableta',    NULL,  NULL, NULL),
(NULL, 'Misoprostol',                   '200 mcg',       'tableta',    NULL,  NULL, 'protector gástrico con AINEs'),
(NULL, 'Tamsulosina',                   '0.4 mg',        'cápsula',    NULL,  NULL, 'HBP; tomar tras desayuno'),
(NULL, 'Finasteride',                   '5 mg',          'tableta',    NULL,  NULL, NULL),
(NULL, 'Indometacina',                  '25 mg',         'cápsula',    NULL,  NULL, NULL),
(NULL, 'Propranolol',                   '40 mg',         'tableta',    0.5,   1,    'dosis/día dividida c/8h'),
(NULL, 'Nifedipino',                    '30 mg',         'tableta',    NULL,  NULL, 'liberación prolongada'),
(NULL, 'Nistatina suspensión',          '100,000 UI/ml', 'suspensión', NULL,  NULL, '1 ml c/6h en boca'),
(NULL, 'Nistatina óvulos',              '100,000 UI',    'otro',       NULL,  NULL, '1 óvulo vaginal c/noche × 14 días'),
(NULL, 'Sales de rehidratación oral',   '---',           'otro',       NULL,  NULL, '50-100 ml/kg en 4h para deshidratación leve'),
(NULL, 'Probiótico (Lactobacillus)',    '---',           'cápsula',    NULL,  NULL, '1 cápsula c/12-24h'),
(NULL, 'Pirantel',                      '250 mg/5 ml',   'suspensión', 11,    11,   'dosis única; mg/kg'),
(NULL, 'Mebendazol',                    '100 mg',        'tableta',    NULL,  NULL, '1 tableta c/12h × 3 días')

ON CONFLICT DO NOTHING;
