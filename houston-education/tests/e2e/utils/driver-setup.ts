import { Builder, By, until, WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import path from "path";
import os from "os";

const BASE_URL = "http://localhost:3000";

/**
 * Cria e retorna uma instância do Chrome WebDriver configurada para os testes E2E.
 */
export async function createDriver(): Promise<WebDriver> {
  const options = new chrome.Options();

  // Executa o Chrome sem interface gráfica (mais estável e sem alertas do navegador).
  options.addArguments("--headless=new");

  // Usa um perfil temporário limpo a cada execução para evitar problemas de
  // perfil travado entre os testes.
  const userDataDir = path.join(os.tmpdir(), `chrome-e2e-${Date.now()}`);
  options.addArguments(`--user-data-dir=${userDataDir}`);

  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");
  options.addArguments("--window-size=1920,1080");

  // Desativa avisos do Chrome sobre senhas fracas/vazadas,
  // gerenciador de senhas, diálogos de autofill, detecção de vazamento,
  // sincronização, GCM e outros serviços em segundo plano.
  options.addArguments("--disable-features=PasswordManager,PasswordCheck,Autofill,PasswordLeakDetection,PasswordBreachAgent,SafeBrowsing,ChromeCleanup,ChromeLauncher,OptimizationGuideModelDownloading,OptimizationHints,MediaRouter,NetworkPrediction,Translate,InterestFeedContentSuggestions");
  options.addArguments("--disable-blink-features=PasswordCheck,PasswordLeakDetection");
  options.addArguments("--disable-save-password-bubble");
  options.addArguments("--disable-popup-blocking");
  options.addArguments("--disable-password-manager");
  options.addArguments("--disable-password-manager-reauthentication");
  options.addArguments("--password-store=basic");
  options.addArguments("--no-default-browser-check");
  options.addArguments("--disable-background-networking");
  options.addArguments("--disable-component-update");
  options.addArguments("--disable-default-apps");
  options.addArguments("--safebrowsing-disable-auto-update");
  options.addArguments("--disable-sync");
  options.addArguments("--disable-gcm");
  options.addArguments("--no-first-run");
  options.addArguments("--disable-breakpad");
  options.addArguments("--disable-software-rasterizer");
  options.addArguments("--disable-features=SharedArrayBuffer");

  // Preferências do usuário para desligar ainda mais notificações e serviços.
  options.setUserPreferences({
    "credentials_enable_service": false,
    "profile.password_manager_enabled": false,
    "profile.default_content_setting_values.notifications": 2,
    "safebrowsing.enabled": false,
    "safebrowsing.chrome_cleaner_enabled": false,
    "sync.suppress_start": true,
    "signin.allow_dice_prompt": false,
    "signin.allow_dice_prompt_for_signin": false,
  });

  const chromedriverPath = path.resolve(
    process.cwd(),
    "node_modules",
    "chromedriver",
    "lib",
    "chromedriver",
    "chromedriver.exe"
  );

  const service = new chrome.ServiceBuilder(chromedriverPath);

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();
}

/**
 * Sobrescreve window.alert, window.confirm e window.prompt na página atual
 * para que dialogs JavaScript não bloqueiem a execução dos testes.
 */
export async function disableJsDialogs(driver: WebDriver): Promise<void> {
  await driver.executeScript(`
    window.alert = function() {};
    window.confirm = function() { return true; };
    window.prompt = function() { return null; };
  `);
}

/**
 * Realiza login via UI e aguarda redirecionamento para a home.
 * Em caso de falha, captura a mensagem de erro da página para facilitar o diagnóstico.
 */
export async function loginAs(
  driver: WebDriver,
  email: string,
  senha: string
): Promise<void> {
  // Força o logout de verdade: chama o endpoint, limpa storage e cookies.
  await driver.get(`${BASE_URL}/pages/logout.html`);
  await driver.executeScript(`
    fetch("/logout", { method: "POST", credentials: "same-origin" })
      .finally(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
  `);
  await driver.sleep(500);
  await driver.manage().deleteAllCookies();

  await driver.get(`${BASE_URL}/pages/login.html`);
  await disableJsDialogs(driver);

  await driver.wait(
    until.elementIsVisible(driver.findElement(By.css("#btnLogin"))),
    10000
  );

  const emailInput = await driver.findElement(By.css("input[name='email']"));
  await emailInput.clear();
  await emailInput.sendKeys(email);

  const senhaInput = await driver.findElement(By.css("#inputSenhaLogin"));
  await senhaInput.clear();
  await senhaInput.sendKeys(senha);

  await driver.findElement(By.css("#btnLogin")).click();

  try {
    await driver.wait(until.urlContains("/pages/home.html"), 15000);
  } catch (err) {
    const url = await driver.getCurrentUrl();
    const mensagemErro = await getElementText(driver, "#mensagem");
    throw new Error(
      `Login não redirecionou para home. URL atual: ${url}. Mensagem de erro: ${mensagemErro || "(nenhuma)"}`
    );
  }

  // Garante que o token foi salvo no localStorage.
  const token = await driver.executeScript("return localStorage.getItem('token');");
  if (!token) {
    throw new Error("Login aparentemente bem-sucedido, mas token não encontrado no localStorage.");
  }
}

/**
 * Aguarda até que um elemento contenha texto não vazio.
 */
export async function waitForNonEmptyText(
  driver: WebDriver,
  selector: string,
  timeout = 10000
): Promise<string> {
  const element = await driver.wait(
    until.elementLocated(By.css(selector)),
    timeout
  );

  await driver.wait(async () => {
    const text = await element.getText();
    return text.length > 0;
  }, timeout);

  return element.getText();
}

/**
 * Retorna o texto de um elemento, ou string vazia se não existir.
 */
export async function getElementText(
  driver: WebDriver,
  selector: string
): Promise<string> {
  try {
    const element = await driver.findElement(By.css(selector));
    return element.getText();
  } catch {
    return "";
  }
}
