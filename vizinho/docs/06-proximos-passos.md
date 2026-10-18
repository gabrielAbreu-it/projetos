# 6. Próximos passos, teste e aprendizados

[← Voltar ao índice](README.md)

## Roteiro de teste com 5 usuários

**Quem:** 3 moradores de condomínio que recebem encomenda pelo menos uma vez por semana e 2 porteiros ou zeladores. Teste presencial ou por vídeo, 30 minutos cada, com o protótipo no celular (morador) e no computador (porteiro).

**Como:** peço para a pessoa pensar em voz alta, não ajudo durante a tarefa e anoto onde ela hesita.

| # | Tarefa | Quem | Sucesso quando |
|---|---|---|---|
| T1 | "Chegou alguma coisa para você? Como você retiraria?" | Morador | Acha a encomenda e mostra o código sem ajuda |
| T2 | "Reserve o salão para a noite de sábado, 24." | Morador | Entende o conflito e escolhe uma alternativa |
| T3 | "Tem algum aviso que você precisa saber esta semana?" | Morador | Encontra a falta de água e marca "Estou ciente" |
| T4 | "Libere a entrada da sua diarista para segunda-feira." | Morador | Passe criado com a data certa |
| T5 | "Chegou uma caixa para o B 304. Registre." | Porteiro | Registro com unidade certa em menos de 30 segundos |
| T6 | "A moradora do B 304 está aqui. Entregue." | Porteiro | Entrega com código; se errar o código, entende o porquê |
| T7 | "O que está parado há muito tempo?" | Porteiro | Aponta as encomendas com mais de 3 dias |

Depois das tarefas: escala de facilidade (SEQ) por tarefa e uma pergunta aberta: "o que faria você parar de usar o caderno?".

## Métricas que eu mediria

Em teste:

- Taxa de sucesso por tarefa e tempo da T5 comparado ao tempo de anotar no caderno.
- Número de erros na busca de unidade (unidade errada escolhida).

Com o produto em uso (se fosse lançado):

- Tempo médio entre a encomenda chegar e ser retirada.
- Quantidade de encomendas paradas há mais de 3 dias por semana.
- Reservas canceladas por conflito.
- Porcentagem de moradores que confirmam leitura dos avisos importantes.

Não tenho nenhum desses números hoje. Eles servem para saber se o produto resolveu o problema depois de testado.

## O que viria depois

- Entregar várias encomendas da mesma unidade de uma vez (achado 6 da avaliação heurística).
- Visão do síndico para publicar avisos e aprovar reservas.
- Lista de convidados do salão enviada direto para a portaria.
- Testar se o porteiro prefere o painel no computador ou num tablet no balcão.

## Aprendizados

- **Dois usuários, um registro.** Desenhar as duas pontas ao mesmo tempo me obrigou a pensar no dado que passa entre elas (o código de retirada) antes de pensar nas telas.
- **O concorrente é o caderno.** Cada passo a mais no registro é motivo para o porteiro voltar ao papel. Cortei campos até sobrar unidade, tipo e um botão.
- **O erro mais grave estava no fluxo mais simples.** O passe de visitante parecia trivial, e foi onde encontrei o único problema de severidade 3. Vale revisar o óbvio com a mesma atenção.
