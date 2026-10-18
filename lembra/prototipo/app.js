/* Lembra — protótipo navegável (roteamento por hash, estado em memória) */
(function () {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const view = $("#view");
  const nav = $("#nav");
  const toasts = $("#toasts");
  const modal = $("#modal");

  /* ---------- Estado ---------- */
  const S = {
    remedios: clone(LB.remedios),
    doses: clone(LB.doses),
    cad: novoCadastro(),
    lembreteEnviado: false,
    destaque: null
  };

  function novoCadastro() {
    return { nome: "", forma: "comprimido", qtd: 1, horarios: [] };
  }

  const PREFS_KEY = "lembra-prefs";
  const prefs = Object.assign(
    { fonte: "g", contraste: false, som: true, repetir: true, avisar: true },
    lerPrefs()
  );
  function lerPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }
  function salvarPrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      /* sem armazenamento: segue só na memória */
    }
  }
  function aplicarPrefs() {
    const px = { g: 20, m: 24, mg: 28 }[prefs.fonte] || 20;
    document.documentElement.style.fontSize = px + "px";
    if (prefs.contraste) document.documentElement.setAttribute("data-contraste", "max");
    else document.documentElement.removeAttribute("data-contraste");
  }
  aplicarPrefs();

  /* ---------- Hora e textos ---------- */
  const min = (h) => {
    const [a, b] = h.split(":").map(Number);
    return a * 60 + b;
  };
  const hhmm = (m) => String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
  const AGORA = min(LB.agora);

  const FORMAS = {
    comprimido: { um: "comprimido", varios: "comprimidos", rotulo: "Comprimido", icone: "pill" },
    capsula: { um: "cápsula", varios: "cápsulas", rotulo: "Cápsula", icone: "pill" },
    gotas: { um: "gota", varios: "gotas", rotulo: "Gotas", icone: "droplet" }
  };
  const unidade = (forma, n) => (n === 1 ? FORMAS[forma].um : FORMAS[forma].varios);
  const doseTexto = (r) => r.qtd + " " + unidade(r.forma, r.qtd);
  const rem = (id) => S.remedios.find((r) => r.id === id);
  const dose = (id) => S.doses.find((d) => d.id === id);
  const artigo = (r) => (/^(vitamina)/i.test(r.nome) ? "a " : "o ");

  function duracao(m) {
    if (m < 60) return m + " minutos";
    const h = Math.floor(m / 60);
    const r = m % 60;
    return (h === 1 ? "1 hora" : h + " horas") + (r ? " e " + r + " minutos" : "");
  }

  function estado(d) {
    if (d.estado === "tomado") return "tomado";
    if (d.estado === "pulado") return "pulado";
    const alvo = d.adiadoPara ? min(d.adiadoPara) : min(d.hora);
    if (!d.adiadoPara && AGORA - min(d.hora) > 30) return "atrasado";
    if (alvo <= AGORA + 30) return "agora";
    return "depois";
  }

  const ordenadas = () => S.doses.slice().sort((a, b) => min(a.hora) - min(b.hora));
  const atrasadas = () => ordenadas().filter((d) => estado(d) === "atrasado");
  const proximaDepois = () => ordenadas().find((d) => estado(d) === "depois");

  function selo(d) {
    const st = estado(d);
    const prox = proximaDepois();
    const map = {
      tomado: ["ok", "circle-check", "Tomado às " + (d.tomadoAs || d.hora)],
      atrasado: ["late", "triangle-alert", "Atrasado · era " + d.hora],
      agora: ["now", "bell-ring", d.adiadoPara ? "Adiado para " + d.adiadoPara : "Hora de tomar"],
      depois: prox && prox.id === d.id ? ["next", "clock", "Próximo"] : ["later", "clock", "Mais tarde"],
      pulado: ["skip", "circle-minus", "Não tomado, você pulou"]
    };
    const [cls, ic, txt] = map[st];
    return `<span class="badge badge--${cls}"><i data-lucide="${ic}" aria-hidden="true"></i>${esc(txt)}</span>`;
  }

  /* Desenho da caixa do remédio (fictícia), para reconhecer pela cor e forma */
  function caixa(r, cls = "") {
    const c = r.caixa || { fundo: "#ffffff", faixa: "#1f3c88", nomeCor: "branca" };
    let pilula = "";
    if (r.forma === "comprimido") {
      pilula = `<circle cx="112" cy="66" r="16" fill="#fff" stroke="#1a2238" stroke-width="3"/><line x1="100" y1="66" x2="124" y2="66" stroke="#1a2238" stroke-width="3" stroke-linecap="round"/>`;
    } else if (r.forma === "capsula") {
      pilula = `<g transform="rotate(-35 112 66)"><rect x="90" y="56" width="44" height="20" rx="10" fill="#fff" stroke="#1a2238" stroke-width="3"/><path d="M112 56h12a10 10 0 0 1 0 20h-12z" fill="${c.faixa}" stroke="#1a2238" stroke-width="3"/></g>`;
    } else {
      pilula = `<path d="M112 44c9 12 15 20 15 27a15 15 0 0 1-30 0c0-7 6-15 15-27z" fill="#9cc3ff" stroke="#1a2238" stroke-width="3" stroke-linejoin="round"/>`;
    }
    return `<svg class="box-art ${cls}" viewBox="0 0 160 112" role="img" aria-label="Desenho da caixa ${esc(c.nomeCor)}, ${esc(FORMAS[r.forma].um)}">
      <path d="M14 30 L30 14 H150 L134 30 Z" fill="${c.fundo}" stroke="#1a2238" stroke-width="3" stroke-linejoin="round"/>
      <path d="M134 30 L150 14 V88 L134 104 Z" fill="${c.faixa}" stroke="#1a2238" stroke-width="3" stroke-linejoin="round" opacity=".85"/>
      <rect x="14" y="30" width="120" height="74" rx="4" fill="${c.fundo}" stroke="#1a2238" stroke-width="3"/>
      <rect x="15.5" y="84" width="117" height="12" fill="${c.faixa}"/>
      <rect x="26" y="44" width="52" height="8" rx="4" fill="#1a2238" opacity=".75"/>
      <rect x="26" y="60" width="36" height="6" rx="3" fill="#1a2238" opacity=".35"/>
      ${pilula}
    </svg>`;
  }

  /* ---------- Componentes de interface ---------- */
  function toast(msg, tipo = "ok") {
    const el = document.createElement("div");
    el.className = "toast toast--" + tipo;
    toasts.innerHTML = ""; /* um aviso por vez, para não cobrir a tela */
    el.innerHTML = `<i data-lucide="${tipo === "ok" ? "circle-check" : tipo === "late" ? "triangle-alert" : "info"}" aria-hidden="true"></i><span>${msg}</span>`;
    toasts.appendChild(el);
    icons();
    clearTimeout(toast.t);
    toast.t = setTimeout(() => {
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 300);
    }, 5200);
  }

  function confirmar({ titulo, texto, ok, cancelar = "Voltar", perigo = false }) {
    return new Promise((resolve) => {
      const voltaFoco = document.activeElement;
      modal.innerHTML = `
        <h2 id="modal-title">${titulo}</h2>
        <p id="modal-text">${texto}</p>
        <div class="modal__actions">
          <button type="button" class="btn ${perigo ? "btn--danger" : "btn--primary"}" data-modal="ok">${ok}</button>
          <button type="button" class="btn btn--secondary" data-modal="cancel">${cancelar}</button>
        </div>`;
      const fechar = (v) => {
        modal.close();
        resolve(v);
        if (voltaFoco && document.contains(voltaFoco)) voltaFoco.focus();
      };
      modal.querySelector('[data-modal="ok"]').onclick = () => fechar(true);
      modal.querySelector('[data-modal="cancel"]').onclick = () => fechar(false);
      modal.oncancel = (e) => {
        e.preventDefault();
        fechar(false);
      };
      modal.showModal();
      modal.querySelector('[data-modal="cancel"]').focus();
    });
  }

  function icons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function tabbar(atual) {
    const itens = [
      ["agora", "bell-ring", "Agora"],
      ["dia", "list-checks", "Meu dia"],
      ["remedios", "pill-bottle", "Remédios"],
      ["ajustes", "a-large-small", "Ajustes"]
    ];
    return itens
      .map(
        ([r, ic, t]) =>
          `<a href="#${r}" class="tab" ${r === atual ? 'aria-current="page"' : ""}><i data-lucide="${ic}" aria-hidden="true"></i><span>${t}</span></a>`
      )
      .join("");
  }

  function topo(titulo, voltar, extra = "") {
    const cab = voltar || extra
      ? `<header class="top">${voltar ? `<a class="btn-back" href="${voltar}"><i data-lucide="arrow-left" aria-hidden="true"></i>Voltar</a>` : ""}${extra}</header>`
      : "";
    return `${cab}<h1 tabindex="-1">${titulo}</h1>`;
  }

  /* ---------- Telas ---------- */
  const TELAS = {};

  // 1. Agora
  TELAS.agora = () => {
    const pend = atrasadas();
    const d = ordenadas().find((x) => estado(x) === "agora") || proximaDepois();
    const hora = Math.floor(AGORA / 60);
    const saud = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
    let alerta = "";
    if (pend.length) {
      const p = pend[0];
      const r = rem(p.rem);
      alerta = `<a class="alert alert--late" href="#esquecida/${p.id}">
        <i data-lucide="triangle-alert" aria-hidden="true"></i>
        <span><strong>Falta marcar ${pend.length === 1 ? "1 remédio" : pend.length + " remédios"}</strong>
        <span>${esc(r.nome)}, das ${p.hora}</span></span>
        <span class="alert__go">Ver<i data-lucide="chevron-right" aria-hidden="true"></i></span>
      </a>`;
    }

    if (!d) {
      return `<section class="screen">
        <p class="date">${LB.dataTexto}</p>
        <h1 tabindex="-1">${saud}, ${LB.pessoa.nome}</h1>
        ${alerta}
        <div class="empty">
          <span class="empty__icon" aria-hidden="true"><i data-lucide="circle-check"></i></span>
          <h2>Tudo certo por hoje</h2>
          <p>Não falta nenhum remédio. O próximo lembrete é amanhã de manhã.</p>
        </div>
        <a class="btn btn--secondary" href="#dia"><i data-lucide="list-checks" aria-hidden="true"></i>Ver meu dia</a>
      </section>`;
    }

    const r = rem(d.rem);
    const st = estado(d);
    const juntos = ordenadas().filter((x) => x.id !== d.id && x.hora === d.hora && estado(x) !== "tomado");
    const depois = ordenadas().filter((x) => estado(x) === "depois" && x.hora !== d.hora);
    const quando =
      st === "agora"
        ? d.adiadoPara
          ? `<i data-lucide="clock" aria-hidden="true"></i>Adiado para ${d.adiadoPara}`
          : `<i data-lucide="bell-ring" aria-hidden="true"></i>Agora · ${d.hora}`
        : `<i data-lucide="clock" aria-hidden="true"></i>Próximo · às ${d.hora}`;

    return `<section class="screen screen--agora">
      <p class="date">${LB.dataTexto}</p>
      <h1 tabindex="-1">${saud}, ${LB.pessoa.nome}</h1>
      ${alerta}
      <article class="dose-card ${st === "agora" ? "dose-card--now" : ""}" aria-labelledby="dose-nome">
        <p class="dose-card__when">${quando}</p>
        ${caixa(r)}
        <h2 id="dose-nome" class="dose-card__name">${esc(r.nome)}</h2>
        <p class="dose-card__dose">${doseTexto(r)}</p>
        ${r.nota ? `<p class="dose-card__note">${esc(r.nota)}</p>` : ""}
      </article>
      ${
        st === "agora"
          ? `<div class="actions">
          <button type="button" class="btn btn--primary btn--xl" data-action="tomei" data-id="${d.id}"><i data-lucide="check" aria-hidden="true"></i>Tomei</button>
          <button type="button" class="btn btn--secondary" data-action="adiar" data-id="${d.id}"><i data-lucide="clock" aria-hidden="true"></i>${d.adiadoPara ? "Adiar mais 15 minutos" : "Adiar 15 minutos"}</button>
        </div>`
          : `<p class="hint">Ainda não é hora. Eu aviso com som e vibração às ${d.hora}.</p>`
      }
      ${
        juntos.length
          ? `<p class="later"><i data-lucide="info" aria-hidden="true"></i>No mesmo horário: ${juntos.map((x) => esc(rem(x.rem).nome)).join(", ")}.</p>`
          : ""
      }
      ${
        depois.length && st === "agora"
          ? `<p class="later"><i data-lucide="clock" aria-hidden="true"></i>Depois: ${depois[0].hora}, ${esc(rem(depois[0].rem).nome)}${depois.filter((x) => x.hora === depois[0].hora).length > 1 ? " e mais " + (depois.filter((x) => x.hora === depois[0].hora).length - 1) : ""}.</p>`
          : ""
      }
      <p class="fineprint">Protótipo com dados fictícios. Não é orientação médica.</p>
    </section>`;
  };

  // 2. Confirmação "Tomei"
  TELAS.tomei = (id) => {
    const d = dose(id) || dose("d3");
    if (d.estado !== "tomado") marcarTomado(d, LB.agora, true);
    const r = rem(d.rem);
    return `<section class="screen screen--center">
      <span class="done-mark" aria-hidden="true"><i data-lucide="check"></i></span>
      <h1 tabindex="-1">Pronto! Você tomou ${artigo(r)}${esc(r.nome)}.</h1>
      <p class="lead">Marquei às ${d.tomadoAs}. A ${LB.cuidador.nome} vai ver no celular dela que está tudo certo.</p>
      <div class="receipt">
        ${caixa(r, "box-art--sm")}
        <div><strong>${esc(r.nome)}</strong><span>${doseTexto(r)} · ${d.hora}</span></div>
      </div>
      <div class="actions">
        <a class="btn btn--primary btn--xl" href="#agora"><i data-lucide="house" aria-hidden="true"></i>Voltar ao início</a>
        <button type="button" class="btn btn--secondary" data-action="desfazer" data-id="${d.id}"><i data-lucide="undo-2" aria-hidden="true"></i>Marquei sem querer, desfazer</button>
      </div>
    </section>`;
  };

  // 3. Meu dia
  TELAS.dia = () => {
    const grupos = [
      ["Manhã", "sunrise", (m) => m < 720],
      ["Tarde", "sun", (m) => m >= 720 && m < 1080],
      ["Noite", "moon", (m) => m >= 1080]
    ];
    const lista = ordenadas();
    const feitos = lista.filter((d) => d.estado === "tomado").length;
    const blocos = grupos
      .map(([nome, ic, f]) => {
        const ds = lista.filter((d) => f(min(d.hora)));
        if (!ds.length) return "";
        return `<section class="period" aria-labelledby="p-${nome}">
          <h2 id="p-${nome}" class="period__title"><i data-lucide="${ic}" aria-hidden="true"></i>${nome}</h2>
          <ul class="doses">${ds.map(itemDose).join("")}</ul>
        </section>`;
      })
      .join("");
    return `<section class="screen">
      ${topo("Meu dia")}
      <p class="date date--sub">${LB.dataTexto}</p>
      <div class="progress" role="img" aria-label="${feitos} de ${lista.length} remédios marcados hoje">
        <div class="progress__bar"><span style="width:${(feitos / lista.length) * 100}%"></span></div>
        <p><strong>${feitos} de ${lista.length}</strong> remédios marcados hoje</p>
      </div>
      ${blocos}
    </section>`;
  };

  function itemDose(d) {
    const r = rem(d.rem);
    const st = estado(d);
    let acao = "";
    if (st === "atrasado") acao = `<a class="btn btn--danger btn--sm" href="#esquecida/${d.id}">Resolver</a>`;
    else if (st === "agora") acao = `<a class="btn btn--primary btn--sm" href="#agora">Tomar agora</a>`;
    else if (st === "tomado") acao = `<button type="button" class="btn btn--quiet btn--sm" data-action="desmarcar" data-id="${d.id}"><i data-lucide="undo-2" aria-hidden="true"></i>Desmarcar</button>`;
    return `<li class="dose dose--${st}">
      <span class="dose__time">${d.hora}</span>
      <div class="dose__body">
        <strong>${esc(r.nome)}</strong>
        <span>${doseTexto(r)}</span>
        ${selo(d)}
        ${acao ? `<div class="dose__act">${acao}</div>` : ""}
      </div>
    </li>`;
  }

  // 4. Dose esquecida
  TELAS.esquecida = (id) => {
    const d = dose(id) || atrasadas()[0];
    if (!d || estado(d) !== "atrasado") {
      return `<section class="screen">
        ${topo("Nada esquecido", "#agora")}
        <div class="empty">
          <span class="empty__icon" aria-hidden="true"><i data-lucide="circle-check"></i></span>
          <p>Todos os remédios até agora foram marcados. Pode ficar tranquila.</p>
        </div>
        <a class="btn btn--primary btn--xl" href="#agora">Voltar ao início</a>
      </section>`;
    }
    const r = rem(d.rem);
    const atraso = AGORA - min(d.hora);
    return `<section class="screen">
      <header class="top"><a class="btn-back" href="#agora"><i data-lucide="arrow-left" aria-hidden="true"></i>Voltar</a></header>
      <span class="warn-mark" aria-hidden="true"><i data-lucide="triangle-alert"></i></span>
      <h1 tabindex="-1">Você ainda não marcou o remédio das ${d.hora}</h1>
      <div class="receipt receipt--late">
        ${caixa(r, "box-art--sm")}
        <div><strong>${esc(r.nome)}</strong><span>${doseTexto(r)} · era às ${d.hora}, há ${duracao(atraso)}</span></div>
      </div>
      <h2 class="question">O que aconteceu?</h2>
      <div class="actions">
        <button type="button" class="btn btn--primary" data-action="esq-agora" data-id="${d.id}"><i data-lucide="check" aria-hidden="true"></i>Vou tomar agora</button>
        <button type="button" class="btn btn--secondary" data-action="esq-ja" data-id="${d.id}"><i data-lucide="calendar-check" aria-hidden="true"></i>Já tinha tomado, só não marquei</button>
        <button type="button" class="btn btn--quiet" data-action="esq-pular" data-id="${d.id}"><i data-lucide="circle-minus" aria-hidden="true"></i>Não vou tomar esta dose</button>
      </div>
      <aside class="note">
        <i data-lucide="info" aria-hidden="true"></i>
        <p><strong>Na dúvida, não tome dose dobrada.</strong> Pergunte ao seu médico ou farmacêutico o que fazer quando esquecer este remédio.</p>
      </aside>
      <button type="button" class="btn btn--secondary" data-action="ligar" data-quem="${LB.cuidador.nome}"><i data-lucide="phone" aria-hidden="true"></i>Ligar para a ${LB.cuidador.nome}</button>
    </section>`;
  };

  // 5. Remédios e estoque
  TELAS.remedios = () => {
    const baixo = S.remedios.filter((r) => r.estoque != null && r.estoque <= 5);
    const alertas = baixo
      .map(
        (r) => `<article class="stock-alert" aria-labelledby="sa-${r.id}">
        <p class="stock-alert__tag"><i data-lucide="package" aria-hidden="true"></i>Está acabando</p>
        <h2 id="sa-${r.id}">${esc(r.nome)}</h2>
        <p class="stock-alert__count">Restam <strong>${r.estoque} ${unidade(r.forma, r.estoque)}</strong>. ${diasRestantes(r)}</p>
        <div class="actions">
          <button type="button" class="btn btn--primary" data-action="avisar-compra" data-id="${r.id}"><i data-lucide="send" aria-hidden="true"></i>Pedir para a ${LB.cuidador.nome} comprar</button>
          <button type="button" class="btn btn--secondary" data-action="comprei" data-id="${r.id}"><i data-lucide="plus" aria-hidden="true"></i>Já comprei mais</button>
        </div>
      </article>`
      )
      .join("");
    const lista = S.remedios
      .map(
        (r) => `<li class="med ${S.destaque === r.id ? "med--new" : ""}">
        ${caixa(r, "box-art--sm")}
        <div class="med__body">
          <strong>${esc(r.nome)}</strong>
          <span>${doseTexto(r)} · ${r.horarios.join(" e ")}</span>
          ${
            r.estoque != null
              ? `<span class="med__stock ${r.estoque <= 5 ? "med__stock--low" : ""}"><i data-lucide="${r.estoque <= 5 ? "triangle-alert" : "package"}" aria-hidden="true"></i>Restam ${r.estoque} ${unidade(r.forma, r.estoque)}</span>`
              : `<span class="med__stock"><i data-lucide="package" aria-hidden="true"></i>Estoque não informado</span>`
          }
        </div>
      </li>`
      )
      .join("");
    S.destaque = null;
    return `<section class="screen">
      ${topo("Meus remédios")}
      ${alertas}
      <h2 class="section-title">Todos (${S.remedios.length})</h2>
      <ul class="meds">${lista}</ul>
      <a class="btn btn--primary" href="#cadastro" data-action="novo"><i data-lucide="plus" aria-hidden="true"></i>Adicionar remédio</a>
    </section>`;
  };

  function diasRestantes(r) {
    const porDia = r.horarios.length * r.qtd;
    if (!porDia) return "";
    const dias = Math.floor(r.estoque / porDia);
    const semana = ["sexta", "sábado", "domingo", "segunda", "terça", "quarta", "quinta"];
    if (dias <= 0) return "Acaba hoje.";
    if (dias >= 7) return "Dá para mais de uma semana.";
    return "Dá até " + semana[dias - 1] + ".";
  }

  // 6. Cadastro em passos
  TELAS.cadastro = (passo) => {
    passo = passo || "1";
    const c = S.cad;
    const num = passo === "revisar" ? 4 : Number(passo);
    const cab = `<header class="top">
        <a class="btn-back" href="${num === 1 ? "#remedios" : num === 4 ? "#cadastro/3" : "#cadastro/" + (num - 1)}"><i data-lucide="arrow-left" aria-hidden="true"></i>Voltar</a>
        <span class="steps">${num <= 3 ? "Passo " + num + " de 3" : "Revisar"}</span>
      </header>
      <div class="stepbar" aria-hidden="true">${[1, 2, 3].map((i) => `<span class="${i <= num ? "is-on" : ""}"></span>`).join("")}</div>`;

    if (passo === "1") {
      return `<form class="screen" data-form="c1" novalidate>
        ${cab}
        <h1 tabindex="-1">Qual é o nome do remédio?</h1>
        <div class="field">
          <label for="nome">Nome do remédio</label>
          <p class="field__hint" id="nome-dica">Pode ser do jeito que você chama. Por exemplo: remédio da pressão.</p>
          <input id="nome" name="nome" type="text" autocomplete="off" value="${esc(c.nome)}" aria-describedby="nome-dica nome-erro" />
          <p class="field__error" id="nome-erro" hidden></p>
        </div>
        <div class="push"></div>
        <button class="btn btn--primary btn--xl" type="submit">Continuar<i data-lucide="chevron-right" aria-hidden="true"></i></button>
      </form>`;
    }
    if (passo === "2") {
      return `<form class="screen" data-form="c2" novalidate>
        ${cab}
        <h1 tabindex="-1">Quanto você toma de cada vez?</h1>
        <fieldset class="choices">
          <legend>Como ele é?</legend>
          ${Object.keys(FORMAS)
            .map(
              (f) => `<label class="choice"><input type="radio" name="forma" value="${f}" ${c.forma === f ? "checked" : ""} />
              <span><i data-lucide="${FORMAS[f].icone}" aria-hidden="true"></i>${FORMAS[f].rotulo}</span></label>`
            )
            .join("")}
        </fieldset>
        <div class="field">
          <span class="field__label" id="qtd-rot">Quantidade</span>
          <div class="stepper" role="group" aria-labelledby="qtd-rot">
            <button type="button" class="stepper__btn" data-action="qtd" data-delta="-1" aria-label="Diminuir" ${c.qtd <= 1 ? "disabled" : ""}><i data-lucide="minus" aria-hidden="true"></i></button>
            <output class="stepper__val" id="qtd" aria-live="polite">${c.qtd} ${unidade(c.forma, c.qtd)}</output>
            <button type="button" class="stepper__btn" data-action="qtd" data-delta="1" aria-label="Aumentar" ${c.qtd >= 40 ? "disabled" : ""}><i data-lucide="plus" aria-hidden="true"></i></button>
          </div>
        </div>
        <div class="push"></div>
        <button class="btn btn--primary btn--xl" type="submit">Continuar<i data-lucide="chevron-right" aria-hidden="true"></i></button>
      </form>`;
    }
    if (passo === "3") {
      const extras = c.horarios.filter((h) => !LB.periodos.some((p) => p.hora === h));
      return `<form class="screen" data-form="c3" novalidate>
        ${cab}
        <h1 tabindex="-1">Em quais horários?</h1>
        <fieldset class="choices choices--grid" aria-describedby="hor-erro">
          <legend>Toque em um ou mais horários</legend>
          ${LB.periodos
            .map(
              (p) => `<label class="choice choice--time"><input type="checkbox" name="hora" value="${p.hora}" ${c.horarios.includes(p.hora) ? "checked" : ""} />
              <span><i data-lucide="${p.icone}" aria-hidden="true"></i>${p.rotulo}<small>${p.hora}</small></span></label>`
            )
            .join("")}
          ${extras
            .map(
              (h) => `<label class="choice choice--time"><input type="checkbox" name="hora" value="${h}" checked />
              <span><i data-lucide="clock" aria-hidden="true"></i>Outro<small>${h}</small></span></label>`
            )
            .join("")}
        </fieldset>
        <div class="field field--inline">
          <label for="outro">Outro horário</label>
          <div class="row">
            <input id="outro" type="time" step="300" />
            <button type="button" class="btn btn--secondary btn--sm" data-action="add-hora">Adicionar</button>
          </div>
        </div>
        <p class="field__error" id="hor-erro" hidden></p>
        <div class="push"></div>
        <button class="btn btn--primary btn--xl" type="submit">Continuar<i data-lucide="chevron-right" aria-hidden="true"></i></button>
      </form>`;
    }
    // revisar
    if (!c.nome || !c.horarios.length) {
      return `<section class="screen">
        ${cab}
        <h1 tabindex="-1">Falta pouco</h1>
        <div class="empty">
          <span class="empty__icon empty__icon--warn" aria-hidden="true"><i data-lucide="circle-alert"></i></span>
          <p>${!c.nome ? "Ainda não sei o nome do remédio." : "Ainda não sei em quais horários você toma."}</p>
        </div>
        <a class="btn btn--primary btn--xl" href="${!c.nome ? "#cadastro/1" : "#cadastro/3"}">Completar agora</a>
      </section>`;
    }
    const prev = { nome: c.nome, forma: c.forma, qtd: c.qtd, caixa: { fundo: "#ffffff", faixa: "#1f3c88", nomeCor: "branca" } };
    return `<section class="screen">
      ${cab}
      <h1 tabindex="-1">Está tudo certo?</h1>
      <div class="review">
        ${caixa(prev, "box-art--sm")}
        <dl>
          <div><dt>Nome</dt><dd>${esc(c.nome)}</dd><a href="#cadastro/1" class="link-edit">Mudar<span class="sr-only"> o nome</span></a></div>
          <div><dt>Quanto</dt><dd>${c.qtd} ${unidade(c.forma, c.qtd)}</dd><a href="#cadastro/2" class="link-edit">Mudar<span class="sr-only"> a quantidade</span></a></div>
          <div><dt>Horários</dt><dd>${c.horarios.slice().sort().join(", ")}</dd><a href="#cadastro/3" class="link-edit">Mudar<span class="sr-only"> os horários</span></a></div>
        </dl>
      </div>
      <p class="hint">Vou lembrar com som e vibração em cada horário. A ${LB.cuidador.nome} também vai ver este remédio.</p>
      <div class="push"></div>
      <button type="button" class="btn btn--primary btn--xl" data-action="salvar-remedio"><i data-lucide="check" aria-hidden="true"></i>Salvar remédio</button>
    </section>`;
  };

  // 7. Ajustes (tamanho da letra)
  TELAS.ajustes = () => {
    const tam = [
      ["g", "Grande", "20"],
      ["m", "Maior", "24"],
      ["mg", "Muito grande", "28"]
    ];
    const sw = (k, ic, t, d) => `<label class="switch">
        <span class="switch__text"><i data-lucide="${ic}" aria-hidden="true"></i><span><strong>${t}</strong>${d ? `<small>${d}</small>` : ""}</span></span>
        <input type="checkbox" role="switch" data-pref="${k}" ${prefs[k] ? "checked" : ""} />
        <span class="switch__ui" aria-hidden="true"></span>
      </label>`;
    return `<section class="screen">
      ${topo("Ajustes")}
      <fieldset class="sizes">
        <legend>Tamanho da letra</legend>
        ${tam
          .map(
            ([k, t, px]) => `<label class="size"><input type="radio" name="fonte" value="${k}" ${prefs.fonte === k ? "checked" : ""} />
            <span><span class="size__aa" style="font-size:${px}px" aria-hidden="true">Aa</span>${t}</span></label>`
          )
          .join("")}
      </fieldset>
      <div class="preview" aria-label="Prévia">
        <p class="preview__tag">Prévia</p>
        <p class="preview__name">Remédio da pressão</p>
        <p>1 comprimido · 20:00</p>
      </div>
      <h2 class="section-title">Ver e ouvir</h2>
      <div class="switches">
        ${sw("contraste", "contrast", "Contraste máximo", "Fundo branco e letra preta")}
        ${sw("som", "volume-2", "Alarme com som", "Toca até você marcar")}
        ${sw("repetir", "bell-ring", "Lembrar de novo", "A cada 15 minutos se eu não marcar")}
      </div>
      <h2 class="section-title">Quem acompanha</h2>
      <div class="person">
        <span class="avatar" aria-hidden="true">A</span>
        <div><strong>${LB.cuidador.nome}</strong><span>Sua ${LB.cuidador.relacao}</span></div>
      </div>
      <div class="switches">
        ${sw("avisar", "heart-handshake", "Avisar a " + LB.cuidador.nome, "Se eu não marcar em 30 minutos")}
      </div>
      <a class="btn btn--secondary" href="#cuidador"><i data-lucide="eye" aria-hidden="true"></i>Ver como a ${LB.cuidador.nome} vê</a>
      <p class="fineprint">Lembra é um protótipo de estudo com dados fictícios. Não substitui a orientação do seu médico ou farmacêutico.</p>
    </section>`;
  };

  // 8. Visão do cuidador
  TELAS.cuidador = () => {
    const pend = atrasadas();
    const lista = ordenadas();
    const feitos = lista.filter((d) => d.estado === "tomado").length;
    const baixo = S.remedios.filter((r) => r.estoque != null && r.estoque <= 5);
    const total = LB.semana.reduce((a, s) => a + s.total, 0) + lista.length;
    const marc = LB.semana.reduce((a, s) => a + s.marcadas, 0) + feitos;
    const alerta = pend.length
      ? pend
          .map((d) => {
            const r = rem(d.rem);
            return `<article class="cg-alert" aria-labelledby="cga-${d.id}">
            <p class="cg-alert__tag"><i data-lucide="triangle-alert" aria-hidden="true"></i>Dose atrasada há ${duracao(AGORA - min(d.hora))}</p>
            <h2 id="cga-${d.id}">${esc(r.nome)} · ${d.hora}</h2>
            <p>A ${LB.pessoa.nome} ainda não marcou. O app já tocou o alarme 4 vezes.</p>
            <div class="actions">
              <button type="button" class="btn btn--danger btn--xl" data-action="ligar" data-quem="${LB.pessoa.nome}"><i data-lucide="phone" aria-hidden="true"></i>Ligar para a ${LB.pessoa.nome}</button>
              <button type="button" class="btn btn--secondary" data-action="lembrete" ${S.lembreteEnviado ? "disabled" : ""}><i data-lucide="bell-ring" aria-hidden="true"></i>${S.lembreteEnviado ? "Lembrete enviado" : "Tocar o alarme dela de novo"}</button>
            </div>
          </article>`;
          })
          .join("")
      : `<article class="cg-ok"><i data-lucide="circle-check" aria-hidden="true"></i><div><h2>Tudo em dia</h2><p>A ${LB.pessoa.nome} marcou todos os remédios até agora.</p></div></article>`;

    return `<section class="screen screen--cg">
      <header class="cg-head">
        <p class="cg-head__who"><i data-lucide="smartphone" aria-hidden="true"></i>Celular da ${LB.cuidador.nome} · visão de quem cuida</p>
        <h1 tabindex="-1">${LB.pessoa.nome}, sua ${LB.cuidador.relacaoDela}</h1>
        <p class="cg-head__sub">Hoje: ${feitos} de ${lista.length} remédios marcados · atualizado às ${LB.agora}</p>
      </header>
      ${alerta}
      <h2 class="section-title">Hoje</h2>
      <ul class="cg-list">
        ${lista
          .map((d) => {
            const r = rem(d.rem);
            return `<li class="cg-row cg-row--${estado(d)}"><span class="cg-row__time">${d.hora}</span><span class="cg-row__name">${esc(r.nome)}</span>${selo(d)}</li>`;
          })
          .join("")}
      </ul>
      ${baixo
        .map(
          (r) => `<article class="cg-stock"><i data-lucide="package" aria-hidden="true"></i><div><strong>${esc(r.nome)} está acabando</strong><span>Restam ${r.estoque} ${unidade(r.forma, r.estoque)}. ${diasRestantes(r)}</span></div></article>`
        )
        .join("")}
      <h2 class="section-title">Últimos 7 dias</h2>
      <div class="week" role="img" aria-label="${marc} de ${total} doses marcadas nos últimos 7 dias">
        ${LB.semana
          .concat([{ dia: "Hoje", marcadas: feitos, total: lista.length }])
          .map(
            (s) => `<div class="week__day ${s.marcadas < s.total ? "week__day--miss" : ""}"><span class="week__mark">${s.marcadas < s.total ? "!" : "✓"}</span><span>${s.dia}</span></div>`
          )
          .join("")}
      </div>
      <p class="hint">${marc} de ${total} doses marcadas. Os dias com <strong>!</strong> tiveram dose sem marcar.</p>
      <a class="btn btn--quiet" href="#agora"><i data-lucide="arrow-left" aria-hidden="true"></i>Voltar ao app da ${LB.pessoa.nome}</a>
    </section>`;
  };

  /* ---------- Ações ---------- */
  function marcarTomado(d, hora, silencioso) {
    d.estado = "tomado";
    d.tomadoAs = hora;
    delete d.adiadoPara;
    const r = rem(d.rem);
    if (r.estoque != null) r.estoque = Math.max(0, r.estoque - r.qtd);
    if (!silencioso) S.lembreteEnviado = false;
  }
  function desmarcar(d) {
    const r = rem(d.rem);
    if (d.estado === "tomado" && r.estoque != null) r.estoque += r.qtd;
    d.estado = "pendente";
    delete d.tomadoAs;
  }

  const ACOES = {
    tomei(el) {
      const d = dose(el.dataset.id);
      marcarTomado(d, LB.agora);
      location.hash = "#tomei/" + d.id;
    },
    adiar(el) {
      const d = dose(el.dataset.id);
      const base = d.adiadoPara ? min(d.adiadoPara) : AGORA;
      d.adiadoPara = hhmm(base + 15);
      toast(`Tudo bem. Vou lembrar de novo às <strong>${d.adiadoPara}</strong>.`, "info");
      render(true);
    },
    desfazer(el) {
      const d = dose(el.dataset.id);
      desmarcar(d);
      toast(`Desfeito. ${esc(rem(d.rem).nome)} voltou para "Hora de tomar".`, "info");
      location.hash = "#agora";
    },
    async desmarcar(el) {
      const d = dose(el.dataset.id);
      const r = rem(d.rem);
      const ok = await confirmar({
        titulo: "Desmarcar este remédio?",
        texto: `${esc(r.nome)} das ${d.hora} vai voltar a aparecer como não tomado.`,
        ok: "Sim, desmarcar",
        cancelar: "Não, deixar como está"
      });
      if (!ok) return;
      desmarcar(d);
      toast(`${esc(r.nome)} desmarcado.`, "info");
      render(true);
    },
    "esq-agora"(el) {
      const d = dose(el.dataset.id);
      marcarTomado(d, LB.agora);
      location.hash = "#tomei/" + d.id;
    },
    "esq-ja"(el) {
      const d = dose(el.dataset.id);
      marcarTomado(d, d.hora);
      toast(`Anotado: ${esc(rem(d.rem).nome)} tomado às ${d.hora}.`);
      location.hash = "#dia";
    },
    async "esq-pular"(el) {
      const d = dose(el.dataset.id);
      const r = rem(d.rem);
      const ok = await confirmar({
        titulo: "Pular esta dose?",
        texto: `Vou anotar que você não tomou ${esc(r.nome)} das ${d.hora}. A ${LB.cuidador.nome} vai ver essa anotação.`,
        ok: "Sim, pular esta dose",
        cancelar: "Voltar"
      });
      if (!ok) return;
      d.estado = "pulado";
      toast("Anotado. Esta dose ficou como não tomada.", "info");
      location.hash = "#dia";
    },
    ligar(el) {
      toast(`Ligando para a ${esc(el.dataset.quem)}... (no protótipo a ligação é simulada)`, "info");
    },
    lembrete() {
      S.lembreteEnviado = true;
      toast(`O alarme vai tocar de novo no celular da ${LB.pessoa.nome}.`);
      render(true);
    },
    "avisar-compra"(el) {
      const r = rem(el.dataset.id);
      el.disabled = true;
      el.innerHTML = `<i data-lucide="circle-check" aria-hidden="true"></i>Pedido enviado`;
      icons();
      toast(`Pronto. A ${LB.cuidador.nome} recebeu: "Comprar ${esc(r.nome.toLowerCase())}".`);
    },
    async comprei(el) {
      const r = rem(el.dataset.id);
      const ok = await confirmar({
        titulo: "Comprou uma caixa nova?",
        texto: `Vou somar 30 ${unidade(r.forma, 30)} ao que você tem de ${esc(r.nome.toLowerCase())}.`,
        ok: "Sim, somar 30",
        cancelar: "Voltar"
      });
      if (!ok) return;
      r.estoque += 30;
      toast(`Agora você tem ${r.estoque} ${unidade(r.forma, r.estoque)} de ${esc(r.nome.toLowerCase())}.`);
      render(true);
    },
    novo() {
      S.cad = novoCadastro();
    },
    qtd(el) {
      S.cad.qtd = Math.min(40, Math.max(1, S.cad.qtd + Number(el.dataset.delta)));
      const out = $("#qtd");
      out.textContent = S.cad.qtd + " " + unidade(S.cad.forma, S.cad.qtd);
      $$(".stepper__btn").forEach((b) => (b.disabled = (b.dataset.delta === "-1" && S.cad.qtd <= 1) || (b.dataset.delta === "1" && S.cad.qtd >= 40)));
      if (document.activeElement && document.activeElement.disabled) $(".stepper__btn:not([disabled])").focus();
    },
    "add-hora"() {
      const inp = $("#outro");
      const err = $("#hor-erro");
      if (!inp.value) {
        mostraErro(inp, err, "Escolha a hora no campo antes de tocar em Adicionar.");
        return;
      }
      if (!S.cad.horarios.includes(inp.value)) S.cad.horarios.push(inp.value);
      toast(`Horário ${inp.value} adicionado.`);
      render(false);
      $("#outro").focus();
    },
    "salvar-remedio"() {
      const c = S.cad;
      const id = "r" + Date.now();
      const novo = {
        id,
        nome: c.nome,
        qtd: c.qtd,
        forma: c.forma,
        nota: "",
        caixa: { fundo: "#ffffff", faixa: "#1f3c88", nomeCor: "branca" },
        horarios: c.horarios.slice().sort(),
        estoque: null
      };
      S.remedios.push(novo);
      novo.horarios.forEach((h, i) => {
        if (min(h) > AGORA) S.doses.push({ id: id + "-" + i, rem: id, hora: h, estado: "pendente" });
      });
      S.destaque = id;
      S.cad = novoCadastro();
      toast(`${esc(novo.nome)} salvo. Vou lembrar às ${novo.horarios.join(" e ")}.`);
      location.hash = "#remedios";
    }
  };

  function mostraErro(campo, el, msg) {
    el.innerHTML = `<i data-lucide="circle-alert" aria-hidden="true"></i>${msg}`;
    el.hidden = false;
    if (campo) {
      campo.setAttribute("aria-invalid", "true");
      campo.focus();
    }
    icons();
  }

  /* ---------- Formulários do cadastro ---------- */
  document.addEventListener("submit", (e) => {
    const f = e.target.closest("[data-form]");
    if (!f) return;
    e.preventDefault();
    const c = S.cad;
    if (f.dataset.form === "c1") {
      const inp = $("#nome");
      const v = inp.value.trim();
      if (!v) return mostraErro(inp, $("#nome-erro"), "Escreva o nome do remédio para continuar. Pode ser do seu jeito, como \"remédio da pressão\".");
      if (v.length < 3) return mostraErro(inp, $("#nome-erro"), "O nome ficou muito curto. Escreva pelo menos 3 letras.");
      c.nome = v.charAt(0).toUpperCase() + v.slice(1);
      location.hash = "#cadastro/2";
    } else if (f.dataset.form === "c2") {
      location.hash = "#cadastro/3";
    } else if (f.dataset.form === "c3") {
      if (!c.horarios.length) {
        return mostraErro($('input[name="hora"]'), $("#hor-erro"), "Escolha pelo menos um horário. Toque em Manhã, Almoço, Tarde ou Noite.");
      }
      location.hash = "#cadastro/revisar";
    }
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "nome" && t.getAttribute("aria-invalid")) {
      t.removeAttribute("aria-invalid");
      $("#nome-erro").hidden = true;
    }
  });

  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "forma") {
      S.cad.forma = t.value;
      $("#qtd").textContent = S.cad.qtd + " " + unidade(S.cad.forma, S.cad.qtd);
    } else if (t.name === "hora") {
      const set = new Set(S.cad.horarios);
      t.checked ? set.add(t.value) : set.delete(t.value);
      S.cad.horarios = Array.from(set);
      if (S.cad.horarios.length) {
        $("#hor-erro").hidden = true;
        $$('input[name="hora"]').forEach((i) => i.removeAttribute("aria-invalid"));
      }
    } else if (t.name === "fonte") {
      prefs.fonte = t.value;
      salvarPrefs();
      aplicarPrefs();
      toast("Tamanho da letra: " + { g: "Grande", m: "Maior", mg: "Muito grande" }[t.value] + ".", "info");
    } else if (t.dataset.pref) {
      prefs[t.dataset.pref] = t.checked;
      salvarPrefs();
      aplicarPrefs();
      const nomes = { contraste: "Contraste máximo", som: "Alarme com som", repetir: "Lembrar de novo", avisar: "Avisar a " + LB.cuidador.nome };
      toast(nomes[t.dataset.pref] + (t.checked ? " ligado." : " desligado."), "info");
    }
  });

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const fn = ACOES[el.dataset.action];
    if (!fn) return;
    if (el.tagName !== "A") e.preventDefault();
    fn(el);
  });

  $("#reset").addEventListener("click", () => {
    try {
      localStorage.removeItem(PREFS_KEY);
    } catch (e) {
      /* nada */
    }
    location.hash = "#agora";
    location.reload();
  });

  /* ---------- Roteamento ---------- */
  function render(manterFoco) {
    const h = location.hash.slice(1) || "agora";
    const [nome, arg] = h.split("/");
    const tela = TELAS[nome] ? nome : "agora";
    const scroll = view.scrollTop;
    const ativo = document.activeElement;
    const chave = ativo && ativo.dataset && ativo.dataset.action ? [ativo.dataset.action, ativo.dataset.id] : null;
    view.innerHTML = TELAS[tela](arg);
    const abas = { agora: "agora", tomei: "agora", esquecida: "agora", dia: "dia", remedios: "remedios", cadastro: "remedios", ajustes: "ajustes" };
    if (tela === "cuidador" || tela === "cadastro") {
      nav.innerHTML = "";
      nav.hidden = true;
    } else {
      nav.hidden = false;
      nav.innerHTML = tabbar(abas[tela]);
    }
    document.body.dataset.tela = tela;
    $$("#side-links a").forEach((a) => {
      const alvo = a.getAttribute("href").slice(1).split("/")[0];
      if (alvo === tela) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    icons();
    if (manterFoco === true) {
      view.scrollTop = scroll;
      let alvo = null;
      if (chave) alvo = $$("[data-action]", view).find((b) => b.dataset.action === chave[0] && b.dataset.id === chave[1] && !b.disabled);
      if (!alvo) alvo = $("h1", view);
      if (alvo) alvo.focus({ preventScroll: true });
    } else if (manterFoco !== false) {
      view.scrollTop = 0;
      const h1 = $("h1", view);
      if (h1) h1.focus({ preventScroll: true });
    }
    document.title = ($("h1", view) ? $("h1", view).textContent.trim() + " · " : "") + "Lembra · Protótipo";
  }

  window.addEventListener("hashchange", () => render());
  render();
})();
