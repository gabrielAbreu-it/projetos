# 03 · Fluxos

## Mapa do app

- **Painel**: vendas protegidas, contestações abertas com contagem regressiva, valor em risco, taxa de dossiês completos e vendas que precisam de prova
- **Vendas**: lista com busca e filtros (sem prova, prova fraca, contestadas, resolvidas)
- **Registrar venda** (e editar): valor, data, cliente, produto, ID do Pix, canal, tipo de entrega
- **Venda registrada**: confirmação com o próximo passo
- **Venda**: força da prova, provas anexadas, rastreio, linha do tempo, dados, histórico
- **Abrir contestação**: data do aviso, motivo alegado, prazo configurável
- **Dossiê**: documento para imprimir ou salvar em PDF
- **Contestações**: abertas e histórico com resultado
- **Ajustes**: dados da loja, logo, prazo padrão e cópia dos dados

No computador, menu lateral; no celular, barra inferior com Painel, Vendas, Nova venda, Contestações e Ajustes.

## Fluxo principal: registrar a venda e guardar as provas

```mermaid
flowchart TD
  A([Pix recebido]) --> B[Registrar venda]
  B --> C{Campos válidos?}
  C -- Não --> D[Erro no campo e resumo com links]
  D --> B
  C -- Sim --> E[Venda registrada: próximo passo]
  E --> F[Anexar provas agora]
  F --> G{Arquivo aceito?}
  G -- Grande demais ou formato errado --> H[Aviso amigável com o que fazer]
  H --> F
  G -- Imagem grande --> I[Compacta automaticamente]
  I --> J[Checklist atualiza a força]
  G -- Sim --> J
  J --> K{Prova forte?}
  K -- Não --> F
  K -- Sim --> L([Venda protegida])
```

## Fluxo da contestação

```mermaid
flowchart TD
  A([Banco avisa pedido de devolução]) --> B[Abre a venda]
  B --> C[Abrir contestação]
  C --> D[Data do aviso e motivo alegado]
  D --> E[Prazo em dias: vem do exemplo dos Ajustes]
  E --> F[Confere o prazo real com o banco]
  F --> G[Contagem regressiva no painel e na venda]
  G --> H{Provas completas?}
  H -- Não --> I[Completar provas pelo checklist]
  I --> H
  H -- Sim --> J[Gerar dossiê e salvar em PDF]
  J --> K[Envia pelo canal da instituição]
  K --> L{Resposta do banco}
  L -- Valor fica com a loja --> M[Marcar como ganha]
  L -- Valor devolvido --> N[Marcar como perdida]
  M --> O[Histórico com desfazer]
  N --> O
```

## Estados de cada tela

| Tela | Estados |
|---|---|
| Painel | com dados, sem nenhuma venda, sem contestação aberta |
| Vendas | lista, busca sem resultado, filtro vazio, nenhuma venda |
| Registrar venda | vazio, erro por campo com resumo, aviso não bloqueante do ID do Pix |
| Venda | sem prova, fraca, média, forte; contestação aberta, perto do prazo, vencida, ganha, perdida |
| Anexar prova | carregando, compactada, arquivo grande, formato não aceito, espaço do navegador cheio |
| Abrir contestação | nova, edição, já resolvida |
| Dossiê | prova forte, aviso de prova incompleta |
| Qualquer venda | venda não encontrada |
