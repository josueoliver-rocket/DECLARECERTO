
CREATE POLICY "Admin can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can delete subscriptions"
ON public.user_subscriptions
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
