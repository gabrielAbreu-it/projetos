// SIS STRATON.AI — protótipo de frontend, dados mockados/localStorage. Sem integração real com backend.

const LEADS = [
  { id: 1, nome: "Marina Costa", empresa: "Ateliê MC", status: "novo", frio: "nao", score: 72 },
  { id: 2, nome: "Rafael Souza", empresa: "Souza Contábil", status: "contato", frio: "nao", score: 65 },
  { id: 3, nome: "Julia Ramos", empresa: "JR Estética", status: "proposta", frio: "nao", score: 81 },
  { id: 4, nome: "Bruno Alves", empresa: "Alves Consultoria", status: "contato", frio: "sim", score: 40 },
  { id: 5, nome: "Carla Nunes", empresa: "Nunes Odonto", status: "fechado", frio: "nao", score: 90 },
  { id: 6, nome: "Diego Farias", empresa: "Farias Imóveis", status: "perdido", frio: "nao", score: 22 },
  { id: 7, nome: "Elaine Prado", empresa: "Prado Fitness", status: "novo", frio: "sim", score: 35 },
];

const STATUS_LABELS = { novo: "Novo", contato: "Contato", proposta: "Proposta", fechado: "Fechado", perdido: "Perdido" };

function loadLeadState() {
  const saved = JSON.parse(localStorage.getItem("sis_leads") || "{}");
  return LEADS.map(l => ({ ...l, ...(saved[l.id] || {}) }));
}

function saveLeadState(id, patch) {
  const saved = JSON.parse(localStorage.getItem("sis_leads") || "{}");
  saved[id] = { ...(saved[id] || {}), ...patch };
  localStorage.setItem("sis_leads", JSON.stringify(saved));
}

function getFollowups(id) {
  const all = JSON.parse(localStorage.getItem("sis_followups") || "{}");
  return all[id] || [];
}

function addFollowup(id, text) {
  const all = JSON.parse(localStorage.getItem("sis_followups") || "{}");
  all[id] = all[id] || [];
  all[id].push({ text, data: new Date().toLocaleString("pt-BR") });
  localStorage.setItem("sis_followups", JSON.stringify(all));
}

let currentLeadId = null;

function renderKanban() {
  const leads = loadLeadState();
  const cols = ["novo", "contato", "proposta", "fechado", "perdido"];
  const kanban = document.getElementById("kanban");
  kanban.innerHTML = cols.map(status => {
    const items = leads.filter(l => l.status === status);
    return `
      <div class="kanban-col">
        <h3>${STATUS_LABELS[status]} (${items.length})</h3>
        ${items.map(l => `
          <div class="lead-card" onclick="openLead(${l.id})">
            <div class="name">${l.nome}</div>
            <div class="meta">${l.empresa} · score ${l.score}</div>
            <span class="badge ${l.frio === 'sim' ? 'frio' : status}">${l.frio === 'sim' ? 'Frio' : STATUS_LABELS[status]}</span>
          </div>
        `).join("")}
      </div>
    `;
  }).join("");
}

function openLead(id) {
  currentLeadId = id;
  const leads = loadLeadState();
  const lead = leads.find(l => l.id === id);
  document.getElementById("detail-panel").style.display = "block";
  document.getElementById("detail-name").textContent = lead.nome;
  document.getElementById("detail-meta").textContent = `${lead.empresa} · score ${lead.score}`;
  document.getElementById("detail-status").value = lead.status;
  document.getElementById("detail-frio").value = lead.frio;
  renderFollowups(id);
}

function renderFollowups(id) {
  const list = getFollowups(id);
  const el = document.getElementById("followup-list");
  el.innerHTML = list.length
    ? list.map(f => `<li style="margin-bottom:0.5rem;">— ${f.text} <span style="opacity:0.6;">(${f.data})</span></li>`).join("")
    : "<li>Nenhum follow-up registrado ainda.</li>";
}

document.addEventListener("DOMContentLoaded", () => {
  const saveFollowupBtn = document.getElementById("save-followup");
  if (saveFollowupBtn) {
    saveFollowupBtn.addEventListener("click", () => {
      const text = document.getElementById("followup-text").value.trim();
      const error = document.getElementById("followup-error");
      if (!text) {
        error.style.display = "block";
        return;
      }
      error.style.display = "none";
      addFollowup(currentLeadId, text);
      document.getElementById("followup-text").value = "";
      renderFollowups(currentLeadId);
    });
  }

  const saveStatusBtn = document.getElementById("save-status");
  if (saveStatusBtn) {
    saveStatusBtn.addEventListener("click", () => {
      const status = document.getElementById("detail-status").value;
      const frio = document.getElementById("detail-frio").value;
      saveLeadState(currentLeadId, { status, frio });
      if (frio === "sim") {
        const all = JSON.parse(localStorage.getItem("sis_followups") || "{}");
        delete all[currentLeadId];
        localStorage.setItem("sis_followups", JSON.stringify(all));
      }
      renderKanban();
      openLead(currentLeadId);
    });
  }
});

// ----- Agenda -----

const AGENDAMENTOS = [
  { id: 1, data: "15/08 10:00", lead: "Marina Costa", tipo: "Diagnóstico", status: "confirmado" },
  { id: 2, data: "15/08 14:30", lead: "Rafael Souza", tipo: "Proposta", status: "confirmado" },
  { id: 3, data: "16/08 09:00", lead: "Julia Ramos", tipo: "Onboarding", status: "confirmado" },
  { id: 4, data: "17/08 11:00", lead: "Bruno Alves", tipo: "Follow-up", status: "confirmado" },
];

function loadAgendaState() {
  const saved = JSON.parse(localStorage.getItem("sis_agenda") || "{}");
  return AGENDAMENTOS.map(a => ({ ...a, ...(saved[a.id] || {}) }));
}

function renderAgenda() {
  const items = loadAgendaState();
  const tbody = document.getElementById("agenda-body");
  tbody.innerHTML = items.map(a => `
    <tr>
      <td>${a.data}</td>
      <td>${a.lead}</td>
      <td>${a.tipo}</td>
      <td><span class="badge ${a.status === 'cancelado' ? 'perdido' : 'fechado'}">${a.status === 'cancelado' ? 'Cancelado' : 'Confirmado'}</span></td>
      <td>
        ${a.status === 'cancelado'
          ? '—'
          : `<button class="btn danger small" onclick="askCancel(${a.id})">Cancelar</button>`}
      </td>
    </tr>
  `).join("");
}

let agendaToCancel = null;

function askCancel(id) {
  agendaToCancel = id;
  const saved = JSON.parse(localStorage.getItem("sis_agenda") || "{}");
  saved[id] = { ...(saved[id] || {}), status: "cancelado" };
  localStorage.setItem("sis_agenda", JSON.stringify(saved));
  renderAgenda();
  document.getElementById("cancel-modal").classList.add("open");
}

function closeCancelModal() {
  document.getElementById("cancel-modal").classList.remove("open");
  agendaToCancel = null;
}

function confirmCancel() {
  const saved = JSON.parse(localStorage.getItem("sis_agenda") || "{}");
  saved[agendaToCancel] = { ...(saved[agendaToCancel] || {}), status: "cancelado" };
  localStorage.setItem("sis_agenda", JSON.stringify(saved));
  closeCancelModal();
  renderAgenda();
}

// ----- Financeiro -----

function loadDespesas() {
  return JSON.parse(localStorage.getItem("sis_despesas") || "[]");
}

function saveDespesas(list) {
  localStorage.setItem("sis_despesas", JSON.stringify(list));
}

function renderFinanceiro() {
  const despesas = loadDespesas();
  const tbody = document.getElementById("despesas-body");
  tbody.innerHTML = despesas.map((d, i) => `
    <tr>
      <td>${d.produto}</td>
      <td>R$ ${Number(d.valor).toFixed(2)}</td>
      <td><button class="btn secondary small" onclick="removerDespesa(${i})">Remover</button></td>
    </tr>
  `).join("") || `<tr><td colspan="3" style="color:var(--text-dim);">Nenhum gasto fixo cadastrado ainda.</td></tr>`;

  const total = despesas.reduce((sum, d) => sum + Number(d.valor), 0);
  document.getElementById("total-despesas").textContent = `R$ ${total.toFixed(2)}`;
}

function removerDespesa(index) {
  const despesas = loadDespesas();
  despesas.splice(index, 1);
  saveDespesas(despesas);
  renderFinanceiro();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("despesa-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const produto = document.getElementById("produto").value.trim();
      const valor = document.getElementById("valor").value;
      const error = document.getElementById("despesa-error");

      if (!produto || !valor || Number(valor) < 0) {
        error.style.display = "block";
        return;
      }
      error.style.display = "none";

      const despesas = loadDespesas();
      despesas.push({ produto, valor });
      saveDespesas(despesas);
      form.reset();
      renderFinanceiro();
    });
    renderFinanceiro();
  }

  const agendaBody = document.getElementById("agenda-body");
  if (agendaBody) renderAgenda();
});

// ----- Projetos -----

function loadProjetos() {
  const saved = localStorage.getItem("sis_projetos");
  if (saved) return JSON.parse(saved);
  return [
    { id: 1, nome: "Automação de atendimento — Ateliê MC", progresso: 40, sprints: ["Sprint 1: mapeamento de fluxo"] },
    { id: 2, nome: "Sistema interno — Souza Contábil", progresso: 15, sprints: [] },
  ];
}

function saveProjetos(list) {
  localStorage.setItem("sis_projetos", JSON.stringify(list));
}

function renderProjetos() {
  const projetos = loadProjetos();
  const el = document.getElementById("projetos-list");
  el.innerHTML = projetos.map(p => `
    <div class="panel">
      <h2>${p.nome}</h2>
      <div class="progress-bar" style="margin:0.8rem 0;"><div class="fill" style="width:${p.progresso}%;"></div></div>
      <p style="color:var(--text-dim); font-size:0.85rem;">${p.progresso}% concluído</p>
      <h3 style="margin-top:1rem; font-size:0.9rem;">Dailys / Sprints</h3>
      <ul style="margin-top:0.5rem; font-size:0.85rem; color:var(--text-dim); list-style:none;">
        ${p.sprints.map(s => `<li>— ${s}</li>`).join("") || "<li>Nenhuma daily registrada ainda.</li>"}
      </ul>
      <div style="margin-top:0.8rem; display:flex; gap:0.6rem;">
        <input type="text" placeholder="Nova daily/sprint" id="daily-${p.id}" style="flex:1;">
        <button class="btn small" onclick="addDaily(${p.id})">Adicionar</button>
      </div>
    </div>
  `).join("");
}

function addDaily(id) {
  const input = document.getElementById(`daily-${id}`);
  const text = input.value.trim();
  if (!text) return;
  const projetos = loadProjetos();
  const projeto = projetos.find(p => p.id === id);
  projeto.sprints.push(text);
  saveProjetos(projetos);
  renderProjetos();
}

document.addEventListener("DOMContentLoaded", () => {
  const novoForm = document.getElementById("novo-projeto-form");
  if (novoForm) {
    novoForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const nome = document.getElementById("novo-projeto-nome").value.trim();
      const projetos = loadProjetos();
      projetos.push({ id: Date.now(), nome, progresso: 0, sprints: [] });
      saveProjetos(projetos);
      novoForm.reset();
      renderProjetos();
    });
  }
  const projetosList = document.getElementById("projetos-list");
  if (projetosList) renderProjetos();
});
