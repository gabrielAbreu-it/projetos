# 01 · Problema e benchmark

## O problema

Quem vende por Pix recebe o dinheiro na hora, e isso é ótimo para loja pequena. O risco aparece depois: o pagador pode pedir a devolução pelo **MED (Mecanismo Especial de Devolução)** dizendo que caiu em golpe. Às vezes é golpe de verdade; às vezes a venda foi legítima e o produto foi entregue.

Quando o aviso chega, o lojista precisa mostrar rapidamente que a venda aconteceu: comprovante, conversa, nota, rastreio, entrega. Na prática essas provas estão espalhadas no app do banco, no WhatsApp, no Direct do Instagram, no site da transportadora e na galeria do celular. Com prazo correndo, ele monta tudo às pressas, ou desiste.

**Frase do problema:** a venda foi real, mas as provas estão espalhadas e o lojista só descobre o que falta quando já está correndo contra o prazo.

> Não afirmo aqui prazos nem regras específicas do MED. Eles dependem das normas vigentes do Banco Central e de cada instituição. No app, o prazo é um campo que o lojista configura e confere com o banco dele.

## Benchmark

Olhei quatro referências. Descrevo só características amplamente conhecidas.

| Referência | O que faz bem | O que não resolve para este caso |
|---|---|---|
| **Stripe** (gestão de disputas de cartão) | Painel com cada disputa, prazo visível e envio de evidências organizadas por tipo | É para cartão e para quem processa pagamentos com ela; não cobre Pix recebido direto na conta |
| **Mercado Pago** (contestações de cartão para vendedores) | Avisa o vendedor e pede documentação da venda dentro da própria conta | Também focado em cartão e no ecossistema dele; não ajuda quem recebe Pix em outro banco |
| **App do banco do lojista** | É o canal oficial: é por ele que o aviso chega e a resposta é enviada | Não ajuda a juntar e organizar provas antes de o problema acontecer |
| **Pastas no Google Drive e conversas fixadas no WhatsApp** (solução improvisada) | Grátis e familiar | Nada lembra de guardar a prova na hora da venda; não diz o que falta; montar o documento final é manual |

**Hipótese:** não encontrei um produto popular focado em organizar a defesa de vendas contra pedidos de devolução pelo MED. Isso pode ser oportunidade ou sinal de que o problema é pequeno demais; preciso validar (ver doc 07).

## O que levei para o projeto

1. **Evidência por tipo, com checklist.** As ferramentas de disputa de cartão organizam a evidência por categoria. Trouxe isso para o Pix, mas com uma camada a mais: o app diz a força da prova (fraca, média, forte) e explica o que falta e por quê.
2. **Prazo sempre visível, mas configurável.** Os painéis de disputa deixam o prazo em destaque. No Dossiê Pix a contagem regressiva aparece no painel e na venda, sempre com o selo "prazo configurado", porque o prazo vem do lojista e não do app.
3. **Guardar na hora da venda, não na hora da briga.** A solução improvisada falha porque ninguém organiza nada até o problema chegar. Depois de registrar a venda, a confirmação já leva para "Anexar provas agora".
4. **Saída que o banco aceita sem esforço.** O resultado é um documento único, com capa, resumo, linha do tempo e anexos, que sai como PDF pelo próprio navegador.
