-- Supabase SQL Editor에 붙여 넣고 Run 하세요.
create table if not exists public.entries (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 40),
  message text not null check (char_length(message) between 1 and 500),
  recipient text check (recipient is null or char_length(recipient) <= 40),
  emoji text,
  created_at timestamptz not null default now()
);

-- 브라우저에서 바로 읽고 쓰지 못하게 RLS를 켜고 정책은 두지 않음
-- (서버의 secret key만 접근 가능)
alter table public.entries enable row level security;
