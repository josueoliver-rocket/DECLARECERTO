-- Add unique constraint on CPF to prevent duplicate registrations
ALTER TABLE public.profiles ADD CONSTRAINT profiles_cpf_unique UNIQUE (cpf);