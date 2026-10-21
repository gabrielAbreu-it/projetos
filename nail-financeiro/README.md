# Financeiro · nail designer

Painel privado de finanças para uma nail designer. Usa a mesma ideia da aba Finanças do Segundo Cérebro, sem nenhuma das outras partes (rotina, agenda, estudos, notícias).

Fica fora do portfólio: não aparece na vitrine nem na lista de projetos.

## O que tem

- **Tem agora**, **pode gastar por dia** até o fim do mês e **fim do mês previsto**, já contando os fixos que faltam.
- **+ Lançar** em quatro passos: o que aconteceu (gastei, recebi, guardei, tirei da reserva), quanto, com o quê e quando. O saldo se atualiza sozinho no banco.
- **Este mês**: quanto tinha no dia 1, quanto entrou, quanto gastou e a média por dia comparada ao limite.
- **Para onde vai o dinheiro**: pizza do planejado no mês ou do gasto real por categoria.
- **Planejar meses**: fixos de todo mês (entradas, gastos, quanto guardar), itens só de um mês e mudança de um fixo só num mês.
- **Projeção** de 3, 6, 9 e 12 meses e barras dos próximos 12 meses.
- **Dicas** automáticas com base nos números (gastos fixos x entradas, quanto guarda, reserva de emergência).

## Como colocar no ar

1. Em `supabase/schema.sql`, troque `EMAIL_DELA@exemplo.com` pelo e-mail dela e rode o arquivo no **SQL Editor** do Supabase. Tudo fica no esquema `nail`, separado do que já existir no projeto.
2. Em **Settings → API → Exposed schemas**, acrescente `nail` (ou rode as duas linhas comentadas no fim do arquivo, mantendo os esquemas que já estavam).
3. Em `config.js`, coloque a *Project URL*, a chave *anon public* e `SB_SCHEMA = 'nail'`.
4. Publique a pasta (no Vercel, como projeto próprio, sem framework).
5. Ela abre o link, toca em **Primeiro acesso? Criar senha**, usa o e-mail do passo 1 e confirma pelo e-mail que chega. Qualquer outro e-mail entra e não vê nada.

No celular, dá para usar **Adicionar à tela de início**.

A chave *anon* pode ficar no código: quem protege os dados são as regras do banco, que só deixam a dona ler e escrever.

## Rodar no computador

```bash
python3 -m http.server 8080
# abra http://localhost:8080/nail-financeiro/
```

## Arquivos

```
nail-financeiro/
├── index.html         página única
├── config.js          URL, chave e esquema do Supabase, nome dela
├── app.js             login, valores em R$, janela de edição
├── financas.js        tudo de finanças: projeção, lançamentos, fixos, mês a mês, pizza e dicas
├── app.css            estilos
├── tema.css           paleta rosé
├── icone.svg          ícone (aba do navegador e tela de início)
├── manifest.json      instalar no celular
└── supabase/schema.sql  tabelas, gatilho do saldo e acesso só da dona
```
