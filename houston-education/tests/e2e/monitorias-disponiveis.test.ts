import { describe, it, before, after } from "mocha";
import assert from "assert";
import { By, until, WebDriver } from "selenium-webdriver";

import {
  QASE_CASE_MAP,
  reportQaseResult,
} from "./utils/qase-reporter.js";
import { createDriver, loginAs } from "./utils/driver-setup.js";

describe("Monitorias Disponíveis e Inscrições E2E", function () {
  let driver: WebDriver;

  before(async function () {
    driver = await createDriver();
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

  it("deve exibir monitorias disponíveis na Home", async function () {
    await runTest(QASE_CASE_MAP.VISUALIZAR_MONITORIAS_DISPONIVEIS, async () => {
      await loginAs(driver, "joao@email.com", "J414!");
      await driver.get("http://localhost:3000/pages/home.html");

      await driver.wait(
        until.elementLocated(By.css("#listamonitorias .cardmonitoria")),
        10000
      );

      const cards = await driver.findElements(By.css("#listamonitorias .cardmonitoria"));
      assert.ok(cards.length > 0, "Nenhuma monitoria disponível foi encontrada na Home");
    });
  });

  it("deve inscrever aluno em monitoria disponível", async function () {
    await runTest(QASE_CASE_MAP.INSCRICAO_MONITORIA, async () => {
      await loginAs(driver, "joao@email.com", "J414!");
      await driver.get("http://localhost:3000/pages/home.html");

      await driver.wait(
        until.elementLocated(By.css("#listamonitorias .btn-inscrever")),
        10000
      );

      const botaoInscrever = await driver.findElement(By.css("#listamonitorias .btn-inscrever"));
      await botaoInscrever.click();

      await driver.wait(
        until.elementLocated(By.css("#listamonitorias .btn-inscrito")),
        10000
      );

      const botaoInscrito = await driver.findElement(By.css("#listamonitorias .btn-inscrito"));
      const texto = await botaoInscrito.getText();
      assert.strictEqual(texto, "Inscrito", "O botão não mudou para 'Inscrito' após a inscrição");
    });
  });

  it("não deve permitir inscrição duplicada na mesma monitoria", async function () {
    await runTest(QASE_CASE_MAP.INSCRICAO_DUPLICADA, async () => {
      await loginAs(driver, "joao@email.com", "J414!");
      await driver.get("http://localhost:3000/pages/home.html");

      await driver.wait(
        until.elementLocated(By.css("#listamonitorias .btn-inscrito")),
        10000
      );

      const botaoInscrito = await driver.findElement(By.css("#listamonitorias .btn-inscrito"));
      await botaoInscrito.click();

      // Após clicar em "Inscrito", a UI deve continuar mostrando "Inscrito".
      const textoAposClique = await botaoInscrito.getText();
      assert.strictEqual(textoAposClique, "Inscrito", "O botão permitiu nova inscrição em monitoria já inscrita");
    });
  });

  it("deve exibir 'Minhas Inscrições' com a monitoria inscrita", async function () {
    await runTest(QASE_CASE_MAP.VISUALIZAR_MINHAS_INSCRICOES, async () => {
      await loginAs(driver, "joao@email.com", "J414!");
      await driver.get("http://localhost:3000/pages/minhasInscricoes.html");

      await driver.wait(
        until.elementLocated(By.css("#listaInscricoes .cardmonitoria")),
        10000
      );

      const cards = await driver.findElements(By.css("#listaInscricoes .cardmonitoria"));
      assert.ok(cards.length > 0, "Nenhuma inscrição foi exibida em 'Minhas Inscrições'");
    });
  });
});
