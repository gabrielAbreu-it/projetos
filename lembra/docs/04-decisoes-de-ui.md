# 04 · Decisões de UI e acessibilidade

## Princípios de design inclusivo

| Decisão | Por quê |
|---|---|
| **Letra base de 20px**, com opções de 24px e 28px e prévia ao vivo | Visão para perto costuma piorar com a idade. Testei as telas nos três tamanhos sem cortar texto |
| **Uma ação por tela** | A tela "Agora" mostra só o próximo remédio. Menos coisa para ler, menos chance de erro |
| **Botões enormes** | "Tomei" tem 84px de altura na letra padrão; todos os toques têm pelo menos 48px |
| **Botão principal e secundário bem diferentes** | "Tomei" é azul cheio; "Adiar" é contorno, embaixo e com espaço entre os dois |
| **Nada de gesto escondido** | Sem arrastar para o lado nem toque longo. Tudo é botão com texto escrito |
| **Estado com ícone + texto, nunca só cor** | "Tomado às 08:04", "Atrasado · era 10:00", "Próximo" |
| **Confirmação clara e desfazer** | Depois de "Tomei" a tela inteira confirma, com o botão "Marquei sem querer, desfazer" |
| **Linguagem simples** | "Quanto você toma de cada vez?" no lugar de "posologia"; "doses marcadas" no lugar de "adesão" |
| **Desenho da caixa** | Ajuda a reconhecer o remédio pela cor e forma, além do nome |
| **Chaves com "Sim" e "Não" escritos** | O estado da chave não depende só da cor |
| **Aviso de protótipo** | Remédios genéricos e fictícios; o app lembra que não substitui o médico ou o farmacêutico |

## Paleta e contraste (WCAG)

Identidade calorosa: azul profundo + laranja suave sobre um fundo creme.

| Uso | Cor | Sobre | Contraste |
|---|---|---|---|
| Texto principal | `#1A2238` | Creme `#FFF8EF` | 14,98:1 (AAA) |
| Texto de apoio | `#4A5168` | Creme `#FFF8EF` | 7,47:1 (AAA) |
| Botão principal | Branco | Azul `#1F3C88` | 10,19:1 (AAA) |
| Azul como texto | `#1F3C88` | Creme `#FFF8EF` | 9,67:1 (AAA) |
| Laranja suave (fundo de destaque) | Texto `#1A2238` | `#F4A259` | 7,64:1 (AAA) |
| Texto laranja | `#8A4310` | `#FDEBD7` | 6,24:1 (AA) |
| Tomado | `#1E6B3A` | `#E3F3E7` | 5,67:1 (AA) |
| Atrasado | `#B3261E` | `#FCE8E6` | 5,55:1 (AA) |
| Borda de campo | `#6E6556` | Creme | 5,45:1 (acima de 3:1) |
| Anel de foco | `#C2410C` | Creme | 4,91:1 (acima de 3:1) |

O modo **Contraste máximo** troca o fundo para branco e o texto para preto.

## Tipografia

- **Atkinson Hyperlegible**, criada para leitores com baixa visão: letras parecidas (como I, l e 1) têm formas bem diferentes, e o zero é cortado para não confundir com a letra O.
- Escala: 18 / 20 / 24 / 29 / 36px na letra padrão, crescendo junto com a opção escolhida.
- Os rótulos das abas ficam fixos em 18px para caberem quatro abas mesmo com a letra "Muito grande". Foi uma troca consciente: o ícone e o sublinhado ajudam a reconhecer a aba.

## Componentes

| Componente | Detalhes |
|---|---|
| Cartão do remédio | Horário em selo, desenho da caixa, nome em 36px, dose em azul, observação |
| Botões | Principal (azul), secundário (contorno), discreto, perigo (vermelho). Altura mínima de 68px |
| Selo de estado | Ícone + texto: tomado, atrasado, hora de tomar, próximo, mais tarde, pulado |
| Faixa de alerta | Vermelha, com ícone e "Ver", leva para a dose esquecida |
| Campo | Rótulo grande, dica embaixo do rótulo, erro com ícone ligado ao campo |
| Escolhas grandes | Cartões de opção com marca de seleção visível, inclusive para os horários |
| Contador | Botões de menos e mais com 68px, valor escrito por extenso ("2 comprimidos") |
| Aviso (toast) | Um por vez, lido pelo leitor de tela |
| Diálogo | Para pular dose e desmarcar; o foco vai para "Voltar" e fecha com Esc |

## Teclado e leitor de tela

Foco visível em tudo, título de cada tela recebe o foco ao trocar de tela, campos com rótulo e erro ligado ao campo, avisos anunciados, e o protótipo todo navegável só com o teclado.
