# Análise Comparativa dos Projetos

Documento gerado automaticamente a partir da cópia dos códigos-fonte para este repositório (`projetos`). Cobre os 4 projetos previstos no briefing; `/site` e `/sis` ficam com status **pendente de importação** (ver seção de status no final) até que o acesso da integração do Claude aos repositórios privados `STRATON-AI/site-straton` e `STRATON-AI/SIS` seja resolvido do lado do GitHub. As seções desses dois serão completadas automaticamente assim que os códigos forem importados.

---

## `/site` — Site institucional STRATON.AI

**Status:** pendente de importação (repositório privado `STRATON-AI/site-straton`, acesso ainda não liberado para a integração do Claude — ver nota no README principal).

Sem acesso ao código-fonte ainda, não é possível preencher stack, tamanho, formulários ou nota de adequação com precisão. Pelo briefing original, sabe-se apenas que o projeto usa Supabase, n8n/uazapi e integração com Google Calendar — ou seja, superfície relevante de segredos e integrações externas, o que sugere boa adequação a bugs de segurança/integração uma vez importado.

---

## `/sis` — SIS (Sistema Interno STRATON.AI)

**Status:** pendente de importação (repositório privado `STRATON-AI/SIS`, acesso ainda não liberado para a integração do Claude — ver nota no README principal).

Sem acesso ao código-fonte ainda, não é possível preencher esta seção.

---

## `/houston-education` — Houston Education (projeto do Henrique Gennari)

**Autoria:** Henrique Gennari (github.com/HenriqueGennari), incluído com autorização pessoal dele.

**Stack/tecnologias:**
- Backend: Node.js + TypeScript
- Banco de dados: CockroachDB via Prisma ORM
- Frontend: HTML5, CSS3, JavaScript puro (sem framework SPA)
- Arquitetura: MVC (controllers / services / repositories / routes / models)

**Tamanho aproximado:**
- ~143 arquivos `.ts`/`.js`/`.html` (fora `node_modules`)
- 9 módulos de domínio no backend (Aluno, Auditoria, Campus, Curso, Disciplina, Inscricoes, Local, Login, Monitoria), cada um com controller/service/route próprios
- Páginas de frontend: login, cadastro, perfil, dashboard de usuários, dashboard admin, listagem/gestão de monitorias

**Formulários/inputs de usuário (superfície de ataque):**
- Pelo menos 10 arquivos com `<form>` ou campos de senha (`type="password"`), incluindo cadastro, login e edição de perfil
- Fluxo de autenticação próprio (JWT, ver `src/utils/jwt`) e camada de segurança dedicada (`src/utils/security`)
- Painel administrativo com CRUD completo (criar/editar/deletar) sobre todas as entidades — superfície ampla para bugs de autorização (ex: aluno acessando rotas de admin)

**Nível de maturidade do código:**
Estruturado — segue padrão MVC consistente, separação clara entre camadas (controller/service/repository), inclui testes (`/tests`), CI (`.github`), documentação própria (`/docs`, SRS no padrão IEEE 830) e changelog. Projeto acadêmico, mas organizado com práticas de engenharia real.

**Recomendação (adequação a bugs propositais, 1–5): 5/5**
Autenticação própria, painel admin com CRUD, múltiplos formulários e camadas bem definidas tornam fácil introduzir bugs variados e realistas (validação de formulário, off-by-one em cotas/vagas, condição de autorização invertida, exposição de dado sensível) sem quebrar a estrutura geral do projeto.

---

## `/prevismob` — PrevIsmob (TCC do usuário)

**Autoria:** TCC em grupo do usuário (José Guilherme Ferreira dos Santos, Kaua Alves Guerreiro, Eduardo Borges de Carvalho, Gabriel de Abreu da Silva). Fonte original: github.com/joseguilherme01/Prevismob.

**Stack/tecnologias:**
- Backend: Python (FastAPI, `api.py`), SQLAlchemy + MySQL
- ML: modelo de regressão pré-treinado (`modelo_imoveis.pkl`, via joblib) para previsão de preço de imóveis
- Integrações externas: Google Maps API (Geocoding + Places), Google OAuth 2.0
- Frontend: HTML/CSS/JS puro, 4 páginas (landing, previsão, histórico, comparação) + recuperação de senha
- Autenticação: JWT (access + refresh), verificação de e-mail, login social Google

**Tamanho aproximado:**
- 16 arquivos `.py` fora de testes (backend concentrado em `api.py`, mais scripts de treino/processamento)
- 6 páginas HTML principais (index/landing, previsão, histórico, comparar, recuperar-senha, reset-senha)
- API versionada (`/v1/...`) com endpoints de auth, previsão, histórico, comparação, exportação (CSV/PDF) e exclusão de conta (LGPD)

**Formulários/inputs de usuário (superfície de ataque):**
- Formulários de cadastro/login (com senha) na landing, recuperação e reset de senha
- Formulário de previsão (nome do prédio, área, condomínio, quartos, vagas)
- Fluxo de cotas diárias (guest vs. autenticado) e exclusão de conta — bons candidatos a bugs lógicos (off-by-one em cota, bypass de limite)
- Login social Google (verificação de ID Token) — superfície pra bugs de validação/autorização

**Nível de maturidade do código:**
Estruturado e bem documentado — README extenso, README de arquitetura dedicado, README de testes com suíte formal (IEEE 829/ISTQB: 44 casos automatizados pytest + 29 casos Selenium), migrações versionadas, CONTRIBUICOES.md dividindo responsabilidades. Projeto de TCC com nível de maturidade acima da média para o formato.

**Recomendação (adequação a bugs propositais, 1–5): 5/5**
Múltiplos formulários, autenticação própria + OAuth, lógica de cotas e exportação de dados oferecem grande variedade de bugs plausíveis (validação de formulário, condição de cota invertida, exposição de dado sensível em resposta de API, bypass de verificação de e-mail). Testes existentes também facilitam mostrar "antes/depois" na correção.

---

## Status de importação

| Projeto | Status |
|---|---|
| `/site` | ⏳ Pendente — acesso ao repositório privado ainda não liberado para a integração do Claude |
| `/sis` | ⏳ Pendente — acesso ao repositório privado ainda não liberado para a integração do Claude |
| `/houston-education` | ✅ Importado e sanitizado (nenhum segredo real encontrado) |
| `/prevismob` | ✅ Importado e sanitizado (nenhum segredo real encontrado) |

## PARE — aguardando confirmação para a Fase 2

Conforme o briefing, a Fase 2 (bugs propositais) só deve avançar depois que o usuário ler esta análise e escolher 3 dos 4 projetos. Com `/site` e `/sis` ainda pendentes, a escolha final fica limitada até a importação ser concluída — mas o usuário pode adiantar a decisão considerando `/houston-education` e `/prevismob` como certos (ambos nota 5/5) e escolher o terceiro entre `/site` e `/sis` assim que estiverem disponíveis.
