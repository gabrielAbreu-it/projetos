import { getAuthHeaders } from "../utils/getAuthHeaders.js";

let todosLocais = [];

async function carregarCampus() {
  try {
    const response = await fetch("/campus", {
      headers: getAuthHeaders(),
      credentials: "same-origin",
    });

    const campusList = await response.json();
    const selectCampus = document.getElementById("campus");

    campusList.forEach((campus) => {
      const option = document.createElement("option");
      option.value = campus.id;
      option.textContent = campus.nome;
      selectCampus.appendChild(option);
    });
  } catch (error) {
    console.log(error);
  }
}

async function carregarLocais() {
  try {
    const response = await fetch("/locais", {
      headers: getAuthHeaders(),
      credentials: "same-origin",
    });

    todosLocais = await response.json();
  } catch (error) {
    console.log(error);
  }
}

function filtrarLocaisPorCampus() {
  const campusId = document.getElementById("campus").value;
  const selectLocal = document.getElementById("locais");
  const inputId = document.getElementById("local-id");

  selectLocal.innerHTML = '<option value="" disabled selected>Selecione...</option>';
  inputId.value = "";

  if (!campusId) return;

  const locaisFiltrados = todosLocais.filter((l) => l.campusId == campusId);

  locaisFiltrados.forEach((local) => {
    const option = document.createElement("option");
    option.value = local.id;
    option.textContent = local.nome;
    selectLocal.appendChild(option);
  });
}

document.getElementById("campus")?.addEventListener("change", filtrarLocaisPorCampus);
document.getElementById("locais")?.addEventListener("change", (e) => {
  document.getElementById("local-id").value = e.target.value;
});

carregarCampus();
carregarLocais();
