# Documento de Requisitos — Houston Education (protótipo com bugs propositais)

## Objetivo

Usar a cópia do Houston Education (`/houston-education`) como base pra um protótipo com bugs de segurança/QA inseridos de propósito, servindo de material de estudo e de portfólio pra entrevista.

## Escopo do protótipo

Vou focar nas telas e rotas que já existem no projeto original — não adiciono funcionalidade nova, só uso o que já tem:

- Cadastro e login (aluno)
- Edição de perfil
- Painel admin com CRUD de Aluno, Campus, Curso, Disciplina, Inscrições, Local, Monitoria
- Fluxo de inscrição em monitoria (vagas/cota)

**Correção em relação ao briefing original:** eu tinha planejado um bug de "off-by-one em vaga/cota de monitoria", mas ao ler o código de verdade (`prisma/schema.prisma`, `InscricoesService`) confirmei que o projeto real do Henrique **não tem** campo de capacidade/vaga em `Monitoria` — não existe essa regra hoje. Troquei esse item por um bug real que existe no fluxo de inscrição: controle de inscrição duplicada.

## Requisitos funcionais esperados (baseline, antes do bug)

1. Cadastro só aceita e-mail em formato válido e matrícula com 8 a 11 dígitos numéricos (`src/schemas/alunoSchema.ts`)
2. Login só autentica com credenciais corretas; token JWT emitido conforme `src/utils/jwt/jwt.ts`
3. Aluno só acessa as próprias inscrições (`getMinhasInscricoes` bloqueia `user.id !== alunoId`)
4. Rotas restritas a ADMIN (`autorizadoMiddleware`) só respondem pra usuário com o perfil permitido — quem não tem o perfil recebe 403
5. Um aluno não pode se inscrever duas vezes na mesma monitoria (`InscricoesService.create` bloqueia via `findAlunoMonitoria`)
6. Resposta de `GET /alunos/:id` não inclui o hash da senha do aluno (`AlunoPrismaRepository.getById` não seleciona o campo `senha`)

## Bugs propositais planejados (ver Issue #1 no GitHub)

- Validação de matrícula aceitando 1 dígito a menos que o mínimo exigido (`alunoCreateSchema`)
- Condição de autorização invertida no `autorizadoMiddleware` (bloqueia quem deveria poder acessar, libera quem não deveria)
- Exposição do hash de senha na resposta de `GET /alunos/:id` (`AlunoPrismaRepository.getById`)
- Condição de inscrição duplicada invertida em `InscricoesService.create` (permite duplicar inscrição, bloqueia inscrição legítima)

## Critério de aceite pra fase de correção

Pra cada bug inserido, o relatório final (Word) precisa mostrar: como reproduzir o bug, qual requisito da lista acima ele viola, e o diff da correção aplicada.
