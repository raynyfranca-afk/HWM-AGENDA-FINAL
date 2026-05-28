
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Restringe listagem do bucket (mantém leitura pública por URL)
DROP POLICY IF EXISTS "fotos_public_read" ON storage.objects;
CREATE POLICY "fotos_auth_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'os-fotos');
