-- Reading log database setup. Run once in the Supabase SQL editor; safe to run again.
-- `books` holds the live app's books. `preview_books` is an identical table that
-- preview links use, so trying out a change never touches the real books.

create or replace function public.reading_log_touch() returns trigger
language plpgsql as $$
begin
  -- Last write wins: ignore an update that is older than what is already stored.
  if tg_op = 'UPDATE' and new.updated < old.updated then
    return null;
  end if;
  new.synced_at := clock_timestamp();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['books', 'preview_books'] loop
    execute format($f$
      create table if not exists public.%1$I (
        user_id uuid not null default auth.uid() references auth.users on delete cascade,
        id text not null,
        title text not null default '',
        author text not null default '',
        start_date text not null default '',
        end_date text not null default '',
        page text not null default '',
        deleted boolean not null default false,
        updated bigint not null,
        synced_at timestamptz not null default clock_timestamp(),
        primary key (user_id, id)
      );
      -- Open Library cover ID, 'none' when there is no cover, or '' when not looked up yet.
      alter table public.%1$I add column if not exists cover text not null default '';
      create index if not exists %2$I on public.%1$I (user_id, synced_at);
      alter table public.%1$I enable row level security;
      drop policy if exists "Own books only" on public.%1$I;
      create policy "Own books only" on public.%1$I for all to authenticated
        using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
      grant select, insert, update on public.%1$I to authenticated;
      drop trigger if exists touch on public.%1$I;
      create trigger touch before insert or update on public.%1$I
        for each row execute function public.reading_log_touch();
    $f$, t, t || '_synced_at');
  end loop;
end $$;
