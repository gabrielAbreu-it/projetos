-- Aprova Hub · estrutura do banco para a versão com login (Supabase / Postgres)
-- Rode este arquivo inteiro no SQL Editor do Supabase.
-- Regras gerais:
--   * o aluno vê e edita só os próprios registros;
--   * o mentor vê os registros dos alunos das turmas dele (e não edita o que é do aluno);
--   * escola (plano cursinho) agrupa vários mentores;
--   * o ranking é calculado por uma função que devolve só nome e pontos, nunca os dados brutos dos colegas.

create extension if not exists pgcrypto;

-- Perfil de cada pessoa (ligado ao usuário do Supabase Auth)
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 120),
  whatsapp text check (whatsapp ~ '^[0-9]{10,13}$'),
  criado_em timestamptz not null default now()
);

-- Escola ou cursinho (plano com vários mentores)
create table public.escolas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  dono_id uuid not null references public.perfis (id),
  criado_em timestamptz not null default now()
);

create table public.escola_mentores (
  escola_id uuid not null references public.escolas (id) on delete cascade,
  mentor_id uuid not null references public.perfis (id) on delete cascade,
  papel text not null default 'mentor' check (papel in ('admin', 'mentor')),
  primary key (escola_id, mentor_id)
);

-- Assinatura do mentor ou da escola (cobrança fica no provedor de pagamento)
create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.perfis (id) on delete cascade,
  escola_id uuid references public.escolas (id) on delete cascade,
  plano text not null check (plano in ('solo', 'turma_grande', 'escola')),
  status text not null default 'teste' check (status in ('teste', 'ativa', 'atrasada', 'cancelada')),
  limite_alunos int not null default 30,
  renova_em date,
  check ((mentor_id is not null) <> (escola_id is not null))
);

-- Turmas
create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.perfis (id) on delete cascade,
  escola_id uuid references public.escolas (id) on delete set null,
  nome text not null,
  concurso text,
  criado_em timestamptz not null default now()
);
create index turmas_mentor_idx on public.turmas (mentor_id);

-- Alunos de cada turma (o aluno entra por convite)
create table public.turma_alunos (
  turma_id uuid not null references public.turmas (id) on delete cascade,
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  entrou_em date not null default current_date,
  ativo boolean not null default true,
  primary key (turma_id, aluno_id)
);
create index turma_alunos_aluno_idx on public.turma_alunos (aluno_id);

-- Convites pendentes (mentor cadastra nome e WhatsApp antes do aluno criar conta)
create table public.convites (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas (id) on delete cascade,
  nome text not null,
  whatsapp text not null check (whatsapp ~ '^[0-9]{10,13}$'),
  codigo text not null unique default encode(gen_random_bytes(6), 'hex'),
  usado_em timestamptz
);

-- Matérias (lista fixa editável pelo mentor)
create table public.materias (
  id text primary key,
  nome text not null
);
insert into public.materias (id, nome) values
  ('port', 'Português'), ('rl', 'Raciocínio lógico'), ('const', 'Direito constitucional'),
  ('adm', 'Direito administrativo'), ('info', 'Informática');

-- Check-in: sessão de estudo. A prova de estudo é o número de questões.
create table public.sessoes (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  data date not null default current_date,
  materia_id text not null references public.materias (id),
  minutos int not null check (minutos between 1 and 720),
  questoes int not null check (questoes between 1 and 500),
  acertos int not null check (acertos >= 0),
  criado_em timestamptz not null default now(),
  check (acertos <= questoes)
);
create index sessoes_aluno_data_idx on public.sessoes (aluno_id, data desc);

-- Plano da semana da turma
create table public.planos (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references public.turmas (id) on delete cascade,
  semana date not null check (extract(isodow from semana) = 1), -- sempre segunda-feira
  recado text check (char_length(recado) <= 280),
  publicado_em timestamptz not null default now(),
  unique (turma_id, semana)
);

create table public.plano_metas (
  plano_id uuid not null references public.planos (id) on delete cascade,
  materia_id text not null references public.materias (id),
  questoes int not null check (questoes between 1 and 2000),
  horas numeric(4,1) not null check (horas > 0 and horas <= 80),
  primary key (plano_id, materia_id)
);

-- Simulado relâmpago: questões e tentativas
create table public.simulados (
  id uuid primary key default gen_random_uuid(),
  semana date not null unique check (extract(isodow from semana) = 1),
  questoes jsonb not null -- [{enunciado, opcoes[], certa, explicacao, materia_id, assunto}]
);

create table public.tentativas (
  id uuid primary key default gen_random_uuid(),
  simulado_id uuid not null references public.simulados (id) on delete cascade,
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  respostas smallint[] not null,
  acertos smallint not null check (acertos between 0 and 10),
  feito_em timestamptz not null default now(),
  unique (simulado_id, aluno_id) -- uma tentativa por semana
);

-- Caderno de erros com revisão em 1, 7 e 21 dias
create table public.erros (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references public.perfis (id) on delete cascade,
  materia_id text not null references public.materias (id),
  assunto text not null check (char_length(assunto) between 3 and 80),
  anotacao text not null check (char_length(anotacao) between 10 and 600),
  origem text not null default 'manual',
  criado_em date not null default current_date
);
create index erros_aluno_idx on public.erros (aluno_id);

create table public.revisoes (
  erro_id uuid not null references public.erros (id) on delete cascade,
  etapa smallint not null check (etapa in (1, 7, 21)),
  data date not null,
  feita_em date,
  adiada smallint not null default 0,
  primary key (erro_id, etapa)
);
create index revisoes_pendentes_idx on public.revisoes (data) where feita_em is null;

-- Cria as três revisões automaticamente ao registrar um erro
create or replace function public.criar_revisoes() returns trigger language plpgsql as $$
begin
  insert into public.revisoes (erro_id, etapa, data)
  select new.id, e, new.criado_em + e from unnest(array[1, 7, 21]) as e;
  return new;
end $$;
create trigger erros_revisoes after insert on public.erros
  for each row execute function public.criar_revisoes();

-- ---------- Funções de apoio às regras de acesso ----------

-- O usuário atual é mentor deste aluno? (dono de alguma turma em que o aluno está)
create or replace function public.sou_mentor_de(p_aluno uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from turma_alunos ta join turmas t on t.id = ta.turma_id
    where ta.aluno_id = p_aluno and (t.mentor_id = auth.uid()
      or exists (select 1 from escola_mentores em where em.escola_id = t.escola_id and em.mentor_id = auth.uid() and em.papel = 'admin'))
  );
$$;

-- O usuário atual participa desta turma (como mentor ou aluno)?
create or replace function public.participo_da_turma(p_turma uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from turmas where id = p_turma and mentor_id = auth.uid())
      or exists (select 1 from turma_alunos where turma_id = p_turma and aluno_id = auth.uid() and ativo);
$$;

-- Funções da escola (evitam recursão entre as regras de escolas e escola_mentores)
create or replace function public.sou_dono_escola(p_escola uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from escolas where id = p_escola and dono_id = auth.uid());
$$;
create or replace function public.sou_da_escola(p_escola uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.sou_dono_escola(p_escola)
      or exists (select 1 from escola_mentores where escola_id = p_escola and mentor_id = auth.uid());
$$;

-- Ranking da semana: devolve só nome e pontos (regra igual à do app)
create or replace function public.ranking_semana(p_turma uuid, p_semana date)
returns table (aluno_id uuid, nome text, pontos int, dias int)
language sql stable security definer set search_path = public as $$
  with alunos as (
    select ta.aluno_id from turma_alunos ta where ta.turma_id = p_turma and ta.ativo
  ), por_dia as (
    select s.aluno_id, s.data, least(sum(s.acertos), 60) as ac
    from sessoes s join alunos a using (aluno_id)
    where s.data between p_semana and p_semana + 6
    group by s.aluno_id, s.data
  ), sim as (
    select t.aluno_id, t.acertos * 3 as pts
    from tentativas t join simulados si on si.id = t.simulado_id
    where si.semana = p_semana
  )
  select a.aluno_id, p.nome,
         (coalesce(sum(d.ac), 0) + 15 * count(d.data) + coalesce(max(sim.pts), 0))::int,
         count(d.data)::int
  from alunos a join perfis p on p.id = a.aluno_id
  left join por_dia d on d.aluno_id = a.aluno_id
  left join sim on sim.aluno_id = a.aluno_id
  where public.participo_da_turma(p_turma)
  group by a.aluno_id, p.nome
  order by 3 desc;
$$;

-- ---------- Row Level Security ----------
alter table public.perfis enable row level security;
alter table public.escolas enable row level security;
alter table public.escola_mentores enable row level security;
alter table public.assinaturas enable row level security;
alter table public.turmas enable row level security;
alter table public.turma_alunos enable row level security;
alter table public.convites enable row level security;
alter table public.materias enable row level security;
alter table public.sessoes enable row level security;
alter table public.planos enable row level security;
alter table public.plano_metas enable row level security;
alter table public.simulados enable row level security;
alter table public.tentativas enable row level security;
alter table public.erros enable row level security;
alter table public.revisoes enable row level security;

-- Perfis: cada um edita o seu; o mentor lê o dos seus alunos
create policy perfil_proprio on public.perfis for all using (id = auth.uid()) with check (id = auth.uid());
create policy perfil_mentor_le on public.perfis for select using (public.sou_mentor_de(id));

-- Escolas
create policy escola_membros on public.escolas for select using (public.sou_da_escola(id));
create policy escola_dono on public.escolas for all using (dono_id = auth.uid()) with check (dono_id = auth.uid());
create policy escola_mentores_le on public.escola_mentores for select using (mentor_id = auth.uid() or public.sou_dono_escola(escola_id));
create policy escola_mentores_dono on public.escola_mentores for all using (public.sou_dono_escola(escola_id));

-- Assinaturas: só leitura pelo dono (gravação vem do servidor de pagamento com a chave de serviço)
create policy assinatura_le on public.assinaturas for select using (mentor_id = auth.uid() or public.sou_dono_escola(escola_id));

-- Turmas: mentor gerencia as suas; aluno lê as turmas em que está
create policy turma_mentor on public.turmas for all using (mentor_id = auth.uid()) with check (mentor_id = auth.uid());
create policy turma_aluno_le on public.turmas for select using (public.participo_da_turma(id));

create policy turma_alunos_mentor on public.turma_alunos for all using (
  exists (select 1 from public.turmas t where t.id = turma_id and t.mentor_id = auth.uid()));
create policy turma_alunos_proprio on public.turma_alunos for select using (aluno_id = auth.uid());

create policy convites_mentor on public.convites for all using (
  exists (select 1 from public.turmas t where t.id = turma_id and t.mentor_id = auth.uid()));

-- Matérias: leitura para quem está logado
create policy materias_le on public.materias for select using (auth.role() = 'authenticated');

-- Sessões: aluno faz tudo nas suas; mentor só lê
create policy sessoes_aluno on public.sessoes for all using (aluno_id = auth.uid()) with check (aluno_id = auth.uid());
create policy sessoes_mentor_le on public.sessoes for select using (public.sou_mentor_de(aluno_id));

-- Planos: mentor da turma escreve; alunos da turma leem
create policy planos_le on public.planos for select using (public.participo_da_turma(turma_id));
create policy planos_mentor on public.planos for all using (
  exists (select 1 from public.turmas t where t.id = turma_id and t.mentor_id = auth.uid()));
create policy metas_le on public.plano_metas for select using (
  exists (select 1 from public.planos p where p.id = plano_id and public.participo_da_turma(p.turma_id)));
create policy metas_mentor on public.plano_metas for all using (
  exists (select 1 from public.planos p join public.turmas t on t.id = p.turma_id where p.id = plano_id and t.mentor_id = auth.uid()));

-- Simulados: leitura para logados (o gabarito deve ir por uma view sem a coluna "certa" na versão final)
create policy simulados_le on public.simulados for select using (auth.role() = 'authenticated');

-- Tentativas: aluno cria e lê a sua (não edita); mentor lê
create policy tentativas_aluno_ins on public.tentativas for insert with check (aluno_id = auth.uid());
create policy tentativas_aluno_le on public.tentativas for select using (aluno_id = auth.uid());
create policy tentativas_mentor_le on public.tentativas for select using (public.sou_mentor_de(aluno_id));

-- Caderno de erros: só o aluno vê o conteúdo. O mentor recebe só contagens pela função abaixo.
create policy erros_aluno on public.erros for all using (aluno_id = auth.uid()) with check (aluno_id = auth.uid());
create policy revisoes_aluno on public.revisoes for all using (
  exists (select 1 from public.erros e where e.id = erro_id and e.aluno_id = auth.uid()));

create or replace function public.resumo_caderno(p_aluno uuid)
returns table (erros int, revisoes_atrasadas int)
language sql stable security definer set search_path = public as $$
  select (select count(*) from erros where aluno_id = p_aluno)::int,
         (select count(*) from revisoes r join erros e on e.id = r.erro_id
           where e.aluno_id = p_aluno and r.feita_em is null and r.data < current_date)::int
  where p_aluno = auth.uid() or public.sou_mentor_de(p_aluno);
$$;
