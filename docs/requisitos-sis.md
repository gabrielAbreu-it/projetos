# Documento de Requisitos — SIS (protótipo original, com bugs propositais)

## Objetivo

Usar o protótipo original do SIS (`/sis`) — escrito do zero por mim, sem cópia do sistema real — como base pra um protótipo com bugs de segurança/QA inseridos de propósito, servindo de material de estudo e de portfólio pra entrevista.

## Escopo do protótipo

As 6 telas que já implementei: Dashboard, Pipeline de Leads, Agenda, Financeiro, Projetos, Automações. Dados mockados/`localStorage`, sem backend real — os requisitos abaixo valem pro comportamento client-side.

## Requisitos funcionais esperados (baseline, antes do bug)

1. **Pipeline de Leads:** trocar o status de um lead deve persistir e refletir no kanban; marcar lead como "frio" não deve apagar o histórico de follow-up já registrado
2. **Financeiro:** o formulário de gasto fixo só aceita produto não-vazio e valor numérico maior que zero; o total exibido é sempre a soma exata dos gastos cadastrados
3. **Agenda:** cancelar um agendamento exige confirmação explícita no modal antes de mudar o status; um agendamento já cancelado não pode ser cancelado de novo
4. **Projetos:** criar projeto exige nome não-vazio; adicionar daily/sprint não apaga as anteriores; a barra de progresso reflete o valor real armazenado

## Bugs propositais planejados (ver Issue #4 no GitHub)

- Validação numérica falhando no cadastro de gasto fixo (deixar passar valor negativo, zero ou não numérico)
- Lógica de status/follow-up quebrando (ex: perder histórico ao trocar status, ou marcar frio sem refletir no board)
- Cancelamento de agendamento sem confirmação real, ou não revertendo o estado corretamente
- Progresso não recalculando certo, ou permitir criar projeto com nome vazio

## Critério de aceite pra fase de correção

Por ser protótipo próprio (sem restrição de PI), a correção de cada bug deve vir com um teste manual documentado (passos + resultado esperado x obtido) no relatório final, já que não existe suíte automatizada aqui como no PrevIsmob.
