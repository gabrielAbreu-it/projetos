# 06 · Próximos passos

## Roteiro de teste com 5 usuários

**Quem:** 4 pessoas com 65 anos ou mais que tomam pelo menos 3 remédios por dia e 1 familiar que acompanha alguém de longe. Teste presencial, no celular da própria pessoa quando possível, com a letra do jeito que ela usa.

**Antes de começar:** explicar que é um protótipo com remédios fictícios, que quem está sendo testado é o app e não a pessoa, e pedir para pensar em voz alta.

| Tarefa | O que observar |
|---|---|
| "O alarme tocou. Mostre que você tomou o remédio." | Acha o "Tomei" sem ajuda? Toca em "Adiar" por engano? |
| "Você tocou sem querer. Volte atrás." | Encontra o desfazer? Entende o que aconteceu? |
| "Você está na dúvida se tomou o remédio das 10:00. O que faz?" | Escolhe a opção certa? Lê o aviso da dose dobrada? |
| "Coloque um remédio novo, de manhã e à noite." | Onde trava? Os erros são entendidos? |
| "Deixe a letra maior." | Acha os Ajustes? A prévia ajuda? |
| Familiar: "Veja se a sua mãe tomou tudo hoje e fale com ela." | Vê o alerta na hora? Usa o botão de ligar? |

**Perguntas finais:** o que foi mais fácil, o que deu medo de errar, e se usaria no dia a dia.

## Métricas que eu mediria

- **Sucesso na tarefa** "marcar que tomou" sem ajuda (meta: 5 de 5).
- **Toques errados** entre "Tomei" e "Adiar".
- **Tempo** do alarme até a dose marcada.
- **Erros no cadastro** e quantos foram corrigidos sem ajuda.
- Num piloto, ao longo de semanas: **doses marcadas no horário** e **tempo até o cuidador saber** de uma dose atrasada.

## Próximas entregas

1. Tela de convite do cuidador, explicando o que ele vê (problema 9).
2. Testar alarme, vibração e repetição em aparelho real (problema 8).
3. Leitura em voz alta do nome do remédio no alarme.
4. Relatório simples para levar à consulta.

## Aprendizados

- **Acessibilidade começa no tamanho da letra, mas não termina nele.** Com 28px as telas precisaram mudar de forma: horários em cima, textos quebrando em linhas, abas com rótulo fixo.
- **O erro mais perigoso aparece depois do horário.** O caso da dose esquecida pediu mais cuidado que o caso feliz.
- **Para quem cuida, menos gráfico e mais ação.** O botão de ligar vale mais que qualquer número.
