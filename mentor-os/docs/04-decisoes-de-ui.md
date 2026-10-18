# 04 · Decisões de UI

## Identidade

Quis uma cara de "caderno de estudo" calmo, diferente dos meus outros projetos (nada de fundo escuro com neon, nada de azul). Escolhi **verde-floresta com lima** sobre um fundo papel levemente esverdeado. O verde-floresta passa seriedade; o lima marca conquista (sequência, faixa forte, cronômetro ligado).

## Paleta e contraste

| Token | Cor | Uso | Contraste |
|---|---|---|---|
| `--ink` | #14231a | Texto principal sobre `--paper` | 15,0:1 |
| `--muted` | #4f5d53 | Texto secundário sobre branco | 6,9:1 |
| `--primary` | #1d5a35 | Botão principal, texto branco por cima | 8,2:1 |
| `--forest-950` | #12301f | Menu lateral e cronômetro, com texto lima | 11,5:1 |
| `--lime` | #d4f36b | Destaques, com texto `--forest-900` | 8,2:1 |
| `--danger` | #b42318 | Erros e "sumiu", sobre `--danger-bg` | 5,8:1 |
| `--warn` | #7a4b00 | "Abaixo da meta", sobre `--warn-bg` | 6,6:1 |
| `--line-strong` | #7f8c82 | Borda de campos sobre branco | 3,5:1 (componente) |

Todo texto passa de 4,5:1 (AA). Bordas de campo e barras de progresso passam de 3:1. Situação nunca é só cor: sempre tem ícone e texto ("Sumiu há 5 dias", "Abaixo da meta").

## Tipografia

- **Lexend** para interface e números: foi desenhada para facilitar a leitura, o que combina com quem lê o dia todo. Números em largura fixa no cronômetro e nas tabelas.
- **Fraunces** só nos títulos e no número grande da sequência, para dar um tom editorial e acolhedor.

## Componentes principais

- **Seletor de visão** "Sou aluno" / "Sou mentor" sempre no topo.
- **Cartão de cronômetro** escuro, para se destacar como a ação do dia.
- **Selo de faixa** em três tons (lima, verde claro, areia), nenhum deles vermelho: estar em "Retomando" não é erro.
- **Barra de progresso** com `role="progressbar"` e valor anunciado.
- **Chips de situação** com ícone, texto e cor.
- **Resumo de erros** no topo do formulário com links para cada campo, e mensagem no próprio campo com exemplo.
- **Aviso (toast)** com `aria-live` e botão "Desfazer" quando a ação pode ser revertida.
- **Gráfico da semana** feito com CSS, com tabela escondida para leitor de tela.

## Layout

- No computador: menu lateral fixo e conteúdo em duas colunas.
- No celular: barra superior com o seletor, menu em gaveta e barra de abas embaixo. Tabela de alunos vira cartões.
- Sem rolagem horizontal de 360 a 1440 px (conferido).

## Acessibilidade

- Foco visível em azul com contorno branco, que aparece sobre fundo claro e escuro.
- Alvos de toque com pelo menos 44 px.
- Link "Pular para o conteúdo", títulos em ordem e foco levado ao título ao trocar de tela.
- Formulários com `label`, `aria-invalid` e `aria-describedby` ligando campo e mensagem.
- Animação desligada para quem pede menos movimento.
