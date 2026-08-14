# Análise Comparativa dos Projetos

Fiz essa análise a partir das cópias dos códigos que trouxe pra dentro deste repo (`projetos`). São os 4 projetos que eu tinha planejado no briefing; `/site` e `/sis` ainda ficam **pendentes de importação** (detalhes na seção de status lá embaixo) até eu resolver o acesso da integração do Claude aos repositórios privados `STRATON-AI/site-straton` e `STRATON-AI/SIS`. Assim que importar o código dos dois, completo as seções deles.

---

## `/site` — Site institucional STRATON.AI

**Situação:** pendente de importação (repositório privado `STRATON-AI/site-straton`, ainda sem acesso liberado pra integração do Claude — mais detalhes no README).

Sem o código em mãos ainda não dá pra fechar stack, tamanho, formulários ou nota com precisão. Pelo que lembro do briefing original, o projeto usa Supabase, n8n/uazapi e integração com Google Calendar — então tem bastante segredo e integração externa envolvida, o que deve dar bom material pra bugs de segurança/integração assim que eu importar.

---

## `/sis` — SIS (Sistema Interno STRATON.AI)

**Situação:** pendente de importação (repositório privado `STRATON-AI/SIS`, mesma história do acesso ainda não liberado — ver README).

Ainda não tenho o código pra preencher essa parte.

---

## `/houston-education` — Houston Education (projeto do Henrique Gennari)

**De quem é:** Henrique Gennari (github.com/HenriqueGennari), ele me deixou usar e entrei como colaborador.

**Stack:**
- Backend em Node.js + TypeScript
- Banco CockroachDB via Prisma ORM
- Frontend em HTML5/CSS3/JS puro, sem framework SPA
- Arquitetura MVC (controllers / services / repositories / routes / models)

**Tamanho:**
- Uns 143 arquivos `.ts`/`.js`/`.html` (fora `node_modules`)
- 9 módulos de domínio no backend (Aluno, Auditoria, Campus, Curso, Disciplina, Inscricoes, Local, Login, Monitoria), cada um com controller/service/route próprio
- No frontend: login, cadastro, perfil, dashboard de usuário, dashboard admin, gestão de monitorias

**Formulários e pontos de entrada de usuário:**
- Pelo menos 10 arquivos com `<form>` ou campo de senha, incluindo cadastro, login e edição de perfil
- Autenticação própria com JWT (`src/utils/jwt`) e uma camada de segurança dedicada (`src/utils/security`)
- Painel admin com CRUD completo em todas as entidades — dá bastante espaço pra bugs de autorização, tipo aluno conseguindo acessar rota de admin

**Maturidade do código:**
Bem estruturado — segue MVC direitinho, camadas separadas (controller/service/repository), tem testes (`/tests`), CI (`.github`), documentação própria (`/docs`, SRS no padrão IEEE 830) e changelog. É projeto acadêmico, mas organizado com prática de engenharia de verdade.

**Nota pra bugs propositais (1–5): 5/5**
Tem autenticação própria, painel admin com CRUD, vários formulários e camadas bem definidas — dá pra colocar bugs variados e realistas (validação de formulário, off-by-one em vaga/cota, condição de autorização invertida, exposição de dado sensível) sem bagunçar a estrutura do projeto.

---

## `/prevismob` — PrevIsmob (meu TCC)

**De quem é:** TCC que fiz em grupo (eu, José Guilherme Ferreira dos Santos, Kaua Alves Guerreiro, Eduardo Borges de Carvalho). Original em github.com/joseguilherme01/Prevismob.

**Stack:**
- Backend em Python (FastAPI, `api.py`), SQLAlchemy + MySQL
- Modelo de ML pré-treinado (`modelo_imoveis.pkl`, carregado via joblib) pra prever preço de imóveis
- Integrações externas: Google Maps API (Geocoding + Places), Google OAuth 2.0
- Frontend em HTML/CSS/JS puro, 4 páginas (landing, previsão, histórico, comparação) mais recuperação de senha
- Autenticação com JWT (access + refresh), verificação de e-mail, login social via Google

**Tamanho:**
- 16 arquivos `.py` fora de testes (backend concentrado no `api.py`, mais scripts de treino/processamento)
- 6 páginas HTML principais (index/landing, previsão, histórico, comparar, recuperar-senha, reset-senha)
- API versionada (`/v1/...`) com endpoints de auth, previsão, histórico, comparação, exportação (CSV/PDF) e exclusão de conta (LGPD)

**Formulários e pontos de entrada de usuário:**
- Cadastro/login com senha na landing, mais recuperação e reset de senha
- Formulário de previsão (nome do prédio, área, condomínio, quartos, vagas)
- Fluxo de cota diária (visitante vs. autenticado) e exclusão de conta — bons candidatos pra bug lógico, tipo off-by-one na cota ou bypass de limite
- Login social Google com verificação de ID Token — dá pra colocar bug de validação/autorização ali também

**Maturidade do código:**
Bem estruturado e documentado — README extenso, README de arquitetura separado, README de testes com suíte formal (IEEE 829/ISTQB: 44 casos automatizados em pytest + 29 em Selenium), migrações versionadas, CONTRIBUICOES.md dividindo quem fez o quê. Pra ser TCC, tá acima da média em maturidade.

**Nota pra bugs propositais (1–5): 5/5**
Vários formulários, autenticação própria + OAuth, lógica de cota e exportação de dados — dá pra variar bastante nos bugs (validação de formulário, condição de cota invertida, exposição de dado sensível na resposta da API, bypass de verificação de e-mail). Os testes que já existem também ajudam a mostrar o "antes e depois" quando eu corrigir.

---

## Status de importação

| Projeto | Situação |
|---|---|
| `/site` | ⏳ Pendente — falta liberar acesso da integração do Claude ao repositório privado |
| `/sis` | ⏳ Pendente — mesma coisa, falta liberar acesso ao repositório privado |
| `/houston-education` | ✅ Importado e sanitizado (não achei nenhum segredo real) |
| `/prevismob` | ✅ Importado e sanitizado (não achei nenhum segredo real) |

## PARE — preciso confirmar antes de ir pra Fase 2

Como combinei no briefing, só avanço pra Fase 2 (os bugs propositais) depois de eu ler essa análise e escolher 3 dos 4 projetos. Com `/site` e `/sis` ainda pendentes, minha escolha final fica travada até terminar a importação — mas já posso adiantar considerando `/houston-education` e `/prevismob` como certos (os dois tiraram 5/5) e decidir o terceiro entre `/site` e `/sis` assim que estiverem disponíveis.
