# 03 · Fluxos

## Mapa do app

- **Boas-vindas** com escolha da atividade (ajusta os nomes das categorias)
- **Início**: quanto é seu, atalhos de entrada e saída, DAS do mês, limite anual, últimas movimentações
- **Registrar**: entrada ou saída, valor, categoria, negócio ou pessoal
- **Movimentações**: lista por dia com filtros
- **DAS**: status do mês, como pagar, lembrete, histórico
- **Limite anual**: barra, ritmo do ano e avisos
- **Relatório do mês**

Barra inferior: Início, Movimentos, Registrar, DAS e Relatório. O limite anual abre pelo cartão do início.

## Fluxo principal: registrar uma entrada

```mermaid
flowchart TD
  A([Abre o app]) --> B[Início: quanto é seu]
  B --> C[Toca em Entrada]
  C --> D[Digita o valor]
  D --> E[Escolhe a categoria]
  E --> F[Negócio ou pessoal já sugerido]
  F --> G{Valor e categoria ok?}
  G -- Não --> H[Erro no campo e resumo no topo]
  H --> D
  G -- Sim --> I[Registro confirmado]
  I --> J{O que fazer agora?}
  J -- Registrar outra --> C
  J -- Voltar --> B
```

## Fluxo do DAS

```mermaid
flowchart TD
  A[Lembrete 3 dias antes] --> B[Tela do DAS]
  B --> C{Já venceu?}
  C -- Não --> D[A pagar: valor e dia 20]
  C -- Sim --> E[Atrasado: gerar guia nova no canal oficial]
  D --> F[Paga no canal oficial]
  E --> F
  F --> G[Marcar como pago]
  G --> H{Confirma?}
  H -- Cancelar --> B
  H -- Sim --> I[Pago, com opção de desfazer]
```

## Estados que desenhei

| Tela | Estados |
|---|---|
| Boas-vindas | sem atividade escolhida (erro), atividade escolhida |
| Início | primeiro uso (vazio), com dados, limite acima de 80% |
| Registrar | entrada, saída, erro de valor, erro de categoria |
| Movimentações | com dados, filtro sem resultado (vazio) |
| DAS | a pagar, em atraso, pago, confirmação |
| Limite | abaixo e acima da marca de aviso |
