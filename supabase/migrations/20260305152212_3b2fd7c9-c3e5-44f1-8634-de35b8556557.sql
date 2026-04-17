
-- Tabela para rastrear mudanças de ticker na B3
-- Quando uma empresa muda de código, o sistema automaticamente migra as operações
CREATE TABLE public.ticker_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  old_ticker text NOT NULL,
  new_ticker text NOT NULL,
  change_date date NOT NULL,
  reason text NOT NULL DEFAULT 'Mudança de ticker',
  bonus_ticker text DEFAULT NULL,
  bonus_ratio numeric DEFAULT NULL,
  description text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(old_ticker, new_ticker, change_date)
);

-- Permitir leitura pública (dados de mercado, não sensíveis)
ALTER TABLE public.ticker_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ticker changes"
  ON public.ticker_changes
  FOR SELECT
  TO authenticated
  USING (true);

-- Inserir mudanças de ticker conhecidas na B3
INSERT INTO public.ticker_changes (old_ticker, new_ticker, change_date, reason, bonus_ticker, bonus_ratio, description) VALUES
  ('ELET3', 'ELET6', '2023-08-21', 'Reestruturação societária', NULL, NULL, 'Eletrobras - migração de ON para PNB após privatização'),
  ('ELET6', 'ELET6', '2023-08-21', 'Bonificação', 'ELET3', 0.0, 'Eletrobras PNB manteve ticker'),
  ('CIEL3', 'CIEL3', '2024-06-14', 'Fechamento de capital', NULL, NULL, 'Cielo - OPA e fechamento de capital'),
  ('BRKM5', 'BRKM5', '2024-01-01', 'Ticker mantido', NULL, NULL, 'Braskem manteve ticker'),
  ('GOLL4', 'GOLL4', '2024-01-25', 'Recuperação judicial', NULL, NULL, 'Gol - pedido de Chapter 11'),
  ('CCRO3', 'MOTV3', '2025-01-02', 'Mudança de nome', NULL, NULL, 'CCR mudou nome para Motiva e ticker para MOTV3'),
  ('JHSF3', 'JHSF3', '2024-01-01', 'Ticker mantido', NULL, NULL, 'JHSF manteve ticker'),
  ('LREN3', 'LREN3', '2024-01-01', 'Ticker mantido', NULL, NULL, 'Lojas Renner manteve ticker'),
  ('BRPR3', 'BRCR11', '2020-01-01', 'Conversão para FII', NULL, NULL, 'BR Properties convertido em FII'),
  ('WIZS3', 'WIZC3', '2022-09-01', 'Mudança de nome', NULL, NULL, 'Wiz Soluções mudou ticker de WIZS3 para WIZC3'),
  ('TGMA3', 'TGMA3', '2024-01-01', 'Ticker mantido', NULL, NULL, 'Tegma manteve ticker');
