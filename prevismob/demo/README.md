# Demo — bugs do PrevIsmob

Página estática (HTML + JS puro) pra narrar ao vivo os 4 bugs propositais do projeto, chamando a API real que já roda com os bugs ativos. Não corrige nem esconde nada — só mostra a chamada e a resposta.

## Como rodar

1. Suba a API local do jeito de sempre (com o `.env` configurado — banco MySQL, chave do Google Maps para geocoding, etc.):

   ```bash
   pip install -r requirements.txt
   uvicorn api:app --reload
   ```

   Isso sobe a API em `http://localhost:8000` (porta padrão do projeto).

2. Sirva a pasta `demo/` com um servidor estático simples, numa porta diferente da API. O CORS do projeto já libera `http://localhost:5500` e `http://localhost:8001` por padrão, então qualquer um dos dois funciona sem configuração extra:

   ```bash
   cd demo
   python3 -m http.server 5500
   ```

3. Abra **`http://localhost:5500/index.html`** no navegador.

4. Clique em "Reproduzir" em cada seção. Cada botão faz o registro/login necessário sozinho — não precisa preparar nada manualmente antes.

## O que cada bug precisa

- **Bug 1** (área útil zero): só precisa da API rodando, sem login. Como a chamada segue até a geocodificação real (Google Maps), depende das credenciais configuradas no seu `.env` local — o que importa pro bug é a ausência do erro 422 esperado, mesmo que o resto da previsão falhe por outro motivo.
- **Bug 2** (cota invertida): compara uma chamada como guest com uma chamada autenticada. Registra um usuário novo automaticamente — mas como o login sem verificar e-mail só funciona por causa do bug 3, rode a seção 3 primeiro se a comparação não completar de primeira.
- **Bug 3** (bypass de verificação de e-mail): registra um usuário novo e tenta logar sem clicar em nenhum link de verificação.
- **Bug 4** (hash de senha exposto): reusa o mesmo fluxo do bug 3.

## Por que a ordem das seções importa um pouco

Os bugs 2, 3 e 4 dependem de conseguir logar — e hoje só é possível logar sem verificar e-mail por causa do bug 3 estar ativo (não há como automatizar o clique no link de verificação real, que dependeria do serviço de e-mail configurado). Se for narrar a demo do zero, vale reproduzir o bug 3 primeiro, só pra "aquecer" o fluxo — os outros continuam funcionando na ordem que preferir depois disso.
