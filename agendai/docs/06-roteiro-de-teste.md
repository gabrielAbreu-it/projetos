# 6. Roteiro de teste de usabilidade

[← Voltar ao índice](README.md)

> **Próximo passo.** Este teste ainda não foi feito. O roteiro está pronto para rodar com o protótipo atual.

## Objetivos

1. Ver se o cliente marca um horário sozinho, sem conta e sem ajuda.
2. Ver se o dono entende e usa o arrastar para remarcar.
3. Ver se o dono encontra e entende os números do mês.
4. Validar as suposições das [proto-personas](02-persona-e-jornada.md).

## Participantes

- **Donos:** 5 donos ou gerentes de salão, barbearia ou estética com 2 a 8 profissionais, que hoje agendam pelo WhatsApp. Sessões de 40 minutos, presenciais no próprio salão, fora do horário de pico.
- **Clientes:** 5 pessoas que vão a salão ou barbearia pelo menos uma vez por mês. Sessões remotas de 20 minutos, no celular do participante.

## Tarefas do cliente

| # | Tarefa | Sucesso quando |
|---|---|---|
| 1 | "Marque um corte + barba para sexta à tarde, com qualquer barbeiro." | Chega na tela "Tudo certo!" |
| 2 | "Você não vai conseguir ir. Mude para outro dia da semana que vem." | Remarca sem cancelar e criar outro |
| 3 | "Desista do horário." | Cancela e entende que pode desfazer |

## Tarefas do dono

| # | Tarefa | Sucesso quando |
|---|---|---|
| 1 | "Quantos clientes o Bruno atende hoje?" | Lê na coluna do Bruno |
| 2 | "O cliente das 13:30 do Diego pediu para passar para o fim da tarde. Faça a mudança." | Remarca para um horário livre (arrastando ou pelo detalhe) |
| 3 | "A cliente que está com a Júlia agora já foi atendida. Registre." | Marca como concluído |
| 4 | "Quanto o salão já faturou este mês? E quanto já está agendado?" | Lê os dois valores |
| 5 | "Qual é o horário mais cheio da semana?" | Encontra no mapa de calor |
| 6 | "Crie o serviço 'Hidratação', 45 minutos, R$ 60, feito pela Camila." | Tenta, lida com a duração (o sistema só aceita múltiplos de 30) e cria |

## Métricas

- Taxa de sucesso por tarefa e tempo por tarefa. Meta: tarefa 1 do cliente em menos de 1 minuto.
- Quantos donos descobrem o arrastar sozinhos, sem ler a dica.
- Erros (toques em lugar errado, voltas).
- SEQ depois de cada tarefa e SUS no fim.

## Perguntas

Para o dono:
1. Como você organiza a agenda hoje? Me mostra.
2. Quantas faltas você acha que tem por mês? (perguntar antes de mostrar o painel)
3. O que você faria com o número de faltas e os horários cheios?
4. Seus clientes usariam um link para marcar sozinhos?

Para o cliente:
1. Você prefere marcar por mensagem ou por aqui? Por quê?
2. Ficou alguma dúvida sobre o que acontece depois de confirmar?
3. Sentiu falta de criar uma conta ou ficou melhor assim?

## Como vou registrar

Planilha por participante com tarefa, sucesso, tempo, SEQ e observações. Problemas agrupados por frequência e gravidade (0 a 4 do Nielsen) para decidir o que entra na próxima versão.
