import { getAuthHeaders } from "../utils/getAuthHeaders.js";

const tabelaBody = document.querySelector("#tabelaCursos tbody");
const buscaInput = document.getElementById("buscaCurso");
const popupConfirmacao = document.getElementById("popupConfirmacao");
const popupConfirmacaoTexto = document.getElementById("popupConfirmacaoTexto");
const btnConfirmarAcao = document.getElementById("btnConfirmarAcao");
const btnCancelarAcao = document.getElementById("btnCancelarAcao");

const modalCriarCurso = document.getElementById("modalCriarCurso");
const btnFecharModalCriar = document.getElementById("btnFecharModalCriar");
const formCriarCurso = document.getElementById("formCriarCurso");

const modalEditarCurso = document.getElementById("modalEditarCurso");
const btnFecharModalEditar = document.getElementById("btnFecharModalEditar");
const formEditarCurso = document.getElementById("formEditarCurso");
const idCursoEditar = document.getElementById("idCursoEditar");
const nomeCursoEditar = document.getElementById("nomeCursoEditar");
const descricaoCursoEditar = document.getElementById("descricaoCursoEditar");

let cursos = [];
let acaoPendente = null;
let cursoPendente = null;

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

async function carregarCursos() {
    tabelaBody.innerHTML = '<tr><td colspan="3">Carregando cursos...</td></tr>';

    try {
        const response = await fetch("/cursos", {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar cursos");
        }

        cursos = await response.json();
        atualizarStats();
        renderizarTabela();
    } catch (err) {
        tabelaBody.innerHTML = `<tr><td colspan="3">Erro: ${err.message}</td></tr>`;
    }
}

function atualizarStats() {
    document.getElementById("statTotal").textContent = cursos.length;
}

function renderizarTabela() {
    const termo = buscaInput.value.toLowerCase();
    const filtrados = cursos.filter(c =>
        c.nome.toLowerCase().includes(termo) ||
        (c.descricao || "").toLowerCase().includes(termo)
    );

    if (filtrados.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="3">Nenhum curso encontrado.</td></tr>';
        return;
    }

    tabelaBody.innerHTML = filtrados.map(c => `
        <tr>
            <td>${c.nome}</td>
            <td>${c.descricao || "-"}</td>
            <td>
                <div class="acoes-botoes">
                    <button class="btn-editar" data-id="${c.id}" title="Editar curso">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn-excluir" data-id="${c.id}" data-acao="excluir" title="Excluir curso">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const curso = cursos.find(c => c.id === id);
            abrirModalEditar(curso);
        });
    });

    document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id, 10);
            const acao = e.currentTarget.dataset.acao;
            const curso = cursos.find(c => c.id === id);
            abrirConfirmacao(acao, curso);
        });
    });
}

function abrirModalCriar() {
    modalCriarCurso.classList.add("open");
}

function fecharModalCriar() {
    modalCriarCurso.classList.remove("open");
    formCriarCurso.reset();
    limparErrosCriarCurso();
}

function limparErrosCriarCurso() {
    const campos = ["Nome", "Descricao"];
    campos.forEach(campo => {
        const input = document.getElementById(`input${campo}Criar`);
        const erro = document.getElementById(`erro${campo}Criar`);
        if (input) input.classList.remove("input-erro");
        if (erro) {
            erro.textContent = "";
            erro.classList.remove("visivel");
        }
    });
}

function mostrarErroCampo(campo, mensagem) {
    const input = document.getElementById(`input${campo}Criar`);
    const erro = document.getElementById(`erro${campo}Criar`);
    if (input) input.classList.add("input-erro");
    if (erro) {
        erro.textContent = mensagem;
        erro.classList.add("visivel");
    }
}

function abrirModalEditar(curso) {
    limparErrosEditarCurso();
    idCursoEditar.value = curso.id;
    nomeCursoEditar.value = curso.nome;
    descricaoCursoEditar.value = curso.descricao || "";
    modalEditarCurso.classList.add("open");
}

function fecharModalEditar() {
    modalEditarCurso.classList.remove("open");
    formEditarCurso.reset();
    limparErrosEditarCurso();
}

function limparErrosEditarCurso() {
    const campos = ["Nome", "Descricao"];
    campos.forEach(campo => {
        const input = document.getElementById(`${campo.toLowerCase()}CursoEditar`);
        const erro = document.getElementById(`erro${campo}Editar`);
        if (input) input.classList.remove("input-erro");
        if (erro) {
            erro.textContent = "";
            erro.classList.remove("visivel");
        }
    });
}

function mostrarErroCampoEditar(campo, mensagem) {
    const input = document.getElementById(`${campo.toLowerCase()}CursoEditar`);
    const erro = document.getElementById(`erro${campo}Editar`);
    if (input) input.classList.add("input-erro");
    if (erro) {
        erro.textContent = mensagem;
        erro.classList.add("visivel");
    }
}

async function criarCurso(e) {
    e.preventDefault();

    const formData = new FormData(formCriarCurso);
    const dados = Object.fromEntries(formData);

    try {
        const response = await fetch("/cursos", {
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
            throw new Error(erro.erro || erro.errors?.[0] || "Erro ao criar curso");
        }

        fecharModalCriar();
        mostrarToastSucesso("Curso criado com sucesso!");
        carregarCursos();
    } catch (err) {
        const msg = err.message;

        if (msg === "CURSO_DUPLICADO") {
            mostrarErroCampo("Nome", "Curso já existe");
        } else if (msg.includes("nome") && msg.includes("required")) {
            mostrarErroCampo("Nome", "Nome é obrigatório");
        } else {
            alert(msg);
        }
    }
}

async function salvarEdicao(e) {
    e.preventDefault();

    const id = parseInt(idCursoEditar.value, 10);
    const formData = new FormData(formEditarCurso);
    const dados = Object.fromEntries(formData);

    try {
        const response = await fetch(`/cursos/${id}`, {
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
            throw new Error(erro.erro || erro.errors?.[0] || "Erro ao atualizar curso");
        }

        fecharModalEditar();
        mostrarToastSucesso("Curso atualizado com sucesso!");
        carregarCursos();
    } catch (err) {
        const msg = err.message;

        if (msg === "CURSO_DUPLICADO") {
            mostrarErroCampoEditar("Nome", "Curso já existe");
        } else if (msg.includes("nome") && msg.includes("required")) {
            mostrarErroCampoEditar("Nome", "Nome é obrigatório");
        } else {
            alert(msg);
        }
    }
}

function abrirConfirmacao(acao, curso) {
    acaoPendente = acao;
    cursoPendente = curso;

    const mensagens = {
        excluir: `Deseja excluir o curso "${curso.nome}"?`
    };

    popupConfirmacaoTexto.textContent = mensagens[acao];
    popupConfirmacao.classList.remove("hidden");
}

function fecharConfirmacao() {
    popupConfirmacao.classList.add("hidden");
    acaoPendente = null;
    cursoPendente = null;
}

async function executarAcao() {
    if (!acaoPendente || !cursoPendente) return;

    try {
        let response;

        if (acaoPendente === "excluir") {
            response = await fetch(`/cursos/${cursoPendente.id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
                credentials: "same-origin"
            });
        }

        if (!response.ok) {
            throw new Error("Erro ao executar acao");
        }

        fecharConfirmacao();
        mostrarToastSucesso("Curso excluído com sucesso!");
        carregarCursos();
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
formCriarCurso.addEventListener("submit", criarCurso);

btnFecharModalEditar.addEventListener("click", fecharModalEditar);
formEditarCurso.addEventListener("submit", salvarEdicao);

popupConfirmacao.addEventListener("click", (e) => {
    if (e.target === popupConfirmacao) fecharConfirmacao();
});

modalCriarCurso.addEventListener("click", (e) => {
    if (e.target === modalCriarCurso) fecharModalCriar();
});

modalEditarCurso.addEventListener("click", (e) => {
    if (e.target === modalEditarCurso) fecharModalEditar();
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

["Nome", "Descricao"].forEach(campo => {
    document.getElementById(`${campo.toLowerCase()}CursoEditar`)?.addEventListener("input", () => {
        const input = document.getElementById(`${campo.toLowerCase()}CursoEditar`);
        const erro = document.getElementById(`erro${campo}Editar`);
        if (input) input.classList.remove("input-erro");
        if (erro) {
            erro.textContent = "";
            erro.classList.remove("visivel");
        }
    });
});

carregarCursos();
