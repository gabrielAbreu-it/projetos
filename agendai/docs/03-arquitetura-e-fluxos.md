# 3. Arquitetura de informação e fluxos

[← Voltar ao índice](README.md)

## Arquitetura de informação

### App do cliente

Três abas. "Agendar" abre o fluxo em quatro passos.

```mermaid
flowchart TD
  I[Início do salão] --> A
  subgraph Abas
    I
    A[Agendar]
    M[Meus horários]
  end
  A --> A1[Passo 1: serviço]
  A1 --> A2[Passo 2: profissional ou sem preferência]
  A2 --> A3[Passo 3: data e hora]
  A3 --> A4[Passo 4: confirmar com nome e WhatsApp]
  A4 --> OK[Agendado]
  M --> M1[Próximos]
  M --> M2[Anteriores]
  M1 --> R[Remarcar]
  M1 --> C[Cancelar]
  M2 --> AG[Agendar de novo]
```

### Painel do dono

Cinco itens de menu. A agenda é a tela inicial.

```mermaid
flowchart TD
  P[Painel] --> AG[Agenda]
  P --> N[Números do mês]
  P --> CL[Clientes]
  P --> S[Serviços]
  P --> PR[Profissionais]
  AG --> AG1[Dia: uma coluna por profissional]
  AG --> AG2[Semana: filtro por profissional]
  AG --> AG3[Detalhe do horário]
  AG3 --> AG4[Confirmar, concluir, faltou, remarcar, cancelar]
  N --> N1[Faturamento por dia]
  N --> N2[Horários mais cheios]
  N --> N3[Faltas por profissional]
  CL --> CL1[Ficha: histórico, gasto, faltas, observações]
  S --> S1[Novo e editar serviço, ativar e ocultar]
  PR --> PR1[Novo profissional]
```

## Fluxo do cliente: agendar

```mermaid
flowchart LR
  A([Abre o link do salão]) --> B[Escolhe o serviço]
  B --> C{Tem preferência de profissional?}
  C -- Sim --> D[Escolhe o profissional]
  C -- Não --> E[Sem preferência]
  D --> F[Escolhe dia e horário livre]
  E --> F
  F --> G[Confere o resumo e informa nome e WhatsApp]
  G --> H{Dados válidos e horário ainda livre?}
  H -- Não --> I[Mensagem no campo ou volta para escolher outro horário]
  I --> F
  H -- Sim --> J([Agendado, confirmação no WhatsApp])
```

## Fluxo do cliente: remarcar e cancelar

```mermaid
flowchart LR
  A([Meus horários]) --> B{Falta mais de 2 horas?}
  B -- Não --> C[Aviso: falar com o salão]
  B -- Sim --> D{Remarcar ou cancelar?}
  D -- Remarcar --> E[Escolhe novo dia e hora]
  E --> F[Confirma de → para]
  F --> G([Remarcado])
  D -- Cancelar --> H[Modal com motivo opcional]
  H --> I([Cancelado, com Desfazer])
```

## Fluxo do dono: remarcar arrastando

```mermaid
flowchart LR
  A([Agenda do dia]) --> B[Arrasta o bloco do cliente]
  B --> C{Destino válido?}
  C -- Ocupado, fechado, passado ou profissional não faz o serviço --> D[Célula fica vermelha e o motivo aparece]
  D --> B
  C -- Sim --> E[Solta]
  E --> F([Remarcado, cliente avisado, botão Desfazer])
  A --> G[Teclado: abre o horário e usa Remarcar]
  G --> H[Escolhe profissional, data e horário livre]
  H --> F
```

## Priorização do MVP

Com os fluxos desenhados, separei o que entra na primeira versão. O critério: o que resolve a dor principal da jornada entra primeiro.

| Prioridade | O que | Por quê |
|---|---|---|
| Precisa ter | Agendar em 4 passos sem cadastro, só horários livres, agenda por profissional, remarcar e cancelar dos dois lados, status de confirmação | Resolve as três dores: horário perdido, falta e mensagem sem resposta |
| Deveria ter | Arrastar para remarcar, números do mês, ficha do cliente com observações | Deixam o dono mais rápido e dão visão do negócio |
| Poderia ter | Ir para uma data, lista de espera, bloqueio de agenda | Ajustes de quem já usa no dia a dia |
| Não agora | Comissões, estoque, pagamento online, marketplace | Aumentam muito o escopo e afastam o foco da agenda |
