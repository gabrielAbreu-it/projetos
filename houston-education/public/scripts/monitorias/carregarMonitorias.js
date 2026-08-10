import { getAlunoId } from "../utils/getAlunoId.js";
import { getPerfil } from "../utils/getPerfil.js";
import { getAuthHeaders } from "../utils/getAuthHeaders.js";

let todasMonitorias = [];
let campusList = [];
let indicadorTab = null;
let timeoutMensagemVaziaHome = null;

function posicionarIndicador(tab, animar = true) {
    if (!indicadorTab || !tab) return;

    if (!animar) {
        indicadorTab.classList.add("sem-transicao");
    }

    const left = tab.offsetLeft;
    const width = tab.offsetWidth;

    indicadorTab.style.transform = `translateX(${left}px)`;
    indicadorTab.style.width = `${width}px`;

    if (!animar) {
        // Força o reflow para aplicar a posição sem transição
        indicadorTab.offsetHeight;
        indicadorTab.classList.remove("sem-transicao");
    }
}

async function carregarCampusTabs() {
    try {
        const response = await fetch("/campus", {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });
        campusList = await response.json();

        const tabsContainer = document.getElementById("tabsCampus");

        indicadorTab = document.createElement("span");
        indicadorTab.classList.add("tab-indicator");
        tabsContainer.appendChild(indicadorTab);

        campusList.forEach(campus => {
            const btn = document.createElement("button");
            btn.classList.add("tab-btn");
            btn.dataset.campus = campus.nome;
            btn.textContent = campus.nome;
            tabsContainer.appendChild(btn);
        });

        tabsContainer.addEventListener("click", (e) => {
            if (e.target.classList.contains("tab-btn")) {
                tabsContainer.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                posicionarIndicador(e.target);
                filtrarPorCampus(e.target.dataset.campus);
            }
        });

        // Posicionar indicador na tab ativa inicial (Todas) sem animação
        const tabAtiva = tabsContainer.querySelector('.tab-btn.active');
        if (tabAtiva) {
            posicionarIndicador(tabAtiva, false);
        }
    } catch (error) {
        console.log(error);
    }
}

function filtrarPorCampus(campusNome) {
    const cards = document.querySelectorAll(".cardmonitoria");
    cards.forEach(card => {
        const cardCampus = card.dataset.campus;
        const deveMostrar = campusNome === "todas" || cardCampus === campusNome;
        if (deveMostrar) {
            card.classList.remove("tab-hidden");
        } else {
            card.classList.add("tab-hidden");
        }
    });

    // Esconder containers de curso vazios
    document.querySelectorAll(".curso-container").forEach(container => {
        const visibleCards = container.querySelectorAll(".cardmonitoria:not(.tab-hidden)");
        container.style.display = visibleCards.length > 0 ? "" : "none";
    });

    atualizarMensagemVaziaHome();
}

function atualizarMensagemVaziaHome() {
    const lista = document.getElementById("listamonitorias");
    if (!lista) return;

    if (timeoutMensagemVaziaHome) {
        clearTimeout(timeoutMensagemVaziaHome);
        timeoutMensagemVaziaHome = null;
    }

    const mensagemAnterior = lista.querySelector(".mensagem-home-vazia");
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }

    const cardsVisiveis = lista.querySelectorAll(".cardmonitoria:not(.tab-hidden)");
    const algumVisivel = Array.from(cardsVisiveis).some(card => card.style.display !== "none");

    if (!algumVisivel) {
        timeoutMensagemVaziaHome = setTimeout(() => {
            const li = document.createElement("li");
            li.classList.add("mensagem-lista-vazia", "mensagem-home-vazia");
            li.innerHTML = `
                <img src="../assets/img/monitoramento2.png" alt="Nenhuma monitoria">
                <span>Nenhuma monitoria encontrada</span>
            `;
            lista.appendChild(li);
        }, 300);
    }
}

async function carregarMonitorias() {
    const lista = document.getElementById("listamonitorias");

    try {
        const response = await fetch("/monitorias/disponiveis", {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        const respInscricao = await fetch(`/inscricoes/aluno`, {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("ERRO_AO_CARREGAR");
        }

        const monitorias = await response.json();
        todasMonitorias = monitorias;

        const ordenacao = document.getElementById("ordenarMonitorias")?.value || "recente";
        monitorias.sort((a, b) => {
            const dataA = new Date(a.inicio).getTime();
            const dataB = new Date(b.inicio).getTime();
            return ordenacao === "recente" ? dataB - dataA : dataA - dataB;
        });

        const inscricoes = await respInscricao.json();

        if (monitorias.length === 0) {
            lista.innerHTML = `
                <li class="mensagem-lista-vazia mensagem-home-vazia">
                    <img src="../assets/img/monitoramento2.png" alt="Nenhuma monitoria">
                    <span>Nenhuma monitoria encontrada</span>
                </li>
            `;
            return;
        }

        lista.innerHTML = "";

        const popup = document.createElement("div");
        popup.classList.add("popup", "hidden");

        popup.innerHTML = `
        <div class="popup-content">
            <p>Deseja cancelar sua inscrição?</p>
            <button class="btn-cancelar">Cancelar inscrição</button>
            <button class="btn-fechar">Fechar</button>
        </div>
        `;
        document.body.appendChild(popup);

        const btnCancelarInscricaoPopup = popup.querySelector(".btn-cancelar");
        const btnFecharPopup = popup.querySelector(".btn-fechar");

        // Agrupar monitorias por curso
        const monitoriasPorCurso = {};
        monitorias.forEach((m) => {
            const primeiroCurso = m.disciplina?.cursos?.[0]?.curso;
            const cursoNome = primeiroCurso?.nome || "Sem curso";
            const cursoSigla = primeiroCurso?.nome
                ? primeiroCurso.nome.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
                : "?";
            if (!monitoriasPorCurso[cursoNome]) {
                monitoriasPorCurso[cursoNome] = { sigla: cursoSigla, monitorias: [] };
            }
            monitoriasPorCurso[cursoNome].monitorias.push(m);
        });

        // Renderizar cada curso
        Object.entries(monitoriasPorCurso).forEach(([cursoNome, cursoData]) => {
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

            cursoData.monitorias.forEach((m) => {
            const li = document.createElement("li");
            li.classList.add("cardmonitoria");
            li.dataset.id = m.id;
            li.dataset.campus = m.local?.campus?.nome || "";
            li.dataset.curso = cursoNome.toLowerCase();

            const linkCompartilhavel = `${window.location.origin}/pages/home.html?monitoria=${m.id}`;

            li.innerHTML = `
            <button class="btn-compartilhar" title="Copiar link da monitoria" aria-label="Compartilhar monitoria">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
            </button>
            <div class="informacoesmonitoria">
                <div class="nomemonitoria">${m.nome_monitoria}</div>
                <div class="disciplinamonitoria">${m.disciplina.nome}</div>
                <div class="datamonitoria">
                        ${new Date(m.inicio).toLocaleDateString()} -
                        ${new Date(m.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div class="campusmonitoria">${m.local?.campus?.nome || ''}</div>
            </div>
            `;

            const btnCompartilhar = li.querySelector(".btn-compartilhar");
            btnCompartilhar.addEventListener("click", (e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(linkCompartilhavel).then(() => {
                    mostrarToast("Link copiado para a área de transferência!");
                }).catch(() => {
                    mostrarToast("Não foi possível copiar o link.");
                });
            });

            const popupInfoMonitoria = document.getElementById("popupInfoMonitoria");
            const popupTitulo = document.getElementById("popupTitulo");
            const popupDisciplina = document.getElementById("popupDisciplina");
            const popupMonitor = document.getElementById("popupMonitor");
            const popupLocal = document.getElementById("popupLocal");
            const popupDataHora = document.getElementById("popupDataHora");

            popupInfoMonitoria.addEventListener("click", (e) => {
                if (e.target === popupInfoMonitoria) popupInfoMonitoria.classList.add("hidden");
            });

            li.addEventListener("click", (e) => {
                if (e.target.tagName.toLowerCase() === "button") return;

                popupTitulo.textContent = m.nome_monitoria;
                popupDisciplina.textContent = `Disciplina: ${m.disciplina.nome}`;
                popupMonitor.textContent = `Monitor: ${m.monitor.nome}`;
                popupLocal.textContent = `Local: ${m.local?.nome || 'Não informado'} (${m.local?.campus?.nome || ''})`;
                popupDataHora.textContent = `Data/Hora: ${new Date(m.inicio).toLocaleDateString()} - ${new Date(m.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                popupInfoMonitoria.classList.remove("hidden");
            });

            const divBotao = document.createElement("div");
            divBotao.classList.add("divbotao");
            const botaoInscrever = document.createElement("button");
            botaoInscrever.dataset.id = m.id;

            const jaInscrito = inscricoes.find((i) => i.monitoriaId === m.id);

            if (jaInscrito) {
                botaoInscrever.textContent = "Inscrito";
                botaoInscrever.classList.add("btn-inscrito");
                botaoInscrever.dataset.inscricaoId = jaInscrito.id;
            } else {
                botaoInscrever.textContent = "Inscreva-se";
                botaoInscrever.classList.add("btn-inscrever");
            }

            divBotao.appendChild(botaoInscrever);
            li.appendChild(divBotao);

            botaoInscrever.addEventListener("click", async () => {
                const alunoId = getAlunoId();

                if (botaoInscrever.classList.contains("btn-inscrito")) {
                    popup.classList.remove("hidden");
                    popup.dataset.targetButtonId = m.id;
                    return;
                }
                try {
                    const responseFazerInscricao = await fetch(`/inscricoes`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...getAuthHeaders()
                        },
                        credentials: "same-origin",
                        body: JSON.stringify({ alunoId: alunoId, monitoriaId: m.id })
                    });

                    if (!responseFazerInscricao.ok) {
                        throw new Error("ERRO_AO_FAZER_INSCRICAO");
                    }

                    const dadosDaInscricao = await responseFazerInscricao.json();

                    botaoInscrever.textContent = "Inscrito";
                    botaoInscrever.classList.remove("btn-inscrever");
                    botaoInscrever.classList.add("btn-inscrito");
                    botaoInscrever.dataset.inscricaoId = dadosDaInscricao.id;
                } catch (err) {
                    lista.innerHTML = `<li>Erro ao carregar inscrição: ${err.message}</li>`;
                }
            });

            const idDoUsuario = getAlunoId();
            const perfilDoUsuario = getPerfil();

            if (m.monitorId == idDoUsuario || perfilDoUsuario == "ADMIN") {
                const botaoUpdate = document.createElement("button");
                botaoUpdate.textContent = "Atualizar Monitoria";
                botaoUpdate.classList.add("btn-update");

                botaoUpdate.addEventListener("click", (e) => {
                    e.stopPropagation();

                    const formUpdate = document.getElementById("formAtualizarMonitoria");
                    const modalOverlay = document.getElementById("modalOverlay");

                    document.getElementById("id_monitoria_hidden").value = m.id;

                    formUpdate.querySelector('input[name="nome_monitoria"]').value = m.nome_monitoria;
                    formUpdate.querySelector('textarea[name="descricao"]').value = m.descricao;
                    formUpdate.querySelector('input[name="data"]').value = new Date(m.inicio).toISOString().split("T")[0];
                    formUpdate.querySelector('input[name="hora_inicio"]').value = new Date(m.inicio).toTimeString().slice(0, 5);
                    formUpdate.querySelector('input[name="hora_fim"]').value = new Date(m.fim).toTimeString().slice(0, 5);
                    formUpdate.querySelector('select[name="localId"]').value = m.localId;
                    formUpdate.querySelector('select[name="disciplinaId"]').value = m.disciplinaId;

                    modalOverlay.classList.add("open");
                });

                divBotao.appendChild(botaoUpdate);
            }

            cursoMonitorias.appendChild(li);
            });

            cursoContainer.appendChild(cursoMonitorias);
            lista.appendChild(cursoContainer);
        });

        const formAtualizar = document.getElementById("formAtualizarMonitoria");
        formAtualizar.addEventListener("submit", async (e) => {
            e.preventDefault();

            const idMonitoria = document.getElementById("id_monitoria_hidden").value;

            const formData = new FormData(formAtualizar);
            const dadosParaAtualizar = Object.fromEntries(formData);

            delete dadosParaAtualizar.id_monitoria;

            try {
                const response = await fetch(`/monitorias/${idMonitoria}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...getAuthHeaders()
                    },
                    credentials: "same-origin",
                    body: JSON.stringify(dadosParaAtualizar)
                });
                if (response.ok) {
                    const popupSucesso = document.getElementById("popupSucessoAtualizar");
                    popupSucesso.classList.remove("hidden");
                    const modalOverlay = document.getElementById("modalOverlay");
                    modalOverlay.classList.remove("open");
                    formAtualizar.reset();
                    carregarMonitorias();
                }
            } catch (error) {
                console.log(error);
            }
        });

        const btnFecharPopupSucesso = document.getElementById("btnFecharPopupSucesso");
        const popupSucessoAtualizar = document.getElementById("popupSucessoAtualizar");
        if (btnFecharPopupSucesso) {
            btnFecharPopupSucesso.addEventListener("click", () => {
                popupSucessoAtualizar.classList.add("hidden");
            });
        }
        popupSucessoAtualizar.addEventListener("click", (e) => {
            if (e.target === popupSucessoAtualizar) {
                popupSucessoAtualizar.classList.add("hidden");
            }
        });

        const modalOverlay = document.getElementById("modalOverlay");
        const btnFecharModal = document.querySelector(".close-btn");

        const fecharModal = () => {
            modalOverlay.classList.remove("open");
        };

        if (btnFecharModal) {
            btnFecharModal.addEventListener("click", fecharModal);
        }

        btnFecharPopup.addEventListener("click", () => {
            popup.classList.add("hidden");
        });

        btnCancelarInscricaoPopup.addEventListener("click", async () => {
            const monitoriaAtiva = popup.dataset.targetButtonId;
            const botao = document.querySelector(`button[data-id="${monitoriaAtiva}"]`);
            const inscricaoId = botao.dataset.inscricaoId;

            try {
                const responseCancelarInscricao = await fetch(`/inscricoes/${inscricaoId}`, {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                    credentials: "same-origin"
                });

                if (!responseCancelarInscricao.ok) {
                    throw new Error("ERRO_AO_CANCELAR");
                }

                botao.textContent = "Inscreva-se";
                botao.classList.remove("btn-inscrito");
                botao.classList.add("btn-inscrever");
                delete botao.dataset.inscricaoId;
                popup.classList.add("hidden");

            } catch (err) {
                alert("Erro ao cancelar inscrição. Tente novamente.");
            }
        });

        const buscarMonitoria = document.getElementById("buscaMonitoria");
        const filtrar = () => {
            const termo = buscarMonitoria.value.toLowerCase();
            document.querySelectorAll(".cardmonitoria").forEach(card => {
                const nomeMonitoria = card.querySelector(".nomemonitoria").textContent.toLowerCase();
                const nomeCurso = card.dataset.curso || "";
                const match = nomeMonitoria.includes(termo) || nomeCurso.includes(termo);
                card.style.display = match ? "" : "none";
            });

            // Esconder containers de curso vazios apos busca
            document.querySelectorAll(".curso-container").forEach(container => {
                const hasVisible = Array.from(container.querySelectorAll(".cardmonitoria"))
                    .some(card => card.style.display !== "none" && !card.classList.contains("tab-hidden"));
                container.style.display = hasVisible ? "" : "none";
            });

            atualizarMensagemVaziaHome();
        };

        buscarMonitoria.addEventListener("input", filtrar);

        destacarMonitoriaDaUrl();

    } catch (err) {
        lista.innerHTML = `<li>Erro ao carregar monitorias: ${err.message}</li>`;
    }
}

const ordenarMonitoriasHome = document.getElementById("ordenarMonitorias");
if (ordenarMonitoriasHome) {
    ordenarMonitoriasHome.addEventListener("change", () => {
        carregarMonitorias();
    });
}

carregarCampusTabs();
carregarMonitorias();

function destacarMonitoriaDaUrl() {
    const params = new URLSearchParams(window.location.search);
    const monitoriaId = params.get("monitoria");
    if (!monitoriaId) return;

    const card = document.querySelector(`.cardmonitoria[data-id="${monitoriaId}"]`);
    if (!card) return;

    // Ativar o tab do campus correto
    const campusNome = card.dataset.campus;
    if (campusNome) {
        const tabBtn = document.querySelector(`.tab-btn[data-campus="${campusNome}"]`);
        if (tabBtn) {
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            tabBtn.classList.add("active");
            posicionarIndicador(tabBtn, false);
            filtrarPorCampus(campusNome);
        }
    }

    // Adicionar destaque visual
    card.classList.add("monitoria-destacada");

    // Scroll suave até o card
    setTimeout(() => {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
}

function mostrarToast(mensagem) {
    let toast = document.getElementById("toastCompartilhar");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastCompartilhar";
        toast.className = "toast-compartilhar";
        document.body.appendChild(toast);
    }

    toast.textContent = mensagem;
    toast.classList.add("toast-visivel");

    setTimeout(() => {
        toast.classList.remove("toast-visivel");
    }, 2500);
}
