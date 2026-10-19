# Aprova Hub · Documentação

> **Nota:** o Aprova Hub nasceu da ideia do [Mentor OS](../../projetos/mentor-os.html), uma ferramenta para o mentor de concurso acompanhar a turma. Os documentos 01 a 08 abaixo descrevem essa primeira versão (hoje o "Modo mentor"). O app evoluiu para o concurseiro: radar de editais, o que mais cai, estudo com cronômetro, caderno de erros com foto, grupos com quiz relâmpago e plano Premium.

## Editais ao vivo

O Radar e a página [Editais resumidos](../editais/index.html) leem a função [`/api/editais`](../../api/README.md), que busca publicações de concursos nos diários oficiais municipais pelo Querido Diário (Open Knowledge Brasil) e devolve cada uma resumida, com o link para o documento oficial.

- Quando a consulta funciona, aparece "Ao vivo · atualizado há X min · fonte: Querido Diário".
- No computador local ou se a fonte falhar, aparecem dados de exemplo com o selo "dados de exemplo" e os links ficam desativados.
- Por enquanto, só os diários municipais cobertos pelo Querido Diário. Diário Oficial da União e diários estaduais são o próximo passo.
- O resumo é automático. Confira sempre o documento original.

Projeto conceitual de 2026, feito por mim do início ao fim: pesquisa, fluxos, interface, app funcional e modelo de negócio.

| Documento | O que tem |
|---|---|
| [01 · Problema e benchmark](01-problema-e-benchmark.md) | O problema do mentor e o que aprendi com 5 produtos conhecidos |
| [02 · Persona e jornada](02-persona-e-jornada.md) | Proto-persona do mentor e da aluna (hipóteses) e a jornada de uma semana |
| [03 · Fluxos](03-fluxos.md) | Mapa do app, fluxos de check-in e de alerta, estados de cada tela |
| [04 · Decisões de UI](04-decisoes-de-ui.md) | Paleta com contraste, tipografia, componentes e acessibilidade |
| [05 · Avaliação heurística](05-avaliacao-heuristica.md) | 8 problemas, 6 corrigidos, antes e depois |
| [06 · Próximos passos](06-proximos-passos.md) | Roteiro de teste com 5 pessoas e métricas |
| [07 · Modelo de negócio](07-modelo-de-negocio.md) | Planos, preços (hipóteses), conta de clientes e validação em 2 semanas |
| [08 · Piloto automático](08-piloto-automatico.md) | Como o produto se vende, se cobra e paga o dono sozinho (demonstração) |

Outros materiais:

- [App de demonstração](../prototipo/) (funciona no navegador e pode ser instalado no celular)
- [Página de vendas](../site/index.html), [cadastro com pagamento simulado](../site/cadastro.html), [programa de afiliados](../site/afiliados.html) e [central de ajuda](../site/ajuda.html)
- [Painel do dono](../admin/index.html): receita, assinantes, afiliados e "Retirar meu lucro"
- [Estrutura do banco para a versão com login](../supabase/schema.sql)
- [Como colocar no ar](../COMO-COLOCAR-NO-AR.md)
- [Prints das telas](prints/)

Todos os dados do app são fictícios.
