# 01 · Problema e benchmark

## O problema

Quem trabalha por conta própria costuma usar **uma conta só** para tudo. O Pix da cliente cai na mesma conta do mercado de casa. No fim do mês a pessoa sabe o saldo, mas não sabe:

- quanto o trabalho realmente deu de lucro;
- quanto pode tirar para ela sem faltar para o material do mês seguinte;
- se já separou o dinheiro do **DAS**, a guia mensal do MEI, que vence todo dia 20;
- quanto falta para o **limite de faturamento anual** do MEI.

**Pergunta que guiou o projeto:** como mostrar, em uma tela, quanto do dinheiro do mês é de verdade da pessoa, sem exigir que ela entenda de contabilidade?

## Benchmark

Olhei cinco produtos conhecidos e anotei só características amplamente conhecidas de cada um.

| Produto | O que faz bem | O que não resolve para o MEI |
|---|---|---|
| **Mobills** | Lançamentos por categoria, cartões, orçamento e gráficos claros | Pensado para finanças pessoais; não separa negócio e casa |
| **Organizze** | Interface simples, registro rápido, relatórios fáceis | Também é pessoal; não fala de DAS nem de limite do MEI |
| **App MEI (governo)** | Canal oficial para emitir a guia do DAS e acompanhar a situação do CNPJ | Não acompanha o dinheiro do dia a dia nem mostra lucro |
| **Conta Azul** | Gestão completa: financeiro, notas, ligação com o contador | Feito para empresas maiores; muitos termos e telas para quem é sozinho |
| **Conta PJ de banco digital** (ex.: Nubank, Inter) | Separa o dinheiro do CNPJ numa conta própria, com Pix e boletos | Mostra saldo e extrato, mas a pergunta "quanto foi lucro?" continua com a pessoa |

## O que levei do benchmark

| Achado | Decisão no Pila |
|---|---|
| Apps pessoais tratam tudo como gasto de uma pessoa | Todo registro responde "de quem é esse dinheiro?": do negócio ou pessoal |
| O canal oficial resolve a guia, mas não conecta com o caixa | O DAS já sai da conta do "quanto é seu" e tem lembrete, com atalho para o canal oficial |
| Sistemas completos assustam quem trabalha sozinho | Uma pergunta principal na tela inicial, linguagem do dia a dia, sem termos contábeis |
| Conta PJ separa o dinheiro, mas não interpreta | O Pila funciona junto com qualquer conta e mostra a conta feita, passo a passo |

## Fora do escopo desta versão

- Emitir a guia do DAS dentro do app (o Pila leva para o canal oficial).
- Ler extrato bancário automaticamente.
- Emitir nota fiscal.
