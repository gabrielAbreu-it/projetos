import { describe, it, before, after } from "mocha";
import assert from "assert";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import path from "path";

import {
  QASE_CASE_MAP,
  reportQaseResult,
} from "./utils/qase-reporter.js";

describe("Login E2E", function () {
  let driver: any;

  before(async function () {
    const options = new chrome.Options();

    // Descomente a linha abaixo para rodar sem abrir a janela do navegador.
    // options.addArguments("--headless=new");

    options.addArguments("--no-sandbox");
    options.addArguments("--disable-dev-shm-usage");
    options.addArguments("--window-size=1920,1080");

    // Desativa avisos do Chrome sobre senhas fracas/vazadas,
    // gerenciador de senhas e diálogos de autofill.
    options.addArguments("--disable-features=PasswordManager,PasswordCheck,Autofill");
    options.addArguments("--disable-blink-features=PasswordCheck");
    options.addArguments("--disable-save-password-bubble");
    options.addArguments("--disable-popup-blocking");

    const chromedriverPath = path.resolve(
      process.cwd(),
      "node_modules",
      "chromedriver",
      "lib",
      "chromedriver",
      "chromedriver.exe"
    );

    const service = new chrome.ServiceBuilder(chromedriverPath);

    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(options)
      .setChromeService(service)
      .build();
  });

  after(async function () {
    await driver.quit();
  });

  /**
   * Executa um cenário de teste e reporta o resultado automaticamente para o qase.io.
   *
   * @param caseId - ID do caso de teste no qase.io
   * @param testFn - função assíncrona com o cenário de teste
   */
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

      // Re-lança o erro para que o Mocha também conte o teste como falho.
      throw error;
    }
  }

  it("deve fazer login com sucesso como aluno", async function () {
    await runTest(QASE_CASE_MAP.LOGIN_SUCESSO_ALUNO, async () => {
      await driver.get("http://localhost:3000/pages/login.html");

      await driver.executeScript("localStorage.clear();");
      await driver.manage().deleteAllCookies();

      await driver
        .findElement(By.css("input[name='email']"))
        .sendKeys("joao@email.com");

      await driver.findElement(By.css("#inputSenhaLogin")).sendKeys("J414!");
      await driver.findElement(By.css("#btnLogin")).click();

      await driver.wait(until.urlContains("/pages/home.html"), 10000);

      const token = await driver.executeScript(
        "return localStorage.getItem('token');"
      );

      assert.ok(token, "Token não foi salvo no localStorage");
    });
  });

  it("deve exibir mensagem de erro para senha incorreta", async function () {
    await runTest(QASE_CASE_MAP.LOGIN_CREDENCIAIS_INVALIDAS, async () => {
      await driver.get("http://localhost:3000/pages/login.html");

      await driver.executeScript("localStorage.clear();");
      await driver.manage().deleteAllCookies();

      await driver
        .findElement(By.css("input[name='email']"))
        .sendKeys("joao@email.com");
      await driver.findElement(By.css("#inputSenhaLogin")).sendKeys("senhaErrada");
      await driver.findElement(By.css("#btnLogin")).click();

      const mensagem = await driver.wait(
        until.elementLocated(By.css("#mensagem")),
        10000
      );

      await driver.wait(async () => {
        const texto = await mensagem.getText();
        return texto.length > 0;
      }, 10000);

      const texto = await mensagem.getText();
      assert.strictEqual(texto, "Email ou senha incorretos!");
    });
  });

  it("deve exibir mensagem de erro para campos vazios", async function () {
    await runTest(QASE_CASE_MAP.LOGIN_CAMPOS_VAZIOS, async () => {
      await driver.get("http://localhost:3000/pages/login.html");

      await driver.executeScript("localStorage.clear();");
      await driver.manage().deleteAllCookies();

      await driver.findElement(By.css("input[name='email']")).sendKeys("");
      await driver.findElement(By.css("#inputSenhaLogin")).sendKeys("");
      await driver.findElement(By.css("#btnLogin")).click();

      const mensagem = await driver.wait(
        until.elementLocated(By.css("#mensagem")),
        10000
      );

      await driver.wait(async () => {
        const texto = await mensagem.getText();
        return texto.length > 0;
      }, 10000);

      const texto = await mensagem.getText();
      assert.strictEqual(texto, "Preencha todos os campos!");
    });
  });
});
