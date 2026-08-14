# Documento de Requisitos — PrevIsmob (protótipo com bugs propositais)

## Objetivo

Usar a cópia do meu TCC (`/prevismob`) como base pra um protótipo com bugs de segurança/QA inseridos de propósito, servindo de material de estudo e de portfólio pra entrevista.

## Escopo do protótipo

Sem funcionalidade nova, só o que já existe no projeto original:

- Cadastro, login e recuperação/reset de senha
- Login social via Google (verificação de ID Token)
- Formulário de previsão de preço (nome do prédio, área, condomínio, quartos, vagas)
- Fluxo de cota diária (visitante vs. autenticado)
- Exclusão de conta (LGPD)
- Exportação de histórico/comparação (CSV/PDF)

## Requisitos funcionais esperados (baseline, antes do bug)

1. Cadastro exige e-mail válido e confirma via verificação de e-mail antes de liberar login completo
2. Login social só aceita ID Token do Google realmente válido e não expirado
3. Formulário de previsão só aceita valores numéricos positivos pra área, condomínio, quartos e vagas
4. Usuário visitante tem um limite diário de previsões; usuário autenticado tem um limite maior (ou ilimitado, conforme regra do projeto) — o limite do visitante nunca pode passar do configurado
5. Exclusão de conta remove de fato os dados do usuário e invalida os tokens JWT (access + refresh) dele
6. Resposta da API de previsão/histórico nunca inclui dado de outro usuário

## Bugs propositais planejados (ver Issue #2 no GitHub)

- Inverter a condição de cota diária (guest vs. autenticado)
- Bug de validação no formulário de previsão (aceitar área/vagas negativas ou não numéricas)
- Expor dado sensível na resposta de alguma rota `/v1`
- Falha no bypass de verificação de e-mail (login completo sem confirmar e-mail)

## Critério de aceite pra fase de correção

Como o projeto já tem suíte de testes formal (pytest + Selenium), cada bug deve vir acompanhado de qual caso de teste existente ele quebra (ou deveria quebrar) — isso facilita mostrar o antes/depois no relatório final.
