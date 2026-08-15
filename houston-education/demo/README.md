# Demo — bugs do Houston Education

Página estática (HTML + JS puro) pra narrar ao vivo os 4 bugs propositais do projeto, chamando a API real que já roda com os bugs ativos. Não corrige nem esconde nada — só mostra a chamada e a resposta.

## Como rodar

1. Suba a API local do jeito de sempre:

   ```bash
   npm install
   npm run prisma:generate
   npm run prisma:migrate
   npm run dev
   ```

   Isso sobe o servidor Express em `http://localhost:3000` (porta padrão, configurável via `PORT` no `.env`).

2. Rode o seed do banco, se ainda não tiver rodado (a demo depende dos usuários e monitorias de exemplo):

   ```bash
   npx prisma db seed
   ```

   Isso garante os usuários `paulo@email.com` / `P15l4!` (perfil MONITOR) e `joao@email.com` / `J414!` (perfil ALUNO) usados pela demo, além de 2 monitorias de exemplo.

3. Abra **`http://localhost:3000/demo/index.html`** no navegador.

   Importante: a demo precisa ser aberta por essa URL (servida pelo próprio Express), não como arquivo local (`file://...`). O CORS do servidor só libera `http://localhost:3000`, e a pasta `public/demo` é um symlink pra esta pasta (`houston-education/demo`) — então o Express já serve os arquivos daqui automaticamente, sem precisar copiar nada.

4. Clique em "Reproduzir" em cada seção. Cada botão faz a chamada (e o login necessário, quando aplicável) sozinho — não precisa logar manualmente antes.

## O que cada bug precisa

- **Bug 1** (matrícula fraca): só precisa da API rodando, sem login.
- **Bug 2** (autorização invertida) e **Bug 3** (hash de senha exposto): fazem login automático como Paulo (`paulo@email.com`), seedado pelo `prisma/seed.ts`.
- **Bug 4** (inscrição duplicada): faz login automático como João (`joao@email.com`) e busca a primeira monitoria disponível no banco — precisa que o seed já tenha rodado.

## Nota sobre o bug 4

Como o bug faz uma inscrição duplicada persistir de verdade no banco, rodar a demo várias vezes vai acumulando inscrições duplicadas — isso é o próprio bug se manifestando, não um problema da demo. Se quiser resetar entre apresentações: `npx prisma migrate reset` (recria o banco e roda o seed de novo).
