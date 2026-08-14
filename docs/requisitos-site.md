# Documento de Requisitos — Site institucional STRATON.AI (protótipo original, com bugs propositais)

## Objetivo

Usar o protótipo original do site (`/site`) — escrito do zero por mim, sem cópia do site real — como base pra um protótipo com bugs de segurança/QA inseridos de propósito, servindo de material de estudo e de portfólio pra entrevista.

## Escopo do protótipo

3 páginas: landing (`index.html`) com formulário de captação de lead, `obrigado.html`, `privacidade.html`.

## Requisitos funcionais esperados (baseline, antes do bug)

1. O formulário só é enviado (redireciona pra `obrigado.html`) se o e-mail informado for válido
2. Todos os campos obrigatórios (nome, e-mail, telefone) precisam estar preenchidos antes do envio
3. A validação de e-mail no cliente não pode ser a única barreira — o formulário não deveria depender só de JS pra impedir envio malformado (ponto de atenção pra bug de segurança: validação só client-side é bypassável)

## Bugs propositais planejados

- Validação de e-mail com regex fraca ou que aceita formato inválido
- Campo obrigatório (`required`) removido de um input, permitindo envio vazio
- Envio do formulário sem qualquer sanitização, permitindo injeção de HTML/script no valor exibido em algum lugar (ex: se o nome fosse futuramente exibido em algum painel administrativo)

## Critério de aceite pra fase de correção

Cada bug inserido precisa vir com: como reproduzir (inclusive contornando a validação client-side via requisição direta), qual requisito da lista acima ele viola, e a correção aplicada.
