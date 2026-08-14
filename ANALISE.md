# Análise Comparativa dos Projetos

São os 4 projetos que tinha planejado no briefing. `/houston-education` e `/prevismob` são cópias reais de trabalho — analisei o código deles direto. Já `/site` e `/sis` acabei não conseguindo copiar (acesso ao repositório privado da empresa travou, um deles ainda travou num gate de PI) e virei o plano: escrevi protótipos originais pra eles, com a mesma proposta e identidade visual, mas código e conteúdo meus, do zero. Por isso as duas primeiras seções abaixo descrevem o protótipo que construí, não uma análise de código copiado.

Decisão de escopo: os 3 projetos que seguem pra Fase 2 (bugs propositais) são **`/houston-education`, `/prevismob` e `/sis`**. O `/site` fica de fora da Fase 2 por enquanto — ficou pronto como protótipo, mas não é prioridade pra bug injection.

---

## `/site` — Site institucional STRATON.AI (protótipo original)

**Situação:** protótipo escrito do zero, não é cópia do site real (sem acesso ao repositório privado `STRATON-AI/site-straton`).

**Stack:**
- HTML5/CSS3 puro, sem framework, uma folha de estilo compartilhada (`style.css`)
- JS vanilla só pra validação de formulário no cliente

**Tamanho:**
- 3 páginas: landing (`index.html`), confirmação pós-formulário (`obrigado.html`), política de privacidade (`privacidade.html`)

**Formulários e pontos de entrada de usuário:**
- Formulário de captação de lead na landing (nome, e-mail, telefone, empresa, mensagem), com validação de e-mail no cliente via regex

**Nível de maturidade:** protótipo simples, o suficiente pra ter um formulário real de captação pra eventualmente testar bug de validação — mas não é foco da Fase 2 agora.

---

## `/sis` — SIS (Sistema Interno STRATON.AI, protótipo original)

**Situação:** protótipo escrito do zero, a partir da especificação funcional real do sistema (sem acesso ao código do repositório privado `STRATON-AI/SIS`, e a tentativa de cópia direta foi barrada por um gate de segurança de propriedade intelectual).

**Stack:**
- HTML5/CSS3 puro + JS vanilla, sem framework
- Dados mockados em `app.js`, estado persistido em `localStorage` do navegador (sem backend/banco real neste protótipo)
- Identidade visual âmbar (`#F59E0B`) e preto, herdada do sistema real

**Tamanho:**
- 6 telas: Dashboard, Pipeline de Leads, Agenda, Financeiro, Projetos, Automações
- 1 `style.css` e 1 `app.js` compartilhados entre as telas

**Formulários e pontos de entrada de usuário (superfície de ataque pra Fase 2):**
- **Pipeline de Leads:** kanban por status (novo/contato/proposta/fechado/perdido), marcação de lead frio, formulário de follow-up salvo por lead
- **Financeiro:** formulário de cadastro de produto/valor com cálculo automático do total de gastos fixos — bom candidato pra bug de validação numérica (valor negativo, zero, não numérico)
- **Agenda:** cancelamento de agendamento via modal de confirmação — bom candidato pra bug de lógica/estado (cancelamento sem confirmação, ou não reverter estado)
- **Projetos:** criação de projeto e registro de dailys/sprints, barra de progresso

**Nível de maturidade:** protótipo de frontend funcional (não é MVP descartável — segue a proposta de "frontend robusto" do sistema real), mas sem integração de backend/API real, como combinado pro escopo do protótipo.

**Nota pra bugs propositais (1–5): 5/5**
Justamente por ter sido desenhado com a Fase 2 em mente: formulário de valor no Financeiro, fluxo de status/follow-up no Pipeline de Leads e cancelamento na Agenda dão bastante espaço pra bug de validação, lógica invertida e estado inconsistente.

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

## Status geral

| Projeto | Origem | Situação | Entra na Fase 2? |
|---|---|---|---|
| `/site` | Protótipo original | ✅ Pronto | Não, por enquanto |
| `/sis` | Protótipo original | ✅ Pronto | Sim |
| `/houston-education` | Cópia real (autorizada) | ✅ Importado e sanitizado | Sim |
| `/prevismob` | Cópia real (autorizada) | ✅ Importado e sanitizado | Sim |

## Fase 2 confirmada

Os 3 projetos escolhidos são **`/houston-education`, `/prevismob` e `/sis`**. Pra cada um, o próximo passo é: documento de requisitos, o protótipo com os bugs propositais embutidos, e o relatório em Word separado com as falhas e como corrigi-las.
