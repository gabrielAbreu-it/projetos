# 1. Problema e benchmark

[← Voltar ao índice](README.md)

## Problema

Em muito condomínio residencial, três coisas do dia a dia ainda dependem de papel e de grupo de WhatsApp:

- **Encomendas.** O porteiro anota no caderno e liga para o interfone, quando lembra. O morador não sabe que chegou, a encomenda fica dias na portaria e às vezes se perde ou é entregue para a pessoa errada.
- **Reserva do salão de festas.** É feita num caderno na portaria ou com o zelador. Duas unidades marcam o mesmo sábado, e o conflito só aparece no dia.
- **Avisos.** Falta de água e manutenção do elevador são postadas no mesmo grupo onde se vende bolo e se discute vaga de garagem. O aviso importante some no meio das mensagens.

**Objetivo:** um app do morador e um painel da portaria que resolvam essas três coisas sem exigir treinamento do porteiro e sem obrigar o morador a abrir o app todo dia para descobrir algo.

## Benchmark

Olhei produtos reais pelo que eles mostram publicamente e pelo que é amplamente conhecido. Não testei planos pagos nem painéis internos, então fico no nível das características gerais.

| Referência | O que é | O que aprendi | O que levei para o Vizinho |
|---|---|---|---|
| Townsq | App de comunicação e gestão do condomínio, com morador, síndico e portaria | Junta muitos módulos num mesmo app. Ajuda quem administra, mas o morador precisa achar o que importa no meio de tudo | Início do morador com só três coisas: encomendas esperando, aviso importante e atalhos |
| uCondo | Plataforma de gestão condominial com app do morador | Reserva de áreas comuns e comunicados ficam junto com a parte financeira | Reserva com calendário que mostra o que está livre antes de a pessoa escolher |
| Superlógica | Sistema de gestão usado por administradoras, com app do condômino | Forte em boleto, cobrança e prestação de contas, que é o que a administradora mais precisa | Deixei o financeiro fora do escopo e foquei no que acontece na portaria |
| CondoConta | Conta digital voltada para condomínios | Produto centrado no dinheiro do condomínio, não na rotina do morador | Confirmou que o problema da portaria merece uma interface própria |
| Grupo de WhatsApp + caderno da portaria | O "concorrente" informal, usado de graça em muito prédio | Todo mundo já sabe usar e não custa nada. O problema é a mistura: aviso importante e conversa no mesmo lugar, sem histórico confiável | Avisos com filtro importante e geral, confirmação de leitura e histórico. O porteiro registra em menos passos que no caderno |

## Achados que viraram decisão

1. **O caderno é rápido.** Se registrar no painel demorar mais que anotar no papel, o porteiro volta para o caderno. Por isso o registro tem busca de bloco e apartamento que aceita "b 304", foto opcional e o aviso já marcado.
2. **O conflito na reserva é o maior atrito.** Mostrar os períodos ocupados no calendário evita a maioria. O resto (duas pessoas reservando ao mesmo tempo) precisa de uma mensagem clara com alternativas.
3. **O morador só abre o app quando algo acontece.** O aviso tem de chegar até ele, e a tela inicial tem de responder "tem algo para mim?" em um segundo.

## Fora do escopo

Boleto, assembleia on-line, controle de acesso por reconhecimento facial e integração com interfone. São importantes, mas não resolvem os três problemas acima.
