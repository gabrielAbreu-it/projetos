# 3. Fluxos

[← Voltar ao índice](README.md)

O ponto central do Vizinho é a encomenda passando da portaria para o morador. Os dois lados olham para o mesmo registro: o que o porteiro salva aparece no app na hora, e o que ele entrega some da tela inicial do morador.

## Encomenda: da chegada à retirada

```mermaid
flowchart LR
  A([Entregador chega]) --> B[Porteiro busca bloco e apartamento]
  B --> C[Tipo, descrição e foto opcional]
  C --> D[Registrar e avisar]
  D --> E[Morador recebe o aviso com o código]
  E --> F{Morador vai à portaria}
  F -- Com o código --> G[Porteiro digita o código]
  G --> H{Código confere?}
  H -- Não --> G
  H -- Sim --> I([Entregue, morador recebe confirmação])
  F -- Sem o código --> J[Entrega com nome e documento]
  J --> I
  D -. Parada há mais de 1 dia .-> K[Porteiro avisa de novo]
  K --> E
```

## Reserva de área comum

```mermaid
flowchart TD
  A([Morador abre Reservas]) --> B[Escolhe salão ou churrasqueira]
  B --> C[Escolhe o dia no calendário]
  C --> D[Escolhe almoço ou noite]
  D --> E[Lê as regras e concorda]
  E --> F{Faltou algo?}
  F -- Sim --> G[Mensagem no campo que falta]
  G --> C
  F -- Não --> H{Horário ainda livre?}
  H -- Não --> I[Conflito de horário com alternativas próximas]
  I --> D
  H -- Sim --> J([Reserva confirmada com taxa e prazo de cancelamento])
```

O calendário já mostra o que está ocupado, então o conflito só acontece quando outra unidade reserva o mesmo período enquanto a pessoa preenche. No protótipo isso está simulado no sábado, 24/10, à noite, no salão de festas.

## Avisos

```mermaid
flowchart LR
  A([Administração publica]) --> B{Importante?}
  B -- Sim --> C[Destaque no início e selo Importante]
  B -- Não --> D[Lista geral]
  C --> E[Morador abre e marca Estou ciente]
  D --> F[Morador abre e o aviso fica lido]
```

## Visitante

```mermaid
flowchart LR
  A([Morador abre Visitantes]) --> B[Nome, tipo, dia e horário limite]
  B --> C{Dados válidos?}
  C -- Não --> B
  C -- Sim --> D[Passe com código de 4 números]
  D --> E[Portaria vê na lista de hoje]
  E --> F([Registra a entrada e o morador é avisado])
```

## Mapa das telas

| App do morador | Painel da portaria |
|---|---|
| Início · Detalhe da encomenda | Encomendas na portaria (com o diálogo de entrega) |
| Reservar · Conflito · Reserva confirmada | Registrar encomenda |
| Avisos | Visitantes de hoje |
| Liberar visitante | |
