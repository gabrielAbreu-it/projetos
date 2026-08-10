import { getAuthHeaders } from "../utils/getAuthHeaders.js";

const tabelaBody = document.querySelector("#tabelaDisciplinas tbody");
const buscaInput = document.getElementById("buscaDisciplina");
const popupConfirmacao = document.getElementById("popupConfirmacao");
const popupConfirmacaoTexto = document.getElementById("popupConfirmacaoTexto");
const btnConfirmarAcao = document.getElementById("btnConfirmarAcao");
const btnCancelarAcao = document.getElementById("btnCancelarAcao");

const modalCriarDisciplina = document.getElementById("modalCriarDisciplina");
const btnFecharModalCriar = document.getElementById("btnFecharModalCriar");
const formCriarDisciplina = document.getElementById("formCriarDisciplina");

const modalEditarDisciplina = document.getElementById("modalEditarDisciplina");
const btnFecharModalEditar = document.getElementById("btnFecharModalEditar");
const formEditarDisciplina = document.getElementById("formEditarDisciplina");
const idDisciplinaEditar = document.getElementById("idDisciplinaEditar");
const nomeDisciplinaEditar = document.getElementById("nomeDisciplinaEditar");
const descricaoDisciplinaEditar = document.getElementById("descricaoDisciplinaEditar");
const cursosSelectCriar = document.getElementById("cursosSelectCriar");
const cursosSelectEditar = document.getElementById("cursosSelectEditar");
const listaCursosCriar = document.getElementById("listaCursosCriar");
const listaCursosEditar = document.getElementById("listaCursosEditar");
const tagsCriar = document.getElementById("tagsCriar");
const tagsEditar = document.getElementById("tagsEditar");

let disciplinas = [];
let cursos = [];
let acaoPendente = null;
let disciplinaPendente = null;

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

function renderizarListaCursos(listaElement, selectElement) {
    listaElement.innerHTML = cursos.map(c => `
        <div class="curso-item" data-id="${c.id}">${c.nome}</div>
    `).join("");

    listaElement.querySelectorAll(".curso-item").forEach(item => {
        item.addEventListener("click", () => {
            const option = Array.from(selectElement.options).find(opt => opt.value === item.dataset.id);
            if (option) {
                option.selected = !option.selected;
                item.classList.toggle("selecionado", option.selected);
                atualizarTags(selectElement, listaElement === listaCursosCriar ? tagsCriar : tagsEditar);
            }
        });
    });
}

function sincronizarListaComSelect(listaElement, selectElement) {
    const selecionados = Array.from(selectElement.selectedOptions).map(opt => opt.value);
    listaElement.querySelectorAll(".curso-item").forEach(item => {
        item.classList.toggle("selecionado", selecionados.includes(item.dataset.id));
    });
}

function atualizarTags(selectElement, containerElement) {
    const selecionados = Array.from(selectElement.selectedOptions)
        .filter(opt => opt.value !== "")
        .map(opt => ({ id: opt.value, nome: opt.textContent }));

    containerElement.innerHTML = selecionados.map(s => `
        <span class="tag-curso" data-id="${s.id}">
            ${s.nome}
            <button type="button" data-id="${s.id}" title="Remover">&times;</button>
        </span>
    `).join("");

    containerElement.querySelectorAll("button").forEach(btn => {
        btn.addEventListener("click", () => {
            const option = Array.from(selectElement.options).find(opt => opt.value === btn.dataset.id);
            if (option) option.selected = false;
            const listaElement = selectElement === cursosSelectCriar ? listaCursosCriar : listaCursosEditar;
            sincronizarListaComSelect(listaElement, selectElement);
            atualizarTags(selectElement, containerElement);
        });
    });
}

async function carregarCursos() {
    try {
        const response = await fetch("/cursos", {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });
        if (!response.ok) throw new Error("Erro ao carregar cursos");
        cursos = await response.json();

        const options = cursos.map(c => `<option value="${c.id}">${c.nome}</option>`).join("");

        cursosSelectCriar.innerHTML = '<option value="" disabled>Selecione os cursos...</option>' + options;
        cursosSelectEditar.innerHTML = '<option value="" disabled>Selecione os cursos...</option>' + options;

        renderizarListaCursos(listaCursosCriar, cursosSelectCriar);
        renderizarListaCursos(listaCursosEditar, cursosSelectEditar);
    } catch (err) {
        console.error(err);
    }
}

async function carregarDisciplinas() {
    tabelaBody.innerHTML = '<tr><td colspan="3">Carregando disciplinas...</td></tr>';

    try {
        const response = await fetch("/disciplinas", {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar disciplinas");
        }

        disciplinas = await response.json();
        atualizarStats();
        renderizarTabela();
    } catch (err) {
        tabelaBody.innerHTML = `<tr><td colspan="3">Erro: ${err.message}</td></tr>`;
    }
}

function atualizarStats() {
    document.getElementById("statTotal").textContent = disciplinas.length;
}

function renderizarTabela() {
    const termo = buscaInput.value.toLowerCase();
    const filtrados = disciplinas.filter(d =>
        d.nome.toLowerCase().includes(termo) ||
        (d.descricao || "").toLowerCase().includes(termo) ||
        (d.cursos || []).some(c => c.curso.nome.toLowerCase().includes(termo))
    );

    if (filtrados.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="3">Nenhuma disciplina encontrada.</td></tr>';
        return;
    }

    tabelaBody.innerHTML = filtrados.map(d => {
        const cursosNomes = (d.cursos || []).map(c => c.curso.nome).join(", ") || "-";
        return `
        <tr>
            <td>${d.nome}</td>
            <td>${cursosNomes}</td>
            <td>
                <div class="acoes-botoes">
                    <button class="btn-editar" data-id="${d.id}" title="Editar disciplina">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn-excluir" data-id="${d.id}" data-acao="excluir" title="Excluir disciplina">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `}).join("");

    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const disciplina = disciplinas.find(d => d.id === id);
            abrirModalEditar(disciplina);
        });
    });

    document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const acao = e.currentTarget.dataset.acao;
            const disciplina = disciplinas.find(d => d.id === id);
            abrirConfirmacao(acao, disciplina);
        });
    });
}

function abrirModalCriar() {
    modalCriarDisciplina.classList.add("open");
    sincronizarListaComSelect(listaCursosCriar, cursosSelectCriar);
    atualizarTags(cursosSelectCriar, tagsCriar);
}

function fecharModalCriar() {
    modalCriarDisciplina.classList.remove("open");
    formCriarDisciplina.reset();
    tagsCriar.innerHTML = "";
    sincronizarListaComSelect(listaCursosCriar, cursosSelectCriar);
}

function abrirModalEditar(disciplina) {
    idDisciplinaEditar.value = disciplina.id;
    nomeDisciplinaEditar.value = disciplina.nome;
    descricaoDisciplinaEditar.value = disciplina.descricao || "";

    const cursoIds = (disciplina.cursos || []).map(c => String(c.curso.id));
    Array.from(cursosSelectEditar.options).forEach(opt => {
        opt.selected = cursoIds.includes(opt.value);
    });

    sincronizarListaComSelect(listaCursosEditar, cursosSelectEditar);
    atualizarTags(cursosSelectEditar, tagsEditar);
    modalEditarDisciplina.classList.add("open");
}

function fecharModalEditar() {
    modalEditarDisciplina.classList.remove("open");
    formEditarDisciplina.reset();
    tagsEditar.innerHTML = "";
    sincronizarListaComSelect(listaCursosEditar, cursosSelectEditar);
}

function getSelectedCursoIds(selectElement) {
    return Array.from(selectElement.selectedOptions)
        .map(opt => parseInt(opt.value, 10))
        .filter(v => !isNaN(v));
}

async function criarDisciplina(e) {
    e.preventDefault();

    const formData = new FormData(formCriarDisciplina);
    const dados = Object.fromEntries(formData);
    dados.cursoIds = getSelectedCursoIds(cursosSelectCriar);

    try {
        const response = await fetch("/disciplinas", {
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
            throw new Error(erro.erro || erro.errors?.[0] || "Erro ao criar disciplina");
        }

        fecharModalCriar();
        mostrarToastSucesso("Disciplina criada com sucesso!");
        carregarDisciplinas();
    } catch (err) {
        alert(err.message);
    }
}

async function salvarEdicao(e) {
    e.preventDefault();

    const id = parseInt(idDisciplinaEditar.value, 10);
    const formData = new FormData(formEditarDisciplina);
    const dados = Object.fromEntries(formData);
    dados.cursoIds = getSelectedCursoIds(cursosSelectEditar);

    try {
        const response = await fetch(`/disciplinas/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            credentials: "same-origin",
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || erro.errors?.[0] || "Erro ao atualizar disciplina");
        }

        fecharModalEditar();
        mostrarToastSucesso("Disciplina atualizada com sucesso!");
        carregarDisciplinas();
    } catch (err) {
        alert(err.message);
    }
}

function abrirConfirmacao(acao, disciplina) {
    acaoPendente = acao;
    disciplinaPendente = disciplina;

    const mensagens = {
        excluir: `Deseja excluir a disciplina "${disciplina.nome}"?`
    };

    popupConfirmacaoTexto.textContent = mensagens[acao];
    popupConfirmacao.classList.remove("hidden");
}

function fecharConfirmacao() {
    popupConfirmacao.classList.add("hidden");
    acaoPendente = null;
    disciplinaPendente = null;
}

async function executarAcao() {
    if (!acaoPendente || !disciplinaPendente) return;

    try {
        let response;

        if (acaoPendente === "excluir") {
            response = await fetch(`/disciplinas/${disciplinaPendente.id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
                credentials: "same-origin"
            });
        }

        if (!response.ok) {
            throw new Error("Erro ao executar acao");
        }

        fecharConfirmacao();
        mostrarToastSucesso("Disciplina excluída com sucesso!");
        carregarDisciplinas();
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
formCriarDisciplina.addEventListener("submit", criarDisciplina);

btnFecharModalEditar.addEventListener("click", fecharModalEditar);
formEditarDisciplina.addEventListener("submit", salvarEdicao);

popupConfirmacao.addEventListener("click", (e) => {
    if (e.target === popupConfirmacao) fecharConfirmacao();
});

modalCriarDisciplina.addEventListener("click", (e) => {
    if (e.target === modalCriarDisciplina) fecharModalCriar();
});

modalEditarDisciplina.addEventListener("click", (e) => {
    if (e.target === modalEditarDisciplina) fecharModalEditar();
});

carregarCursos();
carregarDisciplinas();
