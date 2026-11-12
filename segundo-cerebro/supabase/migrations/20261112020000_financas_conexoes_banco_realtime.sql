-- Conexões do banco: configuração (Meu Pluggy), registro de cada importação e token privado do n8n
create table if not exists public.fin_config (
  id int primary key default 1 check (id = 1),
  pluggy_itens text[] not null default '{}',
  pluggy_ativo boolean not null default false,
  pluggy_ultimo_sync timestamptz,
  pluggy_status text,
  drive_pasta text not null default 'Extratos Inter',
  atualizado_em timestamptz not null default now()
);
insert into public.fin_config (id) values (1) on conflict do nothing;
alter table public.fin_config enable row level security;
drop policy if exists fin_config_dono on public.fin_config;
create policy fin_config_dono on public.fin_config for all to authenticated using ((select public.is_dono())) with check ((select public.is_dono()));

create table if not exists public.fin_importacoes (
  id uuid primary key default gen_random_uuid(),
  origem text not null check (origem in ('manual','drive','pluggy')),
  arquivo text,
  novas int not null default 0,
  repetidas int not null default 0,
  saldo_final numeric,
  status text not null default 'ok',
  mensagem text,
  criado_em timestamptz not null default now()
);
alter table public.fin_importacoes enable row level security;
drop policy if exists fin_importacoes_dono on public.fin_importacoes;
create policy fin_importacoes_dono on public.fin_importacoes for all to authenticated using ((select public.is_dono())) with check ((select public.is_dono()));

-- Token que o n8n e o pg_cron usam para chamar a função; nenhum papel do painel lê esta tabela
create table if not exists public.fin_privado (
  id int primary key default 1 check (id = 1),
  token text not null default encode(gen_random_bytes(24), 'hex')
);
insert into public.fin_privado (id) values (1) on conflict do nothing;
alter table public.fin_privado enable row level security;
revoke all on public.fin_privado from anon, authenticated;

-- Atualização ao vivo no painel
do $$
declare t text;
begin
  foreach t in array array['fin_lancamentos','fin_contas','fin_recorrentes','fin_ajustes','fin_importacoes','fin_config'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Sincronização diária com o Meu Pluggy às 07:10 de Brasília (a função sai na hora se estiver desligada)
select cron.schedule('financas-pluggy-diario', '10 10 * * *', $cron$
  select net.http_post(
    url := 'https://nzydtjhcibzazcotyabp.supabase.co/functions/v1/banco?rota=pluggy',
    headers := jsonb_build_object('Content-Type','application/json','x-fin-token',(select token from public.fin_privado where id = 1)),
    body := '{}'::jsonb, timeout_milliseconds := 145000);
$cron$);
