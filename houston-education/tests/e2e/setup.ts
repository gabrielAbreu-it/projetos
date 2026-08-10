import {
  createQaseRun,
  completeQaseRun,
} from "./utils/qase-reporter.js";

/**
 * Root hooks do Mocha: criam um único test run no Qase antes de todos os testes
 * e completam o run ao final. Assim, todos os arquivos de teste reportam seus
 * resultados no mesmo run do dashboard.
 */
export const mochaHooks = {
  beforeAll: async function () {
    await createQaseRun(`E2E Suite - ${new Date().toISOString()}`);
  },

  afterAll: async function () {
    await completeQaseRun();
  },
};
