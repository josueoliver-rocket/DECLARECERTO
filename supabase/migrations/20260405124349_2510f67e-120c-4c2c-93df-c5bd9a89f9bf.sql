
-- 1. Fix profiles UPDATE policy: add WITH CHECK to prevent profile takeover
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also restrict other profile policies to authenticated role
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. Fix operacoes policies to authenticated role
DROP POLICY IF EXISTS "Users can view their own operacoes" ON public.operacoes;
CREATE POLICY "Users can view their own operacoes"
ON public.operacoes FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own operacoes" ON public.operacoes;
CREATE POLICY "Users can insert their own operacoes"
ON public.operacoes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own operacoes" ON public.operacoes;
CREATE POLICY "Users can update their own operacoes"
ON public.operacoes FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own operacoes" ON public.operacoes;
CREATE POLICY "Users can delete their own operacoes"
ON public.operacoes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 3. Fix notas_corretagem policies to authenticated role
DROP POLICY IF EXISTS "Users can view their own notas" ON public.notas_corretagem;
CREATE POLICY "Users can view their own notas"
ON public.notas_corretagem FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notas" ON public.notas_corretagem;
CREATE POLICY "Users can insert their own notas"
ON public.notas_corretagem FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notas" ON public.notas_corretagem;
CREATE POLICY "Users can update their own notas"
ON public.notas_corretagem FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notas" ON public.notas_corretagem;
CREATE POLICY "Users can delete their own notas"
ON public.notas_corretagem FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- 4. Fix storage policies for notas-pdf bucket
DROP POLICY IF EXISTS "Users can view their own PDFs" ON storage.objects;
CREATE POLICY "Users can view their own PDFs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'notas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own PDFs" ON storage.objects;
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'notas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;
CREATE POLICY "Users can delete their own PDFs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'notas-pdf' AND auth.uid()::text = (storage.foldername(name))[1]);
