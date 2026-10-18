# 04 · Decisões de UI

## Identidade

O nome **Pila** vem da gíria para dinheiro. Quis uma marca amigável e confiável, longe do visual "banco sério" e também diferente dos meus outros projetos (Roxx Energy é escuro com verde neon; Agendaí é verde petróleo claro).

- **Azul-tinta** para confiança e para o cartão principal.
- **Amarelo milho** como destaque: botões principais, valor que sobra e o selo de alerta.
- **Fundo papel** (off-white quente) para não parecer planilha.

## Paleta e contraste (WCAG AA)

| Token | Cor | Uso | Contraste |
|---|---|---|---|
| `--pl-text` | #16203A | texto sobre fundo #F5F3EC | 14,53:1 |
| `--pl-text-2` | #4E5669 | texto secundário sobre fundo | 6,62:1 |
| `--pl-ink` | #1C2E5C | branco sobre o azul-tinta | 13,17:1 |
| `--pl-sun` | #F6C445 | amarelo sobre o azul-tinta (valor do hero) | 8,09:1 |
| `--pl-sun` | #F6C445 | texto azul-tinta sobre botão amarelo | 9,91:1 |
| `--pl-text-on-ink-2` | #CDD5EA | texto secundário sobre o azul-tinta | 8,97:1 |
| `--pl-in` | #15704A | entrada, sobre branco | 6,09:1 |
| `--pl-out` | #B3261E | saída e erro, sobre branco | 6,54:1 |
| `--pl-out` | #B3261E | erro sobre fundo de erro #FBE7E5 | 5,50:1 |
| `--pl-warn-text` | #7A4B00 | selo "exemplo" sobre #FDF1CC | 6,57:1 |
| `--pl-personal` | #6A3F94 | etiqueta "Pessoal" sobre #F1EAF8 | 6,49:1 |
| `--pl-line-strong` | #7A7F8C | borda de campo e interruptor desligado | 4,01:1 |

O amarelo **nunca** é usado como cor de texto sobre fundo claro. Entrada e saída não dependem só da cor: têm sinal (+ ou −), ícone e texto para leitor de tela.

## Tipografia

- **Bricolage Grotesque** (800) para títulos e valores grandes: tem personalidade e números bem largos.
- **Figtree** (400 a 700) para o resto: leitura fácil em tela pequena.
- Valores com números tabulares, para alinhar na lista.

## Componentes

- **Cartão "quanto é seu"**: o valor grande e, logo abaixo, a conta inteira (entrou, saiu, DAS, sobra).
- **Selo "exemplo"**: aparece em todo valor de DAS e de limite, para não parecer valor oficial.
- **Seletor negócio ou pessoal**: duas opções grandes, com cor e ícone próprios; vem sugerido pela categoria.
- **Campo de valor**: teclado numérico, prefixo R$, erro no próprio campo e resumo no topo com links.
- **Filtros em pílula** com estado pressionado anunciado e contador de resultados.
- **Barra do limite** com marcas de aviso em 70%, 80% e 90%.
- **Confirmação** em diálogo para ações que mudam status (marcar DAS como pago), com desfazer no aviso.

## Acessibilidade

- Foco visível em tudo (azul no fundo claro, amarelo no fundo azul).
- Alvos de toque de no mínimo 44 px.
- Todos os campos com label; erros ligados ao campo e foco levado ao primeiro erro.
- Avisos em região `aria-live`; diálogo fecha com Esc e devolve o controle.
- Navegação completa pelo teclado, com link para pular para o conteúdo.
