# 4. Decisões de UI e acessibilidade

[← Voltar ao índice](README.md)

Todos os valores estão no [design system](../design-system/index.html), que usa os mesmos arquivos CSS do protótipo.

## Cor

- **Tema escuro** (`#0A0F0D`). O app é usado muito à noite e dentro do carro, onde uma tela clara ofusca. Também conversa com o painel dos carros elétricos.
- **Verde elétrico** (`#39FF88`) é a cor da marca e significa "energia disponível". Uso em três lugares só: botão principal, status "livre" e progresso da recarga. Se o verde aparecesse em tudo, deixaria de chamar atenção para a ação.
- **Âmbar** (`#FFC14D`) para ocupado e **cinza** para fora de serviço/incompatível. Evitei vermelho no status do mapa porque vermelho fica reservado para erro e ação destrutiva.
- **Azul** (`#63C7FF`) para informação e para o anel de foco, que precisa aparecer tanto sobre o fundo quanto ao lado do botão verde.

## Tipografia

- **Space Grotesk** nos títulos e números (porcentagem, valores em reais). Tem um ar técnico que combina com o tema e números bem legíveis em tamanho grande.
- **Inter** no texto e nos rótulos. Lê bem em 12–14px, que é o tamanho dos metadados das estações.
- Campos com 16px para o iOS não dar zoom ao focar.

## Componentes

| Componente | Decisão |
|---|---|
| Pins do mapa | Mostram a potência máxima em kW. É o que o motorista compara primeiro. A cor diz o status e o rótulo acessível diz tudo por extenso |
| Badge de status | Cor, bolinha e texto. Nunca só cor |
| Card de estação | Inteiro clicável, com distância, disponibilidade compatível e preço |
| Botões fixos no rodapé | Nas telas de decisão (estação, reserva, pagamento) a ação principal fica sempre ao alcance do polegar |
| Modal | Só para ações com dinheiro envolvido: encerrar recarga e cancelar reserva. Foco começa no botão seguro |
| Toast | Confirma o que aconteceu. No cancelamento da reserva tem "Desfazer" |
| Anel de progresso | Lido de relance, com o valor também em texto e `role="meter"` |

## Acessibilidade

### Contraste (WCAG 2.1 AA)

Calculei a razão de contraste de cada par usado no protótipo com a fórmula de luminância relativa da WCAG.

| Par | Razão | Mínimo | Resultado |
|---|---|---|---|
| Texto `#EEF5F2` sobre fundo `#0A0F0D` | 17,46:1 | 4,5:1 | Passa |
| Texto `#EEF5F2` sobre superfície `#121A17` | 16,00:1 | 4,5:1 | Passa |
| Texto secundário `#A9BAB3` sobre fundo | 9,53:1 | 4,5:1 | Passa |
| Texto secundário sobre superfície 2 `#1A2420` | 7,87:1 | 4,5:1 | Passa |
| Placeholder `#7D8F88` sobre superfície | 5,19:1 | 4,5:1 | Passa |
| Verde `#39FF88` sobre fundo | 14,57:1 | 4,5:1 | Passa |
| Texto `#03140A` sobre botão verde | 14,29:1 | 4,5:1 | Passa |
| Âmbar `#FFC14D` sobre superfície | 10,95:1 | 4,5:1 | Passa |
| Texto `#1D1300` sobre pin âmbar | 11,34:1 | 4,5:1 | Passa |
| Vermelho `#FF6B6B` sobre fundo | 6,96:1 | 4,5:1 | Passa |
| Cinza fora de serviço `#8A9A94` sobre fundo | 6,56:1 | 4,5:1 | Passa |
| Borda de campo `#6A7D76` sobre superfície | 4,05:1 | 3:1 (não texto) | Passa |
| Anel de foco `#63C7FF` sobre fundo | 10,25:1 | 3:1 (não texto) | Passa |

### Outros cuidados

- **Foco visível** em todos os elementos interativos: contorno azul de 3px com afastamento.
- **Alvos de toque de 44px** no mínimo (`--rx-touch`). Os pins do mapa têm 34px de altura no desenho, mas uma área de toque invisível completa os 44px.
- **Labels** visíveis em todos os campos. Grupos de opções usam `fieldset` e `legend`.
- **Erros** em texto, com ícone, ligados ao campo por `aria-describedby`, e o foco vai para o primeiro campo com erro.
- **Navegação por teclado**: dá para fazer o fluxo inteiro só com Tab, Enter e Espaço. O modal usa `<dialog>` nativo, que prende o foco e fecha com Esc.
- **Leitor de tela**: ao trocar de tela o foco vai para o título. A recarga anuncia o progresso a cada 10%, e não a cada segundo, para não atropelar a leitura.
- **Movimento reduzido**: animações desligadas com `prefers-reduced-motion`.
- **Gráfico** do histórico tem uma tabela equivalente escondida visualmente para leitores de tela.
