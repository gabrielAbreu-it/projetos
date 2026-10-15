# 4. Decisões de UI e acessibilidade

[← Voltar ao índice](README.md)

Tudo está no [design system](https://gabrielabreu-it.github.io/projetos/agendai/design-system/) (GitHub Pages). O app do cliente e o painel usam os mesmos componentes, então o que está documentado é o que aparece nas telas.

## Cor

- **Fundo creme** (`#FBF8F4`) em vez de branco puro. Deixa a tela mais quente e combina com o ambiente de salão; os cards brancos se destacam sobre ele sem precisar de sombra forte.
- **Verde-petróleo** (`#1F5F5B`) na ação principal. É uma cor que passa calma e confiança, e funciona para salão feminino e barbearia ao mesmo tempo, sem cair no rosa ou no preto e dourado.
- **Coral** (`#E07A5F`) só como detalhe: a linha do "agora" na agenda e a capa do salão. Não passa de 3:1 no branco, então nunca é usado em texto.
- **Status com cor, ícone e texto**: confirmado (verde), aguardando (âmbar e listrado na agenda), faltou (vermelho e riscado), concluído (cinza).
- **Uma cor por profissional** na agenda. O bloco usa fundo bem claro com texto escuro e a cor forte só na borda, para o texto continuar legível.

## Tipografia

- **Plus Jakarta Sans** em tudo. É arredondada, o que ajuda no tom acolhedor, e os números são firmes, o que importa no painel (preço, horário, faturamento).
- Títulos em 800, texto em 400/500. Números com largura fixa, para os horários e valores alinharem na agenda e nas tabelas.

## Componentes

| Componente | Decisão |
|---|---|
| Card de opção | No app, o card inteiro é o alvo de toque (o card inteiro responde ao toque, não só o círculo de seleção) |
| Chips de horário | Só aparecem horários livres, agrupados em manhã, tarde e noite. Mostrar os ocupados poluiria a tela sem ajudar a decidir |
| Faixa de dias | 14 dias para frente; domingo aparece desabilitado com "fechado" no rótulo acessível |
| Grade da agenda | Uma coluna por profissional no dia. A altura do bloco é a duração do serviço |
| Arrastar para remarcar | A célula de destino fica verde ou vermelha antes de soltar, com o motivo escrito ao lado do cursor |
| Toast com Desfazer | Toda mudança na agenda pode ser desfeita por 7 segundos, sem modal de "tem certeza?" para coisas reversíveis |
| Modal | Só para cancelar (precisa de motivo opcional) e para formulários do painel |

## Acessibilidade

### Contraste (WCAG 2.1 AA)

| Par | Razão | Mínimo | Resultado |
|---|---|---|---|
| Texto `#1F2523` sobre fundo `#FBF8F4` | 14,72:1 | 4,5:1 | Passa |
| Texto secundário `#5E6763` sobre fundo | 5,52:1 | 4,5:1 | Passa |
| Texto secundário sobre superfície 2 `#F3EEE7` | 5,06:1 | 4,5:1 | Passa |
| Placeholder `#6B7570` sobre branco | 4,77:1 | 4,5:1 | Passa |
| Branco sobre botão `#1F5F5B` | 7,38:1 | 4,5:1 | Passa |
| Verde `#1F5F5B` sobre verde suave `#E6F0EE` | 6,35:1 | 4,5:1 | Passa |
| Confirmado `#147A4B` sobre `#E7F6EE` | 4,81:1 | 4,5:1 | Passa |
| Aguardando `#8A5A00` sobre `#FFF4DC` | 5,43:1 | 4,5:1 | Passa |
| Erro `#B42318` sobre branco | 6,57:1 | 4,5:1 | Passa |
| Texto escuro sobre os fundos dos profissionais | 13,26:1 a 14,27:1 | 4,5:1 | Passa |
| Toast: branco sobre `#1F2523` | 15,59:1 | 4,5:1 | Passa |
| Borda de campo `#7C8783` sobre branco | 3,72:1 | 3:1 (não texto) | Passa |
| Anel de foco `#1D5BBF` sobre fundo | 6,01:1 | 3:1 (não texto) | Passa |

O texto de botão desabilitado (`#A3AAA6`) fica abaixo de 4,5:1 de propósito: a WCAG não exige contraste para componentes desabilitados, e o estado também é comunicado pelo atributo `disabled`.

### Outros cuidados

- **Foco visível** azul de 3px em tudo que é interativo.
- **Alvos de 44px**, inclusive no painel (botões pequenos, chips, abas e o seletor Dia/Semana).
- **Labels** visíveis em todos os campos; "(opcional)" escrito no label, sem asterisco.
- **Erros** em texto com ícone, lidos junto com o campo pelo leitor de tela, e foco no primeiro campo com problema.
- **Arrastar não é o único caminho**: todo horário abre um detalhe com "Remarcar", que funciona pelo teclado com selects de profissional, data e hora.
- **Blocos da agenda** são botões com rótulo completo para leitor de tela ("Ana Almeida, Corte feminino, 14:00 às 15:00, com Camila, confirmado").
- **Gráficos** têm tabela equivalente (escondida visualmente ou em "Ver dados em tabela") e o mapa de calor mostra o número dentro de cada célula, não só a cor.
- **Trocar de tela** leva o foco para o título; mudanças de data na agenda são anunciadas pelo leitor de tela.
- **Movimento reduzido** respeitado.
