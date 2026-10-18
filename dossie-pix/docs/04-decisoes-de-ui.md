# 04 · Decisões de UI

## Identidade

O assunto é dinheiro e defesa, então quis um visual **sério e calmo**, mais perto de um documento do que de um app de promoção. Também precisava ser diferente dos meus outros projetos (Roxx Energy é escuro com verde neon, Agendaí é verde petróleo claro, Pila é azul-tinta com amarelo, Lembra é azul com laranja, Vizinho é índigo com coral).

- **Grafite** no menu, na capa do dossiê e nos títulos: dá peso de documento.
- **Verde-esmeralda** para a ação principal e para "prova forte": proteção, sem cara de alerta.
- **Âmbar** para atenção (prova média e o selo "prazo configurado"), **laranja queimado** para prazo perto e **vermelho** só para erro, prova fraca e contestação perdida.
- O ícone é um escudo com um visto: "esta venda está protegida".

## Paleta e contraste (WCAG AA)

| Token | Cor | Uso | Contraste |
|---|---|---|---|
| `--dp-ink` | #1E2427 | texto sobre branco | 15,71:1 |
| `--dp-text-2` | #4F5A5E | texto secundário sobre branco | 7,10:1 |
| `--dp-emerald` | #0B7A5C | texto branco no botão principal | 5,31:1 |
| `--dp-emerald-text` | #08664D | links e "prova forte" sobre #E1F2EC | 6,00:1 |
| `--dp-amber-text` | #6B5A00 | "prova média" e selo de prazo sobre #FFF1D6 | 6,09:1 |
| `--dp-urgent-text` | #9A3412 | prazo perto sobre #FFEDD5 | 6,38:1 |
| `--dp-danger` | #B42318 | erro sobre branco / sobre #FDECEA | 6,57:1 / 5,75:1 |
| `--dp-on-graphite` | #E9EEEC | texto do menu sobre grafite | 13,39:1 |
| `--dp-on-graphite-2` | #A9B6B2 | texto secundário do menu | 7,50:1 |
| `--dp-mint` | #5FD4A8 | item ativo e foco no menu grafite | 8,58:1 |
| `--dp-line-strong` | #7C8784 | borda de campo sobre branco | 3,71:1 |

Nenhum estado depende só de cor: força da prova e prazo sempre têm ícone e texto ("Prova fraca", "Faltam 2 dias").

## Tipografia

- **IBM Plex Serif** (600) para títulos, valores grandes e o dossiê: lembra documento formal sem ficar antiquada.
- **IBM Plex Sans** (400 a 700) para a interface: legível em tela pequena, números claros.
- **IBM Plex Mono** para o ID do Pix e o código de rastreio, que o lojista confere caractere por caractere.

## Componentes

- **Selo de força da prova** (sem prova, fraca, média, forte) e **barra de força** com o que foi feito: "3 de 7 itens".
- **Checklist com motivo**: cada item diz por que importa e tem o botão certo ao lado (Anexar, Informar rastreio, Adicionar ID). Itens que não se aplicam ao tipo de entrega aparecem em cinza, marcados como "não se aplica", e não contam.
- **Contagem regressiva**: quadrado com o número de dias, que muda de tom quando faltam 2 dias ou menos e quando passa do prazo.
- **Selo "prazo configurado"**: aparece ao lado de toda data limite, para lembrar que o prazo vem do lojista e precisa ser conferido com a instituição.
- **Área de anexo** com limite escrito antes de enviar, compactação automática de fotos e mensagem no próprio campo quando o arquivo não serve.
- **Dossiê**: capa, sumário numerado, tabelas de resumo, linha do tempo, checklist, miniaturas, declaração com linha de assinatura e anexos em tamanho grande. CSS de impressão próprio (A4, quebras de página controladas, sem menus).
- **Diálogos** para ações que não têm volta (remover prova, excluir venda) e **aviso com Desfazer** para marcar contestação como ganha ou perdida.

## Acessibilidade

- Foco visível em tudo (anel verde no fundo claro, menta no grafite); link "Pular para o conteúdo".
- Alvos de toque de no mínimo 44 px, inclusive filtros, abas e botões do aviso.
- Todos os campos com label; erros ligados ao campo, resumo no topo com links e foco levado ao resumo.
- Avisos em região `aria-live`; abas navegáveis por setas; contagem de resultados da busca anunciada.
- CPF do cliente aparece escondido na lista (\*\*\*.456.789-\*\*) e completo só no dossiê.
