-- Finanças v2: observação em tudo, categoria no planejamento, saldo acompanha edição de lançamento e conversa com a IA
alter table public.fin_lancamentos add column if not exists observacao text;
alter table public.fin_recorrentes add column if not exists observacao text;
alter table public.fin_ajustes add column if not exists observacao text, add column if not exists categoria text;
alter table public.fin_contas add column if not exists observacao text;

-- Saldo das contas acompanha INSERIR, EDITAR (desfaz o antigo e aplica o novo) e APAGAR lançamento
create or replace function public.fin_aplicar_lancamento()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  passos record;
begin
  for passos in
    select * from (values (1, tg_op in ('DELETE','UPDATE')), (2, tg_op in ('INSERT','UPDATE'))) v(ordem, roda) where roda order by ordem
  loop
    declare r record; sinal int;
    begin
      if passos.ordem = 1 then r := old; sinal := -1; else r := new; sinal := 1; end if;
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
    end;
  end loop;
  return null;
end $function$;
drop trigger if exists fin_lancamento_saldo on public.fin_lancamentos;
create trigger fin_lancamento_saldo after insert or delete or update of tipo, valor on public.fin_lancamentos
  for each row execute function public.fin_aplicar_lancamento();

-- Conversa com o assistente de finanças
create table if not exists public.fin_chat (
  id uuid primary key default gen_random_uuid(),
  papel text not null check (papel in ('user','assistant')),
  conteudo text not null,
  acoes jsonb,
  criado_em timestamptz not null default now()
);
alter table public.fin_chat enable row level security;
drop policy if exists fin_chat_dono on public.fin_chat;
create policy fin_chat_dono on public.fin_chat for all to authenticated using ((select public.is_dono())) with check ((select public.is_dono()));
