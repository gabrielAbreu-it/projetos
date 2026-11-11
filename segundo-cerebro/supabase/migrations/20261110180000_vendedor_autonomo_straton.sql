-- Vendedor autônomo da STRATON: configuração, credenciais privadas, funil em cb_leads,
-- mensagens, reuniões de fechamento, contatos do mockup, estatística por atendente e agenda (pg_cron).
create extension if not exists pg_cron;
create extension if not exists pg_net;

create table if not exists public.vd_config (
  id boolean primary key default true check (id),
  ativo boolean not null default false,
  meta_calls integer not null default 5,
  nichos text[] not null default array['clínica odontológica','clínica de estética','advocacia','clínica médica','pet shop','imobiliária','academia','restaurante'],
  regioes text[] not null default array['Asa Sul, Brasília','Asa Norte, Brasília','Águas Claras, Brasília','Guará, Brasília','Taguatinga, Brasília','Sudoeste, Brasília','Lago Sul, Brasília','Vicente Pires, Brasília'],
  max_por_hora integer not null default 20,
  janela jsonb not null default '{"envio":["08:30","18:00"],"manha":["09:00","11:30"],"tarde":["14:00","17:30"],"dias":[1,2,3,4,5]}'::jsonb,
  personas jsonb not null default '[{"id":"ana","nome":"Ana","genero":"f"},{"id":"rafael","nome":"Rafael","genero":"m"}]'::jsonb,
  empresa jsonb not null default '{"nome":"STRATON","fechamento_com":"Gabriel","site":"","instagram":""}'::jsonb,
  oferta text not null default 'A STRATON desenvolve sites profissionais para negócios locais: site rápido e bonito no celular, agendamento online, botão e atendente de WhatsApp, integração com Google e Instagram, e automações que respondem cliente, confirmam horário e reduzem falta.',
  precos jsonb not null default '[]'::jsonb,
  rodando_desde timestamptz, ultimo_ciclo timestamptz,
  atualizado_em timestamptz not null default now()
);
insert into public.vd_config (id) values (true) on conflict do nothing;

create table if not exists public.vd_privado (
  id boolean primary key default true check (id),
  token_cron text not null default encode(extensions.gen_random_bytes(24),'hex'),
  token_webhook text not null default encode(extensions.gen_random_bytes(24),'hex'),
  uazapi_url text, uazapi_token text, email_webhook_url text, email_remetente text, straton_leads jsonb
);
insert into public.vd_privado (id) values (true) on conflict do nothing;

alter table public.cb_leads
  add column if not exists cnpj text, add column if not exists razao_social text,
  add column if not exists socios jsonb, add column if not exists porte text, add column if not exists abertura date,
  add column if not exists presenca text, add column if not exists score integer,
  add column if not exists qualificacao jsonb, add column if not exists persona text,
  add column if not exists etapa text not null default 'descoberto',
  add column if not exists proximo_passo_em timestamptz, add column if not exists whatsapp text,
  add column if not exists tentativas integer not null default 0, add column if not exists opt_out boolean not null default false,
  add column if not exists conversa_resumo text, add column if not exists mockup_feedback text,
  add column if not exists briefing jsonb, add column if not exists origem_ref text, add column if not exists regiao text,
  add column if not exists ultima_msg_em timestamptz, add column if not exists ultima_resposta_em timestamptz;
alter table public.cb_leads drop constraint if exists cb_leads_etapa_check;
alter table public.cb_leads add constraint cb_leads_etapa_check check (etapa = any (array[
  'descoberto','qualificado','descartado','analisado','mockup_pronto','contatado','conversando',
  'interessado','decidiu_fechar','reuniao_marcada','sem_resposta','perdido','nao_contatar']));
create index if not exists cb_leads_etapa_idx on public.cb_leads (etapa, proximo_passo_em);
create unique index if not exists cb_leads_whatsapp_uq on public.cb_leads (whatsapp) where whatsapp is not null;

create table if not exists public.vd_mensagens (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.cb_leads(id) on delete cascade,
  canal text not null check (canal in ('whatsapp','email')),
  direcao text not null check (direcao in ('saida','entrada')),
  persona text, conteudo text not null,
  status text not null default 'enviado' check (status in ('enviado','erro','recebido','na_fila')),
  externo_id text, erro text, criado_em timestamptz not null default now()
);
create index if not exists vd_mensagens_lead_idx on public.vd_mensagens (lead_id, criado_em);

create table if not exists public.vd_reunioes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.cb_leads(id) on delete cascade,
  inicio timestamptz not null, fim timestamptz not null,
  status text not null default 'marcada' check (status in ('marcada','realizada','cancelada','fechou','nao_fechou')),
  briefing jsonb, criado_em timestamptz not null default now()
);

create table if not exists public.vd_mockup_contatos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.cb_leads(id) on delete cascade,
  nome text, telefone text, mensagem text, criado_em timestamptz not null default now()
);

create or replace function public.mockup_contato(t text, nome text, telefone text, mensagem text)
returns boolean language plpgsql security definer set search_path = public as $$
declare lid uuid;
begin
  select id into lid from public.cb_leads where t is not null and length(t) >= 24 and mockup_token = t;
  if lid is null then return false; end if;
  insert into public.vd_mockup_contatos (lead_id, nome, telefone, mensagem) values (lid, left(nome,120), left(telefone,40), left(mensagem,2000));
  return true;
end $$;
revoke all on function public.mockup_contato(text,text,text,text) from public;
grant execute on function public.mockup_contato(text,text,text,text) to anon, authenticated;

create or replace view public.vd_persona_stats with (security_invoker = true) as
select coalesce(l.nicho,'?') as nicho, l.persona,
  count(*) filter (where l.etapa not in ('descoberto','qualificado','descartado','analisado','mockup_pronto')) as abordados,
  count(*) filter (where l.ultima_resposta_em is not null) as responderam,
  count(*) filter (where l.etapa in ('interessado','decidiu_fechar','reuniao_marcada')) as interessados,
  count(*) filter (where l.etapa = 'reuniao_marcada') as reunioes
from public.cb_leads l where l.persona is not null group by 1,2;

alter table public.vd_config enable row level security;
alter table public.vd_privado enable row level security;
alter table public.vd_mensagens enable row level security;
alter table public.vd_reunioes enable row level security;
alter table public.vd_mockup_contatos enable row level security;
create policy vd_config_dono on public.vd_config for all to authenticated using ((select public.is_dono())) with check ((select public.is_dono()));
create policy vd_mensagens_dono on public.vd_mensagens for all to authenticated using ((select public.is_dono())) with check ((select public.is_dono()));
create policy vd_reunioes_dono on public.vd_reunioes for all to authenticated using ((select public.is_dono())) with check ((select public.is_dono()));
create policy vd_mockup_contatos_dono on public.vd_mockup_contatos for all to authenticated using ((select public.is_dono())) with check ((select public.is_dono()));
create policy cb_eventos_dono_ler on public.cb_eventos for select to authenticated using ((select public.is_dono()));
create index if not exists cb_eventos_criado_idx on public.cb_eventos (cerebro, criado_em desc);

-- a cada 2 min o banco chama o ciclo do vendedor (ele sai na hora se estiver desligado)
select cron.schedule('vendedor-ciclo', '*/2 * * * *', $cron$
  select net.http_post(
    url := 'https://nzydtjhcibzazcotyabp.supabase.co/functions/v1/vendedor?rota=ciclo',
    headers := jsonb_build_object('Content-Type','application/json','x-vd-token',(select token_cron from public.vd_privado where id)),
    body := '{}'::jsonb, timeout_milliseconds := 145000);
$cron$);
