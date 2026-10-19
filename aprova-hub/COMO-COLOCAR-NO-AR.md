# Como colocar o Aprova Hub no ar

## O que já funciona hoje

- O app em `prototipo/` roda em qualquer hospedagem de site estático (Vercel, GitHub Pages, Netlify). Não precisa de build.
- Todos os dados ficam salvos **só no navegador do aparelho** (localStorage). Cada pessoa que abre o link vê a própria cópia da demonstração.
- Dá para instalar no celular: no Chrome, menu > "Instalar app" ou "Adicionar à tela inicial"; no iPhone, Safari > Compartilhar > "Adicionar à Tela de Início".
- O botão "Recomeçar demonstração" volta tudo para os dados de exemplo.

Ou seja: hoje serve para **demonstrar e vender**. Para uma turma real usar junto, falta o banco com login.

## Passo a passo do banco (Supabase)

1. Crie uma conta em supabase.com e um projeto novo (escolha a região de São Paulo).
2. Vá em **SQL Editor**, cole todo o arquivo `supabase/schema.sql` e clique em **Run**. Ele cria as tabelas, as regras de acesso (RLS) e as funções de ranking e de resumo do caderno.
3. Em **Authentication > Providers**, ative login por e-mail (link mágico) ou por telefone.
4. Em **Project Settings > API**, copie a **URL do projeto** e a **chave anon (pública)**. A chave de serviço nunca vai para o app.
5. Cadastre as questões do simulado da semana na tabela `simulados`.

## O que falta ligar (trabalho de desenvolvimento)

- **Trocar o `store.js`:** hoje cada função grava no localStorage. Na versão com login, cada função (`registrarSessao`, `salvarPlano`, `registrarTentativa`, `registrarErro` etc.) passa a chamar o Supabase com o mesmo nome. A interface não precisa mudar.
- **Telas de entrada:** login, "criar turma" para o mentor e "aceitar convite" para o aluno (a tabela `convites` já existe).
- **Gabarito do simulado:** servir as questões sem a resposta certa e corrigir no servidor (função ou Edge Function).
- **Cobrança do mentor:** ligar um provedor de pagamento à tabela `assinaturas` (atualizada pelo servidor, não pelo app).
- **Aviso de LGPD:** termos de uso e política de privacidade, porque o app guarda nome, telefone e desempenho de estudo.
- **Fase 2:** cobrança do aluno por Pix Automático via empresa de pagamento parceira.

## Custos para começar

O plano gratuito do Supabase e da Vercel cobre o piloto com os primeiros mentores. Confira os limites atuais no site de cada serviço antes de crescer.
