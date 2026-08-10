import { getCookie } from "../utils/getCookie.js";

async function carregarLocais(){
    try {
        const token = localStorage.getItem("token") || getCookie("token");
        const headers = {};
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("/locais", { headers, credentials: "same-origin" });

        const locaisRetornados = await response.json();
        const select = document.getElementById("locais")

        locaisRetornados.forEach((local) =>{
            const option = document.createElement("option")
            option.value = local.id
            option.textContent = `${local.nome} (${local.campus?.nome || ""})`
            select.appendChild(option)
        })
    } catch (error) {
        console.log(error)
    }
}

carregarLocais();
