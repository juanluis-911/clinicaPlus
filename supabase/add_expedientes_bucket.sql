-- ============================================================
-- MediFlow — Bucket para compartir expedientes temporalmente
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Crear el bucket (privado, con limit de 10 MB por archivo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'expedientes-temp',
  'expedientes-temp',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: el usuario solo puede subir a su propia carpeta (/{user_id}/...)
CREATE POLICY "exp_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'expedientes-temp'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: el usuario solo puede leer/firmar sus propios archivos
CREATE POLICY "exp_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'expedientes-temp'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: el usuario puede eliminar sus propios archivos
CREATE POLICY "exp_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'expedientes-temp'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- RLS: el usuario puede actualizar sus propios archivos (upsert)
CREATE POLICY "exp_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'expedientes-temp'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
