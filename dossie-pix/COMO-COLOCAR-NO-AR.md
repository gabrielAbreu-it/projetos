# Como colocar o Dossiê Pix no ar

## O que já funciona hoje

- O app em `prototipo/` é HTML, CSS e JavaScript puro. Basta publicar a pasta em qualquer hospedagem estática (Vercel, GitHub Pages, Netlify). Não tem etapa de build.
- Pode ser instalado no celular: no Chrome (Android) use "Instalar app" ou "Adicionar à tela inicial"; no Safari (iPhone) use "Compartilhar" e "Adicionar à Tela de Início".
- **Os dados ficam só no navegador de quem usa** (localStorage). Se a pessoa limpar o navegador ou trocar de aparelho, perde tudo. Por isso existe o botão "Baixar cópia dos dados" em Ajustes. Isso serve para demonstração e para os primeiros testes, não para operar com clientes pagantes.
- Os arquivos de prova são guardados dentro do navegador, com limite de 1,5 MB por imagem (depois de compactada) e 1 MB por PDF. O espaço total do navegador é pequeno (na casa de poucos MB).

## Passo a passo para a versão com login

1. Crie uma conta em supabase.com e um projeto novo (região São Paulo, se disponível). Guarde a senha do banco.
2. No painel do projeto, abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**. Isso cria as tabelas, os índices, as regras de acesso (RLS) e o bucket privado `provas` para os arquivos.
3. Em **Authentication > Providers**, deixe ligado o login por e-mail (link mágico é o mais simples para lojista).
4. Em **Project Settings > API**, copie a *Project URL* e a chave *anon public*. Elas vão no app; a chave `service_role` **nunca** vai para o navegador.
5. Em **Authentication > URL Configuration**, coloque o endereço onde o app está publicado.

## O que ainda falta ligar (trabalho de desenvolvimento)

- Trocar o corpo das funções de `prototipo/store.js` por chamadas ao Supabase (`supabase-js`). Os nomes das funções foram pensados para isso: `criarVenda`, `adicionarProva`, `abrirContestacao` etc.
- Upload dos arquivos para o bucket `provas` no caminho `<loja_id>/<venda_id>/<arquivo>`, em vez de dataURL.
- Telas de login, de criar a loja e de convidar a equipe (as regras do banco já preveem dono e equipe).
- Lembrete de prazo fora do app (e-mail ou push), que depende de uma função agendada no servidor.
- Cobrança dos planos (ver `docs/07-modelo-de-negocio.md`).
- Revisão de LGPD: o app guarda nome, telefone e CPF/CNPJ de clientes dos lojistas. Antes de abrir para clientes pagantes, é preciso termo de uso, política de privacidade e definir por quanto tempo os dados ficam guardados.

## Avisos importantes

- O Dossiê Pix organiza as provas que o lojista reúne. Não é aconselhamento jurídico e não garante que a contestação será aceita.
- O prazo padrão de 7 dias é só um exemplo. O prazo real depende das regras vigentes do Banco Central e de cada instituição; o lojista deve conferir com o banco dele.
