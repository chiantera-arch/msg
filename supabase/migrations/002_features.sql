-- ============================================================
-- msg — soft delete, modifica, messaggi vocali
-- Applicato in produzione via Supabase MCP; questo file documenta
-- lo schema reale per eventuali redeploy.
-- ============================================================

-- Soft delete + modifica + vocali
alter table public.messages add column if not exists deleted_at timestamptz;
alter table public.messages add column if not exists edited_at  timestamptz;
alter table public.messages add column if not exists voice_url  text;

-- Il messaggio deve avere almeno uno tra testo, foto o vocale
alter table public.messages drop constraint if exists messages_has_content;
alter table public.messages add constraint messages_has_content
  check (content is not null or photo_url is not null or voice_url is not null);

-- ============================================================
-- Storage: bucket foto (pubblico)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

drop policy if exists "photos: upload autenticati" on storage.objects;
create policy "photos: upload autenticati"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos');

drop policy if exists "photos: lettura autenticati" on storage.objects;
create policy "photos: lettura autenticati"
  on storage.objects for select
  using (bucket_id = 'photos');

-- ============================================================
-- Storage: bucket vocali (pubblico)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('voices', 'voices', true)
on conflict (id) do update set public = true;

drop policy if exists "voices read public" on storage.objects;
create policy "voices read public"
  on storage.objects for select
  using (bucket_id = 'voices');

drop policy if exists "voices insert auth" on storage.objects;
create policy "voices insert auth"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'voices');

drop policy if exists "voices delete own" on storage.objects;
create policy "voices delete own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'voices' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Realtime: pubblica la tabella messages
-- ============================================================
alter publication supabase_realtime add table public.messages;

-- ============================================================
-- Hardening: search_path fisso sulla funzione SECURITY DEFINER
-- ============================================================
create or replace function public.mark_messages_read()
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.messages
  set    read_at = now()
  where  sender_id != auth.uid()
    and  read_at is null;
end;
$$;
