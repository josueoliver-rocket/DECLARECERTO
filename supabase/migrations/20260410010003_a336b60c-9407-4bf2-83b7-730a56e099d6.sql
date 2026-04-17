
-- Table to track failed login attempts
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  attempt_count integer NOT NULL DEFAULT 0,
  locked_until timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- No RLS needed - accessed only via security definer functions
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.check_login_locked(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record login_attempts%ROWTYPE;
BEGIN
  SELECT * INTO v_record FROM login_attempts WHERE email = lower(p_email);
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('locked', false, 'attempts', 0);
  END IF;
  
  IF v_record.locked_until IS NOT NULL THEN
    RETURN jsonb_build_object('locked', true, 'attempts', v_record.attempt_count);
  END IF;
  
  RETURN jsonb_build_object('locked', false, 'attempts', v_record.attempt_count);
END;
$$;

-- Function to increment failed attempts and lock after 3
CREATE OR REPLACE FUNCTION public.increment_login_attempts(p_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  INSERT INTO login_attempts (email, attempt_count, updated_at)
  VALUES (lower(p_email), 1, now())
  ON CONFLICT (email) DO UPDATE
    SET attempt_count = login_attempts.attempt_count + 1,
        updated_at = now()
  RETURNING attempt_count INTO v_count;
  
  -- Lock after 3 failed attempts (permanent until password reset)
  IF v_count >= 3 THEN
    UPDATE login_attempts 
    SET locked_until = '9999-12-31T23:59:59Z'::timestamptz
    WHERE email = lower(p_email);
    
    RETURN jsonb_build_object('locked', true, 'attempts', v_count);
  END IF;
  
  RETURN jsonb_build_object('locked', false, 'attempts', v_count);
END;
$$;

-- Function to reset attempts (called after password reset)
CREATE OR REPLACE FUNCTION public.reset_login_attempts(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM login_attempts WHERE email = lower(p_email);
END;
$$;

-- Grant execute to anon so pre-login checks work
GRANT EXECUTE ON FUNCTION public.check_login_locked(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_login_attempts(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_login_attempts(text) TO anon, authenticated;
