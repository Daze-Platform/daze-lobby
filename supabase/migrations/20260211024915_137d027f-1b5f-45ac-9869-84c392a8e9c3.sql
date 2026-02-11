-- Clients can update their own client contacts
CREATE POLICY "Clients can update their own client contacts"
  ON public.client_contacts FOR UPDATE
  USING (client_id IN (
    SELECT uc.client_id FROM user_clients uc WHERE uc.user_id = auth.uid()
  ))
  WITH CHECK (client_id IN (
    SELECT uc.client_id FROM user_clients uc WHERE uc.user_id = auth.uid()
  ));

-- Clients can delete their own client contacts
CREATE POLICY "Clients can delete their own client contacts"
  ON public.client_contacts FOR DELETE
  USING (client_id IN (
    SELECT uc.client_id FROM user_clients uc WHERE uc.user_id = auth.uid()
  ));