# 06 · Próximos passos

## Teste de usabilidade com 5 lojistas

**Perfil:** lojistas que vendem por Pix pelo Instagram, WhatsApp ou loja online, com pelo menos 30 vendas por mês. Idealmente 2 que já receberam um pedido de devolução.

**Formato:** remoto ou presencial, 40 minutos, no celular da pessoa, com o app de demonstração. Peço para pensar em voz alta.

**Tarefas:**

1. Registre uma venda de R$ 189,90 que você fez hoje pelo WhatsApp.
2. Guarde o comprovante do Pix e um print da conversa dessa venda.
3. Descubra o que ainda falta para essa venda ficar com prova forte.
4. O banco avisou hoje que a cliente da bolsa de palha pediu devolução. Registre isso com o prazo que o banco informou.
5. Gere o documento para mandar ao banco e salve em PDF.
6. A contestação deu certo. Registre o resultado.
7. Diga, com suas palavras, o que acontece com os dados se você trocar de celular.

## O que eu mediria

- Taxa de sucesso de cada tarefa, sem ajuda.
- Tempo para registrar uma venda (meta: menos de 1 minuto).
- Quantas pessoas entendem que o prazo é delas para conferir, e não uma regra do app (pergunta direta depois da tarefa 4).
- Se a pessoa consegue explicar o que deixa uma prova "forte".
- Erros no formulário e no anexo de arquivos.
- Nota de facilidade (escala de 1 a 7) e o que ela faria diferente.
- Intenção de uso: "você registraria todas as vendas aqui? Por quê?"

## O que mudaria depois

- Se registrar toda venda for trabalho demais, testar registro em lote ou importar do extrato.
- Se o prazo ainda parecer oficial, deixar o campo de prazo vazio até o lojista preencher.
- Criar a versão com login usando o banco já desenhado (`supabase/schema.sql`) e o lembrete de prazo.

## Aprendizados

- **Em finanças, o produto não pode prometer o que não controla.** O app organiza a defesa; quem decide é a instituição. Isso aparece no painel, na contestação e no próprio dossiê.
- **Prazo configurável é decisão de design, não detalhe técnico.** Tirar a regra de dentro do app evitou passar uma informação que pode mudar ou variar entre bancos.
- **O melhor momento para guardar prova é logo depois da venda.** A tela de confirmação virou o ponto mais importante do fluxo, porque leva direto para anexar.
