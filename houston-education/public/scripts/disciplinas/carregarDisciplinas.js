import { getCookie } from "../utils/getCookie.js";

async function carregarDisciplina(){
    try {
        const token = localStorage.getItem("token") || getCookie("token");
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("/disciplinas", {
            headers,
            credentials: "same-origin"
        });

        const disciplinasRetornadas = await response.json();
        const select = document.getElementById("disciplinas")

        disciplinasRetornadas.forEach((disciplina) =>{
            const option = document.createElement("option")
            option.value = disciplina.id
            option.textContent = disciplina.nome
            select.appendChild(option)
        })
    } catch (error) {
        console.log(error)
    }
}

carregarDisciplina();
