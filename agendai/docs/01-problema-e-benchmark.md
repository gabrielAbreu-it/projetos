# 1. Problema, objetivo e benchmark

[← Voltar ao índice](README.md)

## Problema

Em salão, barbearia e estética pequenos, o agendamento quase sempre acontece pelo WhatsApp. O dono (que muitas vezes também atende) responde mensagens entre um cliente e outro e anota numa agenda de papel ou no próprio celular. Isso gera três problemas:

1. **Horário perdido.** Mensagem respondida tarde, cliente que desiste, encaixe que ninguém viu.
2. **Confirmação esquecida.** Ninguém lembra o cliente na véspera e ele simplesmente não aparece.
3. **Sem visão do negócio.** O dono não sabe quanto faturou no mês, quantos clientes faltaram nem quais horários lotam.

## Objetivo

Tirar o agendamento da conversa no WhatsApp sem obrigar o cliente a criar conta ou baixar mais um app pesado, e dar ao dono uma agenda que ele organize em segundos e que mostre os números do mês.

Sucesso no protótipo:

- O cliente marca um horário em menos de 1 minuto.
- O dono remarca um cliente arrastando o horário, sem abrir formulário.
- O dono descobre o faturamento do mês e a taxa de faltas sem fazer conta.

## Benchmark

Analisei cinco produtos reais. As informações vêm dos sites oficiais, das lojas de apps e de matérias, consultadas em outubro de 2026. Onde não encontrei a informação, escrevi "não encontrei".

| | Booksy | Trinks | AppBarber | Fresha | Google Agenda |
|---|---|---|---|---|---|
| **O que é** | Marketplace e agenda para beleza e barbearia | Sistema brasileiro de gestão para salões | App de gestão e agendamento para barbearias | Software de agendamento e marketplace de beleza | Agenda pessoal, com página de agendamento |
| **Agendamento pelo cliente** | Sim, app e marketplace | Sim, agenda online e pelo Google Maps | Sim, app e painel web | Sim, app e marketplace | Sim, por link de página de agendamento |
| **Lembrete ao cliente** | Sim | Sim, por SMS | Sim, mensagens automáticas de retorno | Sim | Sim, por e-mail |
| **Agenda por profissional** | Sim | Sim | Sim | Sim | Não é o foco |
| **Financeiro e comissões** | Relatórios | Sim: caixa, despesas, comissões, estoque | Sim: caixa, financeiro, pacotes, estoque | Pagamentos e relatórios | Não |
| **Ficha do cliente** | Sim | Sim | Sim | Sim | Não |
| **Foco no Brasil** | Não | Sim | Sim | Não | Não |

### Pontos fortes e falhas que observei

**Booksy**
- Forte: o marketplace traz cliente novo, não só organiza quem já vem.
- Falha: para o cliente, é mais um app e mais uma conta. Para um salão de bairro que vive de cliente fixo, o marketplace pesa mais do que ajuda.

**Trinks**
- Forte: gestão completa e pensada para o Brasil (comissão, caixa, estoque) e agendamento pelo Google Maps.
- Falha: tanta função que a agenda, que é o que o dono abre o dia todo, divide espaço com módulos que ele usa uma vez por mês. Uma matéria mais antiga dizia que a gestão funcionava pelo site e não pelo app; não confirmei se ainda é assim.

**AppBarber**
- Forte: cada barbearia pode ter seu app, com fidelidade, pacotes e lista de espera.
- Falha: a lista de funções é longa e voltada a barbearia. Para salão com serviços longos (coloração de 2 horas), a lógica de encaixe é outra.

**Fresha**
- Forte: entrada gratuita e fluxo de agendamento do cliente muito curto.
- Falha: o custo aparece nas taxas de pagamento e de cliente novo do marketplace, o que exige atenção de quem está começando. É um produto global: o hábito brasileiro de confirmar tudo pelo WhatsApp não é o centro dele.

**Google Agenda**
- Forte: todo mundo já tem, e a página de agendamento resolve o básico de graça.
- Falha: não conhece "serviço", "profissional" ou "faltou". Não dá números do negócio.

### O que eu levei para o Agendaí

| Observação | Decisão no Agendaí |
|---|---|
| Cliente de salão de bairro não quer mais uma conta (Booksy, Fresha) | Agendamento **sem cadastro**: nome e WhatsApp no último passo |
| A agenda divide espaço com módulos raros (Trinks, AppBarber) | Agenda é a **tela inicial** do painel; o resto fica em quatro itens de menu |
| WhatsApp é o canal real no Brasil | Confirmação e lembrete pelo **WhatsApp**, com status "aguardando confirmação" |
| Remarcar costuma ser um formulário | **Arrastar para remarcar** na grade, com "Desfazer" (e um caminho por teclado) |
| Números ficam escondidos em relatórios | Uma tela só com **faturamento, faltas e horários mais cheios** |
| O Google Agenda não sabe o que é serviço | Serviço tem **duração e preço**; a agenda só oferece horário onde o serviço cabe |

## Referências visuais

| Referência | O que observei | Como usei |
|---|---|---|
| Google Agenda e Outlook | Grade de horários com colunas, linha do "agora", blocos com altura pela duração | Grade da agenda do painel, com uma coluna por profissional |
| Apps de delivery (iFood) | Passo a passo curto com resumo antes de confirmar | Fluxo do cliente em 4 passos com resumo no final |
| Sites de reserva de restaurante | Dias em faixa horizontal e horários em chips | Seleção de data e hora no app |
| Revistas de beleza e decoração | Tons creme, terracota e verde escuro | Paleta clara e acolhedora, sem cara de sistema bancário |

### Fontes consultadas

- Página do AppBarber PRO na App Store
- Matérias do Mobile Time e do Tecnoblog sobre o Trinks; Capterra
- Sites do Booksy, Fresha e ajuda do Google Agenda (páginas de agendamento)
