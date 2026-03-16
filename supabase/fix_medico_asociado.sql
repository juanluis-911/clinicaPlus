-- ============================================================
-- MediFlow: Corrección para médicos asociados
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Corregir trigger: capturar medico_empleador_id también para médicos
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_rol TEXT;
  v_nombre TEXT;
  v_medico_id UUID;
BEGIN
  v_rol := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'rol'), ''), 'asistente');

  IF v_rol NOT IN ('medico', 'asistente') THEN
    v_rol := 'asistente';
  END IF;

  v_nombre := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'nombre_completo'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- medico_empleador_id aplica tanto para asistentes como para médicos asociados
  BEGIN
    v_medico_id := NULLIF(TRIM(NEW.raw_user_meta_data->>'medico_empleador_id'), '')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_medico_id := NULL;
  END;

  INSERT INTO public.perfiles (id, nombre_completo, rol, medico_empleador_id)
  VALUES (NEW.id, v_nombre, v_rol, v_medico_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-crear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- 2. Actualizar RLS de configuracion_clinica para incluir médicos asociados
--    (actualmente solo cubre asistentes, no médicos con medico_empleador_id)

DROP POLICY IF EXISTS "config_select_asistente" ON configuracion_clinica;

-- Nueva política unificada: asistentes Y médicos asociados leen la config del dueño
CREATE POLICY "config_select_equipo" ON configuracion_clinica FOR SELECT
  USING (
    id = (
      SELECT medico_empleador_id FROM perfiles WHERE id = auth.uid()
    )
  );


-- ============================================================
-- 3. CORRECCIÓN MANUAL para el médico asociado ya registrado
--
-- Reemplaza:
--   <UUID_DEL_DENTISTA>  con el ID del médico que se registró mal
--   <UUID_DE_TU_CLINICA> con tu ID de médico dueño
--
-- UPDATE perfiles
--   SET medico_empleador_id = '<UUID_DE_TU_CLINICA>'
--   WHERE id = '<UUID_DEL_DENTISTA>'
--     AND medico_empleador_id IS NULL;
-- ============================================================
