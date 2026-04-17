-- Allow null values for data_operacao since it's optional
ALTER TABLE public.notas_corretagem ALTER COLUMN data_operacao DROP NOT NULL;