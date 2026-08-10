import { parseJwt } from "../utils/parseJWT.js";

const API_URL = "";
let monitoriasCache = [];

async function carregarHistorico() {
    const tbody = document.getElementById("corpoTabelaHistorico");
    const token = localStorage.getItem("token");
    const user = parseJwt(token);

    if (!user?.id) {
        tbody.innerHTML = `<tr><td colspan="8" class="sem-dados">Usuário não autenticado</td></tr>`;
        return;
    }

    const url = user.perfil === "ADMIN"
        ? `${API_URL}/monitorias/historico`
        : `${API_URL}/monitorias/historico/${user.id}`;

    try {
        const resposta = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!resposta.ok) throw new Error("Erro ao carregar histórico");

        const monitorias = await resposta.json();
        monitoriasCache = monitorias;
        ordenarMonitorias();
        popularFiltroDisciplinas(monitorias);
    } catch (erro) {
        console.warn("Usando dados mock:", erro.message);
        const mock = [
            {
                nome: "Teste 2",
                monitor: { nome: "João Silva" },
                disciplina: { nome: "Matemática" },
                data: "2026-07-31",
                inicio: "12:00",
                fim: "14:00",
                inscritos: 3,
                presentes: 2,
                temChamada: true,
            },
            {
                nome: "Monitoria de Física",
                monitor: { nome: "Maria Souza" },
                disciplina: { nome: "Física I" },
                data: "2026-07-28",
                inicio: "10:00",
                fim: "12:00",
                inscritos: 8,
                presentes: 5,
                temChamada: true,
            },
            {
                nome: "Revisão de Cálculo",
                monitor: { nome: "Pedro Santos" },
                disciplina: { nome: "Cálculo II" },
                data: "2026-07-25",
                inicio: "08:00",
                fim: "10:00",
                inscritos: 6,
                presentes: 0,
                temChamada: false,
            },
        ];
        monitoriasCache = mock;
        ordenarMonitorias();
        popularFiltroDisciplinas(mock);
    }
}

function formatarData(dataString) {
    const [ano, mes, dia] = dataString.split("-");
    return `${dia}/${mes}/${ano}`;
}

function renderizarTabela(monitorias) {
    const tbody = document.getElementById("corpoTabelaHistorico");

    if (!monitorias || monitorias.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="sem-dados">Nenhuma monitoria encontrada</td></tr>`;
        return;
    }

    tbody.innerHTML = monitorias
        .map((m) => {
            const presentesClasse =
                m.presentes > 0 ? "presentes-positivo" : "presentes-zero";
            const acao = m.temChamada
                ? `<button class="btn-ver-chamada" data-id="${m.id || 0}" data-monitor="${m.monitor?.nome || ''}" data-disciplina="${m.disciplina?.nome || ''}" data-inicio="${m.inicio}" data-fim="${m.fim}">Ver chamada</button>`
                : `<span class="sem-chamada">Sem chamada</span>`;

            return `
            <tr>
                <td>${m.nome}</td>
                <td>${m.monitor?.nome || "-"}</td>
                <td>${m.disciplina?.nome || "-"}</td>
                <td>${formatarData(m.data)}</td>
                <td>${m.inicio} – ${m.fim}</td>
                <td>${m.inscritos}</td>
                <td class="${presentesClasse}">${m.presentes}</td>
                <td>${acao}</td>
            </tr>
        `;
        })
        .join("");

    document.querySelectorAll(".btn-ver-chamada").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            const linha = btn.closest("tr");
            const colunas = linha.querySelectorAll("td");
            const nomeMonitoria = colunas[0].textContent;
            const dataMonitoria = colunas[3].textContent;
            const monitor = btn.dataset.monitor || colunas[1].textContent;
            const disciplina = btn.dataset.disciplina || colunas[2].textContent;
            const horario = colunas[4].textContent;
            abrirModalChamada(id, nomeMonitoria, dataMonitoria, monitor, disciplina, horario);
        });
    });
}

function popularFiltroDisciplinas(monitorias) {
    const select = document.getElementById("filtroDisciplina");
    const disciplinas = [
        ...new Set(monitorias.map((m) => m.disciplina?.nome).filter(Boolean)),
    ];

    disciplinas.forEach((d) => {
        const option = document.createElement("option");
        option.value = d;
        option.textContent = d;
        select.appendChild(option);
    });
}

function filtrarMonitorias() {
    const busca = document.getElementById("buscaMonitoria").value.toLowerCase();
    const disciplina = document.getElementById("filtroDisciplina").value;
    const dataInicial = document.getElementById("dataInicial").value;
    const dataFinal = document.getElementById("dataFinal").value;

    const linhas = document.querySelectorAll("#corpoTabelaHistorico tr");

    linhas.forEach((linha) => {
        const colunas = linha.querySelectorAll("td");
        if (colunas.length < 8) return;

        const nome = colunas[0].textContent.toLowerCase();
        const monitor = colunas[1].textContent.toLowerCase();
        const disc = colunas[2].textContent;
        const dataTexto = colunas[3].textContent;
        const [dia, mes, ano] = dataTexto.split("/");
        const dataISO = `${ano}-${mes}-${dia}`;

        const matchBusca = nome.includes(busca) || monitor.includes(busca);
        const matchDisciplina = !disciplina || disc === disciplina;
        const matchDataInicial = !dataInicial || dataISO >= dataInicial;
        const matchDataFinal = !dataFinal || dataISO <= dataFinal;

        linha.style.display =
            matchBusca && matchDisciplina && matchDataInicial && matchDataFinal
                ? ""
                : "none";
    });
}

document.getElementById("buscaMonitoria")?.addEventListener("input", filtrarMonitorias);
document.getElementById("filtroDisciplina")?.addEventListener("change", filtrarMonitorias);
document.getElementById("dataInicial")?.addEventListener("change", filtrarMonitorias);
document.getElementById("dataFinal")?.addEventListener("change", filtrarMonitorias);
document.getElementById("ordenarMonitorias")?.addEventListener("change", ordenarMonitorias);

function ordenarMonitorias() {
    if (!monitoriasCache || monitoriasCache.length === 0) return;

    const ordenacao = document.getElementById("ordenarMonitorias")?.value || "recente";

    const ordenado = [...monitoriasCache].sort((a, b) => {
        const dataA = new Date(a.data).getTime();
        const dataB = new Date(b.data).getTime();
        return ordenacao === "recente" ? dataB - dataA : dataA - dataB;
    });

    renderizarTabela(ordenado);
    filtrarMonitorias();
}

const modalChamada = document.getElementById("modalChamada");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnBaixarPdf = document.getElementById("btnBaixarPdf");

let dadosMonitoriaAtual = {
    nome: "",
    monitor: "",
    disciplina: "",
    data: "",
    horario: "",
    alunos: [],
};

async function abrirModalChamada(id, nomeMonitoria, dataMonitoria, monitor, disciplina, horario) {
    document.getElementById("modalChamadaTitulo").textContent = `Chamada - ${nomeMonitoria} - ${dataMonitoria}`;

    dadosMonitoriaAtual = {
        nome: nomeMonitoria,
        monitor: monitor || "-",
        disciplina: disciplina || "-",
        data: dataMonitoria,
        horario: horario || "-",
        alunos: [],
    };

    const token = localStorage.getItem("token");
    const container = document.getElementById("modalChamadaLista");
    container.innerHTML = `<div class="sem-alunos">Carregando...</div>`;
    modalChamada.classList.add("open");

    try {
        const resposta = await fetch(`${API_URL}/monitorias/${id}/chamada`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!resposta.ok) {
            if (resposta.status === 403) {
                container.innerHTML = `<div class="sem-alunos">Você não tem permissão para visualizar esta chamada.</div>`;
                return;
            }
            if (resposta.status === 404) {
                container.innerHTML = `<div class="sem-alunos">Monitoria não encontrada.</div>`;
                return;
            }
            throw new Error("Erro ao carregar chamada");
        }

        const alunos = await resposta.json();
        const alunosFormatados = alunos.map(a => ({
            nome: a.nome,
            matricula: a.matricula,
            inscrito: "Sim",
            presente: a.presente,
        }));

        dadosMonitoriaAtual.alunos = alunosFormatados;
        renderizarListaChamada(alunosFormatados);
    } catch (erro) {
        container.innerHTML = `<div class="sem-alunos">Erro ao carregar chamada. Tente novamente.</div>`;
    }
}

function fecharModalChamada() {
    modalChamada.classList.remove("open");
}

function renderizarListaChamada(alunos) {
    const container = document.getElementById("modalChamadaLista");

    if (!alunos || alunos.length === 0) {
        container.innerHTML = `<div class="sem-alunos">Nenhum aluno inscrito nesta monitoria</div>`;
        return;
    }

    container.innerHTML = alunos.map(aluno => `
        <div class="chamada-aluno">
            <div class="chamada-aluno-info">
                <span class="chamada-aluno-nome">${aluno.nome}</span>
                <span class="chamada-aluno-matricula">Matrícula: ${aluno.matricula}</span>
                <span class="chamada-aluno-inscrito">Inscrito: ${aluno.inscrito}</span>
            </div>
            <span class="chamada-aluno-status ${aluno.presente ? 'status-presente' : 'status-ausente'}">
                ${aluno.presente ? 'Presente' : 'Ausente'}
            </span>
        </div>
    `).join("");
}

function preencherPdfContent() {
    document.getElementById("pdfTitulo").textContent = `Chamada - ${dadosMonitoriaAtual.nome} - ${dadosMonitoriaAtual.data}`;
    document.getElementById("pdfMonitor").textContent = dadosMonitoriaAtual.monitor;
    document.getElementById("pdfDisciplina").textContent = dadosMonitoriaAtual.disciplina;
    document.getElementById("pdfData").textContent = dadosMonitoriaAtual.data;
    document.getElementById("pdfHorario").textContent = dadosMonitoriaAtual.horario;

    const tbody = document.getElementById("pdfTabelaCorpo");
    if (!dadosMonitoriaAtual.alunos || dadosMonitoriaAtual.alunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #999;">Nenhum aluno inscrito</td></tr>`;
    } else {
        tbody.innerHTML = dadosMonitoriaAtual.alunos.map((aluno, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${aluno.nome}</td>
                <td>${aluno.matricula}</td>
                <td>${aluno.inscrito}</td>
                <td><span class="${aluno.presente ? 'status-presente' : 'status-ausente'}">${aluno.presente ? 'Presente' : 'Ausente'}</span></td>
            </tr>
        `).join("");
    }

    const agora = new Date();
    document.getElementById("pdfDataGeracao").textContent = agora.toLocaleDateString("pt-BR");
}

function baixarPdf() {
    if (!dadosMonitoriaAtual.alunos || dadosMonitoriaAtual.alunos.length === 0) {
        alert("Não há dados de chamada para baixar.");
        return;
    }

    preencherPdfContent();

    const elemento = document.getElementById("pdfContent");
    elemento.style.display = "block";

    const nomeArquivo = `Chamada_${dadosMonitoriaAtual.nome.replace(/\s+/g, "_")}_${dadosMonitoriaAtual.data.replace(/\//g, "-")}.pdf`;

    const opt = {
        margin: [10, 10, 10, 10],
        filename: nomeArquivo,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    html2pdf()
        .set(opt)
        .from(elemento)
        .save()
        .then(() => {
            elemento.style.display = "none";
        })
        .catch((err) => {
            console.error("Erro ao gerar PDF:", err);
            alert("Erro ao gerar o PDF. Tente novamente.");
            elemento.style.display = "none";
        });
}

btnFecharModal?.addEventListener("click", fecharModalChamada);
btnBaixarPdf?.addEventListener("click", baixarPdf);

modalChamada?.addEventListener("click", (e) => {
    if (e.target === modalChamada) {
        fecharModalChamada();
    }
});

carregarHistorico();