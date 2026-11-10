-- Faculdade: cópia completa do portal (seção, ordem e conclusão vinda do próprio portal)
alter table public.faculdade_itens
  add column if not exists secao text,
  add column if not exists ordem integer,
  add column if not exists concluido_portal boolean;

-- Agente de prospecção: enriquece cb_leads
alter table public.cb_leads
  add column if not exists place_id text,
  add column if not exists avaliacao numeric,
  add column if not exists total_avaliacoes integer,
  add column if not exists email text,
  add column if not exists redes jsonb not null default '{}'::jsonb,
  add column if not exists decisor text,
  add column if not exists analise jsonb,
  add column if not exists mockup_html text,
  add column if not exists mockup_token text,
  add column if not exists mensagem jsonb,
  add column if not exists contatado_em timestamptz,
  add column if not exists reuniao_em timestamptz;
create unique index if not exists cb_leads_place_id_uq on public.cb_leads (place_id);
create unique index if not exists cb_leads_mockup_token_uq on public.cb_leads (mockup_token);

alter table public.cb_leads drop constraint if exists cb_leads_status_check;
alter table public.cb_leads add constraint cb_leads_status_check
  check (status = any (array['novo','abordado','respondeu','negociando','reuniao','fechado','perdido']));

drop policy if exists cb_leads_dono on public.cb_leads;
create policy cb_leads_dono on public.cb_leads for all to authenticated
  using ((select public.is_dono())) with check ((select public.is_dono()));
drop policy if exists cb_aprovacoes_dono on public.cb_aprovacoes;
create policy cb_aprovacoes_dono on public.cb_aprovacoes for all to authenticated
  using ((select public.is_dono())) with check ((select public.is_dono()));

create or replace function public.mockup_publico(t text)
returns table (nome text, html text)
language sql stable security definer set search_path = public as $$
  select l.nome, l.mockup_html from public.cb_leads l
  where t is not null and length(t) >= 24 and l.mockup_token = t and l.mockup_html is not null;
$$;
revoke all on function public.mockup_publico(text) from public;
grant execute on function public.mockup_publico(text) to anon, authenticated;
