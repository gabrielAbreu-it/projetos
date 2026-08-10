import { describe, it, before, after } from "mocha";
import assert from "assert";
import { By, WebDriver } from "selenium-webdriver";

import {
  QASE_CASE_MAP,
  reportQaseResult,
} from "./utils/qase-reporter.js";
import { createDriver, waitForNonEmptyText, disableJsDialogs } from "./utils/driver-setup.js";
import { cadastrarAlunoApi } from "./utils/api-helpers.js";

describe("Cadastro E2E", function () {
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

  it("deve cadastrar novo aluno com dados válidos", async function () {
    await runTest(QASE_CASE_MAP.CADASTRO_ALUNO_VALIDO, async () => {
      const timestamp = Date.now();
      const matricula = `999${timestamp.toString().slice(-8)}`;
      const email = `teste${timestamp}@email.com`;

      await driver.get("http://localhost:3000/pages/cadastro.html");
      await disableJsDialogs(driver);
      await disableJsDialogs(driver);

      await driver.findElement(By.css("input[name='nome']")).sendKeys("Aluno Teste E2E");
      await driver.findElement(By.css("input[name='matricula']")).sendKeys(matricula);
      await driver.findElement(By.css("input[name='email']")).sendKeys(email);
      await driver.findElement(By.css("#inputSenhaCadastro")).sendKeys("123456");

      await driver.findElement(By.css("#btnCadastrar")).click();

      await driver.wait(async () => {
        const url = await driver.getCurrentUrl();
        return url.includes("login.html");
      }, 10000);

      const url = await driver.getCurrentUrl();
      assert.ok(url.includes("login.html"), "Não foi redirecionado para a página de login");
    });
  });

  it("deve exibir erro ao cadastrar com matrícula duplicada", async function () {
    await runTest(QASE_CASE_MAP.CADASTRO_MATRICULA_DUPLICADA, async () => {
      const timestamp = Date.now();
      const matriculaDuplicada = `888${timestamp.toString().slice(-8)}`;
      const emailUnico = `teste${timestamp}@email.com`;

      // Cria um aluno via API com matrícula válida para garantir a duplicata.
      await cadastrarAlunoApi({
        nome: "Aluno Matrícula Duplicada",
        email: emailUnico,
        senha: "123456",
        matricula: matriculaDuplicada,
      });

      await driver.get("http://localhost:3000/pages/cadastro.html");
      await disableJsDialogs(driver);

      await driver.findElement(By.css("input[name='nome']")).sendKeys("Aluno Matrícula Duplicada UI");
      await driver.findElement(By.css("input[name='matricula']")).sendKeys(matriculaDuplicada);
      await driver.findElement(By.css("input[name='email']")).sendKeys(`outro${timestamp}@email.com`);
      await driver.findElement(By.css("#inputSenhaCadastro")).sendKeys("123456");

      await driver.findElement(By.css("#btnCadastrar")).click();

      const texto = await waitForNonEmptyText(driver, "#mensagem", 10000);
      assert.strictEqual(texto, "Matrícula ou email já cadastrados");
    });
  });

  it("deve exibir erro ao cadastrar com email duplicado", async function () {
    await runTest(QASE_CASE_MAP.CADASTRO_EMAIL_DUPLICADO, async () => {
      const timestamp = Date.now();
      const matriculaUnica = `999${timestamp.toString().slice(-8)}`;

      await driver.get("http://localhost:3000/pages/cadastro.html");
      await disableJsDialogs(driver);

      await driver.findElement(By.css("input[name='nome']")).sendKeys("Aluno Email Duplicado");
      await driver.findElement(By.css("input[name='matricula']")).sendKeys(matriculaUnica);
      await driver.findElement(By.css("input[name='email']")).sendKeys("joao@email.com");
      await driver.findElement(By.css("#inputSenhaCadastro")).sendKeys("123456");

      await driver.findElement(By.css("#btnCadastrar")).click();

      const texto = await waitForNonEmptyText(driver, "#mensagem", 10000);
      assert.strictEqual(texto, "Matrícula ou email já cadastrados");
    });
  });
});
