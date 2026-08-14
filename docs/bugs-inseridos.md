# Registro de bugs propositais inseridos

Log de cada bug inserido de propósito, pra usar de referência quando eu escrever os relatórios em Word (falha + como corrigir). Atualizado conforme vou inserindo em cada projeto.

---

## `/site`

### Bug 1 — validação de e-mail aceita formato inválido
- **Arquivo:** `site/index.html`, dentro do `<script>` no fim do arquivo
- **O que mudou:** troquei a regex de `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (exige um domínio com ponto, tipo `.com`) pra `/^[^\s@]+@[^\s@]+$/` (só exige um `@`, sem exigir domínio válido)
- **Como reproduzir:** preencher o formulário com um e-mail tipo `teste@teste` (sem domínio/TLD) — o formulário aceita e redireciona pra `obrigado.html` normalmente
- **Requisito violado:** requisito 1 do `docs/requisitos-site.md` ("o formulário só é enviado se o e-mail informado for válido")
- **Correção prevista:** voltar a regex pra exigir um domínio com ponto, ou trocar por uma validação de e-mail mais robusta

### Bug 2 — campo telefone deixou de ser obrigatório
- **Arquivo:** `site/index.html`, input `#telefone`
- **O que mudou:** removi o atributo `required` do campo de telefone (e adicionei `novalidate` no `<form>`, então nem a validação nativa do navegador barra isso)
- **Como reproduzir:** enviar o formulário com nome e e-mail preenchidos, telefone em branco — passa direto
- **Requisito violado:** requisito 2 do `docs/requisitos-site.md` ("todos os campos obrigatórios precisam estar preenchidos antes do envio")
- **Correção prevista:** devolver o `required` no input de telefone

### Observação — vulnerabilidade latente (sem correção de código isolada)
O formulário depende só de validação client-side (`novalidate` + JS) — nada impede alguém de mandar uma requisição direta pro endpoint de destino contornando o HTML inteiro. Como não existe backend real neste protótipo, documento isso como achado de arquitetura no relatório, não como bug com "antes/depois" de código.

---

## `/sis`

### Bug 1 — Financeiro aceita valor zero como gasto fixo
- **Arquivo:** `sis/app.js`, handler de submit do `#despesa-form`
- **O que mudou:** troquei `Number(valor) <= 0` por `Number(valor) < 0` na validação
- **Como reproduzir:** cadastrar um gasto fixo com valor `0` — o formulário aceita e soma `R$ 0,00` na lista
- **Requisito violado:** requisito 2 do `docs/requisitos-sis.md` ("valor numérico maior que zero")
- **Correção prevista:** voltar pra `<= 0`

### Bug 2 — marcar lead como frio apaga o histórico de follow-up
- **Arquivo:** `sis/app.js`, handler de click do `#save-status`
- **O que mudou:** adicionei um bloco que apaga `sis_followups[currentLeadId]` do localStorage sempre que `frio === "sim"` é salvo
- **Como reproduzir:** abrir um lead, registrar um follow-up, marcar "Lead frio? Sim" e salvar status — o histórico de follow-up some
- **Requisito violado:** requisito 1 do `docs/requisitos-sis.md` ("marcar lead como frio não deve apagar o histórico de follow-up")
- **Correção prevista:** remover o bloco que limpa `sis_followups`

### Bug 3 — cancelamento de agendamento acontece antes da confirmação
- **Arquivo:** `sis/app.js`, função `askCancel`
- **O que mudou:** a função já grava `status: "cancelado"` no localStorage e re-renderiza a agenda antes de abrir o modal — o modal virou só cosmético, clicar em "Voltar" não desfaz nada
- **Como reproduzir:** clicar em "Cancelar" num agendamento — o status já muda pra Cancelado mesmo sem clicar em "Confirmar cancelamento" no modal
- **Requisito violado:** requisito 3 do `docs/requisitos-sis.md` ("cancelar exige confirmação explícita no modal antes de mudar o status")
- **Correção prevista:** mover a gravação do status pra dentro de `confirmCancel()`, deixando `askCancel()` só abrir o modal

### Bug 4 — criar projeto com nome vazio
- **Arquivo:** `sis/app.js`, submit do `#novo-projeto-form`
- **O que mudou:** removi o `if (!nome) return;` que bloqueava a criação sem nome
- **Como reproduzir:** clicar em "Criar" sem preencher o campo de nome — cria um card de projeto sem nome
- **Requisito violado:** requisito 4 do `docs/requisitos-sis.md` ("criar projeto exige nome não-vazio")
- **Correção prevista:** devolver o `if (!nome) return;`

---

## `/houston-education`

**Nota sobre verificação:** o `npm install` desse projeto travou porque uma dependência tenta baixar um binário de `googlechromelabs.github.io` e a rede desta sessão bloqueia esse host — não tem relação com as minhas mudanças. Não consegui rodar `tsc`/testes de verdade, então validei os 4 diffs manualmente (mudanças pequenas e sintaticamente óbvias, seguindo o padrão já usado em outros pontos do mesmo arquivo). Recomendo rodar `npm install && npx tsc --noEmit` numa máquina sem esse bloqueio antes de considerar isso 100% validado.

### Bug 1 — validação de matrícula aceita 1 dígito a menos
- **Arquivo:** `houston-education/src/schemas/alunoSchema.ts`, `alunoCreateSchema`
- **O que mudou:** troquei a regex `/^\d{8,11}$/` por `/^\d{7,11}$/`
- **Como reproduzir:** enviar `POST /alunos` com matrícula de 7 dígitos — a validação do yup deixa passar, mesmo a mensagem de erro ainda dizendo "entre 8 e 11 dígitos"
- **Requisito violado:** requisito 1 do `docs/requisitos-houston-education.md`
- **Correção prevista:** voltar a regex pra `{8,11}`

### Bug 2 — condição de autorização invertida
- **Arquivo:** `houston-education/src/middlewares/autorizadoMiddleware.ts`
- **O que mudou:** removi o `!` de `if (!perfisPermitidos.includes(user.perfil))` — agora quem TEM o perfil permitido é bloqueado com 403, e quem NÃO tem passa
- **Como reproduzir:** chamar uma rota protegida com `autorizado(["ADMIN"])` logado como ADMIN — recebe 403; logado como aluno comum — a rota deixa passar
- **Requisito violado:** requisito 4 do `docs/requisitos-houston-education.md`
- **Correção prevista:** devolver o `!`

### Bug 3 — hash de senha exposto em `GET /alunos/:id`
- **Arquivo:** `houston-education/src/repositories/Prisma/AlunoPrismaRepository.ts`, método `getById`
- **O que mudou:** adicionei `senha: true` no `select` (o `getById` original não trazia esse campo, só o `findByEmailAndMatricula` interno trazia)
- **Como reproduzir:** `GET /alunos/:id` — a resposta passa a incluir o campo `senha` com o hash bcrypt
- **Requisito violado:** requisito 6 do `docs/requisitos-houston-education.md`
- **Correção prevista:** remover `senha: true` do select

### Bug 4 — condição de inscrição duplicada invertida
- **Arquivo:** `houston-education/src/services/Inscricoes/InscricoesService.ts`, método `create`
- **O que mudou:** troquei `if (existeInscricao)` por `if (!existeInscricao)` — agora lança `INSCRICAO_JA_EXISTE` justamente quando NÃO existe inscrição prévia (bloqueando inscrição legítima) e deixa passar quando JÁ existe (permitindo duplicar)
- **Como reproduzir:** tentar inscrever um aluno numa monitoria pela primeira vez — recebe erro `INSCRICAO_JA_EXISTE` indevidamente; inscrever o mesmo aluno de novo na mesma monitoria — funciona e duplica
- **Requisito violado:** requisito 5 do `docs/requisitos-houston-education.md`
- **Correção prevista:** voltar pra `if (existeInscricao)`

---

## `/prevismob`

**Nota sobre verificação:** consegui instalar as dependências (`pip install -r requirements.txt` + `pytest`) e rodar a suíte de testes real do projeto. 9 testes falharam por causa dos bugs inseridos — ótima evidência objetiva pro relatório.

### Bug 1 — formulário de previsão aceita área zero
- **Arquivo:** `prevismob/api.py`, endpoint `POST /v1/prever`
- **O que mudou:** troquei `dados.Area_Util <= 0` por `dados.Area_Util < 0` na validação
- **Como reproduzir:** enviar `Area_Util: 0` no formulário de previsão — passa pela validação (não deveria)
- **Requisito violado:** requisito 3 do `docs/requisitos-prevismob.md`
- **Cobertura de teste existente:** nenhum teste da suíte cobre esse caso hoje — bug "silencioso", só encontrado testando manualmente ou escrevendo um teste novo
- **Correção prevista:** voltar pra `<= 0`

### Bug 2 — cota diária invertida entre guest e autenticado
- **Arquivo:** `prevismob/api.py`, endpoint `POST /v1/prever`
- **O que mudou:** troquei `daily_limit = DAILY_LIMIT_AUTH if is_authenticated else DAILY_LIMIT_GUEST` por `DAILY_LIMIT_GUEST if is_authenticated else DAILY_LIMIT_AUTH` — usuário autenticado passa a ter o limite menor do guest, e guest ganha o limite maior do autenticado
- **Como reproduzir:** logar e tentar fazer mais previsões que `DAILY_LIMIT_GUEST` — recebe 429 antes da hora
- **Requisito violado:** requisito 4 do `docs/requisitos-prevismob.md`
- **Cobertura de teste existente:** `tests/test_quotas_favoritos.py::test_quota_auth_retorna_limite_maior`, `test_prever_429_para_guest_no_terceiro_uso`, `test_prever_429_para_auth_no_decimo_primeiro_uso` — todos falharam
- **Correção prevista:** voltar pra `DAILY_LIMIT_AUTH if is_authenticated else DAILY_LIMIT_GUEST`

### Bug 3 — bypass de verificação de e-mail (invertido: só quem verificou é bloqueado)
- **Arquivo:** `prevismob/api.py`, endpoint `POST /v1/auth/login`
- **O que mudou:** troquei `if user.get("email_verificado_em") is None: raise 403` por `is not None` — agora quem NÃO verificou o e-mail consegue logar, e quem verificou é bloqueado
- **Como reproduzir:** criar conta, não verificar e-mail, tentar login — funciona (deveria bloquear); verificar e-mail e tentar login — bloqueia (deveria funcionar)
- **Requisito violado:** requisito 1 do `docs/requisitos-prevismob.md`
- **Cobertura de teste existente:** `tests/test_email_verification.py::test_login_de_nao_verificado_retorna_403` e `test_login_apos_verificar_retorna_200_com_token` falharam; efeito cascata em `tests/test_account_deletion.py` (3 testes), que dependem do helper de registrar+verificar+logar pra rodar
- **Correção prevista:** voltar pra `is None`

### Bug 4 — hash de senha exposto na resposta de autenticação
- **Arquivo:** `prevismob/api.py`, função `_build_user_payload` (usada em login, registro, refresh)
- **O que mudou:** adicionei `"senha_hash": user.get("senha_hash")` no dicionário retornado
- **Como reproduzir:** fazer login e olhar o campo `usuario` da resposta — inclui o hash bcrypt da senha
- **Requisito violado:** requisito 6 do `docs/requisitos-prevismob.md`
- **Cobertura de teste existente:** nenhum teste da suíte verifica os campos do payload de usuário hoje — bug "silencioso"
- **Correção prevista:** remover a linha `"senha_hash": ...`
