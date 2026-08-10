/**
 * Helper para integração com o qase.io.
 *
 * Esse módulo cria um test run no qase.io, reporta o resultado de cada caso
 * de teste e completa o run ao final da execução.
 */

import { RunsApi, ResultsApi, Configuration } from "qase-api-client";
import dotenv from "dotenv";

// Carrega as variáveis de ambiente do arquivo .env.
dotenv.config();

// Configuração do cliente da API do qase.io.
const configuration = new Configuration({
  basePath: "https://api.qase.io/v1",
  apiKey: process.env.QASE_API_TOKEN,
});

const runsApi = new RunsApi(configuration);
const resultsApi = new ResultsApi(configuration);

// Código do projeto no qase.io (ex: MONITORIA).
const PROJECT_CODE = process.env.QASE_PROJECT_CODE || "";

// Mapeamento entre os cenários de teste no código e os IDs dos casos no qase.io.
// Substitua os valores de exemplo pelos IDs reais gerados no qase.io.
export const QASE_CASE_MAP = {
  LOGIN_SUCESSO_ALUNO: 1,
  LOGIN_CREDENCIAIS_INVALIDAS: 2,
  LOGIN_CAMPOS_VAZIOS: 3,
  CADASTRO_ALUNO_VALIDO: 4,
  CADASTRO_MATRICULA_DUPLICADA: 5,
  CADASTRO_EMAIL_DUPLICADO: 6,
  VISUALIZAR_MONITORIAS_DISPONIVEIS: 7,
  INSCRICAO_MONITORIA: 8,
  INSCRICAO_DUPLICADA: 9,
  VISUALIZAR_MINHAS_INSCRICOES: 10,
  CRIAR_MONITORIA_VALIDA: 11,
  CRIAR_MONITORIA_HORARIO_INVALIDO: 12,
  CRIAR_MONITORIA_CONFLITO_HORARIO: 13,
  EDITAR_MONITORIA: 14,
} as const;

// Guarda o ID do test run atual para poder vincular os resultados.
let currentRunId: number | null = null;

/**
 * Cria um test run no qase.io contendo os casos de teste que serão executados.
 * Se um run já estiver ativo, reutiliza o existente.
 */
export async function createQaseRun(title: string): Promise<number> {
  if (currentRunId) {
    return currentRunId;
  }

  if (!PROJECT_CODE) {
    throw new Error(
      "QASE_PROJECT_CODE não está definido nas variáveis de ambiente."
    );
  }

  const caseIds = Object.values(QASE_CASE_MAP);

  const response = await runsApi.createRun(PROJECT_CODE, {
    title,
    description: "Execução automática via Selenium E2E",
    cases: caseIds,
    is_autotest: true,
  });

  // A resposta vem encapsulada no formato do Axios (response.data).
  const runId = response.data.result?.id;
  
  if (!runId) {
    throw new Error("Não foi possível criar o test run no qase.io");
  }

  currentRunId = runId;
  return currentRunId;
}

/**
 * Reporta o resultado de um caso de teste para o qase.io.
 */
export async function reportQaseResult(
  caseId: number,
  status: "passed" | "failed" | "skipped",
  comment?: string,
  durationMs?: number
): Promise<void> {
  if (!currentRunId) {
    throw new Error("Nenhum test run ativo. Chame createQaseRun primeiro.");
  }

  await resultsApi.createResult(PROJECT_CODE, currentRunId, {
    case_id: caseId,
    status,
    comment: comment || "",
    time_ms: durationMs || 0,
  });
}

/**
 * Finaliza o test run no qase.io.
 */
export async function completeQaseRun(): Promise<void> {
  if (currentRunId) {
    await runsApi.completeRun(PROJECT_CODE, currentRunId);
    currentRunId = null;
  }
}
