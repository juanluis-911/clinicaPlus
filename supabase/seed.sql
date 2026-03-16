-- ============================================================
-- MediFlow — Seed de datos realistas para desarrollo
-- Médico ID: b6b38207-01c3-4408-96ff-64b4c69b5316
-- Ejecutar en Supabase SQL Editor (corre como postgres, bypasea RLS)
-- ============================================================

DO $$
DECLARE
  med_id UUID := 'b6b38207-01c3-4408-96ff-64b4c69b5316';

  -- Pacientes
  p1  UUID; p2  UUID; p3  UUID; p4  UUID; p5  UUID; p6  UUID;
  p7  UUID; p8  UUID; p9  UUID; p10 UUID; p11 UUID; p12 UUID;

  -- Citas (pasadas completadas)
  c1  UUID; c2  UUID; c3  UUID; c4  UUID; c5  UUID;
  c6  UUID; c7  UUID; c8  UUID;
  -- Citas de hoy
  c_hoy1 UUID; c_hoy2 UUID; c_hoy3 UUID; c_hoy4 UUID;
  -- Citas futuras
  cf1 UUID; cf2 UUID; cf3 UUID; cf4 UUID; cf5 UUID;
  cf6 UUID; cf7 UUID; cf8 UUID; cf9 UUID; cf10 UUID;

  -- Consultas
  con1 UUID; con2 UUID; con3 UUID; con4 UUID; con5 UUID;
  con6 UUID; con7 UUID; con8 UUID;

BEGIN

-- ============================================================
-- PACIENTES
-- ============================================================
INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'María Elena', 'Ramírez Gutiérrez', '1962-04-15', '55 1234 5678',
   'maria.ramirez@gmail.com', 'Av. Insurgentes Sur 423, Col. Del Valle, CDMX',
   'Penicilina (rash cutáneo)', 'Diabetes mellitus tipo 2, Hipertensión arterial',
   'Metformina 850mg c/12h, Losartán 50mg c/24h, Atorvastatina 20mg c/24h',
   'Paciente con buen apego al tratamiento. Control glucémico aceptable. Acude cada 3 meses.',
   med_id, med_id)
RETURNING id INTO p1;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Carlos Alberto', 'Mendoza Fuentes', '1978-09-03', '55 9876 5432',
   'carlos.mendoza@hotmail.com', 'Calle Morelos 78, Col. Centro, Tlalnepantla',
   'AINEs (broncoespasmo)', 'Asma bronquial moderada persistente, ERGE',
   'Salbutamol inhalador 100mcg/dosis (rescate), Fluticasona/Salmeterol 250/25mcg c/12h, Omeprazol 20mg c/24h',
   'Asma bien controlada desde hace 1 año. Evitar AINEs y aspirina. Niega tabaquismo.',
   med_id, med_id)
RETURNING id INTO p2;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Ana Sofía', 'Torres Vidal', '1990-12-20', '55 5555 0101',
   'ana.torres@outlook.com', 'Priv. Las Flores 12, Naucalpan',
   NULL, 'Hipotiroidismo primario',
   'Levotiroxina 75mcg c/24h en ayunas',
   'TSH en meta. Recordar tomar 30 min antes del desayuno y separada de calcio/hierro.',
   med_id, med_id)
RETURNING id INTO p3;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Roberto', 'Jiménez Arroyo', '1955-06-28', '55 3344 5566',
   'rjimenez@empresa.mx', 'Blvd. Adolfo López Mateos 1200, Cuautitlán Izcalli',
   'Látex', 'Hipertensión arterial, Dislipidemia, Cardiopatía isquémica (IAM 2019)',
   'Ácido acetilsalicílico 100mg c/24h, Carvedilol 12.5mg c/12h, Enalapril 10mg c/12h, Atorvastatina 40mg c/24h',
   'Post-IAM. Fracción de eyección 45%. Seguimiento cardiología. No levantar objetos >10kg.',
   med_id, med_id)
RETURNING id INTO p4;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Gabriela', 'López Serrano', '1985-03-11', '55 6677 8899',
   'gabi.lopez@gmail.com', 'Calle Pino 34, Col. Jardines, Ecatepec',
   'Sulfas', NULL, NULL,
   'Paciente sana. Acude por medicina preventiva anual.',
   med_id, med_id)
RETURNING id INTO p5;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Miguel Ángel', 'Hernández Cruz', '1971-08-16', '55 2233 4455',
   'miguel.hernandez@yahoo.com', 'Calz. de Tlalpan 3400, CDMX',
   NULL, 'Diabetes mellitus tipo 2, Nefropatía diabética estadio 3',
   'Insulina glargina 20UI c/24h (noche), Metformina 500mg c/12h, Lisinopril 20mg c/24h',
   'Evitar metformina si TFG <30. Última creatinina: 1.8. Referido a nefrología.',
   med_id, med_id)
RETURNING id INTO p6;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Patricia', 'Sánchez Morales', '1967-01-30', '55 7788 9900',
   'paty.sanchez@gmail.com', 'Av. Universidad 1500, Col. Copilco, CDMX',
   'Penicilina, Cefalosporinas (reacción cruzada confirmada)', 'Artritis reumatoide, Osteoporosis',
   'Metotrexate 15mg c/semana, Ácido fólico 5mg c/semana (día diferente), Calcio 1200mg + Vit D3 1000UI c/24h',
   'En control reumatología. Biometría y química sanguínea cada 3 meses por metotrexate.',
   med_id, med_id)
RETURNING id INTO p7;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Fernando', 'Castillo Ríos', '1995-05-22', '55 4455 6677',
   'fer.castillo@gmail.com', 'Calle Cedro 89, Col. Santa María la Rivera, CDMX',
   NULL, NULL, NULL,
   'Deportista. Acude por revisión y certificado médico deportivo.',
   med_id, med_id)
RETURNING id INTO p8;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Lucía', 'Vargas Espinoza', '1948-11-07', '55 9900 1122',
   NULL, 'Calle Magnolia 5, Iztapalapa, CDMX',
   'Codeína (náuseas intensas)', 'Hipertensión arterial, Hipotiroidismo, Depresión',
   'Amlodipino 5mg c/24h, Levotiroxina 100mcg c/24h, Sertralina 50mg c/24h',
   'Paciente mayor, vive sola. Verificar apego. Familiar acompaña ocasionalmente.',
   med_id, med_id)
RETURNING id INTO p9;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Diego Alejandro', 'Romero Peña', '2001-07-14', '55 1122 3344',
   'diego.romero@gmail.com', 'Av. Politécnico Nacional 2508, Gustavo A. Madero',
   'Amoxicilina (urticaria)', NULL, NULL,
   'Estudiante universitario. Primer consulta. Acude por cefalea recurrente.',
   med_id, med_id)
RETURNING id INTO p10;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Verónica', 'Aguilar Domínguez', '1980-02-19', '55 3344 5566',
   'vero.aguilar@hotmail.com', 'Calz. Ignacio Zaragoza 900, Venustiano Carranza',
   NULL, 'EPOC moderado, Tabaquismo activo (30 paquetes/año)',
   'Tiotropio 18mcg inhalado c/24h, Salbutamol (rescate)',
   'Consejería tabaquismo en cada cita. Vacuna antineumocóccica aplicada 2023. SpO2 basal 94%.',
   med_id, med_id)
RETURNING id INTO p11;

INSERT INTO pacientes (id, nombre, apellido, fecha_nacimiento, telefono, email, direccion,
  alergias, condiciones_cronicas, medicacion_actual, notas, medico_id, created_by)
VALUES
  (uuid_generate_v4(), 'Javier', 'Núñez Ortega', '1988-10-05', '55 8899 0011',
   'javier.nunez@gmail.com', 'Calle Hidalgo 234, Tlalpan, CDMX',
   NULL, 'Migraña sin aura', 'Topiramato 50mg c/12h (profilaxis), Sumatriptán 50mg c/rescate',
   'Frecuencia actual: 2-3 episodios/mes. Identificar desencadenantes (estrés, privación de sueño).',
   med_id, med_id)
RETURNING id INTO p12;

-- ============================================================
-- CITAS PASADAS — COMPLETADAS
-- ============================================================
INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p1, med_id, NOW() - INTERVAL '85 days' + TIME '09:00', 30, 'consulta', 'completada',
  'Control trimestral DM2 + HTA', med_id) RETURNING id INTO c1;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p4, med_id, NOW() - INTERVAL '70 days' + TIME '10:30', 45, 'seguimiento', 'completada',
  'Seguimiento post-IAM a 5 años', med_id) RETURNING id INTO c2;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p2, med_id, NOW() - INTERVAL '55 days' + TIME '11:00', 30, 'consulta', 'completada',
  'Control asma + ERGE', med_id) RETURNING id INTO c3;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p6, med_id, NOW() - INTERVAL '40 days' + TIME '09:30', 45, 'consulta', 'completada',
  'Control DM2 + revisión función renal', med_id) RETURNING id INTO c4;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p10, med_id, NOW() - INTERVAL '30 days' + TIME '12:00', 30, 'consulta', 'completada',
  'Primera consulta — cefalea recurrente', med_id) RETURNING id INTO c5;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p7, med_id, NOW() - INTERVAL '20 days' + TIME '10:00', 30, 'seguimiento', 'completada',
  'Control AR + revisión labs metotrexate', med_id) RETURNING id INTO c6;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p11, med_id, NOW() - INTERVAL '10 days' + TIME '08:30', 30, 'consulta', 'completada',
  'EPOC control + consejería tabaquismo', med_id) RETURNING id INTO c7;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p3, med_id, NOW() - INTERVAL '5 days' + TIME '09:00', 30, 'seguimiento', 'completada',
  'Control hipotiroidismo — resultado TSH pendiente', med_id) RETURNING id INTO c8;

-- CITAS PASADAS — CANCELADAS
INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES
  (uuid_generate_v4(), p5, med_id, NOW() - INTERVAL '45 days' + TIME '11:30', 30, 'consulta', 'cancelada',
   'Canceló por trabajo', med_id),
  (uuid_generate_v4(), p9, med_id, NOW() - INTERVAL '25 days' + TIME '10:00', 30, 'seguimiento', 'cancelada',
   'Canceló — enfermedad', med_id),
  (uuid_generate_v4(), p12, med_id, NOW() - INTERVAL '12 days' + TIME '09:30', 30, 'consulta', 'cancelada',
   'No se presentó', med_id);

-- ============================================================
-- CITAS DE HOY
-- ============================================================
INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p1, med_id, CURRENT_DATE + TIME '09:00', 30, 'seguimiento', 'confirmada',
  'Control trimestral DM2', med_id) RETURNING id INTO c_hoy1;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p8, med_id, CURRENT_DATE + TIME '10:30', 30, 'consulta', 'confirmada',
  'Certificado médico deportivo', med_id) RETURNING id INTO c_hoy2;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p6, med_id, CURRENT_DATE + TIME '12:00', 45, 'seguimiento', 'programada',
  'Seguimiento nefropatía + ajuste insulina', med_id) RETURNING id INTO c_hoy3;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p9, med_id, CURRENT_DATE + TIME '16:00', 30, 'consulta', 'programada',
  'Reagendada — seguimiento HTA + hipotiroidismo', med_id) RETURNING id INTO c_hoy4;

-- ============================================================
-- CITAS FUTURAS
-- ============================================================
INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p4, med_id, NOW() + INTERVAL '3 days' + TIME '09:00', 45, 'seguimiento', 'confirmada',
  'Control cardiopatía — ECG y BH', med_id) RETURNING id INTO cf1;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p2, med_id, NOW() + INTERVAL '5 days' + TIME '11:00', 30, 'seguimiento', 'programada',
  'Control asma — spirometría programada', med_id) RETURNING id INTO cf2;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p12, med_id, NOW() + INTERVAL '7 days' + TIME '10:00', 30, 'consulta', 'confirmada',
  'Seguimiento migraña + ajuste topiramato', med_id) RETURNING id INTO cf3;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p5, med_id, NOW() + INTERVAL '8 days' + TIME '09:30', 30, 'consulta', 'programada',
  'Medicina preventiva anual reagendada', med_id) RETURNING id INTO cf4;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p3, med_id, NOW() + INTERVAL '10 days' + TIME '08:30', 30, 'seguimiento', 'confirmada',
  'Resultado TSH + ajuste levotiroxina', med_id) RETURNING id INTO cf5;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p7, med_id, NOW() + INTERVAL '14 days' + TIME '10:30', 30, 'seguimiento', 'programada',
  'Control AR + biometría hemática', med_id) RETURNING id INTO cf6;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p11, med_id, NOW() + INTERVAL '17 days' + TIME '09:00', 30, 'consulta', 'programada',
  'Control EPOC + gasometría', med_id) RETURNING id INTO cf7;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p10, med_id, NOW() + INTERVAL '21 days' + TIME '11:30', 30, 'seguimiento', 'confirmada',
  'Seguimiento cefalea — respuesta a tratamiento', med_id) RETURNING id INTO cf8;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p1, med_id, NOW() + INTERVAL '25 days' + TIME '09:00', 30, 'seguimiento', 'programada',
  'Control glucémico — HbA1c', med_id) RETURNING id INTO cf9;

INSERT INTO citas (id, paciente_id, medico_id, fecha_hora, duracion_minutos, tipo, estado, notas, creado_por)
VALUES (uuid_generate_v4(), p6, med_id, NOW() + INTERVAL '28 days' + TIME '10:00', 45, 'seguimiento', 'programada',
  'Control renal — creatinina + EGO', med_id) RETURNING id INTO cf10;

-- ============================================================
-- CONSULTAS (ligadas a citas completadas)
-- ============================================================
INSERT INTO consultas (id, paciente_id, medico_id, cita_id, fecha, motivo_consulta, exploracion_fisica,
  diagnostico, plan_tratamiento, notas, creado_por)
VALUES (uuid_generate_v4(), p1, med_id, c1, (NOW() - INTERVAL '85 days')::DATE,
  'Control trimestral de diabetes mellitus tipo 2 e hipertensión arterial',
  'TA: 138/88 mmHg. FC: 74 lpm. Peso: 78 kg. IMC: 29.4. Glucemia capilar en ayunas: 142 mg/dL. Sin edemas. Pies sin lesiones.',
  'E11.9 Diabetes mellitus tipo 2 sin complicaciones. I10 Hipertensión esencial. Control subóptimo.',
  'Reforzar dieta hipocalórica e hipoglucídica. Mantener Metformina 850mg c/12h. Ajustar Losartán a 100mg c/24h. Solicitar HbA1c, perfil lipídico, EGO y creatinina. Cita control en 3 meses.',
  'Paciente refiere buena adherencia pero confiesa consumo de pan dulce frecuente.',
  med_id) RETURNING id INTO con1;

INSERT INTO consultas (id, paciente_id, medico_id, cita_id, fecha, motivo_consulta, exploracion_fisica,
  diagnostico, plan_tratamiento, notas, creado_por)
VALUES (uuid_generate_v4(), p4, med_id, c2, (NOW() - INTERVAL '70 days')::DATE,
  'Seguimiento anual cardiopatía isquémica post-infarto de miocardio (2019)',
  'TA: 125/78 mmHg. FC: 62 lpm. Peso: 82 kg. Auscultación cardiopulmonar sin soplos ni estertores. Sin ingurgitación yugular. Sin edemas de miembros inferiores.',
  'I25.2 Cardiopatía isquémica crónica con angina estable. Z95.5 Antecedente de IAM. Compensado.',
  'Continuar antiagregación y estatina a dosis altas. ECG: RS sin alteraciones agudas. Solicitar ecocardiograma y Holter 24h. Mantener esquema actual. Pautas de alarma y cuándo acudir a urgencias.',
  'Paciente refiere disnea a grandes esfuerzos. Niega dolor precordial.',
  med_id) RETURNING id INTO con2;

INSERT INTO consultas (id, paciente_id, medico_id, cita_id, fecha, motivo_consulta, exploracion_fisica,
  diagnostico, plan_tratamiento, notas, creado_por)
VALUES (uuid_generate_v4(), p2, med_id, c3, (NOW() - INTERVAL '55 days')::DATE,
  'Control asma bronquial — evaluación respuesta a tratamiento de mantenimiento',
  'FR: 16 rpm. SpO2: 98% (AA). Sibilancias leves bilaterales espiratorias. Tórax sin tiraje. PEF: 430 L/min (88% del teórico).',
  'J45.1 Asma predominantemente alérgica. K21.0 ERGE con esofagitis. Asma bien controlada.',
  'Mantener Fluticasona/Salmeterol 250/25mcg c/12h. Continuar Salbutamol en rescate. Omeprazol 20mg c/24h continuar. Vacuna anti-influenza anual. Control en 4 meses o antes si exacerbación.',
  'Interrogatorio: 0 despertares nocturnos el último mes. Actividad física sin limitación.',
  med_id) RETURNING id INTO con3;

INSERT INTO consultas (id, paciente_id, medico_id, cita_id, fecha, motivo_consulta, exploracion_fisica,
  diagnostico, plan_tratamiento, notas, creado_por)
VALUES (uuid_generate_v4(), p6, med_id, c4, (NOW() - INTERVAL '40 days')::DATE,
  'Control DM2 — revisión de función renal y ajuste de tratamiento',
  'TA: 145/92 mmHg. Peso: 91 kg. IMC: 31.2. Glucemia capilar: 187 mg/dL. Creatinina reciente: 1.8 mg/dL. TFG estimada: 42 mL/min/1.73m². Sin edemas aparentes.',
  'E11.65 DM2 con complicaciones renales. N18.3 Enfermedad renal crónica estadio 3a. Control subóptimo.',
  'Reducir Metformina a 500mg c/24h (TFG >30). Ajustar insulina glargina a 22UI. Referencia a nefrología. Restricción proteica 0.8g/kg/día. Medir TA diariamente. Meta TA <130/80. Próxima cita en 4 semanas.',
  'Se discutió importancia del control glucémico para retrasar progresión renal.',
  med_id) RETURNING id INTO con4;

INSERT INTO consultas (id, paciente_id, medico_id, cita_id, fecha, motivo_consulta, exploracion_fisica,
  diagnostico, plan_tratamiento, notas, creado_por)
VALUES (uuid_generate_v4(), p10, med_id, c5, (NOW() - INTERVAL '30 days')::DATE,
  'Cefalea recurrente de 6 meses de evolución, pulsátil, hemicránea, con fotofobia y náuseas',
  'Neurológico: pupilas isocóricas normoreactivas. Pares craneales íntegros. Sin déficit motor ni sensitivo. Fondo de ojo: sin papiledema. Signos meníngeos negativos.',
  'G43.9 Migraña sin aura. Primera consulta por esta condición.',
  'Iniciar Ibuprofeno 400mg como tratamiento de crisis (máx. 3 días/semana). Considerar profilaxis si >4 episodios/mes. Diario de cefalea. Evitar desencadenantes (alcohol, privación de sueño, estrés). Cita de seguimiento en 4 semanas. Solicitar biometría y QS básica para descartar causa secundaria.',
  'Paciente con importante carga académica. Duerme 5-6h diarias.',
  med_id) RETURNING id INTO con5;

INSERT INTO consultas (id, paciente_id, medico_id, cita_id, fecha, motivo_consulta, exploracion_fisica,
  diagnostico, plan_tratamiento, notas, creado_por)
VALUES (uuid_generate_v4(), p7, med_id, c6, (NOW() - INTERVAL '20 days')::DATE,
  'Control artritis reumatoide — revisión de laboratorios bajo metotrexate',
  'Articulaciones MCF 2,3 mano izquierda con inflamación leve. Grip strength disminuido. Sin nódulos. DAS28 calculado: 2.8 (remisión baja actividad).',
  'M05.79 Artritis reumatoide seropositiva, baja actividad (DAS28 2.8). Buena respuesta a metotrexate.',
  'Biometría hemática: dentro de límites normales. Transaminasas normales. Continuar Metotrexate 15mg/semana + Ácido fólico. Fisioterapia de mantenimiento. Próxima cita 3 meses. Laboratorios c/3 meses.',
  'Factor reumatoide +. Anti-CCP +++. En vigilancia por reumatología cada 6 meses.',
  med_id) RETURNING id INTO con6;

INSERT INTO consultas (id, paciente_id, medico_id, cita_id, fecha, motivo_consulta, exploracion_fisica,
  diagnostico, plan_tratamiento, notas, creado_por)
VALUES (uuid_generate_v4(), p11, med_id, c7, (NOW() - INTERVAL '10 days')::DATE,
  'Control EPOC — disnea de esfuerzo con tendencia al empeoramiento desde hace 2 meses',
  'FR: 20 rpm. SpO2: 93% (AA). Murmullo vesicular disminuido bilateral, espiración prolongada. Sin uso de músculos accesorios en reposo. Tórax en tonel.',
  'J44.1 EPOC con exacerbación aguda. Fenotipo agudizador. Tabaquismo activo.',
  'Azitromicina 500mg c/24h x 5 días. Prednisona 40mg c/24h x 5 días. Reforzar técnica inhalatoria. Consejería tabaquismo: derivar a programa de cesación. Solicitar gasometría arterial y spirometría de control. Próxima cita 1 mes.',
  'Segunda exacerbación en 6 meses. SpO2 en esfuerzo baja a 88%. Discutir LTOT si no mejora.',
  med_id) RETURNING id INTO con7;

INSERT INTO consultas (id, paciente_id, medico_id, cita_id, fecha, motivo_consulta, exploracion_fisica,
  diagnostico, plan_tratamiento, notas, creado_por)
VALUES (uuid_generate_v4(), p3, med_id, c8, (NOW() - INTERVAL '5 days')::DATE,
  'Control hipotiroidismo — resultado de TSH y T4 libre',
  'FC: 70 lpm. Sin bocio palpable. Reflejos osteotendinosos normales. Sin mixedema. Piel normohidratada.',
  'E03.9 Hipotiroidismo no especificado, en meta terapéutica. TSH: 2.1 mUI/L (rango 0.5-4.5).',
  'Mantener Levotiroxina 75mcg. Confirmar horario de toma. Próximo TSH en 6 meses. No modificar dosis.',
  'Paciente refiere buena tolerancia al medicamento. Toma en ayunas correctamente.',
  med_id) RETURNING id INTO con8;

-- ============================================================
-- PRESCRIPCIONES
-- ============================================================

-- Rx1: Para p1 (DM2 + HTA) — ajuste en consulta c1
INSERT INTO prescripciones (paciente_id, medico_id, consulta_id, fecha, medicamentos, instrucciones, vigencia_dias)
VALUES (p1, med_id, con1, (NOW() - INTERVAL '85 days')::DATE,
  '[
    {"nombre":"Metformina","concentracion":"850 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 12 horas","duracion":"90 días","indicaciones":"Tomar con los alimentos para reducir efectos gastrointestinales"},
    {"nombre":"Losartán","concentracion":"100 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 24 horas","duracion":"90 días","indicaciones":"Tomar en la mañana. Vigilar presión arterial diariamente"},
    {"nombre":"Atorvastatina","concentracion":"20 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 24 horas","duracion":"90 días","indicaciones":"Tomar en la noche"}
  ]'::jsonb,
  'Dieta baja en carbohidratos y sal. Ejercicio aeróbico 30 min/día mínimo 5 días/semana. Medir glucemia en ayunas cada 3 días y anotar. Acudir a urgencias si glucemia >300 mg/dL.',
  90);

-- Rx2: Para p4 (cardiopatía) — sin cambios, receta de rutina
INSERT INTO prescripciones (paciente_id, medico_id, consulta_id, fecha, medicamentos, instrucciones, vigencia_dias)
VALUES (p4, med_id, con2, (NOW() - INTERVAL '70 days')::DATE,
  '[
    {"nombre":"Ácido acetilsalicílico","concentracion":"100 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 24 horas","duracion":"90 días","indicaciones":"Tomar con el desayuno. NO suspender sin indicación médica"},
    {"nombre":"Carvedilol","concentracion":"12.5 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 12 horas","duracion":"90 días","indicaciones":"No suspender abruptamente. Vigilar frecuencia cardíaca en reposo (meta <70 lpm)"},
    {"nombre":"Enalapril","concentracion":"10 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 12 horas","duracion":"90 días","indicaciones":"Vigilar tos seca como efecto adverso"},
    {"nombre":"Atorvastatina","concentracion":"40 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 24 horas","duracion":"90 días","indicaciones":"Tomar en la noche. Reportar dolor muscular intenso"}
  ]'::jsonb,
  'Dieta cardioprotectora: baja en grasas saturadas, sin sal añadida. Actividad física leve-moderada según tolerancia. Pautas de alarma: dolor precordial, disnea de reposo, palpitaciones → urgencias.',
  90);

-- Rx3: Para p2 (asma + ERGE)
INSERT INTO prescripciones (paciente_id, medico_id, consulta_id, fecha, medicamentos, instrucciones, vigencia_dias)
VALUES (p2, med_id, con3, (NOW() - INTERVAL '55 days')::DATE,
  '[
    {"nombre":"Fluticasona/Salmeterol","concentracion":"250/25 mcg","forma":"inhalador","dosis":"1 inhalación","frecuencia":"cada 12 horas","duracion":"120 días","indicaciones":"Enjuagar la boca después de cada uso para evitar candidiasis oral. Técnica de inhalación correcta"},
    {"nombre":"Salbutamol","concentracion":"100 mcg/dosis","forma":"inhalador","dosis":"2 inhalaciones","frecuencia":"según necesidad (rescate)","duracion":"A demanda","indicaciones":"Usar solo cuando haya síntomas. Si necesita >3 veces/semana, acudir a consulta"},
    {"nombre":"Omeprazol","concentracion":"20 mg","forma":"cápsula","dosis":"1 cápsula","frecuencia":"cada 24 horas","duracion":"90 días","indicaciones":"Tomar 30 minutos antes del desayuno"}
  ]'::jsonb,
  'Evitar desencadenantes del asma: polvo, humo de cigarro, mascotas, AINEs/aspirina. Elevar cabecera de la cama 15 cm para ERGE. No acostarse inmediatamente después de comer.',
  120);

-- Rx4: Para p6 (DM2 + nefropatía)
INSERT INTO prescripciones (paciente_id, medico_id, consulta_id, fecha, medicamentos, instrucciones, vigencia_dias)
VALUES (p6, med_id, con4, (NOW() - INTERVAL '40 days')::DATE,
  '[
    {"nombre":"Insulina glargina","concentracion":"100 UI/mL","forma":"solución inyectable","dosis":"22 unidades","frecuencia":"cada 24 horas","duracion":"30 días","indicaciones":"Aplicar subcutánea en abdomen, muslo o brazo, rotando sitios. Siempre a la misma hora (noche)"},
    {"nombre":"Metformina","concentracion":"500 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 24 horas","duracion":"30 días","indicaciones":"Tomar con la cena. Dosis reducida por función renal"},
    {"nombre":"Lisinopril","concentracion":"20 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 24 horas","duracion":"30 días","indicaciones":"Nefroprotector. Vigilar potasio sérico y creatinina"}
  ]'::jsonb,
  'Dieta hipoproteica (0.8 g/kg/día), baja en potasio y fósforo. Control estricto de glucemia (meta HbA1c <7.5%). Medir TA diariamente. Hidratación adecuada 1.5-2L/día. Acudir si glucemia <70 o >300 mg/dL.',
  30);

-- Rx5: Para p10 (migraña — primer episodio tratado)
INSERT INTO prescripciones (paciente_id, medico_id, consulta_id, fecha, medicamentos, instrucciones, vigencia_dias)
VALUES (p10, med_id, con5, (NOW() - INTERVAL '30 days')::DATE,
  '[
    {"nombre":"Ibuprofeno","concentracion":"400 mg","forma":"tableta","dosis":"1-2 tabletas","frecuencia":"según necesidad (inicio de crisis)","duracion":"A demanda","indicaciones":"Tomar al INICIO de la cefalea, NO esperar a que sea muy intensa. Máximo 3 días por semana para evitar cefalea de rebote"},
    {"nombre":"Metoclopramida","concentracion":"10 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"al inicio de crisis si hay náuseas","duracion":"A demanda","indicaciones":"Tomar 15-20 min antes del ibuprofeno para mejorar absorción y aliviar náuseas"}
  ]'::jsonb,
  'Llevar diario de cefaleas: fecha, duración, intensidad (0-10), desencadenantes, tratamiento usado y respuesta. Mejorar higiene de sueño: 7-8 horas, horario regular. Evitar ayuno prolongado y deshidratación.',
  60);

-- Rx6: Para p11 (EPOC exacerbación)
INSERT INTO prescripciones (paciente_id, medico_id, consulta_id, fecha, medicamentos, instrucciones, vigencia_dias)
VALUES (p11, med_id, con7, (NOW() - INTERVAL '10 days')::DATE,
  '[
    {"nombre":"Azitromicina","concentracion":"500 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 24 horas","duracion":"5 días","indicaciones":"Tomar 1 hora antes o 2 horas después de los alimentos"},
    {"nombre":"Prednisona","concentracion":"20 mg","forma":"tableta","dosis":"2 tabletas","frecuencia":"cada 24 horas","duracion":"5 días","indicaciones":"Tomar en la mañana con desayuno. NO suspender abruptamente. Vigilar glucemia si diabético"},
    {"nombre":"Tiotropio","concentracion":"18 mcg","forma":"inhalador en polvo (HandiHaler)","dosis":"1 cápsula","frecuencia":"cada 24 horas","duracion":"30 días","indicaciones":"NO tragar la cápsula — es para el inhalador. Misma hora cada día"},
    {"nombre":"Salbutamol","concentracion":"100 mcg/dosis","forma":"inhalador","dosis":"2 inhalaciones","frecuencia":"cada 4-6 horas según necesidad","duracion":"A demanda","indicaciones":"Rescate — aumentar frecuencia durante exacerbación"}
  ]'::jsonb,
  'URGENTE: Cesar tabaquismo completamente — se derivó a programa de cesación. Vacuna antineumocóccica y anti-influenza actualizadas. Acudir a urgencias si SpO2 <90%, disnea en reposo o cianosis.',
  30);

-- Rx7: Para p7 (artritis reumatoide — mantenimiento)
INSERT INTO prescripciones (paciente_id, medico_id, consulta_id, fecha, medicamentos, instrucciones, vigencia_dias)
VALUES (p7, med_id, con6, (NOW() - INTERVAL '20 days')::DATE,
  '[
    {"nombre":"Metotrexate","concentracion":"2.5 mg","forma":"tableta","dosis":"6 tabletas (15 mg total)","frecuencia":"una vez a la semana (lunes)","duracion":"90 días","indicaciones":"Tomar en la noche del día designado. NUNCA tomar dos días seguidos. Evitar alcohol"},
    {"nombre":"Ácido fólico","concentracion":"5 mg","forma":"tableta","dosis":"1 tableta","frecuencia":"una vez a la semana (jueves — día diferente al MTX)","duracion":"90 días","indicaciones":"Reduce toxicidad del metotrexate. NO tomar el mismo día que el metotrexate"},
    {"nombre":"Carbonato de calcio","concentracion":"500 mg","forma":"tableta","dosis":"2 tabletas","frecuencia":"cada 24 horas","duracion":"90 días","indicaciones":"Tomar con vitamina D. Si toma levotiroxina, separar 2 horas"},
    {"nombre":"Colecalciferol (Vitamina D3)","concentracion":"1000 UI","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 24 horas","duracion":"90 días","indicaciones":"Tomar con el calcio"}
  ]'::jsonb,
  'Laboratorios obligatorios cada 3 meses: BH, TGO, TGP, creatinina. Reportar INMEDIATAMENTE: fiebre, úlceras orales, dificultad respiratoria, orina oscura. Evitar embarazo (metotrexate es teratogénico).',
  90);

-- Rx8: Para p3 (hipotiroidismo — mantenimiento)
INSERT INTO prescripciones (paciente_id, medico_id, consulta_id, fecha, medicamentos, instrucciones, vigencia_dias)
VALUES (p3, med_id, con8, (NOW() - INTERVAL '5 days')::DATE,
  '[
    {"nombre":"Levotiroxina","concentracion":"75 mcg","forma":"tableta","dosis":"1 tableta","frecuencia":"cada 24 horas","duracion":"180 días","indicaciones":"Tomar EN AYUNAS, 30-60 min antes del desayuno, con agua. Separar al menos 2 horas de calcio, hierro, antiácidos y café"}
  ]'::jsonb,
  'No modificar dosis sin indicación médica. TSH control en 6 meses. Síntomas de sobredosis: palpitaciones, nerviosismo, insomnio, pérdida de peso → consultar. La dosis puede ajustarse con embarazo, cambio de peso significativo o nuevos medicamentos.',
  180);

-- ============================================================
-- RECORDATORIOS para citas futuras
-- ============================================================
INSERT INTO recordatorios (cita_id, tipo, estado)
SELECT id, 'email', 'pendiente'
FROM citas
WHERE medico_id = med_id
  AND fecha_hora > NOW()
  AND estado IN ('programada', 'confirmada');

-- Recordatorio para citas de hoy también
INSERT INTO recordatorios (cita_id, tipo, estado, enviado_en)
VALUES
  (c_hoy1, 'email', 'enviado', NOW() - INTERVAL '1 hour'),
  (c_hoy2, 'email', 'enviado', NOW() - INTERVAL '1 hour');

END $$;

-- Verificación rápida
SELECT 'pacientes' AS tabla, COUNT(*) AS total FROM pacientes WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316'
UNION ALL SELECT 'citas', COUNT(*) FROM citas WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316'
UNION ALL SELECT 'consultas', COUNT(*) FROM consultas WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316'
UNION ALL SELECT 'prescripciones', COUNT(*) FROM prescripciones WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316'
UNION ALL SELECT 'recordatorios', COUNT(*) FROM recordatorios
  WHERE cita_id IN (SELECT id FROM citas WHERE medico_id = 'b6b38207-01c3-4408-96ff-64b4c69b5316');
