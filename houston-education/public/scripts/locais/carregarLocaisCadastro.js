import { getAuthHeaders } from "../utils/getAuthHeaders.js";

async function carregarLocaisCadastro() {
  try {
    const response = await fetch("/locais", {
      headers: getAuthHeaders(),
      credentials: "same-origin",
    });

    const locaisRetornados = await response.json();
    const datalist = document.getElementById("locais-list");
    const inputNome = document.getElementById("local-nome");
    const inputId = document.getElementById("local-id");

    locaisRetornados.forEach((local) => {
      const option = document.createElement("option");
      option.value = local.nome;
      option.dataset.id = local.id;
      datalist.appendChild(option);
    });

    function validarLocal() {
      const nomeDigitado = inputNome.value.trim();
      if (!nomeDigitado) {
        inputId.value = "";
        inputNome.style.borderColor = "";
        return;
      }
      const localEncontrado = locaisRetornados.find((l) => l.nome === nomeDigitado);
      if (localEncontrado) {
        inputId.value = localEncontrado.id;
        inputNome.style.borderColor = "green";
      } else {
        inputId.value = "";
        inputNome.style.borderColor = "red";
      }
    }

    inputNome.addEventListener("input", validarLocal);
    inputNome.addEventListener("blur", validarLocal);
    inputNome.addEventListener("change", validarLocal);
  } catch (error) {
    console.log(error);
  }
}

carregarLocaisCadastro();
