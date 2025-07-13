
-- Criar política para permitir que admins atualizem saldos dos usuários
CREATE POLICY "Admins podem atualizar saldos dos usuários"
ON public.usuarios FOR UPDATE
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
