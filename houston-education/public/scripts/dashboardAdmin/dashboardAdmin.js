import { getAuthHeaders } from "../utils/getAuthHeaders.js";
import { parseJwt } from "../utils/parseJWT.js";

const tabelaBody = document.querySelector("#tabelaUsuarios tbody");
const buscaInput = document.getElementById("buscaUsuario");
const filtroPerfil = document.getElementById("filtroPerfil");
const popupConfirmacao = document.getElementById("popupConfirmacao");
const popupConfirmacaoTexto = document.getElementById("popupConfirmacaoTexto");
const btnConfirmarAcao = document.getElementById("btnConfirmarAcao");
const btnCancelarAcao = document.getElementById("btnCancelarAcao");

const modalEditarPerfil = document.getElementById("modalEditarPerfil");
const btnFecharModalEditar = document.getElementById("btnFecharModalEditar");
const formEditarPerfil = document.getElementById("formEditarPerfil");
const idUsuarioEditar = document.getElementById("idUsuarioEditar");
const nomeUsuarioEditar = document.getElementById("nomeUsuarioEditar");
const emailUsuarioEditar = document.getElementById("emailUsuarioEditar");
const matriculaUsuarioEditar = document.getElementById("matriculaUsuarioEditar");
const perfilAtualEditar = document.getElementById("perfilAtualEditar");
const novoPerfilEditar = document.getElementById("novoPerfilEditar");
const senhaUsuarioEditar = document.getElementById("senhaUsuarioEditar");

const btnAbrirModalCriar = document.getElementById("btnAbrirModalCriar");
const modalCriarUsuario = document.getElementById("modalCriarUsuario");
const btnFecharModalCriar = document.getElementById("btnFecharModalCriar");
const formCriarUsuario = document.getElementById("formCriarUsuario");

const token = localStorage.getItem("token");
const usuarioLogado = token ? parseJwt(token) : null;
const idUsuarioLogado = usuarioLogado?.id || null;

let usuarios = [];
let acaoPendente = null;
let usuarioPendente = null;

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

async function carregarUsuarios() {
    tabelaBody.innerHTML = '<tr><td colspan="5">Carregando usuarios...</td></tr>';

    try {
        const perfil = filtroPerfil.value;
        const url = perfil ? `/alunos?perfil=${perfil}` : "/alunos";

        const response = await fetch(url, {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Erro ao carregar usuarios");
        }

        usuarios = await response.json();
        atualizarStats();
        renderizarTabela();
    } catch (err) {
        tabelaBody.innerHTML = `<tr><td colspan="5">Erro: ${err.message}</td></tr>`;
    }
}

function atualizarStats() {
    document.getElementById("statTotal").textContent = usuarios.length;
}

function renderizarTabela() {
    const termo = buscaInput.value.toLowerCase();
    const filtrados = usuarios.filter(u =>
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo) ||
        u.matricula.toLowerCase().includes(termo)
    );

    if (filtrados.length === 0) {
        tabelaBody.innerHTML = '<tr><td colspan="5">Nenhum usuario encontrado.</td></tr>';
        return;
    }

    tabelaBody.innerHTML = filtrados.map(u => {
        const perfilClass = u.perfil?.nome === "ADMIN" ? "badge-admin" :
                           u.perfil?.nome === "MONITOR" ? "badge-monitor" : "badge-aluno";

        return `
            <tr>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td>${u.matricula}</td>
                <td><span class="badge-perfil ${perfilClass}">${u.perfil?.nome || "ALUNO"}</span></td>
                <td>
                    <div class="acoes-botoes">
                        <button class="btn-editar" data-id="${u.id}" title="Editar perfil">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        ${u.id !== idUsuarioLogado ? `
                        <button class="btn-excluir" data-id="${u.id}" data-acao="excluir" title="Excluir usuario">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        ` : ""}
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            const usuario = usuarios.find(u => u.id === id);
            abrirModalEditar(usuario);
        });
    });

    document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = e.currentTarget.dataset.id;
            const acao = e.currentTarget.dataset.acao;
            const usuario = usuarios.find(u => u.id === id);
            abrirConfirmacao(acao, usuario);
        });
    });
}

function abrirModalEditar(usuario) {
    limparErrosEditar();
    idUsuarioEditar.value = usuario.id;
    nomeUsuarioEditar.value = usuario.nome;
    emailUsuarioEditar.value = usuario.email;
    matriculaUsuarioEditar.value = usuario.matricula;
    perfilAtualEditar.value = usuario.perfil?.nome || "ALUNO";
    novoPerfilEditar.value = String(usuario.perfilId || 3);
    senhaUsuarioEditar.value = "";
    modalEditarPerfil.classList.add("open");
}

function fecharModalEditar() {
    modalEditarPerfil.classList.remove("open");
    formEditarPerfil.reset();
    limparErrosEditar();
}

function limparErrosEditar() {
    const campos = ["Nome", "Email", "Matricula", "Senha"];
    campos.forEach(campo => {
        const input = document.getElementById(`${campo.toLowerCase()}UsuarioEditar`);
        const erro = document.getElementById(`erro${campo}Editar`);
        if (input) input.classList.remove("input-erro");
        if (erro) {
            erro.textContent = "";
            erro.classList.remove("visivel");
        }
    });
}

function mostrarErroEditar(campo, mensagem) {
    const input = document.getElementById(`${campo.toLowerCase()}UsuarioEditar`);
    const erro = document.getElementById(`erro${campo}Editar`);
    if (input) input.classList.add("input-erro");
    if (erro) {
        erro.textContent = mensagem;
        erro.classList.add("visivel");
    }
}

async function salvarPerfil(e) {
    e.preventDefault();

    const id = idUsuarioEditar.value;
    const dados = {
        nome: nomeUsuarioEditar.value,
        email: emailUsuarioEditar.value,
        matricula: matriculaUsuarioEditar.value,
        perfilId: parseInt(novoPerfilEditar.value)
    };

    if (senhaUsuarioEditar.value.trim() !== "") {
        dados.senha = senhaUsuarioEditar.value;
    }

    try {
        const response = await fetch(`/alunos/${id}/updateAluno`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            body: JSON.stringify(dados)
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.erro || erro.error || "Erro ao atualizar usuário");
        }

        fecharModalEditar();
        mostrarToastSucesso("Usuário atualizado com sucesso!");
        carregarUsuarios();
    } catch (err) {
        const msg = err.message;

        if (msg === "EMAIL_EXISTE") {
            mostrarErroEditar("Email", "Email já em uso");
        } else if (msg === "MATRICULA_EXISTE") {
            mostrarErroEditar("Matricula", "Matrícula já em uso");
        } else if (msg === "MATRICULA_OU_EMAIL_EM_USO") {
            mostrarErroEditar("Email", "Email ou matrícula já em uso");
        } else if (msg === "NOME_OBRIGATORIO") {
            mostrarErroEditar("Nome", "Nome é obrigatório");
        } else if (msg === "EMAIL_OBRIGATORIO") {
            mostrarErroEditar("Email", "Email é obrigatório");
        } else if (msg === "MATRICULA_INVALIDA") {
            mostrarErroEditar("Matricula", "Matrícula deve conter 8 a 11 dígitos");
        } else if (msg === "SENHA_OBRIGATORIA") {
            mostrarErroEditar("Senha", "Senha não pode ser vazia");
        } else if (msg === "ALUNO_INEXISTENTE") {
            alert("Usuário não encontrado");
        } else {
            alert(msg);
        }
    }
}

function abrirConfirmacao(acao, usuario) {
    acaoPendente = acao;
    usuarioPendente = usuario;

    const mensagens = {
        excluir: `Deseja excluir o usuario "${usuario.nome}"?`
    };

    popupConfirmacaoTexto.textContent = mensagens[acao];
    popupConfirmacao.classList.remove("hidden");
}

function fecharConfirmacao() {
    popupConfirmacao.classList.add("hidden");
    acaoPendente = null;
    usuarioPendente = null;
}

async function executarAcao() {
    if (!acaoPendente || !usuarioPendente) return;

    try {
        let response;

        if (acaoPendente === "excluir") {
            response = await fetch(`/alunos/${usuarioPendente.id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
                credentials: "same-origin"
            });
        }

        if (!response.ok) {
            throw new Error("Erro ao executar acao");
        }

        fecharConfirmacao();
        mostrarToastSucesso("Usuário excluído com sucesso!");
        carregarUsuarios();
    } catch (err) {
        alert(err.message);
        fecharConfirmacao();
    }
}

function abrirModalCriar() {
    modalCriarUsuario.classList.add("open");
}

function fecharModalCriar() {
    modalCriarUsuario.classList.remove("open");
    formCriarUsuario.reset();
    limparErrosCriarUsuario();
}

function limparErrosCriarUsuario() {
    const campos = ["Nome", "Email", "Matricula", "Senha"];
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

async function criarUsuario(e) {
    e.preventDefault();

    limparErrosCriarUsuario();

    const formData = new FormData(formCriarUsuario);
    const dados = Object.fromEntries(formData);

    try {
        const response = await fetch("/alunos", {
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
            throw new Error(erro.erro || erro.errors?.[0] || "Erro ao criar usuário");
        }

        fecharModalCriar();
        mostrarToastSucesso("Usuário criado com sucesso!");
        carregarUsuarios();
    } catch (err) {
        const msg = err.message;
        console.log("Erro capturado:", msg);

        if (msg === "EMAIL_EXISTE") {
            mostrarErroCampo("Email", "Email já em uso");
        } else if (msg === "MATRICULA_EXISTE") {
            mostrarErroCampo("Matricula", "Matrícula já em uso");
        } else if (msg.includes("nome") && msg.includes("required")) {
            mostrarErroCampo("Nome", "Nome é obrigatório");
        } else if (msg.includes("email") && msg.includes("required")) {
            mostrarErroCampo("Email", "Email é obrigatório");
        } else if (msg.includes("email") && msg.includes("valid")) {
            mostrarErroCampo("Email", "Email inválido");
        } else if (msg.includes("matricula") && msg.includes("required")) {
            mostrarErroCampo("Matricula", "Matrícula é obrigatória");
        } else if (msg.includes("matricula") && msg.includes("match")) {
            mostrarErroCampo("Matricula", "Matrícula deve conter apenas números (8 a 11 dígitos)");
        } else if (msg.includes("senha") && msg.includes("required")) {
            mostrarErroCampo("Senha", "Senha é obrigatória");
        } else {
            alert(msg);
        }
    }
}

buscaInput.addEventListener("input", renderizarTabela);
filtroPerfil.addEventListener("change", carregarUsuarios);
btnConfirmarAcao.addEventListener("click", executarAcao);
btnCancelarAcao.addEventListener("click", fecharConfirmacao);
btnFecharModalEditar.addEventListener("click", fecharModalEditar);
formEditarPerfil.addEventListener("submit", salvarPerfil);

btnAbrirModalCriar.addEventListener("click", abrirModalCriar);
btnFecharModalCriar.addEventListener("click", fecharModalCriar);
formCriarUsuario.addEventListener("submit", criarUsuario);

["Nome", "Email", "Matricula", "Senha"].forEach(campo => {
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

popupConfirmacao.addEventListener("click", (e) => {
    if (e.target === popupConfirmacao) fecharConfirmacao();
});

modalEditarPerfil.addEventListener("click", (e) => {
    if (e.target === modalEditarPerfil) fecharModalEditar();
});

modalCriarUsuario.addEventListener("click", (e) => {
    if (e.target === modalCriarUsuario) fecharModalCriar();
});

["Nome", "Email", "Matricula", "Senha"].forEach(campo => {
    document.getElementById(`${campo.toLowerCase()}UsuarioEditar`)?.addEventListener("input", () => {
        const input = document.getElementById(`${campo.toLowerCase()}UsuarioEditar`);
        const erro = document.getElementById(`erro${campo}Editar`);
        if (input) input.classList.remove("input-erro");
        if (erro) {
            erro.textContent = "";
            erro.classList.remove("visivel");
        }
    });
});

// Toggle visibilidade da senha no modal de criar usuário
const btnToggleSenhaCriar = document.getElementById("btnToggleSenhaCriar");
const inputSenhaCriar = document.getElementById("inputSenhaCriar");

if (btnToggleSenhaCriar && inputSenhaCriar) {
    btnToggleSenhaCriar.addEventListener("click", () => {
        const icone = btnToggleSenhaCriar.querySelector("i");
        if (inputSenhaCriar.type === "password") {
            inputSenhaCriar.type = "text";
            icone.classList.remove("fa-eye");
            icone.classList.add("fa-eye-slash");
        } else {
            inputSenhaCriar.type = "password";
            icone.classList.remove("fa-eye-slash");
            icone.classList.add("fa-eye");
        }
    });
}

carregarUsuarios();
