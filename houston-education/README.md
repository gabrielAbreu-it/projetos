> Projeto original de Henrique Gennari (github.com/HenriqueGennari). Incluído aqui com autorização pessoal dele, com meu nome adicionado como colaborador.

---

# 🚀 Houston Education – Sistema de Monitoria Estudantil

> **"Terra Chamando Houston!"** > Transformando a dificuldade acadêmica em colaboração mútua através de uma plataforma inteligente de monitoria.

Este projeto foi desenvolvido para o **Projeto Integrador** do curso de **Análise e Desenvolvimento de Sistemas (UniCEUB)**, focado em otimizar a ligação entre alunos com dificuldades e monitores capacitados.

---

## 💡 O Problema e a Nossa Solução

Identificamos que muitos estudantes enfrentam barreiras no aprendizado por falta de suporte imediato, enquanto alunos com alto desempenho não possuem um canal organizado para compartilhar conhecimento. 

A **Houston Education** surge para centralizar este ecossistema:
- **Para o Aluno:** Encontra auxílio rápido em disciplinas críticas e melhora o seu rendimento.
- **Para o Monitor:** Gere os seus horários e consolida o seu conhecimento da melhor forma: ensinando.
- **Para a Instituição:** Reduz a taxa de retenção e promove o engajamento estudantil.


---

## 📚 Documentação do Sistema

Para informações detalhadas sobre a arquitetura, regras de negócio e o histórico de evolução do projeto, acesse a pasta `/docs`:

- **[Documentação Principal](./docs/SRS-HoustonEducation.md):** Documento padronizado com a IEE 830 que contempla toda a documentação da aplicação.
- **[Changelog (Versionamento)](./docs/CHANGELOG.md):** Registro cronológico de todas as atualizações e versões, além de correções e novas funcionalidades implementadas.

---

## 🛠️ Stack Tecnológica

* **Backend:** [Node.js](https://nodejs.org/) com [TypeScript](https://www.typescriptlang.org/)
* **Banco de Dados:** [CockroachDB](https://www.cockroachlabs.com/) usando o [Prisma ORM](https://www.prisma.io/)
* **Frontend:** HTML5, CSS3 e JavaScript.
* **Arquitetura:** Padrão **MVC** (Model-View-Controller)

## 📋 Funcionalidades Principais

| Recurso | Descrição |
| :--- | :--- |
| **Autenticação Segura** | Cadastro e Login|
| **Monitorias** | Visualização de monitorias passíveis de inscrição e  controle e gerenciamento pelos monitores. |
| **Inscrição Simplicada** | Fluxo rápido para o aluno garantir a sua vaga. |
| **Gestão de Perfil** | Controle de informações pessoais e histórico de participações. |
| **Painel do admin** | Área exclusiva para o admin da aplicação, sendo possível adicionar, editar e deletar registros de todas as entidades da aplicação, além da visualização da auditoria completa do sistema. |


---

## 🎯 Estado Atual do MVP

> Esta seção declara objetivamente o que está **entregue e funcionando** na versão atual do sistema, e o que está **fora do escopo** desta entrega.

### ✅ Funcionalidades Entregues e Funcionando

O sistema está **online e acessível** via deploy no Render. As seguintes funcionalidades estão implementadas de ponta a ponta:

| Funcionalidade | Descrição | Status |
| :--- | :--- | :---: |
| **Autenticação** | Login e logout diferenciado para Aluno e Monitor | ✅ Funcionando |
| **Listagem de Monitorias** | Visualização de todas as monitorias disponíveis com disciplina, data e horário | ✅ Funcionando |
| **Inscrição em Monitoria** | Fluxo completo de inscrição do aluno em uma vaga disponível | ✅ Funcionando |
| **Painel do Monitor** | Criação, edição e exclusão de monitorias pelo monitor responsável | ✅ Funcionando |
| **Painel Administrativo** | Dashboard de gestão geral do sistema (`/dashboard-admin`) | ✅ Funcionando |
| **Gestão de Perfil** | Visualização e atualização de dados pessoais do usuário | ✅ Funcionando |

### ❌ O que está fora do escopo desta versão

Os itens abaixo foram **identificados como oportunidades futuras**, mas não fazem parte do MVP entregue:

- **Notificações automáticas:** Envio de e-mail ou push notification para confirmação de inscrição ou lembrete de monitoria.
- **Monitorias com mais monitores** Criação de monitorias conjuntas compostas por mais de um monitor.
- **Integração institucional:** Conexão com sistemas internos do UniCEUB (ex: matrícula, email).
- **Recuperação de senha:** Não há fluxo de "esqueci minha senha".
- **Controle de vagas:** O sistema não limita o número de inscrições por monitoria. Não há validação de capacidade máxima nem indicação de monitoria lotada.

### 🔗 Acesso ao Sistema

O sistema pode ser acessado e testado diretamente pelo deploy em produção no [Render](https://houston-education.onrender.com/pages/login.html) 
Para rodar localmente, siga as instruções na seção [Como Executar o Projeto](#️-como-executar-o-projeto-localmente) abaixo.

---

## ⚙️ Como Executar o Projeto Localmente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/HenriqueGennari/ProjetoIntegeradorMonitoria.git
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Configure as variáveis de ambiente:**
    Copie o arquivo de exemplo e preencha com os valores reais do seu ambiente:
    ```bash
    cp .env.example .env
    ```
4.  **Suba o CockroachDB via Docker:**
    ```bash
    docker run -d --name cockroach-local -p 26257:26257 -p 8080:8080 cockroachdb/cockroach:v25.4.10 start-single-node --insecure
    ```
5.  **Configure o cluster CockroachDB:**
    ```bash
    docker exec -it cockroach-local cockroach sql --insecure -e "SET CLUSTER SETTING sql.defaults.serial_normalization = 'sql_sequence';"
    ```
    > **💡 Por que esse comando?**  
    > Como migramos do PostgreSQL para o CockroachDB, esse ajuste é necessário por conta das diferenças de tipos e do tratamento de campos/tabelas entre os dois bancos. 
6.  **Crie o banco de dados:**
    Substitua `houstoneducationlocal` pelo mesmo nome usado na `DATABASE_URL` do seu `.env`:
    ```bash
    docker exec -it cockroach-local cockroach sql --insecure -e "CREATE DATABASE IF NOT EXISTS houstoneducationlocal;"
    ```
7.  **Rode as migrações e o Seed (Dados Iniciais):**
    ```bash
    npx prisma migrate dev
    npx prisma db seed
    ```
8.  **Inicie o servidor:**
    ```bash
    npm run dev
    ```
---

## 👨‍💻 Devs

**Henrique Gennari**  
💼 https://www.linkedin.com/in/henriquegennari
📧 henriquegennarilemgruber@gmail.com

**Pedro Henrique**  
💼 https://www.linkedin.com/in/pedro-hcruzz
📧 pedro.hcruzz14@gmail.com

---

### 📄 Licença
Este projeto é de uso acadêmico e pessoal, sem fins comerciais.

### 🚀 Houston, Ferraris a 200 por Hora!
Este projeto é a prova de que a tecnologia, quando bem aplicada, pode democratizar o ensino e facilitar a jornada acadêmica de todos.
