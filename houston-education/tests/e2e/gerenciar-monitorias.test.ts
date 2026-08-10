import { describe, it, before, after } from "mocha";
import assert from "assert";
import { By, until, WebDriver } from "selenium-webdriver";

import {
  QASE_CASE_MAP,
  reportQaseResult,
} from "./utils/qase-reporter.js";
import { createDriver, loginAs, waitForNonEmptyText, getElementText } from "./utils/driver-setup.js";
import {
  loginApi,
  getUserIdFromToken,
  getCursoId,
  getDisciplinaId,
  getLocalId,
} from "./utils/api-helpers.js";

describe("Gerenciar Monitorias E2E", function () {
  let driver: WebDriver;
  let monitorToken: string;
  let monitorId: string;
  let cursoId: string;
  let disciplinaId: string;
  let localId: string;
  let localId2: string;

  before(async function () {
    driver = await createDriver();

    // Busca IDs reais via API para preencher o formulário de monitoria.
    monitorToken = await loginApi("paulo@email.com", "P15l4!");
    monitorId = getUserIdFromToken(monitorToken);
    cursoId = await getCursoId(monitorToken, "Ciência da Computação");
    disciplinaId = await getDisciplinaId(monitorToken, cursoId, "Banco de dados");
    localId = await getLocalId(monitorToken, "Sala 170");
    localId2 = await getLocalId(monitorToken, "Sala 160");
  });

  after(async function () {
    await driver.quit();
  });

  async function runTest(
    caseId: number,
    testFn: () => Promise<void>
  ): Promise<void> {
    const start = Date.now();

    try {
      await testFn();
      const duration = Date.now() - start;
      await reportQaseResult(caseId, "passed", "Teste passou", duration);
    } catch (error) {
      const duration = Date.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      await reportQaseResult(caseId, "failed", message, duration);
      throw error;
    }
  }

  async function preencherFormularioMonitoria(
    nome: string,
    data: string,
    horaInicio: string,
    horaFim: string,
    localSelecionado: string
  ): Promise<void> {
    await driver.executeScript(
      `
      const setValue = (selector, value) => {
        const el = document.querySelector(selector);
        if (!el) throw new Error('Elemento não encontrado: ' + selector);
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };

      setValue('#nome_monitoria', arguments[0]);
      setValue('#descricao', 'Descrição de teste E2E');
      setValue('#data', arguments[1]);
      setValue('#hora_inicio', arguments[2]);
      setValue('#hora_fim', arguments[3]);

      setValue('#campus', '1');
      setValue('#locais', arguments[4]);
      setValue('#local-id', arguments[4]);

      setValue('#cursos', arguments[5]);
      setValue('#disciplinas', arguments[6]);
      setValue('#monitores', arguments[7]);
      `,
      nome,
      data,
      horaInicio,
      horaFim,
      localSelecionado,
      cursoId,
      disciplinaId,
      monitorId
    );
  }

  function gerarDataHorarioUnicos(timestamp: number): {
    data: string;
    horaInicio: string;
    horaFim: string;
  } {
    const base = new Date();
    base.setDate(base.getDate() + 30 + (timestamp % 30));
    const data = base.toISOString().split("T")[0];

    const horaBase = 8 + (timestamp % 10);
    const horaInicio = `${horaBase.toString().padStart(2, "0")}:00`;
    const horaFim = `${(horaBase + 2).toString().padStart(2, "0")}:00`;

    return { data, horaInicio, horaFim };
  }

  it("deve criar nova monitoria com dados válidos", async function () {
    await runTest(QASE_CASE_MAP.CRIAR_MONITORIA_VALIDA, async () => {
      await loginAs(driver, "paulo@email.com", "P15l4!");
      await driver.get("http://localhost:3000/pages/cadastrarMonitoria.html");

      await driver.wait(until.elementLocated(By.css("#monitoriaForm")), 10000);

      const timestamp = Date.now();
      const nomeMonitoria = `Monitoria E2E ${timestamp}`;
      const { data, horaInicio, horaFim } = gerarDataHorarioUnicos(timestamp);

      await preencherFormularioMonitoria(
        nomeMonitoria,
        data,
        horaInicio,
        horaFim,
        localId2
      );

      await driver.findElement(By.css("#botaoCriarMonitoria")).click();

      try {
        const popup = await driver.wait(
          until.elementLocated(By.css("#popupSucesso:not(.hidden)")),
          10000
        );
        const texto = await popup.getText();
        assert.ok(texto.includes("Monitoria cadastrada com sucesso"), "Popup de sucesso não foi exibido");
      } catch (err) {
        const mensagemErro = await getElementText(driver, "#mensagem");
        const url = await driver.getCurrentUrl();
        throw new Error(
          `Monitoria não foi criada. URL: ${url}. Mensagem de erro: ${mensagemErro || "(nenhuma)"}`
        );
      }
    });
  });

  it("deve exibir erro ao criar monitoria com horário de fim menor que o início", async function () {
    await runTest(QASE_CASE_MAP.CRIAR_MONITORIA_HORARIO_INVALIDO, async () => {
      await loginAs(driver, "paulo@email.com", "P15l4!");
      await driver.get("http://localhost:3000/pages/cadastrarMonitoria.html");

      await driver.wait(until.elementLocated(By.css("#monitoriaForm")), 10000);

      const timestamp = Date.now();
      const nomeMonitoria = `Monitoria Horário Inválido ${timestamp}`;
      const { data } = gerarDataHorarioUnicos(timestamp);

      await preencherFormularioMonitoria(
        nomeMonitoria,
        data,
        "16:00",
        "14:00",
        localId
      );

      await driver.findElement(By.css("#botaoCriarMonitoria")).click();

      const texto = await waitForNonEmptyText(driver, "#mensagem", 10000);
      assert.ok(
        texto.includes("Horário inválido") || texto.includes("início deve ser anterior"),
        `Mensagem de erro inesperada: ${texto}`
      );
    });
  });

  it("deve exibir erro ao criar monitoria em local e horário já ocupado", async function () {
    await runTest(QASE_CASE_MAP.CRIAR_MONITORIA_CONFLITO_HORARIO, async () => {
      await loginAs(driver, "paulo@email.com", "P15l4!");

      // Cria a primeira monitoria no horário/local desejado.
      await driver.get("http://localhost:3000/pages/cadastrarMonitoria.html");
      await driver.wait(until.elementLocated(By.css("#monitoriaForm")), 10000);

      const timestamp = Date.now();
      const nomeBase = `Monitoria Conflito ${timestamp}`;
      const { data, horaInicio, horaFim } = gerarDataHorarioUnicos(timestamp);

      await preencherFormularioMonitoria(
        nomeBase,
        data,
        horaInicio,
        horaFim,
        localId
      );

      await driver.findElement(By.css("#botaoCriarMonitoria")).click();

      await driver.wait(
        until.elementLocated(By.css("#popupSucesso:not(.hidden)")),
        10000
      );

      // Tenta criar outra monitoria no mesmo local/horário.
      await driver.get("http://localhost:3000/pages/cadastrarMonitoria.html");
      await driver.wait(until.elementLocated(By.css("#monitoriaForm")), 10000);

      await preencherFormularioMonitoria(
        `${nomeBase} Duplicada`,
        data,
        horaInicio,
        horaFim,
        localId
      );

      await driver.findElement(By.css("#botaoCriarMonitoria")).click();

      const texto = await waitForNonEmptyText(driver, "#mensagem", 10000);
      assert.ok(
        texto.includes("Já existe uma monitoria agendada") || texto.includes("conflito"),
        `Mensagem de erro inesperada: ${texto}`
      );
    });
  });

  it("deve editar monitoria existente", async function () {
    await runTest(QASE_CASE_MAP.EDITAR_MONITORIA, async () => {
      await loginAs(driver, "paulo@email.com", "P15l4!");

      // Cria uma monitoria para depois editar.
      await driver.get("http://localhost:3000/pages/cadastrarMonitoria.html");
      await driver.wait(until.elementLocated(By.css("#monitoriaForm")), 10000);

      const timestamp = Date.now();
      const nomeOriginal = `Monitoria Edição ${timestamp}`;
      const { data, horaInicio, horaFim } = gerarDataHorarioUnicos(timestamp);

      await preencherFormularioMonitoria(
        nomeOriginal,
        data,
        horaInicio,
        horaFim,
        localId2
      );

      await driver.findElement(By.css("#botaoCriarMonitoria")).click();
      await driver.wait(
        until.elementLocated(By.css("#popupSucesso:not(.hidden)")),
        10000
      );

      // Acessa a tela de gerenciamento e edita.
      await driver.get("http://localhost:3000/gerenciar-monitorias");
      await driver.wait(
        until.elementLocated(By.css("#listamonitorias .cardmonitoria")),
        10000
      );

      const cards = await driver.findElements(By.css("#listamonitorias .cardmonitoria"));
      assert.ok(cards.length > 0, "Nenhuma monitoria encontrada para edição");

      const btnEditar = await driver.findElement(By.css("#listamonitorias .btn-editar-card"));
      await btnEditar.click();

      await driver.wait(
        until.elementLocated(By.css("#modalOverlay.open")),
        10000
      );

      const inputNome = await driver.findElement(By.css("#formAtualizarMonitoria input[name='nome_monitoria']"));
      await inputNome.clear();
      await inputNome.sendKeys(`${nomeOriginal} Editada`);

      await driver.findElement(By.css("#submit_btn_atualizar")).click();

      await driver.wait(
        until.elementLocated(By.css("#popupSucessoAtualizar:not(.hidden)")),
        10000
      );

      const popupTexto = await driver.findElement(By.css("#popupSucessoAtualizar")).getText();
      assert.ok(
        popupTexto.includes("Monitoria atualizada com sucesso") || popupTexto.includes("Atualizada com Sucesso"),
        "Popup de sucesso na edição não foi exibido"
      );
    });
  });
});
