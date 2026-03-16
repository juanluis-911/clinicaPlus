-- ============================================================
-- MediFlow — Bucket público para logos de clínica
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Crear bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos-clinica', 'logos-clinica', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (para PDFs y visualización)
CREATE POLICY "logos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'logos-clinica');

-- Solo médicos pueden subir
CREATE POLICY "logos_medico_upload" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'logos-clinica'
    AND auth.uid() IS NOT NULL
    AND (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'medico'
  );

-- Solo médicos pueden reemplazar (upsert)
CREATE POLICY "logos_medico_update" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'logos-clinica'
    AND auth.uid() IS NOT NULL
    AND (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'medico'
  );

-- Solo médicos pueden eliminar su logo
CREATE POLICY "logos_medico_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'logos-clinica'
    AND auth.uid() IS NOT NULL
    AND (SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'medico'
  );
