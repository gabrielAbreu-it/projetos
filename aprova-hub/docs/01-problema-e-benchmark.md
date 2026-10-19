# 01 · Problema e benchmark

## O problema

O mentor independente de concurso público vende acompanhamento: monta o cronograma, cobra constância e ajusta a rota. Na prática, esse acompanhamento vive em uma planilha que cada aluno preenche (ou não) e em um grupo de WhatsApp.

Os pontos de dor que quero resolver:

- **O mentor não sabe quem sumiu.** O aluno que parou de estudar simplesmente para de mandar mensagem. Quando o mentor percebe, já passou uma ou duas semanas.
- **Horas não provam estudo.** "Estudei 4 horas" não diz se a pessoa fez questão. Pedir foto do caderno é constrangedor e não escala.
- **O mentor perde horas por semana** consolidando planilhas para saber como a turma está.
- **Ranking desanima quem está no fim.** Muita turma usa ranking de horas, e quem está atrás tende a desistir em vez de reagir.

Pergunta do projeto: *como o mentor descobre, em menos de um minuto, quem precisa dele hoje?*

## Benchmark

Olhei cinco referências conhecidas, só pelas características amplamente conhecidas de cada uma.

| Produto | O que faz bem | O que falta para o mentor | Decisão no Aprova Hub |
|---|---|---|---|
| **GymRats** | Desafio em grupo com check-in diário e placar, constância vira jogo | Pensado para treino; o check-in costuma ser foto, e o placar não mostra quem sumiu | Check-in diário com placar da turma, mas a prova é o número de questões |
| **Qconcursos** | Banco grande de questões com filtros e estatística de desempenho | É individual: o mentor não enxerga a turma em um só lugar | Não competir com banco de questões; registrar o resultado de onde o aluno estudou |
| **Tec Concursos** | Questões comentadas e acompanhamento do próprio desempenho | Mesmo ponto: foco no aluno sozinho | Simulado curto semanal só para ritmo e conversa, não para substituir o banco |
| **Planilhas e Notion de mentoria** | Flexíveis, baratos, o mentor monta do jeito dele | Dependem do aluno preencher, não avisam nada, dão trabalho para consolidar | Alertas automáticos e relatório da semana pronto |
| **Grupos de WhatsApp** | Onde a conversa já acontece, todo mundo usa | Mensagens se perdem, não há dado, e cobrança em grupo expõe o aluno | Não substituir o WhatsApp: levar até ele, com a mensagem individual pronta |

## O que levei do benchmark

1. **Constância é o motor.** Desafios em grupo mostram que aparecer todo dia mantém as pessoas. Por isso a sequência de dias e os pontos por dia estudado.
2. **Questões são a prova certa.** São fáceis de contar, todo aluno de concurso já faz e mostram desempenho, não só presença.
3. **O WhatsApp fica.** O mentor não vai trocar o canal com o aluno. O app decide *com quem* falar e já entrega o texto; a conversa continua no WhatsApp.

Não uso números de mercado neste projeto. As hipóteses de preço e público estão no [07 · Modelo de negócio](07-modelo-de-negocio.md) e precisam de validação.
