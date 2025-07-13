
-- Adicionar RLS políticas para permitir acesso aos dados necessários
CREATE POLICY "Permitir leitura pública de partidas"
ON public.partidas FOR SELECT
USING (true);

CREATE POLICY "Permitir leitura pública de usuários"
ON public.usuarios FOR SELECT
USING (true);

-- Permitir que usuários vejam apenas seus próprios bilhetes
CREATE POLICY "Usuários podem ver seus próprios bilhetes"
ON public.bilhetes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar bilhetes"
ON public.bilhetes FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários vejam seleções de seus próprios bilhetes
CREATE POLICY "Usuários podem ver suas próprias seleções"
ON public.selecoes FOR SELECT
USING (
  bilhete_id IN (
    SELECT bilhete_id FROM public.bilhetes WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem criar seleções"
ON public.selecoes FOR INSERT
WITH CHECK (
  bilhete_id IN (
    SELECT bilhete_id FROM public.bilhetes WHERE user_id = auth.uid()
  )
);

-- Inserir alguns jogadores de exemplo para demonstração
INSERT INTO public.players (jogador, gols, assistencias, defesas, desarmes, faltas, jogos, nota, status) VALUES
('Arthur', 4, 8, 0, 0, 0, 2, 10.0, 'Disponível'),
('Alex', 10, 9, 0, 0, 0, 4, 9.3, 'Disponível'),
('Lucas', 9, 8, 0, 0, 0, 4, 8.8, 'Disponível'),
('Vitex', 0, 1, 4, 0, 0, 1, 7.0, 'Disponível'),
('Lucca', 3, 0, 0, 0, 0, 1, 8.0, 'Disponível'),
('Jorge', 2, 5, 0, 0, 0, 2, 8.0, 'Lesionado'),
('Antônio', 5, 3, 0, 0, 0, 4, 6.8, 'Disponível'),
('Henrique', 6, 5, 0, 0, 0, 4, 7.5, 'Disponível'),
('Sergio', 3, 0, 0, 0, 0, 4, 5.8, 'Disponível'),
('Carol', 3, 3, 0, 0, 0, 3, 6.8, 'Disponível'),
('Nobre', 1, 3, 0, 0, 0, 2, 6.7, 'Disponível'),
('Luiz', 1, 1, 0, 0, 0, 2, 5.9, 'Disponível');

-- Inserir uma partida de exemplo
INSERT INTO public.partidas (data_partida, time_a_nome, time_b_nome, status) VALUES
(NOW() + INTERVAL '1 day', 'Time A', 'Time B', 'AGENDADA');
