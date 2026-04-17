
CREATE TABLE public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'success',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all signup attempts"
ON public.signup_attempts
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Anyone can insert signup attempts"
ON public.signup_attempts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
