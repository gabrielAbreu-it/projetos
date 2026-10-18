-- Dossiê Pix · estrutura do banco para a versão com login (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase, uma vez, num projeto novo.
-- Ideia geral: cada loja tem membros (usuários do Supabase Auth). Toda tabela
-- tem loja_id e as políticas de segurança (RLS) só deixam o usuário ver e mexer
-- nos dados das lojas de que ele é membro.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Lojas e membros
-- ---------------------------------------------------------------
create table public.lojas (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null check (char_length(nome) between 2 and 120),
  cnpj              text,                          -- só números ou com máscara; validado no app
  responsavel       text,                          -- nome que assina a declaração do dossiê
  cidade            text,
  contato           text,
  logo_path         text,                          -- caminho do logo no Storage (bucket "provas")
  prazo_padrao_dias smallint not null default 7    -- EXEMPLO; o lojista troca pelo prazo da instituição dele
                    check (prazo_padrao_dias between 1 and 90),
  plano             text not null default 'essencial',
  criada_em         timestamptz not null default now()
);

create table public.membros_loja (
  loja_id  uuid not null references public.lojas(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  papel    text not null default 'dono' check (papel in ('dono', 'equipe')),
  criado_em timestamptz not null default now(),
  primary key (loja_id, user_id)
);
create index membros_loja_user_idx on public.membros_loja (user_id);

-- Função auxiliar usada pelas políticas: o usuário logado é membro desta loja?
create or replace function public.eh_membro(p_loja uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros_loja m
    where m.loja_id = p_loja and m.user_id = auth.uid()
  );
$$;

create or replace function public.eh_dono(p_loja uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros_loja m
    where m.loja_id = p_loja and m.user_id = auth.uid() and m.papel = 'dono'
  );
$$;

-- Quem cria a loja vira dono automaticamente
create or replace function public.loja_criada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.membros_loja (loja_id, user_id, papel) values (new.id, auth.uid(), 'dono');
  return new;
end;
$$;
create trigger trg_loja_criada after insert on public.lojas
  for each row execute function public.loja_criada();

-- ---------------------------------------------------------------
-- Vendas
-- ---------------------------------------------------------------
create table public.vendas (
  id             uuid primary key default gen_random_uuid(),
  loja_id        uuid not null references public.lojas(id) on delete cascade,
  valor_centavos integer not null check (valor_centavos > 0),
  data_pagamento date not null,
  hora_pagamento time,
  e2e_id         text,                          -- ID da transação Pix; opcional
  canal          text not null check (canal in ('loja', 'instagram', 'whatsapp', 'presencial', 'outro')),
  tipo_entrega   text not null check (tipo_entrega in ('envio', 'propria', 'retirada', 'digital')),
  produto        text not null,
  cliente_nome   text not null,
  cliente_doc    text,                          -- CPF/CNPJ do pagador; dado pessoal, ver LGPD
  cliente_tel    text,
  cidade_entrega text,
  rastreio_codigo        text,
  rastreio_transportadora text,
  rastreio_data_envio    date,
  dossie_gerado_em timestamptz,
  criada_em      timestamptz not null default now(),
  criada_por     uuid references auth.users(id) default auth.uid()
);
create index vendas_loja_data_idx on public.vendas (loja_id, data_pagamento desc);
create index vendas_loja_e2e_idx on public.vendas (loja_id, e2e_id);

-- ---------------------------------------------------------------
-- Provas (o arquivo fica no Storage; aqui só os dados dele)
-- ---------------------------------------------------------------
create table public.provas (
  id           uuid primary key default gen_random_uuid(),
  loja_id      uuid not null references public.lojas(id) on delete cascade,
  venda_id     uuid not null references public.vendas(id) on delete cascade,
  tipo         text not null check (tipo in ('pix', 'nf', 'rastreio', 'entrega', 'conversa', 'foto', 'outro')),
  nome_arquivo text not null,
  mime         text not null check (mime in ('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf')),
  tamanho_bytes integer not null check (tamanho_bytes > 0 and tamanho_bytes <= 10485760),
  storage_path text not null,                   -- ex.: <loja_id>/<venda_id>/<id>.jpg
  data_documento date,
  descricao    text,
  criada_em    timestamptz not null default now()
);
create index provas_venda_idx on public.provas (venda_id);

-- ---------------------------------------------------------------
-- Linha do tempo (acontecimentos que o lojista adiciona)
-- ---------------------------------------------------------------
create table public.eventos (
  id        uuid primary key default gen_random_uuid(),
  loja_id   uuid not null references public.lojas(id) on delete cascade,
  venda_id  uuid not null references public.vendas(id) on delete cascade,
  tipo      text not null check (tipo in ('pedido', 'envio', 'entrega', 'conversa', 'outro')),
  data      date not null,
  hora      time,
  descricao text not null,
  criado_em timestamptz not null default now()
);
create index eventos_venda_idx on public.eventos (venda_id, data);

-- ---------------------------------------------------------------
-- Contestações pelo MED (uma por venda nesta versão)
-- ---------------------------------------------------------------
create table public.contestacoes (
  id            uuid primary key default gen_random_uuid(),
  loja_id       uuid not null references public.lojas(id) on delete cascade,
  venda_id      uuid not null unique references public.vendas(id) on delete cascade,
  status        text not null default 'aberta' check (status in ('aberta', 'ganha', 'perdida')),
  data_aviso    date not null,
  canal_aviso   text,
  motivo        text not null check (motivo in ('golpe', 'nao-reconhece', 'nao-recebeu', 'outro')),
  motivo_texto  text,
  prazo_dias    smallint not null check (prazo_dias between 1 and 90), -- configurado pelo lojista
  prazo_limite  date generated always as (data_aviso + prazo_dias) stored,
  observacoes   text,
  resultado_obs text,
  aberta_em     timestamptz not null default now(),
  resolvida_em  timestamptz,
  check ((status = 'aberta') = (resolvida_em is null))
);
create index contestacoes_loja_status_idx on public.contestacoes (loja_id, status, prazo_limite);

-- ---------------------------------------------------------------
-- Histórico (registro de tudo o que mudou em cada venda)
-- ---------------------------------------------------------------
create table public.historico (
  id        bigint generated always as identity primary key,
  loja_id   uuid not null references public.lojas(id) on delete cascade,
  venda_id  uuid not null references public.vendas(id) on delete cascade,
  texto     text not null,
  user_id   uuid references auth.users(id) default auth.uid(),
  criado_em timestamptz not null default now()
);
create index historico_venda_idx on public.historico (venda_id, criado_em desc);

-- ---------------------------------------------------------------
-- Segurança: RLS em todas as tabelas
-- ---------------------------------------------------------------
alter table public.lojas         enable row level security;
alter table public.membros_loja  enable row level security;
alter table public.vendas        enable row level security;
alter table public.provas        enable row level security;
alter table public.eventos       enable row level security;
alter table public.contestacoes  enable row level security;
alter table public.historico     enable row level security;

-- Lojas: qualquer usuário logado cria a sua; só membros veem; só o dono altera ou apaga
create policy lojas_insert on public.lojas for insert to authenticated with check (true);
create policy lojas_select on public.lojas for select to authenticated using (public.eh_membro(id));
create policy lojas_update on public.lojas for update to authenticated using (public.eh_dono(id)) with check (public.eh_dono(id));
create policy lojas_delete on public.lojas for delete to authenticated using (public.eh_dono(id));

-- Membros: membros veem a equipe; só o dono convida ou remove
create policy membros_select on public.membros_loja for select to authenticated using (public.eh_membro(loja_id));
create policy membros_insert on public.membros_loja for insert to authenticated with check (public.eh_dono(loja_id));
create policy membros_delete on public.membros_loja for delete to authenticated using (public.eh_dono(loja_id));

-- Tabelas do dia a dia: qualquer membro da loja lê e escreve
create policy vendas_tudo on public.vendas for all to authenticated
  using (public.eh_membro(loja_id)) with check (public.eh_membro(loja_id));
create policy provas_tudo on public.provas for all to authenticated
  using (public.eh_membro(loja_id)) with check (public.eh_membro(loja_id));
create policy eventos_tudo on public.eventos for all to authenticated
  using (public.eh_membro(loja_id)) with check (public.eh_membro(loja_id));
create policy contestacoes_tudo on public.contestacoes for all to authenticated
  using (public.eh_membro(loja_id)) with check (public.eh_membro(loja_id));

-- Histórico: membros leem e acrescentam; ninguém edita nem apaga pelo app
create policy historico_select on public.historico for select to authenticated using (public.eh_membro(loja_id));
create policy historico_insert on public.historico for insert to authenticated with check (public.eh_membro(loja_id));

-- ---------------------------------------------------------------
-- Storage: bucket privado para os arquivos de prova e o logo
-- Caminho obrigatório: <loja_id>/<venda_id ou "logo">/<arquivo>
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('provas', 'provas', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do nothing;

create policy provas_storage_select on storage.objects for select to authenticated
  using (bucket_id = 'provas' and public.eh_membro(((storage.foldername(name))[1])::uuid));
create policy provas_storage_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'provas' and public.eh_membro(((storage.foldername(name))[1])::uuid));
create policy provas_storage_delete on storage.objects for delete to authenticated
  using (bucket_id = 'provas' and public.eh_membro(((storage.foldername(name))[1])::uuid));
