-- Create notas_corretagem table
CREATE TABLE public.notas_corretagem (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  corretora TEXT NOT NULL,
  data_operacao DATE NOT NULL,
  arquivo_nome TEXT,
  valor_total DECIMAL(15,2) DEFAULT 0,
  valor_compras DECIMAL(15,2) DEFAULT 0,
  valor_vendas DECIMAL(15,2) DEFAULT 0,
  taxas DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notas_corretagem ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notas" 
ON public.notas_corretagem 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notas" 
ON public.notas_corretagem 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notas" 
ON public.notas_corretagem 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notas" 
ON public.notas_corretagem 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notas_corretagem_updated_at
BEFORE UPDATE ON public.notas_corretagem
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();