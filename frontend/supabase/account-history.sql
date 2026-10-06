-- Additive setup for the EXISTING Boundaries tables, in an isolated Supabase
-- development project first. This is not a Prisma migration baseline.
-- Review and back up before a separately authorized production rollout.
begin;

alter table public.surveys add column if not exists owner_id uuid;
alter table public.responses add column if not exists user_id uuid;

-- Account deletion removes attribution while preserving shared forms/results.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'surveys_owner_id_fkey' and conrelid = 'public.surveys'::regclass) then
    alter table public.surveys add constraint surveys_owner_id_fkey
      foreign key (owner_id) references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'responses_user_id_fkey' and conrelid = 'public.responses'::regclass) then
    alter table public.responses add constraint responses_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;
end $$;

create index if not exists surveys_owner_id_created_at_idx on public.surveys(owner_id, created_at);
create index if not exists responses_user_id_submitted_at_idx on public.responses(user_id, submitted_at);

-- All form reads/writes go through Next.js + Prisma using a trusted server DB
-- role. No direct browser/PostgREST access is required (including for guests).
-- Prisma's role must have BYPASSRLS; it must never be exposed to a browser.
alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;
revoke all on public.surveys, public.questions, public.responses, public.answers from anon, authenticated;

commit;
