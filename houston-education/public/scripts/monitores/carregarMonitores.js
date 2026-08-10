import { getAuthHeaders } from "../utils/getAuthHeaders.js";
import { getPerfil } from "../utils/getPerfil.js";
import { getToken } from "../utils/getToken.js";
import { parseJwt } from "../utils/parseJWT.js";

async function carregarMonitores(){
    const perfil = getPerfil();
    const select = document.getElementById("monitores");

    if (perfil === "MONITOR") {
        const token = getToken();
        const payload = parseJwt(token);

        if (payload && payload.id && payload.nome) {
            const option = document.createElement("option");
            option.value = payload.id;
            option.textContent = payload.nome;
            select.appendChild(option);
            select.value = payload.id;
            select.disabled = true;

            // Campos disabled não são enviados no FormData, então criamos um input hidden
            // para garantir que o backend receba o monitorId no submit.
            const form = select.closest("form");
            if (form) {
                let hiddenInput = form.querySelector('input[type="hidden"][name="monitorId"]');
                if (!hiddenInput) {
                    hiddenInput = document.createElement("input");
                    hiddenInput.type = "hidden";
                    hiddenInput.name = "monitorId";
                    form.appendChild(hiddenInput);
                }
                hiddenInput.value = payload.id;
            }

            return;
        }
    }

    try {
        const response = await fetch("/alunos?perfil=MONITOR", {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        const monitoresRetornados = await response.json();

        monitoresRetornados.forEach((monitor) =>{
            const option = document.createElement("option");
            option.value = monitor.id;
            option.textContent = monitor.nome;
            select.appendChild(option);
        });
    } catch (error) {
        console.log(error);
    }
}

carregarMonitores();
