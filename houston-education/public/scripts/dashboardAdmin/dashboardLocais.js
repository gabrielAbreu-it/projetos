import { getAuthHeaders } from "../utils/getAuthHeaders.js";

const tabelaBody = document.querySelector("#tabelaLocais tbody");
const buscaInput = document.getElementById("buscaLocal");
const popupConfirmacao = document.getElementById("popupConfirmacao");
const popupConfirmacaoTexto = document.getElementById("popupConfirmacaoTexto");
const btnConfirmarAcao = document.getElementById("btnConfirmarAcao");
const btnCancelarAcao = document.getElementById("btnCancelarAcao");

const modalCriarLocal = document.getElementById("modalCriarLocal");
const btnFecharModalCriar = document.getElementById("btnFecharModalCriar");
const formCriarLocal = document.getElementById("formCriarLocal");

const modalEditarLocal = document.getElementById("modalEditarLocal");
const btnFecharModalEditar = document.getElementById("btnFecharModalEditar");
const formEditarLocal = document.getElementById("formEditarLocal");
const idLocalEditar = document.getElementById("idLocalEditar");
const nomeLocalEditar = document.getElementById("nomeLocalEditar");
const descricaoLocalEditar = document.getElementById("descricaoLocalEditar");
const campusSelectEditar = document.getElementById("campusSelectEditar");
const campusSelectCriar = document.getElementById("campusSelectCriar");

let locais = [];
let acaoPendente = null;
let localPendente = null;

function mostrarToastSucesso(mensagem) {
    let toast = document.getElementById("toastSucesso");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastSucesso";
        toast.className = "toast-sucesso";
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="ph-fill ph-check-circle"></i> <span>${mensagem}</span>`;
    toast.classList.add("toast-visivel");

    setTimeout(() => {
        toast.classList.remove("toast-visivel");
    }, 4000);
}

async function carregarCampus() {
    try {
        const response = await fetch("/campus", {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });
        if (!response.ok) throw new Error("Erro ao carregar campus");
        const campus = await response.json();

        const options = campus.map(c => `<option value="${c.id}">${c.nome}</option>
        `).join("");

        campusSelectCriar.innerHTML = '<option value="" disabled selected>Selecione o campus...</option>' + options;
        campusSelectEditar.innerHTML = '<option value="" disabled selected>Selecione o campus...</option>' + options;
    } catch (err) {
        console.error(err);
    }
}

async function carregarLocais() {
    tabelaBody.innerHTML = '<tr><td colspan="4">Carregando locais...</td></tr>';

    try {
        const response = await fetch("/locais", {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar locais");
        }

        locais = await response.json();
        atualizarStats();
        renderizarTabela();
    } catch (err) {
        tabelaBody.innerHTML = `<tr><td colspan="4">Erro: ${err.message}</td></tr>`;
    }
}

function atualizarStats() {
    document.getElementById("statTotal").textContent = locais.length;
}

function renderizarTabela() {
    const termo = buscaInput.value.toLowerCase();
    const filtrados = locais.filter(l =>
        l.nome.toLowerCase().includes(termo) ||
        (l.descricao || "").toLowerCase().includes(termo) ||
        (l.campus?.nome || "").toLowerCase().includes(termo)
    );

    if (filtrados.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="4">Nenhum local encontrado.</td></tr>';
        return;
    }

    tabelaBody.innerHTML = filtrados.map(l => `
        <tr>
            <td>${l.nome}</td>
            <td>${l.descricao || "-"}</td>
            <td>${l.campus?.nome || "-"}</td>
            <td>
                <div class="acoes-botoes">
                    <button class="btn-editar" data-id="${l.id}" title="Editar local">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn-excluir" data-id="${l.id}" data-acao="excluir" title="Excluir local">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const local = locais.find(l => l.id === id);
            abrirModalEditar(local);
        });
    });

    document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const acao = e.currentTarget.dataset.acao;
            const local = locais.find(l => l.id === id);
            abrirConfirmacao(acao, local);
        });
    });
}

function abrirModalCriar() {
    modalCriarLocal.classList.add("open");
}

function fecharModalCriar() {
    modalCriarLocal.classList.remove("open");
    formCriarLocal.reset();
    limparErrosCriarLocal();
}

function limparErrosCriarLocal() {
    const campos = ["Nome", "Descricao", "Campus"];
    campos.forEach(campo => {
        const input = document.getElementById(`input${campo}Criar`) || document.getElementById(`campusSelectCriar`);
        const erro = document.getElementById(`erro${campo}Criar`);
        if (input) input.classList.remove("input-erro");
        if (erro) {
            erro.textContent = "";
            erro.classList.remove("visivel");
        }
    });
}

function mostrarErroCampo(campo, mensagem) {
    const input = document.getElementById(`input${campo}Criar`) || document.getElementById(`campusSelectCriar`);
    const erro = document.getElementById(`erro${campo}Criar`);
    if (input) input.classList.add("input-erro");
    if (erro) {
        erro.textContent = mensagem;
        erro.classList.add("visivel");
    }
}

function abrirModalEditar(local) {
    limparErrosEditarLocal();
    idLocalEditar.value = local.id;
    nomeLocalEditar.value = local.nome;
    descricaoLocalEditar.value = local.descricao || "";
    campusSelectEditar.value = local.campusId || "";
    modalEditarLocal.classList.add("open");
}

function fecharModalEditar() {
    modalEditarLocal.classList.remove("open");
    formEditarLocal.reset();
    limparErrosEditarLocal();
}

function limparErrosEditarLocal() {
    const campos = ["Nome", "Descricao", "Campus"];
    campos.forEach(campo => {
        const input = document.getElementById(`${campo.toLowerCase()}LocalEditar`) || document.getElementById(`campusSelectEditar`);
        const erro = document.getElementById(`erro${campo}Editar`);
        if (input) input.classList.remove("input-erro");
        if (erro) {
            erro.textContent = "";
            erro.classList.remove("visivel");
        }
    });
}

function mostrarErroCampoEditar(campo, mensagem) {
    const input = document.getElementById(`${campo.toLowerCase()}LocalEditar`) || document.getElementById(`campusSelectEditar`);
    const erro = document.getElementById(`erro${campo}Editar`);
    if (input) input.classList.add("input-erro");
    if (erro) {
        erro.textContent = mensagem;
        erro.classList.add("visivel");
    }
}

async function criarLocal(e) {
    e.preventDefault();

    const formData = new FormData(formCriarLocal);
    const dados = Object.fromEntries(formData);
    dados.campusId = parseInt(dados.campusId);

    try {
        const response = await fetch("/locais", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            credentials: "same-origin",
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || erro.errors?.[0] || "Erro ao criar local");
        }

        fecharModalCriar();
        mostrarToastSucesso("Local criado com sucesso!");
        carregarLocais();
    } catch (err) {
        const msg = err.message;

        if (msg === "LOCAL_DUPLICADO") {
            mostrarErroCampo("Nome", "Local já existe neste campus");
        } else if (msg === "CAMPUS_INEXISTENTE") {
            mostrarErroCampo("Campus", "Campus não encontrado");
        } else if (msg.includes("nome") && msg.includes("required")) {
            mostrarErroCampo("Nome", "Nome é obrigatório");
        } else if (msg.includes("campusId") && msg.includes("required")) {
            mostrarErroCampo("Campus", "Campus é obrigatório");
        } else {
            alert(msg);
        }
    }
}

async function salvarEdicao(e) {
    e.preventDefault();

    const id = parseInt(idLocalEditar.value, 10);
    const formData = new FormData(formEditarLocal);
    const dados = Object.fromEntries(formData);
    dados.campusId = parseInt(dados.campusId);

    try {
        const response = await fetch(`/locais/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            credentials: "same-origin",
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || erro.errors?.[0] || "Erro ao atualizar local");
        }

        fecharModalEditar();
        mostrarToastSucesso("Local atualizado com sucesso!");
        carregarLocais();
    } catch (err) {
        const msg = err.message;

        if (msg === "LOCAL_DUPLICADO") {
            mostrarErroCampoEditar("Nome", "Local já existe neste campus");
        } else if (msg === "CAMPUS_INEXISTENTE") {
            mostrarErroCampoEditar("Campus", "Campus não encontrado");
        } else if (msg.includes("nome") && msg.includes("required")) {
            mostrarErroCampoEditar("Nome", "Nome é obrigatório");
        } else if (msg.includes("campusId") && msg.includes("required")) {
            mostrarErroCampoEditar("Campus", "Campus é obrigatório");
        } else {
            alert(msg);
        }
    }
}

function abrirConfirmacao(acao, local) {
    acaoPendente = acao;
    localPendente = local;

    const mensagens = {
        excluir: `Deseja excluir o local "${local.nome}"?`
    };

    popupConfirmacaoTexto.textContent = mensagens[acao];
    popupConfirmacao.classList.remove("hidden");
}

function fecharConfirmacao() {
    popupConfirmacao.classList.add("hidden");
    acaoPendente = null;
    localPendente = null;
}

async function executarAcao() {
    if (!acaoPendente || !localPendente) return;

    try {
        let response;

        if (acaoPendente === "excluir") {
            response = await fetch(`/locais/${localPendente.id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
                credentials: "same-origin"
            });
        }

        if (!response.ok) {
            throw new Error("Erro ao executar acao");
        }

        fecharConfirmacao();
        mostrarToastSucesso("Local excluído com sucesso!");
        carregarLocais();
    } catch (err) {
        alert(err.message);
        fecharConfirmacao();
    }
}

buscaInput.addEventListener("input", renderizarTabela);
btnConfirmarAcao.addEventListener("click", executarAcao);
btnCancelarAcao.addEventListener("click", fecharConfirmacao);

btnAbrirModalCriar.addEventListener("click", abrirModalCriar);
btnFecharModalCriar.addEventListener("click", fecharModalCriar);
formCriarLocal.addEventListener("submit", criarLocal);

btnFecharModalEditar.addEventListener("click", fecharModalEditar);
formEditarLocal.addEventListener("submit", salvarEdicao);

popupConfirmacao.addEventListener("click", (e) => {
    if (e.target === popupConfirmacao) fecharConfirmacao();
});

modalCriarLocal.addEventListener("click", (e) => {
    if (e.target === modalCriarLocal) fecharModalCriar();
});

modalEditarLocal.addEventListener("click", (e) => {
    if (e.target === modalEditarLocal) fecharModalEditar();
});

["Nome", "Descricao"].forEach(campo => {
    document.getElementById(`input${campo}Criar`)?.addEventListener("input", () => {
        const input = document.getElementById(`input${campo}Criar`);
        const erro = document.getElementById(`erro${campo}Criar`);
        if (input) input.classList.remove("input-erro");
        if (erro) {
            erro.textContent = "";
            erro.classList.remove("visivel");
        }
    });
});

document.getElementById("campusSelectCriar")?.addEventListener("change", () => {
    const input = document.getElementById("campusSelectCriar");
    const erro = document.getElementById("erroCampusCriar");
    if (input) input.classList.remove("input-erro");
    if (erro) {
        erro.textContent = "";
        erro.classList.remove("visivel");
    }
});

["Nome", "Descricao"].forEach(campo => {
    document.getElementById(`${campo.toLowerCase()}LocalEditar`)?.addEventListener("input", () => {
        const input = document.getElementById(`${campo.toLowerCase()}LocalEditar`);
        const erro = document.getElementById(`erro${campo}Editar`);
        if (input) input.classList.remove("input-erro");
        if (erro) {
            erro.textContent = "";
            erro.classList.remove("visivel");
        }
    });
});

document.getElementById("campusSelectEditar")?.addEventListener("change", () => {
    const input = document.getElementById("campusSelectEditar");
    const erro = document.getElementById("erroCampusEditar");
    if (input) input.classList.remove("input-erro");
    if (erro) {
        erro.textContent = "";
        erro.classList.remove("visivel");
    }
});

carregarCampus();
carregarLocais();
