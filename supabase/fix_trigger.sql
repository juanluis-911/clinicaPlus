-- Ejecuta este SQL en Supabase SQL Editor si tienes problemas al registrarte
-- Reemplaza el trigger con una versión más resiliente

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_rol TEXT;
  v_nombre TEXT;
  v_medico_id UUID;
BEGIN
  -- Extraer valores con defaults seguros
  v_rol := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'rol'), ''), 'asistente');

  -- Validar que el rol sea válido
  IF v_rol NOT IN ('medico', 'asistente') THEN
    v_rol := 'asistente';
  END IF;

  v_nombre := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'nombre_completo'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- medico_empleador_id solo para asistentes
  IF v_rol = 'asistente' THEN
    BEGIN
      v_medico_id := NULLIF(TRIM(NEW.raw_user_meta_data->>'medico_empleador_id'), '')::UUID;
    EXCEPTION WHEN invalid_text_representation THEN
      v_medico_id := NULL;
    END;
  ELSE
    v_medico_id := NULL;
  END IF;

  INSERT INTO public.perfiles (id, nombre_completo, rol, medico_empleador_id)
  VALUES (NEW.id, v_nombre, v_rol, v_medico_id)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- No bloquear el registro si falla la creación del perfil
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Re-crear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
