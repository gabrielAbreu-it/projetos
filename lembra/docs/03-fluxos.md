# 03 · Fluxos

## Fluxo principal: hora do remédio

```mermaid
flowchart TD
  A([Alarme toca]) --> B[Tela Agora: nome, dose e caixa]
  B --> C{O que a pessoa faz?}
  C -- Tomei --> D[Confirmação: Pronto, você tomou]
  D --> E{Marcou sem querer?}
  E -- Sim --> F[Desfazer] --> B
  E -- Não --> G([Cuidador vê: tudo certo])
  C -- Adiar 15 min --> H[Aviso: lembro de novo às 12:15]
  H --> A
  C -- Não responde em 30 min --> I[Dose atrasada]
  I --> J[Aviso para a pessoa e para o cuidador]
```

## Dose esquecida

```mermaid
flowchart TD
  A([Faixa vermelha: falta marcar 1 remédio]) --> B[Tela Dose esquecida]
  B --> C{O que aconteceu?}
  C -- Vou tomar agora --> D[Marca no horário de agora] --> E([Confirmação])
  C -- Já tinha tomado --> F[Marca no horário certo] --> G([Meu dia])
  C -- Não vou tomar --> H[Pergunta antes de confirmar] --> I[Fica anotado como não tomado] --> G
  B --> J[Ligar para a filha]
  B --> K[Aviso: na dúvida, não tome dose dobrada]
```

## Cadastro de remédio em passos

```mermaid
flowchart LR
  A([Adicionar remédio]) --> B[Passo 1: nome]
  B --> V1{Nome com 3 letras ou mais?}
  V1 -- Não --> E1[Erro explicado no campo] --> B
  V1 -- Sim --> C[Passo 2: forma e quantidade]
  C --> D[Passo 3: horários]
  D --> V2{Pelo menos um horário?}
  V2 -- Não --> E2[Erro: escolha um horário] --> D
  V2 -- Sim --> R[Revisar com opção de mudar cada item]
  R --> S([Salvo e destacado na lista])
```

## Visão do cuidador

```mermaid
flowchart LR
  A([Ana abre o app]) --> B{Alguma dose atrasada?}
  B -- Sim --> C[Alerta vermelho com o remédio e o atraso]
  C --> D[Ligar para a Lúcia]
  C --> E[Tocar o alarme dela de novo]
  B -- Não --> F[Tudo em dia]
  A --> G[Lista do dia, estoque e últimos 7 dias]
```

## Mapa de telas

| Aba | Telas |
|---|---|
| Agora | Agora, Confirmação "Tomei", Dose esquecida |
| Meu dia | Lista de manhã, tarde e noite, com desmarcar |
| Remédios | Lista e estoque, Cadastro em 3 passos e revisão |
| Ajustes | Tamanho da letra, contraste, alarme, quem acompanha |
| (celular do cuidador) | Visão do cuidador |
