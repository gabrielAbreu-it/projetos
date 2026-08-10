# Changelog Houston Education
### Ferraris a 200 por hora.

Todas as alterações deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e esse projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).




## Legenda

| Tag | Descrição |
|-----|-----------|
| `Added` | Novas funcionalidades adicionadas ao sistema |
| `Changed` | Alterações em funcionalidades existentes |
| `Deprecated` | Funcionalidades que serão removidas em versões futuras |
| `Removed` | Funcionalidades removidas nesta versão |
| `Fixed` | Correções de bugs e erros |
| `Security` | Correções e melhorias relacionadas à segurança |

---

## Como Versionar

Este projeto utiliza o padrão **SemVer** (Semantic Versioning):

- **MAJOR** (`X.0.0`): alterações incompatíveis com versões anteriores
- **MINOR** (`0.X.0`): adição de funcionalidades mantendo compatibilidade
- **PATCH** (`0.0.X`): correções de bugs e ajustes menores

Exemplo de evolução de versão:

```
0.1.0 -> 0.2.0 -> 0.3.0 -> 1.0.0 -> 1.1.0 -> 1.1.1
```


## Notes

- **Versões mais antigas ficam sempre abaixo das versões mais recentes, seguindo o padrão estabelecido.**

---

## [1.5.3] - 2026-07-02

### Added

**Changelog Visível**
- Ícone de changelog no menu lateral exibindo a versão atual da aplicação.
- Modal de "Histórico de versões" acessível em todas as páginas com menu lateral.
- Renderização do arquivo `CHANGELOG.md` em cards agrupados por mês/ano, com data e versão destacadas.
- Endpoint `/api/versao` para retornar a versão da aplicação lida do `package.json`.

### Changed

**Documentação**
- Atualização do `README.md`.

**Interface e UX**
- Reestilização do item de changelog no menu lateral com divisor e posicionamento fixo na parte inferior.

---

## [1.5.2] - 2026-06-21

### Added

**Interface e UX**
- Ícones de "erro" associados às mensagens de "not found" (`monitoramento.png` e `monitoramento2.png` na pasta `assets`).
- Nova página de dashboard de admin com cards que levam para as páginas das entidades gerenciáveis.
- Novo ícone de setinha ao lado da aba "Minhas monitorias".
- Animação na página de perfil: ao alterar qualquer valor dos inputs, uma borda azul indica que o campo foi modificado.
- Ícone de lixeira na tela de gerenciamento de monitorias para exclusão.

**Funcionalidades**
- Lógica de exclusão de monitoria, permitida somente ao autor da monitoria ou ao admin.
- Interface `UsuarioLogado` para retornos em funções que utilizam `AuthRequest` estendido do `Request`.

**Auditoria**
- Evento `Monitoria:Excluir`, listener e registro na tabela de auditoria.
- Evento `Aluno:Senha`, listener e registro na tabela de auditoria para alteração de senha.

### Fixed

**Tela de Perfil**
- Corrigido o envio do campo `senhaConfirmada` no frontend da função de atualizar senha, que impedia a atualização via interface.

---

## [1.5.1] - 2026-06-19

### Added

**Interface e UX**
- Retorno do nome do curso na query de `getMinhasInscricoes`.
- Aumento no tamanho dos cards de monitoria e maior peso da fonte no nome da monitoria.
- Animação suave na barrinha que alterna entre os campus.
- Layout da página "Minhas Inscrições" reformulado para agrupar monitorias por curso, seguindo o padrão da home.
- Animação no ícone do menu lateral (três listras) com giro de 180 graus.
- Hover mais suave nas abas de navegação (cadastro, home etc.).
- Propriedade CSS `view-transition` para criar efeito de transição nativa ao mudar de página.
- Animação mais suave ao clicar no ícone de perfil.

### Changed

**Tela de Perfil**
- Ajustada posição dos botões "Alterar senha", "Salvar" e "Cancelar": botão de alteração de senha alinhado à esquerda.
- Renomeado botão "Salvar alterações" para "Salvar".

---

## [1.5.0] - 2026-06-18

### Added

**Testes de Performance e E2E**
- Estrutura de testes com k6 (smoke, load, stress, soak e spike) e comandos no `package.json`.
- Smoke tests de login e monitorias integrados ao CI.
- Testes E2E de login, monitoria e inscrição.
- Integração com qase.io para reporte de testes.

**Campo ATA em Monitorias**
- Novo campo `ata` na tabela de monitoria.
- Lógica de atualização do campo com validações e tratamento no frontend.

**Atribuição Automática de Monitor**
- O monitor é atribuído automaticamente ao cadastrar uma monitoria.
- Select de monitor desabilitado no formulário de cadastro.

**Auditoria do Sistema**
- Nova tabela `Auditoria` com migration correspondente.
- Eventos e listeners de auditoria para criação de monitoria, login, atualização de usuário, atualização de monitoria e inscrição.
- Página de auditoria com filtros por dia e exibição de detalhes.
- Rotas, controller e service de auditoria.

**Seed do Banco**
- Ajustes no `seed.ts` para refletir novas necessidades do sistema: Mudança nas senhas dos usuários de teste e alterações do banco.

### Changed

**Banco de Dados**
- Migração do PostgreSQL para CockroachDB.
- Provider do Prisma ajustado para `cockroachdb`.
- Uso de `sequence()` ao invés de `autoincrement()` nos IDs.

**CI/CD**
- Pipeline ajustada para rodar smoke tests.
- Workflow migrado para usar CockroachDB ao invés de PostgreSQL.
- Jobs separados em build e smoke.

**Interface e UX**
- Ajustes de HTML/CSS na página "Minhas Inscrições".
- Filtro por dia na tela de Auditoria.
- Exibição do nome do aluno e da monitoria nos detalhes de inscrição.
- Ícones de sucesso atualizados e bordas vermelhas em campos não preenchidos no formulário de monitoria.

**Documentação**
- Atualizações no README.
- Ajustes no `.gitignore`.

### Fixed

**Atualização de Monitoria**
- Corrigido bug que exibia popup de erro da ATA mesmo quando o campo não estava preenchido.

**Exclusão de Usuário**
- Impedida auto-exclusão de usuários no dashboard admin.

**Cadastro de Monitoria**
- Corrigido bug que impedia um monitor de criar monitoria devido ao select desabilitado.

**Retorno do Perfil**
- HOTFIX: retorno do nome do perfil nas funções do repository de aluno para garantir a criação correta do token JWT.

### Security

**Dados do Aluno**
- Ajustado retorno das funções do repository de aluno para expor apenas dados úteis e seguros.

---

## [1.4.0] - 2026-05-25

### Added

**Expiração Automática de Monitorias**
- Adicionados campos `deletedAt` e `expiredAt` na tabela de monitorias.
- Criada função para marcar monitorias como expiradas após sua realização.
- Implementado cron job que verifica e expira monitorias automaticamente a cada 10 minutos.

**Alteração de Senha**
- Adicionada funcionalidade de mudança de senha com endpoint separado.

**Segurança da Senha do Admin**
- Implementado `pepper` no hash da senha do administrador para camada extra de segurança.
- Criada pasta `security` com utilitário para leitura da variável de ambiente.
- Adicionado arquivo `.env.example` com as variáveis necessárias do projeto.

### Changed

**Responsividade**
- Ajustes de CSS e melhorias de responsividade em diversas telas.

**Máscara de Matrícula**
- Adicionada máscara no campo de input de matrícula nas telas de cadastro e perfil.
- Reforçada validação no schema Yup durante o update de aluno, garantindo integridade dos dados.

### Fixed

**Login do Administrador**
- Corrigido erro que impedia o login com perfil admin.

**Endpoint de Histórico**
- Corrigida referência hardcoded para `localhost` no fetch do histórico de monitorias, ajustando para o ambiente correto.

**Correção na função de update de monitoria**
- Ajuste em bug que não permitia a atualização de uma monitoria por apitar um erro na função de conflito() que verifica se uma monitoria já existe em um horário e local específico. O erro era que o id da monitoria que estava sendo atualizada não era passado na função, fazendo com que a consulta não excluisse a mesma e estourava um conflito com a própria monitoria. 

### Security

- Adicionado `pepper` criptográfico ao hash de senha do administrador, aumentando a resistência contra vazamentos de banco de dados.

---

## [1.3.1] - 2026-05-24

### Added


**Nova logo**
- Nova logo personalizada que reflete a Houston Education.

### Changed

**Layout de Gerenciamento de Monitorias**
- Mudança nas cores de alguns botões e ajustes de responsividades em páginas, tornando a experiência fluida.


<details>
<summary>🖼️ <b>Clique aqui para visualizar a nova logo</b></summary>

<br>

#### Logo
![Nova logo](./img/HoustonEducationLogo.png)

</details>

---
## [1.3.0] - 2026-05-21

### Added

**Gerenciamento de Presença**
- Adicionada validação por parte do monitor em relação à presença ou ausência de um aluno em uma monitoria.
- Criado campo `presente` na tabela de inscrição.
- Criado endpoint separado para atualização em lote de usuários em relação à sua presença em uma monitoria.

**Histórico de Monitorias**
- Criado endpoint separado para trazer as informações de histórico da monitoria de cada monitor.
- Criado endpoint geral para o admin visualizar o histórico de todas as monitorias.
- Criado endpoint para trazer as informações da chamada (presença dos alunos).

**Minhas Inscrições**
- Criada aba "Minhas inscrições" para os alunos visualizarem todas as suas inscrições em monitorias.
- Adicionado ícone de compartilhamento de monitoria.

**Abas de Gerenciamento de Monitorias**
- Implementadas abas "Antigas" e "Agendadas" na tela de gerenciamento de monitorias.
- Criado filtro para ordenar a aparição das monitorias na aba de gerenciamento e na home.

**Dashboard Admin**
- Adicionados mais campos de edição no painel do admin, permitindo a edição de todos os campos de um usuário.
- Adicionadas mensagens de erro para o admin ao tentar atualizar ou criar qualquer entidade já existente no banco de dados.

**Exportação de Presença**
- Implementada funcionalidade de exportar alunos presentes para PDF.

**Referência de Campus e Local**
- Adicionada referência ao campus em relação ao local quando visualizados os detalhes de uma monitoria ou quando uma monitoria é clicada na home.

**Preview de Senha**
- Adicionado "olhinho" que permite ver o preview da senha. Implementado no cadastro, login e dashboard do admin.

### Changed

**Layout de Gerenciamento de Monitorias**
- Aba de gerenciamento de monitorias agora passa a fazer parte da aba "Minhas monitorias".
- Divisão das páginas de gerenciamento de monitorias e a nova página de histórico de monitorias.

### Fixed

**Tela de Atualização**
- Corrigida tela de atualização quebrada, implementando scroll vertical.

**Regra de negócio**
- Implementada regra de negócio que barra a criação de uma monitoria em um mesmo local na mesma hora. 

<details>
<summary>🖼️ <b>Clique aqui para visualizar as telas desta versão</b></summary>

<br>

#### Home
![Tela Home](./img/TELAS-V1.3.0/Home-V1.3.0.png)

#### Minhas Inscrições
![Tela Minhas Inscrições](./img/TELAS-V1.3.0/MINHASINSCRICOES-V1.3.0.png)

#### Gerenciar Monitorias
![Tela Gerenciar Monitorias](./img/TELAS-V1.3.0/GERENCIARMONITORIAS-V1.3.0.png)

#### Histórico de Monitorias
![Tela Histórico de Monitorias](./img/TELAS-V1.3.0/HISTORICOMONITORIAS-V1.3.0.png)

</details>

---

## [1.2.0] - 2026-05-08

### Added

**Aba Perfil**
- Criada página de Perfil (`perfil.html`) para atualização de dados pessoais (nome, email, matrícula).
- Adicionado item "Perfil" no menu lateral visível para todos os perfis (Aluno, Monitor e Admin).

**Botão de Detalhes na Aba de Gerenciamento**
- Adicionado botão "Detalhes" nos cards de monitoria na tela de gerenciamento.
- Exibe popup com lista de todos os alunos inscritos naquela monitoria.
- Criado endpoint separado para trazer as informações de inscritos.

**Validações e Regras de Negócio**
- Adicionado tratamento de erro para matrícula duplicada: query que verifica se a matrícula já existe no banco antes de cadastrar/atualizar. Ademais, foi adicionado a validação para horário de fim menor ou igual ao horário de início.
- Adicionada validação de campos vazios no update de aluno: nome e email não podem ser enviados como string vazia, permitindo que apenas um campo seja atualizado por vez.

**Repository de Aluno**
- Criada função `findByEmailAndMatricula` que busca por email OU matrícula em uma única query.
- Substituídos todos os usos de `findByEmail` e `findByMatricula` isolados pela nova função unificada.

### Changed

**Modal de Atualização de Monitorias**
- Remodelação da modal de atualização com layout mais compacto.
- Campo "Descrição" movido para linha própria abaixo de "Nome" e acima de "Data", utilizando `textarea` para textos longos.
- Dropdowns de local e disciplina agora são filtrados com base no campus e curso selecionados previamente.



**JWT**
- Token JWT agora inclui o campo `matricula` no payload, eliminando a necessidade de endpoint extra para buscar dados do usuário logado.

### Fixed

**Responsividade do Dashboard Admin**
- Adicionado scroll horizontal nas tabelas do dashboard para dispositivos móveis (telas < 768px).
- Reduzido tamanho dos botões de ação (editar/excluir) em mobile para melhor usabilidade.

**Layout e Popups**
- Corrigido vazamento de texto da descrição nos cards e popups de monitoria com quebra de linha (`word-wrap: break-word`).
- Corrigido caminho de redirecionamento da aba Perfil para a Home.

<details>
<summary>🖼️ <b>Clique aqui para visualizar as telas desta versão</b></summary>

<br>

#### Home
![Tela Home](./img/TELAS-V1.1.0/homeV1.1.png)

#### Dashboard Admin
![Dashboard Admin - Usuários](./img/TELAS-V1.1.0/dashboardAdminUsuariosV1.1.png)
![Dashboard Admin - Locais](./img/TELAS-V1.1.0/dashboardAdminLocaisV1.1.png)
![Dashboard Admin - Disciplinas](./img/TELAS-V1.1.0/dashboardAdminDisciplinasV1.1.png)
![Dashboard Admin - Cursos](./img/TELAS-V1.1.0/dashboardAdminCursosV1.1.png)

#### Monitorias
![Tela de Gerenciamento](./img/TELAS-V1.2.0/gerenciamentoMonitoriasV1.2.png)
![Tela de Cadastro de Monitorias](./img/TELAS-V1.1.0/cadastroMonitoriasV1.1.png)

#### Perfil

![Tela de perfil](./img/TELAS-V1.2.0/perfilV1.2.png)

</details>


---


## [1.1.0] - 2026-04-30

### Added

**Entidade Curso**
- Criação da entidade `Curso` no schema do Prisma
- Tabela de junção `DisciplinaCurso` para relacionamento N:N entre Disciplina e Curso.
- CRUD completo da entidade Curso (Controller, Service, Repository).
- Páginas de dashboard para gerenciamento de disciplinas, locais e cursos no painel administrativo.
- Script `carregarCursos.js` para integração do frontend com a API de cursos.

**Associação Disciplina ↔ Curso**
- Associação de disciplinas com nenhum, um ou mais cursos nas operações de criação, atualização e consulta.
- Campos de curso incluídos nos dados retornados nas APIs de monitoria.

**Validação e Regras de Negócio**
- Adicionada unicidade (`@unique`) nos campos `nome` das entidades `Curso` e `Disciplina`.

**Infraestrutura**
- Nova migration `add_disciplina_curso` para criação das tabelas de Curso e DisciplinaCurso.
- Nova migration `add_unique_nome_curso_disciplina` para garantir unicidade nos nomes.
- Atualização do seed do banco de dados para refletir as novas entidades.

### Changed

**Layout da Home**
- Redesign do layout da página home com agrupamento de monitorias por curso em cards organizados.
- Cada card de monitoria agora exibe a sigla do curso associado.

**Dashboard Admin**
- Criação de páginas e scripts dedicados para gerenciamento de Locais, Disciplinas e Cursos no dashboard administrativo.
- Melhorias no CSS do painel administrativo (`estiloDashboardAdmin.css`).

### Fixed

**Fuso Horário das Monitorias**
- Corrigido o problema de deslocamento de 3 horas no cadastro e exibição das monitorias causado pela interpretação UTC em produção.
- Implementadas funções `criarDateBRT()` e `extrairHoraBRT()` no `MonitoriaService` para garantir que os horários sejam sempre tratados no padrão de Brasília (BRT, UTC-3).

**Layout da Tela de Gerenciamento**
- Ajustado o grid da página "Gerenciar Monitorias" para exibir 4 cards por linha em telas grandes.
- Removido o `max-width` dos cards para aproveitamento melhor do espaço disponível.

### Security
- Adicionada validação `noUnknown` nos schemas Yup para rejeitar campos não permitidos nas requisições.

<details>
<summary>🖼️ <b>Clique aqui para visualizar as telas desta versão</b></summary>

<br>

#### Home
![Tela Home](./img/TELAS-V1.1.0/homeV1.1.png)

#### Dashboard Admin
![Dashboard Admin - Usuários](./img/TELAS-V1.1.0/dashboardAdminUsuariosV1.1.png)
![Dashboard Admin - Locais](./img/TELAS-V1.1.0/dashboardAdminLocaisV1.1.png)
![Dashboard Admin - Disciplinas](./img/TELAS-V1.1.0/dashboardAdminDisciplinasV1.1.png)
![Dashboard Admin - Cursos](./img/TELAS-V1.1.0/dashboardAdminCursosV1.1.png)

#### Monitorias
![Tela de Gerenciamento](./img/TELAS-V1.1.0/gerenciamentoMonitoriasV1.1.png)
![Tela de Cadastro de Monitorias](./img/TELAS-V1.1.0/cadastroMonitoriasV1.1.png)

</details>

---


## [1.0.0] - 2026-04-28 - Primeira Versão oficial 


### Added
**Funcionalidades (Features)**
- CRUD completo e regras de negócio para as entidades: Aluno, Disciplina, Monitoria, Inscrições e Local.
- Páginas de interface de usuário (UI): Login, Home, Cadastro, Gerenciamento de Monitorias e Dashboard Admin.
- Sistema de autenticação de usuários integrado com JWT.

**Infraestrutura e Arquitetura**
- Estrutura inicial do projeto em Node.js com TypeScript.
- Configuração do servidor com Express.
- Integração com banco de dados PostgreSQL utilizando Prisma ORM.
- Criação de middlewares de segurança para autenticação, autorização e validação de requisições.
- Validação de schemas e rotas utilizando a biblioteca Yup.
- Separação da arquitetura em padrão MVC (Controller -> Service -> Repository).
- Implementação de Repositórios InMemory para a execução de testes isolados.
- Configuração de CI/CD via GitHub Actions para build automatizado.
- Estratégia de branches definida: `main` (produção) e `dev` (desenvolvimento contínuo).
- Deploy e hospedagem da aplicação configurados no Render.

<details>
<summary>🖼️ <b>Clique aqui para visualizar as telas desta versão</b></summary>

<br>

#### Login & Cadastro
![Tela de Login](./img/TELAS-V1.0.0/loginV1.png)
![Tela de Cadastro](./img/TELAS-V1.0.0/cadastroV1.png)

#### Home & Dashboard
![Tela Home](./img/TELAS-V1.0.0/homeV1.png)
![Tela Dashboard Admin](./img/TELAS-V1.0.0/dashboardAdminV1.png)

#### Monitorias
![Tela de Gerenciamento](./img/TELAS-V1.0.0/gerenciamentoMonitoriasV1.png)
![Tela de Cadastro de Monitorias](./img/TELAS-V1.0.0/cadastroMonitoriasV1.png)

</details>


---

