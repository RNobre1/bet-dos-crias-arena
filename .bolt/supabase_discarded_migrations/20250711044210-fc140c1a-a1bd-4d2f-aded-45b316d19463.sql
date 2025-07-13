
-- Permitir que usuários se vinculem a jogadores disponíveis (que não tenham user_id)
CREATE POLICY "Usuários podem vincular-se a jogadores disponíveis"
ON public.players FOR UPDATE
USING (
  user_id IS NULL AND 
  NOT EXISTS (
    SELECT 1 FROM public.players 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid() AND
  NOT EXISTS (
    SELECT 1 FROM public.players 
    WHERE user_id = auth.uid() AND id != players.id
  )
);
