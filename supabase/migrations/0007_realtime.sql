-- Live updates: let Supabase Realtime broadcast changes to these tables.
-- Safe to run more than once, and it skips tables that don't exist yet.
do $$
declare t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['resources','departments','courses','submissions','requests','reports']
    loop
      if to_regclass('public.' || t) is not null
         and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
