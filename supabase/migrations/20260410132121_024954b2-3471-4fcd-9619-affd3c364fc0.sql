-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = _user_id
    AND email = 'josue.oliver@hotmail.com'
  );
$$;

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admin can view all subscriptions
CREATE POLICY "Admin can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));