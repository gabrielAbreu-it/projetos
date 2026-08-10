import { getAlunoId } from "../utils/getAlunoId.js";
import { getPerfil } from "../utils/getPerfil.js";
import { getAuthHeaders } from "../utils/getAuthHeaders.js";
const form = document.getElementById("monitoriaForm");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (evento)=>{
    evento.preventDefault();

    const idUsuario = getAlunoId();
    const perfilUsuario = getPerfil()

    const dadosForm = new FormData(form)
    const dados = Object.fromEntries(dadosForm)

    // limpa erros anteriores
    form.querySelectorAll(".input-erro").forEach(el => el.classList.remove("input-erro"));
    mensagem.textContent = "";

    const camposObrigatorios = [
        { nome: "nome_monitoria", seletor: "#nome_monitoria" },
        { nome: "data", seletor: "#data" },
        { nome: "hora_inicio", seletor: "#hora_inicio" },
        { nome: "hora_fim", seletor: "#hora_fim" },
        { nome: "disciplinaId", seletor: "#disciplinas" },
        { nome: "monitorId", seletor: "#monitores" },
    ];

    let camposInvalidos = false;

    camposObrigatorios.forEach(campo => {
        const elemento = document.querySelector(campo.seletor);
        if (!dados[campo.nome]) {
            elemento?.classList.add("input-erro");
            camposInvalidos = true;
        }
    });

    const localId = document.getElementById("local-id").value;
    const selectLocal = document.getElementById("locais");
    if(!localId){
        selectLocal?.classList.add("input-erro");
        camposInvalidos = true;
    } else {
        dados.localId = localId;
    }

    if(camposInvalidos){
        return;
    }


    if(dados.monitorId !== idUsuario && perfilUsuario !== "ADMIN"){
        mensagem.textContent = "Você não pode criar monitorias para outros!"
        return;
    } // validação para que um monitor só crie monitorias para ele mesmo

    try {
        const response = await fetch("/monitorias", {
            method : "POST",
            headers : {
                ...getAuthHeaders(),
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body : JSON.stringify(dados)
        })

        if (!response.ok) {
            const dadosErro = await response.json().catch(() => ({}));
            const mensagemErro = dadosErro.erro || dadosErro.error || "";

            if (response.status === 409 || mensagemErro.startsWith("CONFLITO_HORARIO")) {
                mensagem.textContent = "Já existe uma monitoria agendada neste local nesse horário. Escolha outro horário ou local.";
            } else if (response.status === 400 || mensagemErro.startsWith("HORARIO_INVALIDO")) {
                mensagem.textContent = "Horário inválido. O início deve ser anterior ao fim.";
            } else {
                mensagem.textContent = "Erro ao criar monitoria. Tente novamente.";
            }
            mensagem.style.color = "red";
            return;
        }

        const popup = document.getElementById("popupSucesso");
        popup.classList.remove("hidden");
        form.reset(); // limpar os inputs


    } catch (error) {
        mensagem.textContent = "Erro inesperado ao enviar os dados.";
        mensagem.style.color = "red";
    }
})

// Fechar popup ao clicar no X ou fora do conteúdo
const popupSucesso = document.getElementById("popupSucesso");
const btnFecharPopup = document.getElementById("btnFecharPopup");

if (btnFecharPopup) {
    btnFecharPopup.addEventListener("click", () => {
        popupSucesso.classList.add("hidden");
    });
}

popupSucesso.addEventListener("click", (e) => {
    if (e.target === popupSucesso) {
        popupSucesso.classList.add("hidden");
    }
});

