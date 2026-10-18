# 4. Decisões de UI

[← Voltar ao índice](README.md)

## Paleta

Azul-índigo para ação e confiança, coral para o que pede atenção. Fica longe do escuro com verde neon do Roxx Energy e do verde petróleo claro do Agendaí. Contraste calculado com a fórmula do WCAG 2.1.

| Uso | Cor | Sobre | Contraste | Nível |
|---|---|---|---|---|
| Texto principal | `#1A1B3A` | branco `#FFFFFF` | 16,64:1 | AAA |
| Texto principal | `#1A1B3A` | fundo `#F6F6FB` | 15,45:1 | AAA |
| Texto secundário | `#555874` | fundo `#F6F6FB` | 6,42:1 | AA |
| Botão primário (texto branco) | `#FFFFFF` | índigo `#4338CA` | 7,90:1 | AAA |
| Link e texto índigo | `#4338CA` | branco | 7,90:1 | AAA |
| Selo "Importante" | `#B13A1E` | coral claro `#FFE9E2` | 5,15:1 | AA |
| Selo de sucesso | `#0F6B41` | verde claro `#E3F5EC` | 5,79:1 | AA |
| Selo de atenção | `#8A4B00` | amarelo claro `#FFF1D6` | 6,09:1 | AA |
| Mensagem de erro | `#B42318` | branco | 6,57:1 | AA |
| Texto branco na barra da portaria | `#FFFFFF` | índigo escuro `#1E1B4B` | 15,99:1 | AAA |
| Borda de campo | `#8B8DA8` | branco | 3,24:1 | AA (não texto) |

O coral puro `#FF7A59` só aparece como borda, ícone grande ou fundo com texto escuro (6,48:1), nunca como texto pequeno sobre branco.

## Tipografia

**Figtree**, em 400, 500, 600, 700 e 800. É geométrica e amigável, com números largos que facilitam ler código de retirada e número de apartamento. Escala: 12, 14, 16, 18, 22, 28 e 36 px. O código de retirada usa 2,6 rem com espaçamento extra e números tabulares.

## Componentes

- **Cartão de encomenda:** foto (ou ícone do tipo), descrição, quando chegou e selo de tempo parado. Some do início quando a portaria entrega.
- **Cartão do código:** fundo índigo escuro para chamar atenção e ser lido de longe pelo porteiro.
- **Selo de tempo parado:** cinza até 1 dia, amarelo de 1 a 3 dias, coral com ampulheta acima de 3 dias. Cor e ícone, não só cor.
- **Calendário de reserva:** cada dia mostra dois pontos, um por período. Ponto cheio é livre, anel vazio é reservado.
- **Busca de unidade (portaria):** campo com lista de sugestões, setas para escolher e Enter para confirmar. Aceita "b 304", "304" ou o nome do morador.
- **Alerta de erro:** borda vermelha, ícone, título e o que fazer em seguida. No conflito de horário, traz botões com os horários livres mais próximos.
- **Toast:** confirma ações com `aria-live` e, quando a ação é desfeita com facilidade, traz "Desfazer" (entrega, cancelamento de visitante, entrada de visitante).

## Acessibilidade

- Alvos de toque com pelo menos 44 px em todas as telas, inclusive no painel.
- Foco visível de 3 px em índigo; na barra escura da portaria, o foco é coral.
- Todos os campos com rótulo; erros ligados ao campo por `aria-describedby` e `aria-invalid`.
- Ao trocar de tela, o foco vai para o título. Ao errar o formulário, vai para o primeiro campo com problema.
- No painel, a tabela vira lista de cartões abaixo de 860 px, sem rolagem horizontal da página até 360 px.
- Animações respeitam "reduzir movimento".
