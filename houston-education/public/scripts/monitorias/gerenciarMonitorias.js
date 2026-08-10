import { getAlunoId } from "../utils/getAlunoId.js";
import { getPerfil } from "../utils/getPerfil.js";
import { getCookie } from "../utils/getCookie.js";

const lista = document.getElementById("listamonitorias");
let todosLocais = [];
let monitoriaParaExcluir = null;
let timeoutMensagemVazia = null;

const popupExcluirMonitoria = document.getElementById("popupExcluirMonitoria");
const mensagemConfirmarExclusao = document.getElementById("mensagemConfirmarExclusao");
const btnConfirmarExclusao = document.getElementById("btnConfirmarExclusao");
const btnFecharPopupExclusao = document.getElementById("btnFecharPopupExclusao");

function getAuthHeaders() {
    const token = localStorage.getItem("token") || getCookie("token");
    const headers = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
}

async function salvarChamada(monitoriaId, inscricoes) {
    try {
        const response = await fetch(`/inscricoes/monitoria/${monitoriaId}/presenca`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeaders()
            },
            credentials: "same-origin",
            body: JSON.stringify({ inscricoes })
        });

        if (!response.ok) {
            const erro = await response.json();
            throw new Error(erro.error || "ERRO_AO_SALVAR_CHAMADA");
        }

        return await response.json();
    } catch (err) {
        console.error("Erro ao salvar chamada:", err);
        throw err;
    }
}

function mostrarToastSucesso(mensagem) {
    let toast = document.getElementById("toastSucessoChamada");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toastSucessoChamada";
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
    try {
        const response = await fetch("/cursos", {
            headers: getAuthHeaders(),
            credentials: "same-origin",
        });
        const cursos = await response.json();
        const selectCurso = document.getElementById("cursos");
        selectCurso.innerHTML = '<option value="" disabled selected>Selecione o curso...</option>';
        cursos.forEach((curso) => {
            const option = document.createElement("option");
            option.value = curso.id;
            option.textContent = curso.nome;
            selectCurso.appendChild(option);
        });
    } catch (error) {
        console.log(error);
    }
}

async function carregarCampus() {
    try {
        const response = await fetch("/campus", {
            headers: getAuthHeaders(),
            credentials: "same-origin",
        });
        const campusList = await response.json();
        const selectCampus = document.getElementById("campus");
        selectCampus.innerHTML = '<option value="" disabled selected>Selecione o campus...</option>';
        campusList.forEach((campus) => {
            const option = document.createElement("option");
            option.value = campus.id;
            option.textContent = campus.nome;
            selectCampus.appendChild(option);
        });
    } catch (error) {
        console.log(error);
    }
}

async function carregarTodosLocais() {
    try {
        const response = await fetch("/locais", {
            headers: getAuthHeaders(),
            credentials: "same-origin",
        });
        todosLocais = await response.json();
    } catch (error) {
        console.log(error);
    }
}

async function filtrarDisciplinasPorCurso() {
    const cursoId = document.getElementById("cursos").value;
    const selectDisciplina = document.getElementById("disciplinas");
    selectDisciplina.innerHTML = '<option value="" disabled selected>Selecione...</option>';
    if (!cursoId) return;
    try {
        const response = await fetch(`/disciplinas?cursoId=${cursoId}`, {
            headers: getAuthHeaders(),
            credentials: "same-origin",
        });
        const disciplinas = await response.json();
        disciplinas.forEach((disciplina) => {
            const option = document.createElement("option");
            option.value = disciplina.id;
            option.textContent = disciplina.nome;
            selectDisciplina.appendChild(option);
        });
    } catch (error) {
        console.log(error);
    }
}

function filtrarLocaisPorCampus() {
    const campusId = document.getElementById("campus").value;
    const selectLocal = document.getElementById("locais");
    selectLocal.innerHTML = '<option value="" disabled selected>Selecione...</option>';
    if (!campusId) return;
    const locaisFiltrados = todosLocais.filter((l) => l.campusId == campusId);
    locaisFiltrados.forEach((local) => {
        const option = document.createElement("option");
        option.value = local.id;
        option.textContent = local.nome;
        selectLocal.appendChild(option);
    });
}

document.getElementById("cursos")?.addEventListener("change", filtrarDisciplinasPorCurso);
document.getElementById("campus")?.addEventListener("change", filtrarLocaisPorCampus);

async function carregarMonitorias() {
    const perfilUsuario = getPerfil();
    const idUsuario = getAlunoId();

    try {
        let url;
        if (perfilUsuario === "ADMIN") {
            url = "/monitorias";
        } else {
            url = `/monitorias/monitor/${idUsuario}`;
        }

        const response = await fetch(url, {
            headers: getAuthHeaders(),
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("ERRO_AO_CARREGAR");
        }

        const monitorias = (await response.json()).filter((m) => !m.deletedAt);

        if (monitorias.length === 0) {
            lista.innerHTML = "<li>Nenhuma monitoria encontrada!</li>";
            return;
        }

        const ordenacao = document.getElementById("ordenarMonitorias")?.value || "recente";
        monitorias.sort((a, b) => {
            const dataA = new Date(a.inicio).getTime();
            const dataB = new Date(b.inicio).getTime();
            return ordenacao === "recente" ? dataB - dataA : dataA - dataB;
        });

        lista.innerHTML = "";

        monitorias.forEach((m) => {
            const li = document.createElement("li");
            li.classList.add("cardmonitoria");

            const agora = new Date().getTime();
            const dataInicio = new Date(m.inicio).getTime();
            const status = dataInicio >= agora ? "agendada" : "antiga";
            li.dataset.status = status;

            const qtdInscricoes = m._count?.inscricoes || 0;

            const podeEditar = m.monitorId === idUsuario || perfilUsuario === "ADMIN";
            const podeExcluir = podeEditar;

            let acoesHtml = '';
            if (podeEditar || podeExcluir) {
                acoesHtml = `<div class="acoes-card">`;
                if (podeEditar) {
                    acoesHtml += `
                    <button class="btn-editar-card" title="Editar monitoria">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>`;
                }
                if (podeExcluir) {
                    acoesHtml += `
                    <button class="btn-excluir-card" data-id="${m.id}" title="Excluir monitoria">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>`;
                }
                acoesHtml += `</div>`;
            }

            li.innerHTML = `
            ${acoesHtml}
            <div class="informacoesmonitoria">
                <div class="nomemonitoria">${m.nome_monitoria}</div>
                <div class="disciplinamonitoria">${m.disciplina.nome}</div>
                <div class="datamonitoria">
                    ${new Date(m.inicio).toLocaleDateString()} -
                    ${new Date(m.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div class="qtdinscricoes" style="color: #1e3a8a;">${qtdInscricoes} ${qtdInscricoes === 1 ? 'Inscrição' : 'Inscrições'}</div>
            </div>
            `;

            // Ícone de lápis no canto superior direito
            if (podeEditar) {
                const btnEditarCard = li.querySelector(".btn-editar-card");
                if (btnEditarCard) {
                    btnEditarCard.addEventListener("click", (e) => {
                        e.stopPropagation();

                        const formUpdate = document.getElementById("formAtualizarMonitoria");
                        const modalOverlay = document.getElementById("modalOverlay");

                        document.getElementById("id_monitoria_hidden").value = m.id;

                        formUpdate.querySelector('input[name="nome_monitoria"]').value = m.nome_monitoria;
                        formUpdate.querySelector('textarea[name="descricao"]').value = m.descricao;
                        formUpdate.querySelector('textarea[name="ata"]').value = m.ata || '';
                        formUpdate.querySelector('input[name="data"]').value = new Date(m.inicio).toISOString().split("T")[0];
                        formUpdate.querySelector('input[name="hora_inicio"]').value = new Date(m.inicio).toTimeString().slice(0, 5);
                        formUpdate.querySelector('input[name="hora_fim"]').value = new Date(m.fim).toTimeString().slice(0, 5);

                        // bloqueia o campo de ata se a monitoria ainda não começou
                        const ataTextarea = formUpdate.querySelector('textarea[name="ata"]');
                        const agora = new Date();
                        const dataInicioMonitoria = new Date(m.inicio);
                        const ataBloqueada = dataInicioMonitoria > agora;

                        ataTextarea.disabled = ataBloqueada;
                        if (ataBloqueada) {
                            ataTextarea.title = "A ata só pode ser preenchida após o início da monitoria";
                        } else {
                            ataTextarea.title = "";
                        }

                        const selectCampus = document.getElementById("campus");
                        const selectLocal = document.getElementById("locais");
                        const selectCurso = document.getElementById("cursos");
                        const selectDisciplina = document.getElementById("disciplinas");

                        const campusId = m.local?.campusId;
                        const cursoId = m.disciplina?.cursos?.[0]?.curso?.id;

                        if (campusId) {
                            selectCampus.value = campusId;
                            filtrarLocaisPorCampus();
                        }

                        if (cursoId) {
                            selectCurso.value = cursoId;
                            filtrarDisciplinasPorCurso();
                        }

                        selectLocal.value = m.localId;
                        selectDisciplina.value = m.disciplinaId;

                        modalOverlay.classList.add("open");
                    });
                }
            }

            // Ícone de lixeira no canto superior direito (apenas ADMIN)
            if (podeExcluir) {
                const btnExcluirCard = li.querySelector(".btn-excluir-card");
                if (btnExcluirCard) {
                    btnExcluirCard.addEventListener("click", (e) => {
                        e.stopPropagation();

                        monitoriaParaExcluir = m.id;
                        mensagemConfirmarExclusao.textContent = `Deseja realmente excluir a monitoria "${m.nome_monitoria}"?`;
                        popupExcluirMonitoria.classList.remove("hidden");
                    });
                }
            }

            // Popup de info
            const popupInfoMonitoria = document.getElementById("popupInfoMonitoria");
            const popupTitulo = document.getElementById("popupTitulo");
            const popupDisciplina = document.getElementById("popupDisciplina");
            const popupMonitor = document.getElementById("popupMonitor");
            const popupLocal = document.getElementById("popupLocal");
            const popupDataHora = document.getElementById("popupDataHora");
            const popupDescricao = document.getElementById("popupDescricao");

            popupInfoMonitoria.addEventListener("click", (e) => {
                if (e.target === popupInfoMonitoria) popupInfoMonitoria.classList.add("hidden");
            });

            // Botões de ação
            const divBotao = document.createElement("div");
            divBotao.classList.add("divbotao");

            // Botão detalhes - para qualquer monitor ou admin
            if (perfilUsuario === "MONITOR" || perfilUsuario === "ADMIN") {
                const botaoDetalhes = document.createElement("button");
                botaoDetalhes.textContent = "Detalhes";
                botaoDetalhes.classList.add("btn-detalhes");

                botaoDetalhes.addEventListener("click", (e) => {
                    e.stopPropagation();

                    popupTitulo.textContent = m.nome_monitoria;
                    popupDisciplina.textContent = `Disciplina: ${m.disciplina.nome}`;
                    popupMonitor.textContent = `Monitor: ${m.monitor.nome}`;
                    const campusNome = m.local?.campus?.nome;
popupLocal.textContent = `Local: ${m.local?.nome || 'Não informado'}${campusNome ? ' — ' + campusNome : ''}`;
                    popupDataHora.textContent = `Data/Hora: ${new Date(m.inicio).toLocaleDateString()} - ${new Date(m.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    popupDescricao.textContent = `Descrição: ${m.descricao || 'Sem descrição'}`;

                    popupInfoMonitoria.classList.remove("hidden");
                });

                divBotao.appendChild(botaoDetalhes);
            }

            // Botão lista de presença - apenas para o dono ou admin
            if (podeEditar) {
                const botaoListaPresenca = document.createElement("button");
                botaoListaPresenca.textContent = "Lista de presença";
                botaoListaPresenca.classList.add("btn-lista-presenca");

                botaoListaPresenca.addEventListener("click", async (e) => {
                    e.stopPropagation();

                    const popupDetalhes = document.getElementById("popupDetalhesMonitoria");
                    const titulo = document.getElementById("popupDetalhesTitulo");
                    const descricao = document.getElementById("popupDetalhesDescricao");
                    const listaInscritos = document.getElementById("listaInscritos");

                    titulo.textContent = `Chamada — ${m.nome_monitoria}`;
                    descricao.textContent = `Data: ${new Date(m.inicio).toLocaleDateString()} — ${new Date(m.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    listaInscritos.innerHTML = "<li>Carregando inscritos...</li>";
                    popupDetalhes.classList.remove("hidden");

                    // Estado temporário das presenças: Map<inscricaoId, true | false | undefined>
                    const estadoPresenca = new Map();

                    try {
                        const response = await fetch(`/inscricoes/monitoria/${m.id}`, {
                            headers: getAuthHeaders(),
                            credentials: "same-origin"
                        });

                        if (!response.ok) {
                            throw new Error("Erro ao carregar inscritos");
                        }

                        const inscricoes = await response.json();

                        if (inscricoes.length === 0) {
                            listaInscritos.innerHTML = '<li class="sem-inscritos">Nenhum aluno inscrito</li>';
                        } else {
                            listaInscritos.innerHTML = "";
                            inscricoes.forEach((insc) => {
                                const li = document.createElement("li");
                                li.classList.add("item-inscrito");
                                li.dataset.inscricaoId = insc.id;

                                const infoDiv = document.createElement("div");
                                infoDiv.classList.add("info-inscrito");

                                const nomeSpan = document.createElement("span");
                                nomeSpan.classList.add("nome-inscrito");
                                nomeSpan.textContent = insc.aluno.nome;

                                const matriculaSpan = document.createElement("span");
                                matriculaSpan.classList.add("matricula-inscrito");
                                matriculaSpan.textContent = insc.aluno.matricula;

                                const statusSpan = document.createElement("span");
                                statusSpan.classList.add("status-presenca");

                                infoDiv.appendChild(nomeSpan);
                                infoDiv.appendChild(matriculaSpan);
                                infoDiv.appendChild(statusSpan);
                                li.appendChild(infoDiv);

                                const controlesDiv = document.createElement("div");
                                controlesDiv.classList.add("presenca-controles");

                                const btnPresente = document.createElement("button");
                                btnPresente.classList.add("btn-presenca", "btn-presenca-presente");
                                btnPresente.innerHTML = '<i class="ph-fill ph-check-circle"></i>';
                                btnPresente.title = "Presente";

                                const btnAusente = document.createElement("button");
                                btnAusente.classList.add("btn-presenca", "btn-presenca-ausente");
                                btnAusente.innerHTML = '<i class="ph-fill ph-x-circle"></i>';
                                btnAusente.title = "Ausente";

                                function atualizarStatusPresenca() {
                                    if (btnPresente.classList.contains("ativo")) {
                                        statusSpan.textContent = "Presente";
                                        statusSpan.classList.add("presente");
                                        statusSpan.classList.remove("ausente");
                                    } else if (btnAusente.classList.contains("ativo")) {
                                        statusSpan.textContent = "Ausente";
                                        statusSpan.classList.add("ausente");
                                        statusSpan.classList.remove("presente");
                                    } else {
                                        statusSpan.textContent = "";
                                        statusSpan.classList.remove("presente", "ausente");
                                    }
                                }

                                // Estado inicial baseado no banco (null/undefined = nenhum ativo)
                                if (insc.presente === true) {
                                    btnPresente.classList.add("ativo");
                                    estadoPresenca.set(insc.id, true);
                                } else if (insc.presente === false) {
                                    btnAusente.classList.add("ativo");
                                    estadoPresenca.set(insc.id, false);
                                }
                                atualizarStatusPresenca();

                                btnPresente.addEventListener("click", () => {
                                    const jaAtivo = btnPresente.classList.contains("ativo");
                                    if (jaAtivo) {
                                        btnPresente.classList.remove("ativo");
                                        estadoPresenca.delete(insc.id);
                                    } else {
                                        btnPresente.classList.add("ativo");
                                        btnAusente.classList.remove("ativo");
                                        estadoPresenca.set(insc.id, true);
                                    }
                                    atualizarStatusPresenca();
                                });

                                btnAusente.addEventListener("click", () => {
                                    const jaAtivo = btnAusente.classList.contains("ativo");
                                    if (jaAtivo) {
                                        btnAusente.classList.remove("ativo");
                                        estadoPresenca.delete(insc.id);
                                    } else {
                                        btnAusente.classList.add("ativo");
                                        btnPresente.classList.remove("ativo");
                                        estadoPresenca.set(insc.id, false);
                                    }
                                    atualizarStatusPresenca();
                                });

                                controlesDiv.appendChild(btnPresente);
                                controlesDiv.appendChild(btnAusente);
                                li.appendChild(controlesDiv);
                                listaInscritos.appendChild(li);
                            });

                            // Botão Salvar Chamada
                            const btnSalvar = document.createElement("button");
                            btnSalvar.textContent = "Salvar chamada";
                            btnSalvar.classList.add("btn-salvar-chamada");
                            btnSalvar.style.marginTop = "15px";
                            btnSalvar.style.width = "100%";
                            btnSalvar.style.padding = "10px";
                            btnSalvar.style.background = "#1e3a8a";
                            btnSalvar.style.color = "#fff";
                            btnSalvar.style.border = "none";
                            btnSalvar.style.borderRadius = "6px";
                            btnSalvar.style.cursor = "pointer";
                            btnSalvar.style.fontSize = "1em";

                            btnSalvar.addEventListener("click", async () => {
                                const atualizacoes = [];
                                estadoPresenca.forEach((presente, id) => {
                                    atualizacoes.push({ id, presente });
                                });

                                if (atualizacoes.length === 0) {
                                    mostrarAviso("Nenhuma presença foi marcada.");
                                    return;
                                }

                                try {
                                    await salvarChamada(m.id, atualizacoes);
                                    mostrarToastSucesso("Chamada salva com sucesso!");
                                    popupDetalhes.classList.add("hidden");
                                } catch (err) {
                                    if (err.message === "MONITORIA_NAO_OCORREU") {
                                        mostrarAviso("A monitoria ainda não ocorreu. A chamada só pode ser salva após a data da monitoria.");
                                    } else if (err.message === "NAO_AUTORIZADO") {
                                        mostrarAviso("Você não tem permissão para salvar esta chamada.");
                                    } else if (err.message === "MONITORIA_NAO_ENCONTRADA") {
                                        mostrarAviso("Monitoria não encontrada.");
                                    } else {
                                        mostrarAviso("Erro ao salvar chamada. Tente novamente.");
                                    }
                                }
                            });

                            listaInscritos.appendChild(btnSalvar);
                        }
                    } catch (err) {
                        listaInscritos.innerHTML = `<li class="sem-inscritos">Erro: ${err.message}</li>`;
                    }
                });

                divBotao.appendChild(botaoListaPresenca);
            }

            li.appendChild(divBotao);
            lista.appendChild(li);
        });

        // Busca
        const buscarMonitoria = document.getElementById("buscaMonitoria");
        if (buscarMonitoria) {
            const filtrar = () => {
                const termo = buscarMonitoria.value.toLowerCase();
                document.querySelectorAll(".cardmonitoria").forEach(card => {
                    const nomeMonitoria = card.querySelector(".nomemonitoria").textContent.toLowerCase();
                    card.style.display = nomeMonitoria.includes(termo) ? "" : "none";
                });
            };
            buscarMonitoria.addEventListener("input", filtrar);
        }

    } catch (err) {
        lista.innerHTML = `<li>Erro ao carregar monitorias: ${err.message}</li>`;
    }
}

function filtrarPorStatus(status) {
    const cards = document.querySelectorAll(".cardmonitoria");
    let visiveis = 0;

    cards.forEach(card => {
        const cardStatus = card.dataset.status;
        const deveMostrar = status === "todas" || cardStatus === status;
        card.style.display = deveMostrar ? "" : "none";
        if (deveMostrar) visiveis++;
    });

    // Limpa timeout anterior e remove mensagem anterior se existir
    if (timeoutMensagemVazia) {
        clearTimeout(timeoutMensagemVazia);
        timeoutMensagemVazia = null;
    }

    const mensagemAnterior = lista.querySelector(".mensagem-lista-vazia");
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }

    // Exibe mensagem com delay para evitar piscar durante a transicao das abas
    if (cards.length > 0 && visiveis === 0) {
        timeoutMensagemVazia = setTimeout(() => {
            const li = document.createElement("li");
            li.classList.add("mensagem-lista-vazia");
            li.innerHTML = `
                <img src="../assets/img/monitoramento.png" alt="Nenhuma monitoria">
                <span>Nenhuma monitoria marcada</span>
            `;
            lista.appendChild(li);
        }, 300);
    }
}

const tabsStatus = document.getElementById("tabsStatus");
if (tabsStatus) {
    const indicador = document.createElement("span");
    indicador.classList.add("tab-indicator");
    tabsStatus.appendChild(indicador);

    function posicionarIndicadorStatus(tab) {
        if (!indicador || !tab) return;
        indicador.style.transform = `translateX(${tab.offsetLeft}px)`;
        indicador.style.width = `${tab.offsetWidth}px`;
    }

    const tabAtiva = tabsStatus.querySelector(".tab-btn.active");
    if (tabAtiva) {
        posicionarIndicadorStatus(tabAtiva);
    }

    tabsStatus.addEventListener("click", (e) => {
        if (e.target.classList.contains("tab-btn")) {
            tabsStatus.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            posicionarIndicadorStatus(e.target);
            filtrarPorStatus(e.target.dataset.status);
        }
    });
}

// === Listeners globais (fora de carregarMonitorias) ===

function marcarErroHorario() {
    const horaInicio = formAtualizar.querySelector('input[name="hora_inicio"]');
    const horaFim = formAtualizar.querySelector('input[name="hora_fim"]');
    horaInicio.classList.add("erro-horario");
    horaFim.classList.add("erro-horario");
}

function limparErroHorario() {
    const horaInicio = formAtualizar.querySelector('input[name="hora_inicio"]');
    const horaFim = formAtualizar.querySelector('input[name="hora_fim"]');
    horaInicio.classList.remove("erro-horario");
    horaFim.classList.remove("erro-horario");
}

function mostrarErroConflito(mensagem) {
    const erro = document.getElementById("erroConflitoHorario");
    if (erro) {
        erro.textContent = mensagem;
        erro.classList.add("visivel");
    }
}

function limparErroConflito() {
    const erro = document.getElementById("erroConflitoHorario");
    if (erro) {
        erro.textContent = "";
        erro.classList.remove("visivel");
    }
}

// Lógica de atualizar monitoria
const formAtualizar = document.getElementById("formAtualizarMonitoria");
if (formAtualizar) {
    formAtualizar.addEventListener("submit", async (e) => {
        e.preventDefault();
        limparErroHorario();
        limparErroConflito();

        const idMonitoria = document.getElementById("id_monitoria_hidden").value;
        const formData = new FormData(formAtualizar);
        const dadosParaAtualizar = Object.fromEntries(formData);

        delete dadosParaAtualizar.id_monitoria;

        // não envia o campo ata se estiver vazio, para não disparar a validação do backend
        if (dadosParaAtualizar.ata === "") {
            delete dadosParaAtualizar.ata;
        }

        try {
            const response = await fetch(`/monitorias/${idMonitoria}`, {
                method: "PATCH",
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
            } else {
                const dadosErro = await response.json().catch(() => ({}));
                const mensagemErro = dadosErro.error || dadosErro.erro || "";
                if (mensagemErro === "MONITORIA_DE_OUTRO") {
                    mostrarAviso("Você não tem permissão para editar esta monitoria.");
                    return;
                }
                if (mensagemErro.startsWith("ATA_NAO_PERMITIDA")) {
                    mostrarAviso("A monitoria ainda não começou. A ata só pode ser preenchida após o início da monitoria.");
                    return;
                }
                if (mensagemErro.startsWith("HORARIO_INVALIDO")) {
                    marcarErroHorario();
                }
                if (mensagemErro === "CONFLITO_MONITORIA_EXISTENTE") {
                    mostrarErroConflito("Monitoria existente para esse horário");
                    marcarErroHorario();
                }
            }
        } catch (error) {
            console.log(error);
        }
    });

    const horaInicioInput = formAtualizar.querySelector('input[name="hora_inicio"]');
    const horaFimInput = formAtualizar.querySelector('input[name="hora_fim"]');
    if (horaInicioInput) horaInicioInput.addEventListener("input", () => { limparErroHorario(); limparErroConflito(); });
    if (horaFimInput) horaFimInput.addEventListener("input", () => { limparErroHorario(); limparErroConflito(); });
}

// Fechar popup de sucesso
const btnFecharPopupSucesso = document.getElementById("btnFecharPopupSucesso");
const popupSucessoAtualizar = document.getElementById("popupSucessoAtualizar");
if (btnFecharPopupSucesso) {
    btnFecharPopupSucesso.addEventListener("click", () => {
        popupSucessoAtualizar.classList.add("hidden");
    });
}
if (popupSucessoAtualizar) {
    popupSucessoAtualizar.addEventListener("click", (e) => {
        if (e.target === popupSucessoAtualizar) {
            popupSucessoAtualizar.classList.add("hidden");
        }
    });
}

// Fechar modal
const modalOverlay = document.getElementById("modalOverlay");
const btnFecharModal = document.querySelector(".close-btn");

const fecharModal = () => {
    if (modalOverlay) modalOverlay.classList.remove("open");
};

if (btnFecharModal) {
    btnFecharModal.addEventListener("click", fecharModal);
}

// Fechar popup de detalhes
const popupDetalhesMonitoria = document.getElementById("popupDetalhesMonitoria");
const btnFecharDetalhes = document.getElementById("btnFecharDetalhes");
if (btnFecharDetalhes) {
    btnFecharDetalhes.addEventListener("click", () => {
        popupDetalhesMonitoria.classList.add("hidden");
    });
}
if (popupDetalhesMonitoria) {
    popupDetalhesMonitoria.addEventListener("click", (e) => {
        if (e.target === popupDetalhesMonitoria) {
            popupDetalhesMonitoria.classList.add("hidden");
        }
    });
}

// Popup de aviso
function mostrarAviso(mensagem) {
    const popup = document.getElementById("popupAviso");
    const texto = document.getElementById("popupAvisoMensagem");
    if (popup && texto) {
        texto.textContent = mensagem;
        popup.classList.remove("hidden");
    }
}

const btnFecharAviso = document.getElementById("btnFecharAviso");
const popupAviso = document.getElementById("popupAviso");

if (btnFecharAviso) {
    btnFecharAviso.addEventListener("click", () => {
        popupAviso.classList.add("hidden");
    });
}

if (popupAviso) {
    popupAviso.addEventListener("click", (e) => {
        if (e.target === popupAviso) {
            popupAviso.classList.add("hidden");
        }
    });
}

const ordenarMonitorias = document.getElementById("ordenarMonitorias");
if (ordenarMonitorias) {
    ordenarMonitorias.addEventListener("change", () => {
        carregarMonitorias();
    });
}

// Popup de confirmacao de exclusao de monitoria
if (btnFecharPopupExclusao) {
    btnFecharPopupExclusao.addEventListener("click", () => {
        popupExcluirMonitoria.classList.add("hidden");
        monitoriaParaExcluir = null;
    });
}

if (popupExcluirMonitoria) {
    popupExcluirMonitoria.addEventListener("click", (e) => {
        if (e.target === popupExcluirMonitoria) {
            popupExcluirMonitoria.classList.add("hidden");
            monitoriaParaExcluir = null;
        }
    });
}

if (btnConfirmarExclusao) {
    btnConfirmarExclusao.addEventListener("click", async () => {
        if (!monitoriaParaExcluir) return;

        try {
            const response = await fetch(`/monitorias/${monitoriaParaExcluir}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
                credentials: "same-origin"
            });

            if (!response.ok) {
                const erro = await response.json().catch(() => ({}));
                throw new Error(erro.message || "Erro ao excluir monitoria");
            }

            popupExcluirMonitoria.classList.add("hidden");
            monitoriaParaExcluir = null;
            carregarMonitorias();
        } catch (err) {
            alert(err.message);
        }
    });
}

carregarCampus();
carregarCursos();
carregarTodosLocais();
carregarMonitorias();
