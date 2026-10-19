# Dossiê Pix · documentação

Projeto conceitual de 2026, feito por mim do começo ao fim: benchmark, proto-persona, fluxos, interface, avaliação heurística e um app web que funciona de verdade no navegador.

O Dossiê Pix é para quem vende por Pix (loja online, Instagram, WhatsApp) e recebe um pedido de devolução pelo MED, o Mecanismo Especial de Devolução do Pix, com o pagador alegando golpe mesmo quando a venda foi legítima. O app junta as provas de cada venda e gera um dossiê organizado para o lojista enviar à instituição dele.

> Versão de demonstração: os dados ficam salvos só neste aparelho. Os dados que vêm prontos são fictícios. O app não é aconselhamento jurídico e não garante o resultado da contestação. Prazos e regras do MED dependem do Banco Central e de cada instituição; no app, o prazo é um campo que o lojista configura.

## Índice

1. [Problema e benchmark](01-problema-e-benchmark.md)
2. [Proto-persona e jornada](02-persona-e-jornada.md) (hipótese, ainda não validada)
3. [Fluxos](03-fluxos.md)
4. [Decisões de UI](04-decisoes-de-ui.md): paleta com contraste, tipografia e componentes
5. [Avaliação heurística](05-avaliacao-heuristica.md): 11 problemas, 9 corrigidos
6. [Próximos passos](06-proximos-passos.md): roteiro de teste com 5 lojistas, métricas e aprendizados
7. [Modelo de negócio](07-modelo-de-negocio.md) (hipóteses a validar)
8. [Piloto automático](08-piloto-automatico.md): como o produto se venderia, cobraria e pagaria o lucro sozinho (demonstração; produção ainda não iniciada)

## Links

- [Página do projeto](https://gabriel-abreu-portfolio.vercel.app/projetos/dossie-pix.html)
- [App de demonstração](https://gabriel-abreu-portfolio.vercel.app/dossie-pix/prototipo/)
- Demonstração do negócio: [página de vendas](../site/index.html), [programa de afiliados](../site/afiliados.html), [central de ajuda](../site/ajuda.html) e [painel do dono](../admin/index.html)
- [Estrutura do banco (Supabase)](../supabase/schema.sql) e [como colocar no ar](../COMO-COLOCAR-NO-AR.md)

## Telas (390 x 844)

| Painel | Registro com erro | Venda registrada | Força da prova |
|---|---|---|---|
| <img src="prints/mobile-01-painel.png" alt="Painel com contestações abertas e valor em risco" width="180"> | <img src="prints/mobile-02-registrar-erro.png" alt="Formulário de venda com erros nos campos" width="180"> | <img src="prints/mobile-03-venda-registrada.png" alt="Confirmação de venda registrada com próximo passo" width="180"> | <img src="prints/mobile-04-forca-da-prova.png" alt="Checklist de força da prova com o que falta" width="180"> |

| Abrir contestação | Dossiê | Busca sem resultado | Histórico |
|---|---|---|---|
| <img src="prints/mobile-05-abrir-contestacao.png" alt="Formulário de contestação com prazo configurável" width="180"> | <img src="prints/mobile-06-dossie.png" alt="Capa do dossiê pronta para PDF" width="180"> | <img src="prints/mobile-07-busca-vazia.png" alt="Estado vazio da busca de vendas" width="180"> | <img src="prints/mobile-08-historico.png" alt="Histórico de contestações ganhas e perdidas" width="180"> |

## Piloto automático (demonstração, 1440 x 900 e 390 x 844)

| Página de vendas | Afiliados |
|---|---|
| <img src="prints/site-desktop.png" alt="Primeira dobra da página de vendas" width="380"> | <img src="prints/afiliados-desktop.png" alt="Painel do afiliado com link e comissões" width="380"> |

| Painel do dono | Painel do dono no celular |
|---|---|
| <img src="prints/admin-desktop.png" alt="Painel do dono com saldo, lucro e indicadores" width="380"> | <img src="prints/admin-mobile.png" alt="Painel do dono no celular com o botão Retirar meu lucro" width="180"> |
