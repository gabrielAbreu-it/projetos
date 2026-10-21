-- Financeiro · banco do painel (rodar uma vez no SQL Editor de um projeto Supabase novo)
-- Antes de rodar: troque EMAIL_DELA@exemplo.com pelo e-mail que ela vai usar para entrar.

-- ========== ACESSO: só a dona entra ==========
create table if not exists public.dono (
  id boolean primary key default true check (id),   -- no máximo uma linha
  user_id uuid not null references auth.users(id) on delete cascade,
  criado_em timestamptz default now()
);
alter table public.dono enable row level security;
drop policy if exists dono_le on public.dono;
create policy dono_le on public.dono for select to authenticated using (user_id = auth.uid());

create or replace function public.is_dono() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.dono where user_id = auth.uid());
$$;

-- o primeiro cadastro com o e-mail dela vira a dona; qualquer outro cadastro não vê nada
create or replace function public.reivindicar_dono() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = lower('EMAIL_DELA@exemplo.com') and not exists (select 1 from public.dono) then
    insert into public.dono(user_id) values (new.id);
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created_dono on auth.users;
create trigger on_auth_user_created_dono after insert on auth.users
  for each row execute function public.reivindicar_dono();

-- ========== FINANÇAS ==========
-- saldos: "disponivel" (conta do dia a dia) e "reserva" (guardado)
create table if not exists public.fin_contas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null check (tipo in ('disponivel','reserva')),
  saldo numeric not null default 0,
  atualizado_em timestamptz default now()
);
-- o que já aconteceu (atualiza o saldo pelo gatilho abaixo)
create table if not exists public.fin_lancamentos (
  id uuid primary key default gen_random_uuid(),
  data date not null default current_date,
  descricao text not null,
  categoria text,
  tipo text not null check (tipo in ('entrada','saida','aporte','resgate')),
  valor numeric not null check (valor > 0),
  criado_em timestamptz default now()
);
-- fixos que se repetem todo mês (entram na projeção)
create table if not exists public.fin_recorrentes (
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
create table if not exists public.fin_ajustes (
  id uuid primary key default gen_random_uuid(),
  mes date not null,
  descricao text not null,
  tipo text not null check (tipo in ('entrada','saida','aporte')),
  valor numeric not null check (valor > 0),
  criado_em timestamptz default now()
);

-- lançamento novo aplica no saldo; lançamento excluído desfaz
create or replace function public.fin_aplicar_lancamento() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r record; sinal int;
begin
  if tg_op = 'INSERT' then r := new; sinal := 1; else r := old; sinal := -1; end if;
  if r.tipo = 'entrada' then
    update fin_contas set saldo = saldo + sinal*r.valor, atualizado_em = now() where tipo='disponivel';
  elsif r.tipo = 'saida' then
    update fin_contas set saldo = saldo - sinal*r.valor, atualizado_em = now() where tipo='disponivel';
  elsif r.tipo = 'aporte' then
    update fin_contas set saldo = saldo - sinal*r.valor, atualizado_em = now() where tipo='disponivel';
    update fin_contas set saldo = saldo + sinal*r.valor, atualizado_em = now() where tipo='reserva';
  elsif r.tipo = 'resgate' then
    update fin_contas set saldo = saldo + sinal*r.valor, atualizado_em = now() where tipo='disponivel';
    update fin_contas set saldo = saldo - sinal*r.valor, atualizado_em = now() where tipo='reserva';
  end if;
  return null;
end $$;
drop trigger if exists fin_lancamento_saldo on public.fin_lancamentos;
create trigger fin_lancamento_saldo after insert or delete on public.fin_lancamentos
  for each row execute function public.fin_aplicar_lancamento();

-- só a dona lê e escreve
do $$
declare t text;
begin
  foreach t in array array['fin_contas','fin_lancamentos','fin_recorrentes','fin_ajustes'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists dono_tudo on public.%I', t);
    execute format('create policy dono_tudo on public.%I for all to authenticated using (public.is_dono()) with check (public.is_dono())', t);
  end loop;
end $$;

-- as duas contas começam zeradas; ela ajusta pelo botão "corrigir" no painel
insert into public.fin_contas(nome, tipo)
select * from (values ('Conta do dia a dia','disponivel'), ('Reserva','reserva')) v(nome, tipo)
where not exists (select 1 from public.fin_contas);
