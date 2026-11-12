-- Importação de extrato: cada transação importada guarda um id de origem (FITID do OFX ou hash da linha do CSV/PDF)
alter table public.fin_lancamentos add column if not exists importado_id text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'fin_lancamentos_importado_id_key') then
    alter table public.fin_lancamentos add constraint fin_lancamentos_importado_id_key unique (importado_id);
  end if;
end $$;
