
-- Permitir que usuários atualizem seus próprios perfis (para vincular ao jogador)
CREATE POLICY "Usuários podem atualizar seus próprios perfis"
ON public.usuarios FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Permitir que admins atualizem estatísticas dos jogadores
CREATE POLICY "Admins podem atualizar jogadores"
ON public.players FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- Permitir que admins criem e atualizem partidas
CREATE POLICY "Admins podem gerenciar partidas"
ON public.partidas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- Permitir que admins atualizem bilhetes (para processar resultados)
CREATE POLICY "Admins podem atualizar bilhetes"
ON public.bilhetes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- Permitir que admins atualizem seleções (para processar resultados)
CREATE POLICY "Admins podem atualizar seleções"
ON public.selecoes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- Criar um usuário admin de exemplo
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Inserir usuário admin apenas se não existir
  INSERT INTO public.usuarios (user_id, username, email, role, primeiro_login, saldo_ficticio)
  VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin',
    'admin@betdoscrias.com',
    'ADMIN',
    false,
    10000.00
  )
  ON CONFLICT (username) DO NOTHING;
END $$;
