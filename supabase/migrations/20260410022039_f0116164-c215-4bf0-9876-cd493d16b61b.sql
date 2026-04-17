
-- Create enum for plans
CREATE TYPE public.subscription_plan AS ENUM ('basic', 'premium', 'platinum');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'expired');

-- Create subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'basic',
  status subscription_status NOT NULL DEFAULT 'active',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create basic subscription on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, email, cpf)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'nome',
    new.email,
    new.raw_user_meta_data ->> 'cpf'
  );
  
  INSERT INTO public.user_subscriptions (user_id, plan, status)
  VALUES (new.id, 'basic', 'active');
  
  RETURN new;
END;
$function$;
