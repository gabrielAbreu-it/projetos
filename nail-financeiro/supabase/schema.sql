-- Financeiro · banco do painel (rodar uma vez no SQL Editor do Supabase)
-- Tudo fica no esquema "nail", separado de qualquer outra coisa que já exista no projeto.
-- Antes de rodar: troque EMAIL_DELA@exemplo.com pelo e-mail que ela vai usar para entrar.

create schema if not exists nail;
grant usage on schema nail to anon, authenticated;

-- ========== ACESSO: só a dona entra ==========
create table if not exists nail.dona (
  email text primary key check (email = lower(email)),
  criado_em timestamptz default now()
);
create or replace function nail.is_dona() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from nail.dona d where d.email = lower(auth.email()));
$$;

-- ========== FINANÇAS ==========
-- saldos: "disponivel" (conta do dia a dia) e "reserva" (guardado)
create table if not exists nail.fin_contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null unique check (tipo in ('disponivel','reserva')),
  saldo numeric not null default 0,
  atualizado_em timestamptz default now()
);
-- o que já aconteceu (atualiza o saldo pelo gatilho abaixo)
create table if not exists nail.fin_lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  descricao text not null,
  categoria text,
  tipo text not null check (tipo in ('entrada','saida','aporte','resgate')),
  valor numeric not null check (valor > 0),
  criado_em timestamptz default now()
);
-- fixos que se repetem todo mês (entram na projeção)
create table if not exists nail.fin_recorrentes (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  categoria text,
  tipo text not null check (tipo in ('entrada','saida','aporte')),
  valor numeric not null check (valor > 0),
  dia smallint not null default 5 check (dia between 1 and 31),
  inicio date not null default date_trunc('month', current_date)::date,
  fim date,
  ativo boolean not null default true,
  criado_em timestamptz default now()
);
-- itens só de um mês e correções de um fixo num mês ("| fixo:<id> | valor|pular")
create table if not exists nail.fin_ajustes (
  id uuid primary key default gen_random_uuid(),
  mes date not null,
  descricao text not null,
  tipo text not null check (tipo in ('entrada','saida','aporte')),
  valor numeric not null check (valor > 0),
  criado_em timestamptz default now()
);

-- lançamento novo aplica no saldo; lançamento excluído desfaz
create or replace function nail.aplicar_lancamento() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r record; sinal int;
begin
  if tg_op = 'INSERT' then r := new; sinal := 1; else r := old; sinal := -1; end if;
  if r.tipo = 'entrada' then
    update nail.fin_contas set saldo = saldo + sinal*r.valor, atualizado_em = now() where tipo='disponivel';
  elsif r.tipo = 'saida' then
    update nail.fin_contas set saldo = saldo - sinal*r.valor, atualizado_em = now() where tipo='disponivel';
  elsif r.tipo = 'aporte' then
    update nail.fin_contas set saldo = saldo - sinal*r.valor, atualizado_em = now() where tipo='disponivel';
    update nail.fin_contas set saldo = saldo + sinal*r.valor, atualizado_em = now() where tipo='reserva';
  elsif r.tipo = 'resgate' then
    update nail.fin_contas set saldo = saldo + sinal*r.valor, atualizado_em = now() where tipo='disponivel';
    update nail.fin_contas set saldo = saldo - sinal*r.valor, atualizado_em = now() where tipo='reserva';
  end if;
  return null;
end $$;
drop trigger if exists fin_lancamento_saldo on nail.fin_lancamentos;
create trigger fin_lancamento_saldo after insert or delete on nail.fin_lancamentos
  for each row execute function nail.aplicar_lancamento();

-- só a dona lê e escreve; visitantes sem login não veem nada
alter table nail.dona enable row level security;
drop policy if exists dona_le on nail.dona;
create policy dona_le on nail.dona for select to authenticated using (email = lower(auth.email()));
grant select on nail.dona to authenticated;
do $$
declare t text;
begin
  foreach t in array array['fin_contas','fin_lancamentos','fin_recorrentes','fin_ajustes'] loop
    execute format('alter table nail.%I enable row level security', t);
    execute format('drop policy if exists dona_tudo on nail.%I', t);
    execute format('create policy dona_tudo on nail.%I for all to authenticated using (nail.is_dona()) with check (nail.is_dona())', t);
    execute format('grant select, insert, update, delete on nail.%I to authenticated', t);
  end loop;
end $$;
revoke execute on function nail.is_dona() from public, anon;
grant execute on function nail.is_dona() to authenticated;

-- dona e contas iniciais (zeradas; ela ajusta pelo botão "corrigir")
insert into nail.dona(email) values (lower('EMAIL_DELA@exemplo.com')) on conflict do nothing;
insert into nail.fin_contas(nome, tipo) values ('Conta do dia a dia','disponivel'), ('Reserva','reserva') on conflict (tipo) do nothing;

-- libera o esquema "nail" na API (mantém os esquemas que já estavam liberados;
-- confira em Settings → API → Exposed schemas e acrescente "nail" se preferir pelo painel)
-- alter role authenticator set pgrst.db_schemas = 'public, graphql_public, nail';
-- notify pgrst, 'reload config';
