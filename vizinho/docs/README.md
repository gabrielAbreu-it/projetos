# Vizinho · documentação de processo

Material de trabalho do case. A versão para leitura rápida está na [página do projeto](https://gabriel-abreu-portfolio.vercel.app/projetos/vizinho.html).

1. [Problema e benchmark](01-problema-e-benchmark.md)
2. [Proto-persona e jornada](02-persona-e-jornada.md)
3. [Fluxos](03-fluxos.md)
4. [Decisões de UI](04-decisoes-de-ui.md)
5. [Avaliação heurística](05-avaliacao-heuristica.md)
6. [Próximos passos, teste e aprendizados](06-proximos-passos.md)

Também aqui:

- [Protótipo navegável](https://gabriel-abreu-portfolio.vercel.app/vizinho/prototipo/)
- [Prints das telas](prints/) (celular em 390 x 844 e painel em 1440 x 900)

## Telas do protótipo

| Interface | Tela | Estado que mostra |
|---|---|---|
| Morador | Início | Encomendas esperando, aviso importante em destaque, atalhos |
| Morador | Detalhe da encomenda | Código de retirada, tempo na portaria, andamento |
| Morador | Reservar área comum | Calendário com períodos livres, regras, validação |
| Morador | Reserva confirmada | Confirmação com taxa e prazo de cancelamento |
| Morador | Avisos | Filtro importante e geral, confirmação de leitura, estado vazio |
| Morador | Liberar visitante | Formulário com validação e passe com código |
| Portaria | Encomendas | Lista com tempo parado, busca, entrega com código |
| Portaria | Registrar encomenda | Busca de bloco e apartamento, foto, aviso ao morador |
| Portaria | Visitantes de hoje | Liberações feitas pelos moradores, registrar entrada |

O conflito de horário na reserva é um estado de erro da tela de reserva, com link direto no protótipo.
