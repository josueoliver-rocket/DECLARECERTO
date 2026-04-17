-- Create operacoes table to track individual asset transactions
CREATE TABLE public.operacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nota_id UUID REFERENCES public.notas_corretagem(id) ON DELETE CASCADE,
  ativo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('C', 'V')),
  quantidade INTEGER NOT NULL DEFAULT 0,
  preco_unitario DECIMAL(15,4) NOT NULL DEFAULT 0,
  valor_total DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.operacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for operacoes
CREATE POLICY "Users can view their own operacoes" 
ON public.operacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own operacoes" 
ON public.operacoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own operacoes" 
ON public.operacoes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own operacoes" 
ON public.operacoes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance on common queries
CREATE INDEX idx_operacoes_user_ativo ON public.operacoes(user_id, ativo);
CREATE INDEX idx_operacoes_nota ON public.operacoes(nota_id);