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

1. Crie um projeto novo no [Supabase](https://supabase.com) (não reaproveite o do Segundo Cérebro).
2. Em `supabase/schema.sql`, troque `EMAIL_DELA@exemplo.com` pelo e-mail dela e rode o arquivo inteiro no **SQL Editor**.
3. Em **Authentication → Users → Add user**, crie o usuário com o e-mail dela e uma senha (mínimo 8 caracteres), marcando *Auto Confirm User*. Como o e-mail bate com o do passo 2, ela vira a dona do painel. Qualquer outra conta entra e não vê nada.
4. Em **Authentication → Sign In / Providers**, desligue *Allow new users to sign up*, para ninguém mais criar conta.
5. Em **Settings → API**, copie a *Project URL* e a chave *anon public* para `config.js` (`SB_URL` e `SB_KEY`) e, se quiser, coloque o nome dela em `NOME`.
6. Publique. Como a pasta está no repositório do portfólio, ela já sai junto no deploy em `/nail-financeiro/`. No celular, dá para usar **Adicionar à tela de início**.

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
├── config.js          URL e chave do Supabase, nome dela
├── app.js             login, valores em R$, janela de edição
├── financas.js        tudo de finanças: projeção, lançamentos, fixos, mês a mês, pizza e dicas
├── app.css            estilos
├── tema.css           paleta rosé
├── icone.svg          ícone (aba do navegador e tela de início)
├── manifest.json      instalar no celular
└── supabase/schema.sql  tabelas, gatilho do saldo e acesso só da dona
```
