-- Ejecuta esto en Supabase SQL Editor para corregir la recursión infinita en perfiles RLS

-- 1. Función SECURITY DEFINER para obtener medico_empleador_id sin disparar RLS
CREATE OR REPLACE FUNCTION get_my_medico_empleador_id()
RETURNS UUID AS $$
  SELECT medico_empleador_id FROM public.perfiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Reemplazar la política problemática
DROP POLICY IF EXISTS "perfiles_select" ON perfiles;

CREATE POLICY "perfiles_select" ON perfiles FOR SELECT
  USING (
    id = auth.uid()
    OR id = get_my_medico_empleador_id()
  );
