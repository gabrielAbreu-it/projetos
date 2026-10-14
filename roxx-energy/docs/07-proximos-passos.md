# 7. Próximos passos

[← Voltar ao índice](README.md)

1. **Rodar o teste de usabilidade** com 5 motoristas, seguindo o [roteiro](06-roteiro-de-teste.md), e revisar a proto-persona com o que aparecer.
2. **Favoritos e "carregar de novo"**: atalho para quem usa sempre a mesma estação (achado 7 da [avaliação heurística](05-avaliacao-heuristica.md)).
3. **Ajuda sobre conectores**: um "o que é isso?" ao lado de CCS2, Tipo 2 e CHAdeMO, com foto de cada plugue (achado 10).
4. **Planejamento de viagem**: sugerir paradas numa rota entre cidades. O Tupi já faz isso e é a próxima dor de quem sai de Brasília para Goiânia, por exemplo.
5. **Fila de espera** quando todos os conectores estiverem ocupados, com aviso quando um liberar.
6. **Status reportado pela comunidade** com peso menor que o status da rede, para cobrir estações não integradas.
7. **Validar a taxa de reserva**: testar com e sem taxa e ver o efeito no número de reservas abandonadas.

## Como eu mediria o sucesso

Se o Roxx fosse lançado, estes seriam os números que eu acompanharia. Nenhum deles existe ainda; são as metas que eu definiria.

| Métrica | Por que importa | Meta inicial |
|---|---|---|
| Tempo de abrir o app até confirmar a reserva | É o objetivo do produto | Menos de 1 minuto |
| Chegadas em que o conector reservado estava funcionando | Mede se o status é confiável, que é a dor principal | Acima de 95% |
| Reservas que viram recarga | Mostra se a tolerância de 15 minutos e a taxa fazem sentido | Acima de 85% |
| Relatos de problema confirmados pelo operador | Separa relato útil de ruído e calibra o peso do relato no status | Acompanhar, sem meta no início |
| Motoristas que voltam a carregar pelo app no mês seguinte | Indica se o app virou o lugar padrão para carregar | Acima de 60% |

## O que eu aprendi

- **Testar o protótipo pega o que a tela parada esconde.** Os dois problemas mais graves da avaliação heurística só apareceram usando o fluxo de verdade, e um deles era um bug de CSS que deixava as mensagens de erro sempre visíveis.
- **O maior risco não é a interface, é o dado.** Um status errado derruba a confiança no app inteiro. Por isso a hora da atualização em todo status e os relatos de motoristas na tela da estação.
- **Restringir a cor de destaque deu clareza.** Decidir que o verde só aparece em três lugares (ação principal, livre e progresso) resolveu a hierarquia de quase todas as telas.
