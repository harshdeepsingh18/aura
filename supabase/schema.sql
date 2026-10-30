create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  messages jsonb not null default '[]'::jsonb,
  constraint chats_title_length check (char_length(title) <= 200),
  constraint chats_messages_array check (jsonb_typeof(messages) = 'array')
);

create index if not exists chats_user_updated_at_idx
  on public.chats (user_id, updated_at desc);

alter table public.chats enable row level security;

drop policy if exists chats_select_own on public.chats;
create policy chats_select_own
  on public.chats for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists chats_insert_own on public.chats;
create policy chats_insert_own
  on public.chats for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists chats_update_own on public.chats;
create policy chats_update_own
  on public.chats for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists chats_delete_own on public.chats;
create policy chats_delete_own
  on public.chats for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.chats to authenticated;
