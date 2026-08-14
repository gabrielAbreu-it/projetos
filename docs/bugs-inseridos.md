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

_(a preencher)_

---

## `/prevismob`

_(a preencher)_
