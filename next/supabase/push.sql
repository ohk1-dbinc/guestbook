-- Supabase SQL Editor에 붙여 넣고 Run 하세요. (알림 구독 저장용)
create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- 브라우저에서 바로 읽고 쓰지 못하게 RLS를 켜고 정책은 두지 않음
alter table public.push_subscriptions enable row level security;

-- 새 테이블을 API에 바로 반영
notify pgrst, 'reload schema';
