import { getAuthHeaders } from "../utils/getAuthHeaders.js";

async function carregarCursos() {
  try {
    const response = await fetch("/cursos", {
      headers: getAuthHeaders(),
      credentials: "same-origin",
    });

    const cursos = await response.json();
    const selectCurso = document.getElementById("cursos");

    selectCurso.innerHTML = '<option value="" disabled selected>Selecione o curso...</option>';

    cursos.forEach((curso) => {
      const option = document.createElement("option");
      option.value = curso.id;
      option.textContent = curso.nome;
      selectCurso.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
}

async function filtrarDisciplinasPorCurso() {
  const cursoId = document.getElementById("cursos").value;
  const selectDisciplina = document.getElementById("disciplinas");

  selectDisciplina.innerHTML = '<option value="" disabled selected>Selecione...</option>';

  if (!cursoId) return;

  try {
    const response = await fetch(`/disciplinas?cursoId=${cursoId}`, {
      headers: getAuthHeaders(),
      credentials: "same-origin",
    });

    const disciplinas = await response.json();

    disciplinas.forEach((disciplina) => {
      const option = document.createElement("option");
      option.value = disciplina.id;
      option.textContent = disciplina.nome;
      selectDisciplina.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
}

document.getElementById("cursos")?.addEventListener("change", filtrarDisciplinasPorCurso);

carregarCursos();
