# 7. Próximos passos

[← Voltar ao índice](README.md)

1. **Rodar o teste de usabilidade** com donos e clientes, seguindo o [roteiro](06-roteiro-de-teste.md), e revisar as proto-personas.
2. **Ir para uma data** no painel: hoje só dá para andar dia a dia ou semana a semana (achado 7 da [avaliação heurística](05-avaliacao-heuristica.md)).
3. **Durações de 15 em 15 minutos**, para serviços como hidratação (45 min).
4. **Lista de espera**: avisar quem queria um horário cheio quando alguém cancelar.
5. **Comissões por profissional** a partir do faturamento que o painel já calcula.
6. **Bloqueio de agenda** (folga, almoço, curso) direto na grade.
7. **Integração real com WhatsApp** para confirmação e lembrete, e medir se a taxa de faltas cai depois disso.

## Como eu mediria o sucesso

Se o Agendaí fosse lançado, estes seriam os números que eu acompanharia. Nenhum deles existe ainda; são as metas que eu definiria.

| Métrica | Por que importa | Meta inicial |
|---|---|---|
| Agendamentos que chegam pelo link, e não pelo WhatsApp | Mostra se o cliente aceitou marcar sozinho | Metade em 3 meses |
| Taxa de faltas antes e depois do lembrete | É a dor que mais custa dinheiro ao dono; o painel já mede | Cair pela metade |
| Tempo para remarcar um horário | Valida o arrastar contra o formulário | Menos de 10 segundos |
| Mensagens de agendamento por dia no WhatsApp do salão | Se o produto funciona, o dono conversa menos | Cair pela metade |
| Donos que abrem "Números do mês" ao menos uma vez por semana | Diz se a visão do negócio é útil de verdade | Acima de 50% |

## O que eu aprendi

- **Duas interfaces exigem um design system de verdade.** O app do cliente e o painel leem os mesmos tokens e componentes; sem isso, os dois lados teriam virado produtos diferentes.
- **Dado de exemplo também precisa ser coerente.** Gerei a agenda do mês com uma regra fixa, para o painel, o app, o design system e o case mostrarem os mesmos números.
- **Gesto rápido não pode ser o único caminho.** Arrastar para remarcar é o mais rápido no mouse, mas o mesmo resultado precisa existir pelo teclado e no celular.
