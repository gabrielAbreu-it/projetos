# 3. Arquitetura de informação e fluxos

[← Voltar ao índice](README.md)

## Arquitetura de informação

Quatro áreas na barra inferior. O mapa é a tela inicial porque a primeira pergunta do motorista é sempre "onde eu carrego?".

```mermaid
flowchart TD
  A[Onboarding] --> B[Cadastro do carro]
  B --> M

  subgraph Navbar
    M[Mapa]
    R[Recarga]
    H[Histórico]
    C[Meu carro]
  end

  M --> M1[Busca]
  M --> M2[Filtros: só livres, 50 kW ou mais, conector]
  M --> M3[Lista de estações]
  M3 --> E[Estação]
  E --> E1[Conectores e preço]
  E --> E2[Avaliações]
  E --> E3[Como chegar]
  E --> RV[Reserva]
  RV --> RC[Reserva confirmada]
  RC --> R
  R --> P[Pagamento]
  P --> RB[Recibo]
  H --> H1[Gasto do mês]
  H --> H2[Lista de recargas]
  C --> C1[Editar carro]
  C --> C2[Formas de pagamento]
```

## Fluxo principal: achar, reservar, carregar e pagar

```mermaid
flowchart LR
  A([Abre o app]) --> B[Mapa já filtrado pelo carro]
  B --> C{Tem estação livre?}
  C -- Não --> D[Liga 'Só livres' ou muda filtro]
  D --> B
  C -- Sim --> E[Abre a estação]
  E --> F{Conector compatível livre?}
  F -- Não --> B
  F -- Sim --> G[Reserva: conector + horário]
  G --> H[Reserva confirmada, tolerância de 15 min]
  H --> I[Chega e conecta o cabo]
  I --> J[Recarga em andamento]
  J --> K{Chegou na meta?}
  K -- Não --> L[Encerra antes, com confirmação]
  L --> M
  K -- Sim --> M[Pagamento: Pix ou cartão]
  M --> N([Recibo e histórico])
```

## Primeiro acesso

```mermaid
flowchart LR
  A([Instala]) --> B[Onboarding em 3 passos]
  B -- Pular --> C
  B --> C[Escolhe o modelo do carro]
  C --> D[Conectores preenchidos pelo modelo]
  D --> E{Dados válidos?}
  E -- Não --> F[Erro no campo, foco vai para ele]
  F --> C
  E -- Sim --> G([Mapa com filtro do carro])
```

## Caminhos alternativos e erros

```mermaid
flowchart TD
  A[Reserva confirmada] --> B{Quer cancelar?}
  B -- Sim --> C[Modal de confirmação]
  C --> D[Cancelada, taxa devolvida]
  D --> E[Toast com Desfazer]
  B -- Não --> F[Cheguei, iniciar recarga]

  G[Estação sem conector livre compatível] --> H[Botão Reservar desabilitado com motivo escrito]
  I[Filtros sem resultado] --> J[Estado vazio com Limpar filtros]
```
