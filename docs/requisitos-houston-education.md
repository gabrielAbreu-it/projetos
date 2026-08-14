# Documento de Requisitos — Houston Education (protótipo com bugs propositais)

## Objetivo

Usar a cópia do Houston Education (`/houston-education`) como base pra um protótipo com bugs de segurança/QA inseridos de propósito, servindo de material de estudo e de portfólio pra entrevista.

## Escopo do protótipo

Vou focar nas telas e rotas que já existem no projeto original — não adiciono funcionalidade nova, só uso o que já tem:

- Cadastro e login (aluno)
- Edição de perfil
- Painel admin com CRUD de Aluno, Campus, Curso, Disciplina, Inscrições, Local, Monitoria
- Fluxo de inscrição em monitoria (vagas/cota)

## Requisitos funcionais esperados (baseline, antes do bug)

1. Cadastro só aceita e-mail em formato válido e senha dentro da política mínima do projeto
2. Login só autentica com credenciais corretas; token JWT expira conforme configurado
3. Aluno só acessa as próprias informações de perfil, nunca as de outro aluno
4. Rotas de admin (`/admin/...`) só respondem pra usuário com papel de admin — aluno tentando acessar recebe 403
5. Inscrição em monitoria respeita o limite de vagas configurado — a vaga N não pode ser preenchida por mais de N alunos
6. Nenhuma resposta de API expõe hash de senha, token de outro usuário ou dado de outro aluno

## Bugs propositais planejados (ver Issue #1 no GitHub)

- Validação de formulário falhando em algum campo de cadastro/perfil
- Off-by-one na cota/vaga de monitoria (deixa entrar 1 aluno a mais que o limite)
- Condição de autorização invertida numa rota de admin (aluno acessa o que só admin deveria)
- Exposição de dado sensível em alguma resposta de rota

## Critério de aceite pra fase de correção

Pra cada bug inserido, o relatório final (Word) precisa mostrar: como reproduzir o bug, qual requisito da lista acima ele viola, e o diff da correção aplicada.
