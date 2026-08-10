import { getAlunoId } from "../utils/getAlunoId.js";
import { getAuthHeaders } from "../utils/getAuthHeaders.js";

const listaInscricoes = document.getElementById("listaInscricoes");
const modalDetalhes = document.getElementById("modalDetalhes");
const btnFecharModal = document.getElementById("btnFecharModal");
const popupCancelar = document.getElementById("popupCancelarInscricao");
const btnConfirmarCancelar = document.getElementById("btnConfirmarCancelar");
const btnFecharPopupCancelar = document.getElementById("btnFecharPopupCancelar");

let inscricoesAtuais = [];
let inscricaoParaCancelar = null;

async function carregarInscricoes() {
    const alunoId = getAlunoId();
    if (!alunoId) {
        listaInscricoes.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #888;">Erro ao identificar usuário. Faça login novamente.</div>`;
        return;
    }

    try {
        const response = await fetch(`/inscricoes/${alunoId}/minhas-inscricoes`, {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("ERRO_AO_CARREGAR");
        }

        inscricoesAtuais = await response.json();
        aplicarFiltros();
    } catch (err) {
        listaInscricoes.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #888;">Erro ao carregar inscrições: ${err.message}</div>`;
    }
}

function aplicarFiltros() {
    const termoBusca = document.getElementById("buscaMonitoria")?.value.toLowerCase() || "";
    const ordenacao = document.getElementById("ordenarMonitorias")?.value || "recente";

    let inscricoesFiltradas = [...inscricoesAtuais];

    // Ordenação
    inscricoesFiltradas.sort((a, b) => {
        const dataA = new Date(a.monitoria.inicio).getTime();
        const dataB = new Date(b.monitoria.inicio).getTime();
        return ordenacao === "recente" ? dataB - dataA : dataA - dataB;
    });

    // Busca
    if (termoBusca) {
        inscricoesFiltradas = inscricoesFiltradas.filter((inscricao) => {
            const m = inscricao.monitoria;
            const nomeMonitoria = m.nome_monitoria?.toLowerCase() || "";
            const nomeDisciplina = m.disciplina?.nome?.toLowerCase() || "";
            return nomeMonitoria.includes(termoBusca) || nomeDisciplina.includes(termoBusca);
        });
    }

    renderizarInscricoes(inscricoesFiltradas);
}

function renderizarInscricoes(inscricoes) {
    listaInscricoes.innerHTML = "";

    if (!inscricoes || inscricoes.length === 0) {
        listaInscricoes.innerHTML = `
            <div class="sem-inscricoes">
                <img src="../assets/img/monitoramento.png" alt="Nenhuma monitoria">
                <span>Nenhuma monitoria encontrada.</span>
            </div>
        `;
        return;
    }

    // Agrupar inscrições por curso
    const inscricoesPorCurso = {};
    inscricoes.forEach((inscricao) => {
        const m = inscricao.monitoria;
        const primeiroCurso = m.disciplina?.cursos?.[0]?.curso;
        const cursoNome = primeiroCurso?.nome || "Sem curso";
        const cursoSigla = primeiroCurso?.nome
            ? primeiroCurso.nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
            : "?";
        if (!inscricoesPorCurso[cursoNome]) {
            inscricoesPorCurso[cursoNome] = { sigla: cursoSigla, inscricoes: [] };
        }
        inscricoesPorCurso[cursoNome].inscricoes.push(inscricao);
    });

    // Renderizar cada curso
    Object.entries(inscricoesPorCurso).forEach(([cursoNome, cursoData]) => {
        const cursoContainer = document.createElement("div");
        cursoContainer.classList.add("curso-container");

        const cursoHeader = document.createElement("div");
        cursoHeader.classList.add("curso-header");
        cursoHeader.innerHTML = `
            <div class="curso-sigla">${cursoData.sigla}</div>
            <div class="curso-nome">${cursoNome}</div>
        `;
        cursoContainer.appendChild(cursoHeader);

        const cursoMonitorias = document.createElement("div");
        cursoMonitorias.classList.add("curso-monitorias");

        cursoData.inscricoes.forEach((inscricao) => {
            const m = inscricao.monitoria;
            const card = document.createElement("div");
            card.classList.add("cardmonitoria");
            card.dataset.inscricaoId = inscricao.id;
            card.dataset.monitoriaId = m.id;

            const agora = new Date();
            const monitoriaJaOcorreu = new Date(m.inicio) <= agora;

            card.innerHTML = `
                <div class="informacoesmonitoria">
                    <div class="nomemonitoria">${m.nome_monitoria}</div>
                    <div class="disciplinamonitoria">${m.disciplina?.nome || ""}</div>
                    <div class="datamonitoria">
                        ${new Date(m.inicio).toLocaleDateString()} -
                        ${new Date(m.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div class="campusmonitoria">${m.local?.campus?.nome || ''}</div>
                </div>
                <div class="divbotao">
                    <button class="btn-detalhes">Detalhes</button>
                    ${!monitoriaJaOcorreu ? `<button class="btn-inscrito" data-inscricao-id="${inscricao.id}">Inscrito</button>` : ''}
                </div>
            `;

            const btnDetalhes = card.querySelector(".btn-detalhes");
            btnDetalhes.addEventListener("click", (e) => {
                e.stopPropagation();
                abrirModalDetalhes(inscricao);
            });

            if (!monitoriaJaOcorreu) {
                const btnInscrito = card.querySelector(".btn-inscrito");
                btnInscrito.addEventListener("click", (e) => {
                    e.stopPropagation();
                    inscricaoParaCancelar = inscricao.id;
                    popupCancelar.classList.remove("hidden");
                });
            }

            cursoMonitorias.appendChild(card);
        });

        cursoContainer.appendChild(cursoMonitorias);
        listaInscricoes.appendChild(cursoContainer);
    });
}

function abrirModalDetalhes(inscricao) {
    const m = inscricao.monitoria;
    const dataInicio = new Date(m.inicio);
    const dataFormatada = dataInicio.toLocaleDateString();
    const horaFormatada = dataInicio.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    document.getElementById("modalDetalhesTitulo").textContent = m.nome_monitoria;
    document.getElementById("detalheDisciplina").textContent = m.disciplina?.nome || "Não informado";
    document.getElementById("detalheMonitor").textContent = m.monitor?.nome || "Não informado";
    document.getElementById("detalheLocal").textContent = `${m.local?.nome || "Não informado"} ${m.local?.campus?.nome ? `(${m.local.campus.nome})` : ""}`;
    document.getElementById("detalheDataHora").textContent = `${dataFormatada} - ${horaFormatada}`;
    document.getElementById("detalheDescricao").textContent = m.descricao || "Sem descrição";
    document.getElementById("detalhePresente").textContent = inscricao.presente ? "Sim" : "Não";

    modalDetalhes.classList.add("open");
}

function fecharModalDetalhes() {
    modalDetalhes.classList.remove("open");
}

btnFecharModal?.addEventListener("click", fecharModalDetalhes);

modalDetalhes?.addEventListener("click", (e) => {
    if (e.target === modalDetalhes) {
        fecharModalDetalhes();
    }
});

btnFecharPopupCancelar?.addEventListener("click", () => {
    popupCancelar.classList.add("hidden");
    inscricaoParaCancelar = null;
});

popupCancelar?.addEventListener("click", (e) => {
    if (e.target === popupCancelar) {
        popupCancelar.classList.add("hidden");
        inscricaoParaCancelar = null;
    }
});

btnConfirmarCancelar?.addEventListener("click", async () => {
    if (!inscricaoParaCancelar) return;

    try {
        const response = await fetch(`/inscricoes/${inscricaoParaCancelar}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("ERRO_AO_CANCELAR");
        }

        popupCancelar.classList.add("hidden");
        inscricaoParaCancelar = null;
        carregarInscricoes();
    } catch (err) {
        alert("Erro ao cancelar inscrição. Tente novamente.");
    }
});

// Eventos de filtro
document.getElementById("buscaMonitoria")?.addEventListener("input", aplicarFiltros);
document.getElementById("ordenarMonitorias")?.addEventListener("change", aplicarFiltros);

carregarInscricoes();
