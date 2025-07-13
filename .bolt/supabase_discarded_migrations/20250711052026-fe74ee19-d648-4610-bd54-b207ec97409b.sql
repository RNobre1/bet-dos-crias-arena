
-- Criar políticas RLS para permitir que admins processem apostas
CREATE POLICY "Admins podem ver todas as seleções"
ON public.selecoes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  )
);

-- Criar função de segurança para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios 
    WHERE user_id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- Atualizar política de bilhetes para admins
CREATE POLICY "Admins podem ver todos os bilhetes"
ON public.bilhetes
FOR SELECT
USING (public.is_admin());
