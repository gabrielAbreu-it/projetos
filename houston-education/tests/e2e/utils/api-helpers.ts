const BASE_URL = "http://localhost:3000";

interface JwtPayload {
  id?: string;
  perfil?: string;
  [key: string]: any;
}

/**
 * Faz login via API e retorna o token JWT.
 */
export async function loginApi(email: string, senha: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao fazer login como ${email}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Decodifica o payload de um token JWT sem validar assinatura.
 */
export function decodeJwt(token: string): JwtPayload {
  const payload = token.split(".")[1];
  const decoded = Buffer.from(payload, "base64").toString("utf-8");
  return JSON.parse(decoded);
}

/**
 * Retorna o ID do usuário a partir do token JWT.
 */
export function getUserIdFromToken(token: string): string {
  const payload = decodeJwt(token);
  if (!payload.id) {
    throw new Error("Token JWT não contém id do usuário");
  }
  return payload.id;
}

function authHeaders(token: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Busca o ID de uma disciplina pelo nome, filtrando por curso.
 */
export async function getDisciplinaId(
  token: string,
  cursoId: string | number,
  nomeDisciplina: string
): Promise<string> {
  const response = await fetch(`${BASE_URL}/disciplinas?cursoId=${cursoId}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Falha ao buscar disciplinas");
  }

  const disciplinas = await response.json();
  const disciplina = disciplinas.find(
    (d: any) => d.nome.toLowerCase() === nomeDisciplina.toLowerCase()
  );

  if (!disciplina) {
    throw new Error(`Disciplina '${nomeDisciplina}' não encontrada`);
  }

  return disciplina.id;
}

/**
 * Busca o ID de um local pelo nome.
 */
export async function getLocalId(token: string, nomeLocal: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/locais`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Falha ao buscar locais");
  }

  const locais = await response.json();
  const local = locais.find(
    (l: any) => l.nome.toLowerCase() === nomeLocal.toLowerCase()
  );

  if (!local) {
    throw new Error(`Local '${nomeLocal}' não encontrado`);
  }

  return local.id;
}

/**
 * Busca o ID de um curso pelo nome.
 */
export async function getCursoId(token: string, nomeCurso: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/cursos`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Falha ao buscar cursos");
  }

  const cursos = await response.json();
  const curso = cursos.find(
    (c: any) => c.nome.toLowerCase() === nomeCurso.toLowerCase()
  );

  if (!curso) {
    throw new Error(`Curso '${nomeCurso}' não encontrado`);
  }

  return curso.id;
}

/**
 * Cadastra um novo aluno via API. Útil para criar dados de teste
 * (por exemplo, uma matrícula duplicada válida) antes de validar a UI.
 */
export async function cadastrarAlunoApi(dados: {
  nome: string;
  email: string;
  senha: string;
  matricula: string;
}): Promise<any> {
  const response = await fetch(`${BASE_URL}/alunos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(`Falha ao cadastrar aluno via API: ${erro.erro || response.statusText}`);
  }

  return response.json();
}
