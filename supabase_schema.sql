create table if not exists public.chats (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  messages jsonb not null default '[]'::jsonb,
  constraint chats_messages_is_array check (jsonb_typeof(messages) = 'array')
);

create index if not exists chats_user_updated_idx
  on public.chats (user_id, updated_at desc);

alter table public.chats enable row level security;

drop policy if exists "Users can read their own chats" on public.chats;
create policy "Users can read their own chats"
  on public.chats for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own chats" on public.chats;
create policy "Users can create their own chats"
  on public.chats for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own chats" on public.chats;
create policy "Users can update their own chats"
  on public.chats for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own chats" on public.chats;
create policy "Users can delete their own chats"
  on public.chats for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.chats from anon, public;
grant select, insert, update, delete on public.chats to authenticated;
