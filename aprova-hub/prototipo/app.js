/* Aprova Hub · interface (roteamento por hash) */
(function () {
  const S = window.Store;
  const D = window.AH_DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const view = $('#view');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`;
  const mat = (id) => (D.MATERIAS.find((m) => m.id === id) || { nome: id }).nome;
  const hm = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? `${h}h${String(m).padStart(2, '0')}` : `${m}min`; };
  const crono = (ms) => { const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60; return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0'); };
  const ini = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const wa = (tel, txt) => `https://wa.me/${tel ? '55' + String(tel).replace(/\D/g, '') : ''}?text=${encodeURIComponent(txt)}`;
  const brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const optMat = (sel) => D.MATERIAS.map((m) => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''}>${m.nome}</option>`).join('');

  function toast(msg, acao) {
    const box = $('#toasts');
    while (box.children.length >= 2) box.firstElementChild.remove();
    const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = `<span>${msg}</span>`;
    if (acao) { const b = document.createElement('button'); b.type = 'button'; b.className = 'toast__btn'; b.textContent = acao.rotulo; b.onclick = () => { acao.fn(); el.remove(); }; el.appendChild(b); }
    box.appendChild(el); setTimeout(() => el.remove(), acao ? 7000 : 4200);
  }
  function modal(html) { const d = $('#modal'); d.innerHTML = html; d.showModal(); icons(); return d; }
  function confirmar(titulo, texto, ok, perigo) {
    const d = modal(`<form method="dialog" class="modal__box"><h2 class="modal__t" id="modal-t">${titulo}</h2><p>${texto}</p><div class="modal__acts"><button class="btn btn--ghost btn--sm" value="no">Cancelar</button><button class="btn ${perigo ? 'btn--danger' : 'btn--primary'} btn--sm" value="ok">${ok}</button></div></form>`);
    return new Promise((r) => d.addEventListener('close', () => r(d.returnValue === 'ok'), { once: true }));
  }
  function erros(form, er) {
    $$('.field__erro', form).forEach((p) => { p.hidden = true; p.textContent = ''; });
    $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));
    const ks = Object.keys(er);
    ks.forEach((id) => { const i = $('#' + id, form), p = $('#' + id + '-e', form); if (i) i.setAttribute('aria-invalid', 'true'); if (p) { p.hidden = false; p.textContent = er[id]; } });
    if (ks.length) { const el = $('#' + ks[0], form); if (el) el.focus(); return false; }
    return true;
  }
  const campo = (id, rot, attrs = '', val = '') => `<div class="field"><label class="field__label" for="${id}">${rot}</label><input class="field__input" id="${id}" value="${esc(val)}" aria-describedby="${id}-e" ${attrs} /><p class="field__erro" id="${id}-e" hidden></p></div>`;
  const icons = () => window.lucide && window.lucide.createIcons();

  const ui = { editais: null, carregandoEditais: false, finalizando: false, revAberta: null, rank: 'horas', quiz: null, alunoAberto: null };

  /* =========================== RADAR =========================== */
  const CAT_RE = { policia: /guarda|pol[ií]cia|seguran[çc]a|tr[âa]nsito/i, bancos: /banc|financ|tribut|fazend|fiscal/i, tribunais: /tribunal|judici|procurador|jur[íi]dic/i };
  function carregarEditais() {
    if (ui.editais || ui.carregandoEditais || !window.Editais) return;
    ui.carregandoEditais = true;
    window.Editais.carregar().then((d) => { ui.editais = d; ui.carregandoEditais = false; if (location.hash === '#radar') render(); });
  }
  const primeiraFrase = (t, max = 120) => { const f = String(t).split(/(?<=[.;])\s/)[0]; return f.length > max ? f.slice(0, max).replace(/\s+\S*$/, '') + '…' : f; };

  function telaRadar() {
    carregarEditais();
    const f = S.estado().radarFiltro;
    const d = ui.editais;
    const vivo = d && d.modo === 'vivo';
    const nPv = S.alertas() ? paraVoce().novos.length : 0, nAv = avisosNovos();
    const chips = `<div class="chips chips--scroll" role="group" aria-label="Filtrar">${[['paravoce', 'Para você'], ...D.CATEGORIAS].map(([k, t]) => `<button class="chip ${k === 'paravoce' ? 'chip--pv' : ''}" type="button" data-filtro="${k}" aria-pressed="${f === k}">${k === 'paravoce' ? icon('sparkles') : ''}${t}${k === 'paravoce' && nPv ? `<span class="chip__n" aria-label="${nPv} novos">${nPv}</span>` : ''}</button>`).join('')}</div>`;
    const topo = `<header class="head"><div class="head__brand"><span class="logo" aria-hidden="true">${icon('check')}</span><h1>Aprova Hub</h1></div>
        <a class="icon-btn bell" href="#avisos" aria-label="Avisos${nAv ? `, ${nAv} novos` : ''}">${icon('bell')}${nAv ? `<span class="bell__n" aria-hidden="true">${nAv}</span>` : ''}</a></header>`;
    if (f === 'paravoce') return telaParaVoce(topo, chips);
    const tg = `<div class="card tg"><p>Receba cada edital novo no canal do Telegram</p><button class="btn btn--sm" type="button" data-act="telegram">Entrar</button></div>` + blocoSeguindo() + (S.alertas() ? '' : `<a class="card linha-link" href="#alertas"><span><b>Monte seus alertas</b><br><span class="xs muted">Áreas, estados e cargos que importam para você</span></span>${icon('chevron-right')}</a>`);
    const todos = `<a class="btn btn--ghost btn--block" href="#editais">${icon('newspaper')} Ver todos os editais</a>`;
    if (vivo) {
      const itens = d.itens.filter((i) => f === 'todos' || CAT_RE[f].test(i.resumo + ' ' + i.orgao));
      const dest = itens.find((i) => i.tipo === 'edital de abertura') || itens[0];
      const resto = itens.filter((i) => i !== dest).slice(0, 5);
      const stat = (v, rot) => (v ? `<div><dt>${rot}</dt><dd>${esc(v)}</dd></div>` : '');
      return `${topo}${chips}
        <p class="ao-vivo" role="status"><span class="ao-vivo__dot" aria-hidden="true"></span>Ao vivo · atualizado ${window.Editais.haQuanto(d.atualizado_em)} · fonte: Querido Diário</p>
        ${dest ? `<article class="card card--dark edital" aria-labelledby="ed-t">
          <p class="edital__meta"><span class="tag tag--novo">${esc(dest.tipo.toUpperCase())}</span><span class="xs muted">${dest.uf ? esc(dest.uf) + ' · ' : ''}${window.Editais.quandoData(dest.data)}</span></p>
          <h2 id="ed-t">${esc(dest.orgao)}</h2>
          <p class="small muted">${esc(primeiraFrase(dest.resumo, 160))}</p>
          ${[dest.vagas, dest.salario, dest.inscricoes_ate].some(Boolean) ? `<dl class="stats3">${stat(dest.vagas && dest.vagas.toLocaleString('pt-BR'), 'vagas')}${stat(dest.salario, 'até')}${stat(dest.inscricoes_ate && window.Editais.fmtData(dest.inscricoes_ate).slice(0, 5), 'inscrições até')}</dl>` : ''}
          <div class="row">${dest.links && dest.links.diario ? `<a class="btn btn--ghost-dark" href="${esc(dest.links.diario)}" target="_blank" rel="noopener">Diário Oficial</a>` : ''}<a class="btn btn--mint" href="#editais">Ver resumido ${icon('arrow-right')}</a></div>
          <p class="xs muted">Resumo automático. Confira sempre o documento original.</p>
        </article>` : `<div class="card vazio">${icon('radar')}<p><strong>Nada novo nesta área nos últimos dias.</strong></p><button class="link-btn" type="button" data-filtro="todos">Ver todas as áreas</button></div>`}
        ${tg}
        <h2 class="sec-t">Últimas do Radar</h2>
        ${resto.length ? `<ul class="noticias">${resto.map((n) => `<li><p class="edital__meta"><span class="tp ${window.EditaisUI.classeTipo(n.tipo)}">${esc(n.tipo)}</span><span class="xs muted">${n.uf ? esc(n.uf) + ' · ' : ''}${window.Editais.quandoData(n.data)}</span></p><p>${esc(n.orgao)}: ${esc(primeiraFrase(n.resumo))}</p></li>`).join('')}</ul>` : ''}
        ${todos}`;
    }
    const dest = D.DESTAQUES[f === 'todos' ? 'bancos' : f];
    const lista = D.RADAR.filter((n) => f === 'todos' || n.cat === f);
    return `${topo}${chips}
      <p class="ao-vivo ao-vivo--demo" role="status"><span class="badge-demo">dados de exemplo</span>${d && d.motivo === 'erro' ? 'Os diários não responderam agora.' : 'Na versão publicada, o Radar mostra os diários oficiais ao vivo.'}</p>
      <article class="card card--dark edital" aria-labelledby="ed-t">
        <p class="edital__meta"><span class="tag tag--novo">${dest.tipo}</span><span class="xs muted">${dest.quando}</span></p>
        <h2 id="ed-t">${dest.orgao} — ${dest.cargo}</h2>
        <p class="small muted">${dest.banca} · inscrições até ${dest.inscricoes}</p>
        <dl class="stats3"><div><dt>vagas</dt><dd>${dest.vagas}</dd></div><div><dt>inicial</dt><dd>${dest.salario}</dd></div><div><dt>nível</dt><dd>${dest.nivel}</dd></div></dl>
        <button class="btn btn--mint btn--block" type="button" data-act="ver-analise" data-banca="${dest.analise.banca}" data-materia="${dest.analise.materia}">Ver análise de incidência ${icon('arrow-right')}</button>
      </article>
      ${tg}
      <h2 class="sec-t">Últimas do Radar</h2>
      ${lista.length ? `<ul class="noticias">${lista.map((n) => `<li><p class="edital__meta"><span class="tag tag--${n.tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}">${n.tipo}</span><span class="xs muted">${n.quando}</span></p><p>${esc(n.texto)}</p></li>`).join('')}</ul>`
        : `<div class="card vazio">${icon('radar')}<p><strong>Nada novo nesta área hoje.</strong></p><button class="link-btn" type="button" data-filtro="todos">Ver todas as áreas</button></div>`}
      ${todos}
      <p class="xs muted">Órgãos e bancas fictícios, só para demonstração.</p>`;
  }

  function telaEditais() {
    return `<header class="head"><a class="icon-btn back" href="#radar" aria-label="Voltar para o Radar">${icon('arrow-left')}</a><h1 style="flex:1">Editais</h1><a class="link-btn" href="../editais/index.html">Abrir página</a></header>
      <p class="small muted">Publicações de concursos nos diários oficiais, resumidas e com o link oficial.</p>
      <div id="ed-root"></div>`;
  }

  /* =========================== ANÁLISES =========================== */
  function telaAnalises() {
    const a = S.estado().analise;
    const cargo = D.CARGOS.find((c) => c.id === a.cargo);
    const dados = D.INCIDENCIA[a.banca + '-' + a.materia];
    const banca = D.BANCAS.find((b) => b.id === a.banca);
    const bloqueado = cargo.premium && !S.premium();
    const sel = (id, rot, lista, val) => `<div><label class="sr-only" for="${id}">${rot}</label><select class="select" id="${id}" data-analise="${id.replace('sel-', '')}">${lista.map((x) => `<option value="${x.id}" ${x.id === val ? 'selected' : ''}>${x.curto || x.nome}${x.premium ? ' · Premium' : ''}</option>`).join('')}</select></div>`;
    return `<header class="head"><h1>Análises</h1><span class="badge badge--muted">dados de exemplo</span></header>
      <div class="selects">${sel('sel-banca', 'Banca', D.BANCAS, a.banca)}${sel('sel-materia', 'Matéria', D.MAT_ANALISE, a.materia)}${sel('sel-cargo', 'Cargo', D.CARGOS, a.cargo)}</div>
      ${bloqueado ? `<section class="card paywall" aria-labelledby="pw-t">${icon('lock')}<h2 class="card__t" id="pw-t">Análise por cargo é Premium</h2>
          <p class="small muted">Veja o que mais cai para ${esc(cargo.nome)} e o histórico completo de provas.</p>
          <a class="btn btn--primary" href="#perfil">Conhecer o Premium</a><button class="link-btn" type="button" data-act="todos-cargos">Voltar para todos os cargos</button></section>`
      : `<section class="card" aria-labelledby="mc-t"><h2 class="card__t" id="mc-t">O que mais cai</h2>
          <p class="xs muted">Incidência por assunto nas últimas provas da banca (${banca.estilo}).</p>
          <ul class="barras">${dados.temas.map(([t, p]) => `<li><span class="barras__top"><span>${t}</span><b>${p}%</b></span><span class="bar" role="img" aria-label="${t}: ${p}%"><span style="width:${p * 3}%"></span></span></li>`).join('')}</ul>
          <p class="nota">Em alta: ${dados.alta}</p></section>
        <h2 class="sec-t">Questões catalogadas</h2>
        <ul class="questoes">${dados.questoes.map(([ano, t, sub]) => `<li><b>${banca.nome} ${ano} · ${banca.estilo}</b><span class="xs muted">${t} › ${sub}</span><button class="prova" type="button" data-act="prova">Prova oficial ${icon('info')}</button></li>`).join('')}</ul>`}
      <a class="lock" href="#perfil">${icon('lock')} Análise por cargo e histórico completo <b>Premium</b></a>`;
  }

  /* =========================== ESTUDO =========================== */
  function telaEstudo() {
    const c = S.cronometro(), r = S.resumoDia(), fila = S.revisoesHoje(), seq = S.sequencia();
    const porEtapa = (e) => fila.filter((x) => x.revisao.etapa === e);
    let timer;
    if (ui.finalizando && c) {
      timer = `<form class="card form" id="f-sessao" novalidate aria-labelledby="fs-t"><h2 class="card__t" id="fs-t">Encerrar sessão de ${mat(c.materia)}</h2>
        <p class="small muted">Tempo: <strong>${crono(S.tempoMs())}</strong>. Conte quantas questões fez: é isso que prova o estudo.</p>
        <div class="grid3">${campo('f-min', 'Minutos', 'inputmode="numeric"', Math.max(1, Math.round(S.tempoMs() / 60000)))}${campo('f-q', 'Questões', 'inputmode="numeric"')}${campo('f-a', 'Acertos', 'inputmode="numeric"')}</div>
        <div class="row"><button class="btn btn--ghost" type="button" data-act="voltar-timer">Voltar</button><button class="btn btn--primary" type="submit">Salvar</button></div></form>`;
    } else if (c) {
      timer = `<section class="card timer" aria-labelledby="tm-t"><p class="timer__mat" id="tm-t">${mat(c.materia)}</p>
        <p class="timer__t" id="crono">${crono(S.tempoMs())}</p><p class="small muted">${esc(c.assunto || '')}</p>
        <p class="timer__estado">${c.inicioMs ? '<span class="dot" aria-hidden="true"></span>Cronômetro ligado' : 'Pausado'}</p>
        <div class="row">${c.inicioMs ? `<button class="btn btn--ghost" type="button" data-act="pausar">Pausar</button>` : `<button class="btn btn--ghost" type="button" data-act="continuar">Continuar</button>`}<button class="btn btn--primary" type="button" data-act="encerrar">Encerrar</button></div></section>`;
    } else {
      timer = `<form class="card form" id="f-iniciar" novalidate aria-labelledby="ti-t"><h2 class="card__t" id="ti-t">Começar a estudar</h2>
        <div class="field"><label class="field__label" for="i-mat">Matéria</label><select class="field__input" id="i-mat">${optMat('const')}</select></div>
        ${campo('i-ass', 'Assunto', 'placeholder="Ex.: Direitos fundamentais"')}
        <button class="btn btn--primary" type="submit">${icon('play')} Iniciar cronômetro</button></form>`;
    }
    const revLista = ui.revAberta ? porEtapa(ui.revAberta) : [];
    return `<header class="head"><h1>Estudo</h1><span class="badge badge--streak">${icon('flame')} ${seq} ${seq === 1 ? 'dia seguido' : 'dias seguidos'}</span></header>
      ${timer}
      <dl class="stats-hoje"><div><dt>tempo hoje</dt><dd id="tempo-hoje">${hm(r.minutos)}</dd></div><div><dt>questões</dt><dd>${r.questoes}</dd></div><div class="ok"><dt>acertos</dt><dd>${r.pct ?? 0}%</dd></div></dl>
      <section class="card" aria-labelledby="ce-t"><h2 class="card__t" id="ce-t">Caderno de erros</h2>
        <label class="foto-btn">${icon('camera')}<span>Fotografar questão errada</span><input type="file" accept="image/*" capture="environment" id="foto" aria-label="Fotografar questão errada" /></label>
        <button class="link-btn" type="button" data-act="erro-sem-foto">Anotar sem foto</button>
        <p class="xs muted">Revisões de hoje</p>
        <div class="revs" role="group" aria-label="Revisões de hoje por etapa">${[1, 7, 21].map((e) => `<button class="rev rev--${e}" type="button" data-rev="${e}" aria-pressed="${ui.revAberta === e}">${e} ${e === 1 ? 'dia' : 'dias'} · ${porEtapa(e).length}</button>`).join('')}</div>
        ${ui.revAberta ? (revLista.length ? `<ul class="fila">${revLista.map(({ erro: e, revisao: rv }) => `<li><div class="fila__top">${e.foto ? `<img class="thumb" src="${e.foto}" alt="Foto da questão" />` : `<span class="thumb">${icon('file-text')}</span>`}<div><b>${esc(e.assunto)}</b><p class="xs muted">${mat(e.materia)} · revisão de ${rv.etapa} ${rv.etapa === 1 ? 'dia' : 'dias'}</p><p class="small">${esc(e.anotacao)}</p></div></div>
            <div class="row"><button class="btn btn--primary btn--sm" type="button" data-revisar="${e.id}" data-etapa="${rv.etapa}" data-ok="1">Acertei</button><button class="btn btn--ghost btn--sm" type="button" data-revisar="${e.id}" data-etapa="${rv.etapa}" data-ok="0">Ainda erro</button></div></li>`).join('')}</ul>`
          : `<p class="small muted">Nada para revisar nesta etapa hoje.</p>`) : ''}
      </section>
      ${S.fezCheckin() ? `<p class="checkin-ok">${icon('check')} Check-in de hoje feito</p>` : `<button class="btn btn--dark btn--block" type="button" data-act="checkin">${icon('check')} Registrar check-in do dia</button>`}`;
  }

  function formErro(foto) {
    const d = modal(`<form class="modal__box form" id="f-erro" novalidate><h2 class="modal__t" id="modal-t">Nova questão errada</h2>
      ${foto ? `<img class="preview" src="${foto}" alt="Foto da questão que você tirou" />` : ''}
      <div class="field"><label class="field__label" for="e-mat">Matéria</label><select class="field__input" id="e-mat">${optMat('const')}</select></div>
      ${campo('e-ass', 'Assunto', 'placeholder="Ex.: Habeas data"')}
      <div class="field"><label class="field__label" for="e-anot">O que errei e a regra certa</label><textarea class="field__input" id="e-anot" rows="3" aria-describedby="e-anot-e"></textarea><p class="field__erro" id="e-anot-e" hidden></p></div>
      <p class="xs muted">Volta para revisão em 1, 7 e 21 dias.</p>
      <div class="modal__acts"><button class="btn btn--ghost btn--sm" type="button" data-act="fechar">Cancelar</button><button class="btn btn--primary btn--sm" type="submit">Salvar no caderno</button></div></form>`);
    d.dataset.foto = foto || '';
    $('#e-ass').focus();
  }

  function reduzirFoto(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => { const img = new Image(); img.onload = () => { const k = Math.min(1, 480 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.7)); }; img.onerror = rej; img.src = r.result; };
      r.onerror = rej; r.readAsDataURL(file);
    });
  }

  /* =========================== GRUPOS =========================== */
  function grupo() {
    const h = S.hoje();
    const voce = S.minutosPeriodo(S.addDias(h, -6), h, true);
    const diasVoce = new Set(S.sessoes(S.addDias(h, -6), h).map((s) => s.data)).size;
    const membros = D.GRUPO.membros.map(([nome, min, dias]) => ({ nome, min, dias })).concat([{ nome: 'Você', min: voce, dias: diasVoce, eu: true }]);
    const total = membros.reduce((t, m) => t + m.min, 0) / 60;
    return { membros, total, pct: Math.min(100, Math.round((total / D.GRUPO.metaHoras) * 100)), voce };
  }
  function proximoDomingo() {
    const d = new Date(); const alvo = new Date(d); alvo.setDate(d.getDate() + ((7 - d.getDay()) % 7)); alvo.setHours(20, 0, 0, 0);
    if (alvo <= d) alvo.setDate(alvo.getDate() + 7);
    return alvo;
  }
  const contagem = () => { const ms = proximoDomingo() - new Date(); const t = Math.floor(ms / 1000); const dd = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60; return (dd ? dd + 'd ' : '') + [hh, mm, ss].map((x) => String(x).padStart(2, '0')).join(':'); };

  function telaGrupos() {
    const g = grupo();
    const ord = g.membros.slice().sort((a, b) => (ui.rank === 'horas' ? b.min - a.min : b.dias - a.dias || b.min - a.min));
    const pos = ord.findIndex((m) => m.eu);
    const top = ord.slice(0, 5); if (pos >= 5) top.push(ord[pos]);
    const ant = D.GRUPO.anterior.voce;
    const delta = g.voce - ant;
    const q = S.quiz();
    return `<header class="head"><h1>Grupos</h1><button class="icon-btn" type="button" data-act="novo-grupo" aria-label="Entrar ou criar grupo">${icon('plus')}</button></header>
      <section class="card card--dark turma" aria-labelledby="tu-t"><div class="card__head"><h2 id="tu-t">${D.GRUPO.nome}</h2><span class="xs muted">${g.membros.length} membros</span></div>
        <p class="small muted">Desafio da semana: ${D.GRUPO.metaHoras} h de estudo em grupo</p>
        <span class="bar" role="progressbar" aria-label="Desafio do grupo" aria-valuenow="${g.pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${g.pct}%"></span></span>
        <p class="xs muted">${g.pct}% concluído · termina domingo</p></section>
      <section class="card" aria-labelledby="rk-t"><div class="card__head"><h2 class="card__t" id="rk-t">Ranking da semana</h2>
        <div class="seg" role="group" aria-label="Ordenar ranking"><button type="button" data-rank="horas" aria-pressed="${ui.rank === 'horas'}">Horas</button><button type="button" data-rank="dias" aria-pressed="${ui.rank === 'dias'}">Constância</button></div></div>
        <ol class="rank">${top.map((m) => `<li class="${m.eu ? 'eu' : ''}"><span class="rank__pos">${ord.indexOf(m) + 1}</span><span class="av" aria-hidden="true">${m.eu ? 'VC' : ini(m.nome)}</span><span>${m.nome}</span><span class="rank__v">${ui.rank === 'horas' ? hm(m.min) : m.dias + ' dias'}</span></li>`).join('')}</ol>
        <p class="evolucao">${icon(delta >= 0 ? 'trending-up' : 'trending-down')}<span>Sua evolução: <strong>${delta >= 0 ? '+' : '−'}${hm(Math.abs(delta))}</strong> em relação aos 7 dias anteriores.</span></p>
        <p class="xs muted">Últimos 7 dias. Quem está atrás vê a própria evolução, não só a posição.</p></section>
      <section class="card quiz-card" aria-labelledby="qz-t"><div class="card__head"><h2 class="card__t" id="qz-t">Quiz relâmpago de domingo</h2><span class="count" id="contagem">${contagem()}</span></div>
        <p class="small">10 questões de demonstração com o artigo citado. Dá para reportar erro em cada uma.</p>
        ${q.naFila ? `<p class="small"><strong>Você está na fila.</strong> Avisamos no domingo às 20h.</p><a class="btn btn--linha btn--block" href="#quiz">Treinar agora com a versão de demonstração</a>` : `<button class="btn btn--block" type="button" data-act="fila">Entrar na fila</button>`}</section>
      <a class="btn btn--ghost btn--block" href="${wa('', `Bora estudar junto? Entra na ${D.GRUPO.nome} no Aprova Hub: aprova.exemplo/g/escriturario`)}" target="_blank" rel="noopener">${icon('message-circle')} Convidar pelo WhatsApp</a>`;
  }

  /* =========================== QUIZ =========================== */
  function telaQuiz() {
    if (!ui.quiz) ui.quiz = { i: 0, respostas: [], fim: false };
    const z = ui.quiz, total = D.QUIZ.length;
    if (z.fim) {
      const ac = z.respostas.filter((r, i) => r === D.QUIZ[i].certa).length;
      return `<header class="head"><button class="icon-btn back" type="button" data-act="sair-quiz" aria-label="Voltar para grupos">${icon('arrow-left')}</button><h1>Resultado</h1><span></span></header>
        <section class="card" style="text-align:center;justify-items:center"><p class="score">${ac}<span class="small muted">/${total}</span></p><p>${ac >= 7 ? 'Mandou bem!' : 'Bom treino. Os erros já podem ir para o caderno.'}</p>
          <p class="xs muted">Questões de demonstração, escritas para este protótipo a partir dos artigos citados.</p>
          <div class="row" style="width:100%"><button class="btn btn--ghost" type="button" data-act="refazer-quiz">Refazer</button><a class="btn btn--primary" href="#grupos">Voltar ao grupo</a></div></section>`;
    }
    const q = D.QUIZ[z.i], r = z.respostas[z.i], resp = r != null;
    return `<header class="head"><button class="icon-btn back" type="button" data-act="sair-quiz" aria-label="Sair do quiz">${icon('x')}</button><h1 style="flex:1">Quiz</h1><span class="badge badge--muted">demonstração</span></header>
      <p class="q-prog"><span>Questão ${z.i + 1} de ${total}</span><span>${z.respostas.filter((x, i) => x === D.QUIZ[i].certa).length} acertos</span></p>
      <span class="bar" aria-hidden="true"><span style="width:${((z.i + (resp ? 1 : 0)) / total) * 100}%"></span></span>
      <section class="card" aria-labelledby="qe-t"><p class="q-art">${q.artigo}</p><h2 class="q-enun" id="qe-t">${q.enunciado}</h2>
        <div class="opts">${q.opcoes.map((o, k) => `<button class="opt ${resp && k === q.certa ? 'is-certa' : ''} ${resp && k === r && r !== q.certa ? 'is-errada' : ''}" type="button" data-resp="${k}" ${resp ? 'disabled' : ''}><span class="opt__l">${'ABCD'[k]}</span>${o}</button>`).join('')}</div>
        ${resp ? `<div class="feedback ${r === q.certa ? 'feedback--ok' : 'feedback--erro'}" role="status"><strong>${r === q.certa ? 'Certa!' : 'Não foi dessa vez.'}</strong><span>${q.explicacao}</span></div>
          <div class="row"><button class="btn btn--ghost btn--sm" type="button" data-act="reportar">${icon('flag')} Reportar erro</button><button class="btn btn--primary btn--sm" type="button" data-act="proxima">${z.i + 1 < total ? 'Próxima' : 'Ver resultado'}</button></div>` : ''}
      </section>`;
  }

  /* =========================== PERFIL =========================== */
  function telaPerfil() {
    const prem = S.premium(), ind = S.estado().indicacao, preco = S.precoPremium();
    const link = `aprova.exemplo/r/${ind.codigo}`;
    return `<header class="perfil-head"><span class="av av--lg" aria-hidden="true">VC</span><div><h1>Você</h1><p class="small muted">${prem ? 'Plano Premium (demonstração)' : 'Plano gratuito'}</p></div></header>
      <section class="card card--dark premium" aria-labelledby="pr-t"><div class="card__head"><h2 id="pr-t">Aprova Premium</h2><span class="premium__preco">${brl(preco)}/mês</span></div>
        <ul class="beneficios">${['Análise de incidência por cargo e histórico completo', 'Caderno de erros sem limite, com revisões automáticas', 'Quizzes relâmpago e grupos ilimitados', 'Alertas de edital por cargo e banca'].map((b) => `<li>${icon('check')}${b}</li>`).join('')}</ul>
        ${prem ? `<p class="badge badge--green" style="justify-self:start">${icon('check')} Premium ativo desde ${esc(prem.desde || 'hoje')}</p>` : `<a class="btn btn--mint btn--block" href="../site/cadastro.html?plano=premium">Assinar com Pix Automático</a>`}
        <p class="xs muted" style="text-align:center">Também aceita cartão · cancele quando quiser. Preço em teste; demonstração, nada é cobrado.</p></section>
      <section class="card" aria-labelledby="ig-t"><h2 class="card__t" id="ig-t">Indique e ganhe</h2>
        <p class="small muted">Cada amigo que assinar rende 1 mês de Premium grátis para você (regra em teste).</p>
        <div class="ref"><label class="sr-only" for="ref-link">Seu link de indicação</label><input class="field__input" id="ref-link" readonly value="${link}" /><button class="btn btn--primary btn--sm" type="button" data-act="copiar-ref">Copiar</button></div>
        <p class="small"><strong>${ind.indicados}</strong> amigos indicados · <strong>${ind.mesesGanhos}</strong> mês grátis</p></section>
      <a class="card linha-link" href="#alertas"><span><b>Meus alertas</b><br><span class="xs muted">${S.alertas() ? 'Configurados · filtro "Para você" no Radar' : 'Escolha áreas, estados e cargos'}</span></span>${icon('chevron-right')}</a>
      <a class="card linha-link" href="#concursos"><span><b>Concursos que sigo</b><br><span class="xs muted">${S.seguindo().length} ${S.seguindo().length === 1 ? 'concurso' : 'concursos'} · linha do tempo e plano de estudo</span></span>${icon('chevron-right')}</a>
      <a class="card linha-link" href="#mentor"><span><b>Modo mentor</b><br><span class="xs muted">Acompanhe seus alunos · grátis até ${D.MENTOR.limiteGratis}</span></span>${icon('chevron-right')}</a>
      <div class="perfil-acoes"><button class="link-btn" type="button" data-act="exportar">Exportar meus dados</button><button class="link-btn" type="button" data-act="excluir" style="color:var(--danger)">Excluir minha conta</button></div>
      <section class="card sobre-demo" aria-labelledby="sd-t"><h2 class="card__t" id="sd-t">Sobre esta demonstração</h2>
        <p class="small">Versão de demonstração: os dados ficam salvos só neste aparelho. Órgãos, bancas, pessoas e números são fictícios.</p>
        <ul class="small"><li><a href="../site/index.html">Ver como o produto se vende sozinho</a></li><li><a href="../../projetos/aprova-hub.html">Página do projeto</a></li><li><a href="https://github.com/gabrielAbreu-it/projetos/tree/main/aprova-hub/docs">Documentação</a></li></ul>
        <button class="btn btn--ghost btn--sm" type="button" data-act="recomecar">${icon('rotate-ccw')} Recomeçar demonstração</button></section>`;
  }

  /* =========================== MODO MENTOR =========================== */
  function telaMentor() {
    const m = S.mentor(), al = m.alunos, lim = D.MENTOR.limiteGratis;
    const meta = (a) => Math.round(((Math.min(1, a.questoes / m.metaQuestoes) + Math.min(1, a.horas / m.metaHoras)) / 2) * 100);
    const risco = (a) => (a.semDias != null && a.semDias >= 3) || (a.acertoAntes != null && a.acertoAntes - a.acerto >= 10);
    const ativos = al.filter((a) => a.semDias === 0).length;
    const media = al.length ? Math.round(al.reduce((t, a) => t + meta(a), 0) / al.length) : 0;
    const comDados = al.filter((a) => a.acerto != null);
    const acerto = comDados.length ? Math.round(comDados.reduce((t, a) => t + a.acerto, 0) / comDados.length) : 0;
    const questoes = al.reduce((t, a) => t + a.questoes, 0);
    const emRisco = al.filter(risco);
    const motivo = (a) => (a.semDias >= 3 ? `${a.semDias} dias sem check-in` : `Acertos caíram de ${a.acertoAntes}% para ${a.acerto}%`);
    const msg = (a) => (a.semDias >= 3 ? `Oi, ${a.nome.split(' ')[0]}! Senti sua falta nos check-ins. Está tudo bem? Se a rotina apertou, me conta que a gente ajusta o plano.` : `Oi, ${a.nome.split(' ')[0]}! Vi que seus acertos caíram nesta semana. Quer marcar 15 minutos para revisarmos juntos o que está pegando?`);
    return `<header class="head"><a class="icon-btn back" href="#perfil" aria-label="Voltar para o perfil">${icon('arrow-left')}</a><h1 style="flex:1">Modo mentor</h1><span class="badge badge--green">${al.length} de ${lim} grátis</span></header>
      <dl class="kpis"><div class="kpi"><dt>alunos ativos hoje</dt><dd>${ativos}</dd></div><div class="kpi kpi--green"><dt>acerto médio da turma</dt><dd>${acerto}%</dd></div>
        <div class="kpi"><dt>questões na semana</dt><dd>${questoes}</dd></div><div class="kpi kpi--warn"><dt>alunos em risco</dt><dd>${emRisco.length}</dd></div></dl>
      <h2 class="sec-t">Precisam de atenção</h2>
      ${emRisco.length ? `<ul class="atencao">${emRisco.map((a) => `<li><span class="av" aria-hidden="true">${ini(a.nome)}</span><span><b>${esc(a.nome.split(' ')[0])}</b><span class="xs muted">${motivo(a)}</span></span><a class="btn btn--ghost btn--sm" href="${wa(a.tel, msg(a))}" target="_blank" rel="noopener" aria-label="Mandar mensagem para ${esc(a.nome)} no WhatsApp">Mensagem</a></li>`).join('')}</ul>` : '<p class="card small muted">Ninguém em risco agora.</p>'}
      <section class="card" aria-labelledby="pl-t"><div class="card__head"><h2 class="card__t" id="pl-t">Plano da semana</h2><span class="xs muted">${esc(m.turma)}</span></div>
        <p class="small">Meta: ${m.metaHoras} h de estudo e ${m.metaQuestoes} questões por aluno</p>
        <span class="bar" role="progressbar" aria-label="Média da turma" aria-valuenow="${media}" aria-valuemin="0" aria-valuemax="100"><span style="width:${media}%"></span></span>
        <p class="xs muted">Média da turma: ${media}% da meta</p>
        <button class="link-btn" type="button" data-act="editar-plano">Editar meta</button></section>
      <section class="card" aria-labelledby="al-t"><div class="card__head"><h2 class="card__t" id="al-t">Alunos</h2><button class="btn btn--ghost btn--sm" type="button" data-act="add-aluno">${icon('user-plus')} Adicionar</button></div>
        <ul class="alunos">${al.map((a) => `<li><details ${ui.alunoAberto === a.id ? 'open' : ''} data-aluno="${a.id}"><summary><span class="av" aria-hidden="true">${ini(a.nome)}</span><span><b>${esc(a.nome)}</b><br><span class="xs muted">${a.semDias == null ? 'convite enviado' : a.semDias === 0 ? 'estudou hoje' : `último check-in há ${a.semDias} ${a.semDias === 1 ? 'dia' : 'dias'}`}</span></span>${a.semDias == null ? '<span class="st st--novo">Novo</span>' : risco(a) ? '<span class="st st--risco">Em risco</span>' : '<span class="st st--ok">Em dia</span>'}</summary>
          <div class="det"><p>${String(a.horas).replace('.', ',')} h · ${a.questoes} questões · ${a.acerto ?? '–'}% de acerto · ${meta(a)}% da meta</p><a class="btn btn--ghost btn--sm" href="${wa(a.tel, `Oi, ${a.nome.split(' ')[0]}! Passando para ver como está a semana de estudo.`)}" target="_blank" rel="noopener">${icon('message-circle')} WhatsApp</a></div></details></li>`).join('')}</ul></section>
      <button class="btn btn--primary btn--block" type="button" data-act="nova-turma">Criar nova turma</button>
      <p class="xs muted">Grátis até ${lim} alunos. Acima disso, planos para mentor e para escola. Nomes e números fictícios.</p>`;
  }

  function paywallMentor() {
    modal(`<div class="modal__box"><h2 class="modal__t" id="modal-t">Você chegou a ${D.MENTOR.limiteGratis} alunos grátis</h2>
      <p>Para acompanhar mais alunos, escolha um plano de mentor. Na demonstração, nada é cobrado.</p>
      <div class="modal__acts"><button class="btn btn--ghost btn--sm" type="button" data-act="fechar">Agora não</button><a class="btn btn--primary btn--sm" href="../site/cadastro.html?plano=mentor">Ver planos de mentor</a></div></div>`);
  }

  /* =========================== CONCURSOS, ALERTAS E PLANO =========================== */
  const C = window.AH_CONCURSOS;
  const A = window.AHAlertas;
  const UFS = ['AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];
  const NIVEIS = [['', 'Qualquer'], ['fundamental', 'Fundamental'], ['medio', 'Médio'], ['superior', 'Superior']];
  const ESTADOS_T = [[1, 'Estudei'], [2, 'Revisei'], [3, 'Dominei']];
  const concurso = (slug) => C.CONCURSOS.find((c) => c.slug === slug) || null;
  const fmtD = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
  const diasAte = (iso) => S.diasEntre(S.hoje(), iso);
  const nomeEtapa = (id) => (C.ETAPAS.find((e) => e[0] === id) || [, id])[1];
  const brl0 = (v) => 'R$ ' + v.toLocaleString('pt-BR');
  const itemConcurso = (c) => ({ id: 'c-' + c.slug, texto: `${c.titulo} ${c.cargos.map((x) => x.nome).join(' ')} ${c.orgao}`, uf: c.uf, salario: C.maiorSalario(c), escolaridade: c.escolaridade, area: c.area });
  const itemEdital = (i) => ({ id: 'e-' + i.id, texto: `${i.orgao} ${i.resumo} ${i.municipio || ''}`, uf: i.uf, salario: i.salario });
  const editaisAtuais = () => (ui.editais ? ui.editais.itens : []);

  function paraVoce() {
    const p = S.alertas();
    const concs = C.CONCURSOS.filter((c) => A.combina(itemConcurso(c), p));
    const eds = editaisAtuais().filter((i) => A.combina(itemEdital(i), p));
    const novos = A.novos([...concs.map(itemConcurso), ...eds.map(itemEdital)], p);
    return { p, concs, eds, novos };
  }

  function avisos() {
    const h = S.hoje(), lista = [];
    S.seguindo().forEach((slug) => {
      const c = concurso(slug); if (!c) return;
      C.ETAPAS.forEach(([id, nome]) => {
        const v = c.etapas[id]; const d = Array.isArray(v) ? v[0] : v;
        if (d && d <= h && S.diasEntre(d, h) <= 45 && !(c.previsao || []).includes(id)) lista.push({ data: d, slug, texto: `${c.titulo} avançou para ${nome}.`, icone: 'flag' });
      });
      const dp = diasAte(C.dataProva(c));
      if (dp >= 0 && dp <= 120) lista.push({ data: h, slug, texto: `Faltam ${dp} dias para a prova de ${c.titulo}.`, icone: 'calendar-clock', fixo: true });
    });
    return lista.sort((a, b) => (a.data < b.data ? 1 : -1));
  }
  const avisosNovos = () => avisos().filter((a) => !a.fixo && a.data > S.avisosVistosEm()).length;

  function linhaConcurso(c) {
    const et = C.etapaAtual(c, S.hoje()), dp = diasAte(C.dataProva(c));
    return `<li><a class="conc" href="#concurso/${c.slug}"><span><b>${esc(c.titulo)}</b><span class="xs muted">${esc(nomeEtapa(et))}${dp >= 0 ? ` · prova em ${dp} dias` : ''}</span></span>${icon('chevron-right')}</a></li>`;
  }

  function blocoSeguindo() {
    const l = S.seguindo().map(concurso).filter(Boolean);
    return `<section class="card" aria-labelledby="sg-t"><div class="card__head"><h2 class="card__t" id="sg-t">Concursos que você segue</h2><a class="link-btn" href="#concursos">Ver todos</a></div>
      ${l.length ? `<ul class="concs">${l.map(linhaConcurso).join('')}</ul>` : '<p class="small muted">Siga um concurso para acompanhar cada etapa.</p>'}</section>`;
  }

  function telaParaVoce(topo, chips) {
    const { p, concs, eds, novos } = paraVoce();
    if (!p) return `${topo}${chips}<section class="card card--dark" aria-labelledby="pv-t"><h2 class="card__t" id="pv-t">Monte seus alertas</h2><p class="small muted">Escolha áreas, escolaridade, estados e cargos. O Radar passa a mostrar só o que combina com você.</p><a class="btn btn--mint btn--block" href="#alertas">Configurar alertas</a></section>`;
    const idsNovos = new Set(novos.map((n) => n.id));
    setTimeout(() => A.marcarVistos([...concs.map(itemConcurso), ...eds.map(itemEdital)]), 0);
    return `${topo}${chips}
      <p class="ao-vivo ${ui.editais && ui.editais.modo === 'vivo' ? '' : 'ao-vivo--demo'}"><span class="badge-demo">${novos.length} ${novos.length === 1 ? 'novo' : 'novos'} desde a última visita</span><a class="link-btn" href="#alertas">Editar alertas</a></p>
      <h2 class="sec-t">Concursos para você</h2>
      ${concs.length ? `<ul class="concs card">${concs.map((c) => linhaConcurso(c).replace('<b>', idsNovos.has('c-' + c.slug) ? '<b><span class="novo">novo</span> ' : '<b>')).join('')}</ul>` : '<p class="card small muted">Nenhum concurso acompanhado combina com seus alertas ainda.</p>'}
      <h2 class="sec-t">Editais para você</h2>
      ${eds.length ? `<ul class="noticias">${eds.slice(0, 8).map((n) => `<li><p class="edital__meta">${idsNovos.has('e-' + n.id) ? '<span class="novo">novo</span>' : ''}<span class="tp ${window.EditaisUI.classeTipo(n.tipo)}">${esc(n.tipo)}</span><span class="xs muted">${n.uf ? esc(n.uf) + ' · ' : ''}${window.Editais.quandoData(n.data)}</span></p><p>${esc(n.orgao)}: ${esc(primeiraFrase(n.resumo))}</p></li>`).join('')}</ul>` : '<p class="card small muted">Nenhum edital recente combina com seus alertas. Avisamos quando aparecer.</p>'}
      <a class="btn btn--ghost btn--block" href="#editais">${icon('newspaper')} Ver todos os editais</a>
      ${ui.editais && ui.editais.modo !== 'vivo' ? '<p class="xs muted">Editais e concursos de exemplo, só para demonstração.</p>' : ''}`;
  }

  /* ---------- Meus alertas ---------- */
  function telaAlertas() {
    if (!ui.alertas) ui.alertas = JSON.parse(JSON.stringify(S.alertas() || { areas: [], escolaridade: '', ufs: [], palavras: [], salarioMin: null }));
    const a = ui.alertas;
    return `<header class="head"><a class="icon-btn back" href="#perfil" aria-label="Voltar para o perfil">${icon('arrow-left')}</a><h1 style="flex:1">Meus alertas</h1></header>
      <p class="small muted">O filtro "Para você" do Radar e dos editais usa estas escolhas. Tudo fica salvo neste aparelho.</p>
      <form class="form" id="f-alertas" novalidate>
        <fieldset class="card fs"><legend class="card__t">Áreas</legend>
          <div class="chips chips--wrap">${A.AREAS.map(([k, t]) => `<button class="chip" type="button" data-al-area="${k}" aria-pressed="${a.areas.includes(k)}">${t}</button>`).join('')}</div>
          <p class="field__erro" id="al-area-e" hidden></p></fieldset>
        <fieldset class="card fs"><legend class="card__t">Até qual escolaridade</legend>
          <div class="chips chips--wrap">${NIVEIS.map(([k, t]) => `<button class="chip" type="button" data-al-nivel="${k}" aria-pressed="${a.escolaridade === k}">${t}</button>`).join('')}</div></fieldset>
        <fieldset class="card fs"><legend class="card__t">Estados</legend>
          <p class="xs muted">${a.ufs.length ? a.ufs.join(', ') : 'Todos os estados'} · concursos nacionais sempre aparecem.</p>
          <div class="ufs">${UFS.map((u) => `<button class="uf" type="button" data-al-uf="${u}" aria-pressed="${a.ufs.includes(u)}">${u}</button>`).join('')}</div></fieldset>
        <fieldset class="card fs"><legend class="card__t">Cargos e palavras-chave</legend>
          <div class="ref"><label class="sr-only" for="al-palavra">Nova palavra-chave</label><input class="field__input" id="al-palavra" placeholder="Ex.: escriturário, agente" aria-describedby="al-palavra-e" /><button class="btn btn--primary btn--sm" type="button" data-act="al-add">Adicionar</button></div>
          <p class="field__erro" id="al-palavra-e" hidden></p>
          ${a.palavras.length ? `<ul class="tags-x">${a.palavras.map((w, i) => `<li>${esc(w)}<button type="button" data-al-rem="${i}" aria-label="Remover ${esc(w)}">${icon('x')}</button></li>`).join('')}</ul>` : ''}</fieldset>
        <div class="card fs">${campo('al-sal', 'Salário mínimo (opcional)', 'inputmode="numeric" placeholder="Ex.: 4000"', a.salarioMin || '')}</div>
        <fieldset class="card fs"><legend class="card__t">Onde avisar</legend>
          <p class="canal"><span>${icon('bell')} No app (Radar e Avisos)</span><span class="badge badge--green">ativo</span></p>
          <p class="canal canal--off"><span>${icon('send')} Telegram</span><span class="badge badge--muted">em breve</span></p>
          <p class="canal canal--off"><span>${icon('message-circle')} WhatsApp</span><span class="badge badge--muted">em breve</span></p></fieldset>
        <button class="btn btn--primary btn--block" type="submit">Salvar alertas</button>
      </form>`;
  }

  /* ---------- Avisos ---------- */
  function telaAvisos() {
    const l = avisos(), vistoEm = S.avisosVistosEm();
    const { p, novos } = paraVoce();
    setTimeout(() => S.marcarAvisosVistos(), 0);
    return `<header class="head"><a class="icon-btn back" href="#radar" aria-label="Voltar para o Radar">${icon('arrow-left')}</a><h1 style="flex:1">Avisos</h1></header>
      ${p && novos.length ? `<a class="card linha-link" href="#radar" data-act="ir-paravoce"><span><b>${novos.length} ${novos.length === 1 ? 'publicação nova combina' : 'publicações novas combinam'} com seus alertas</b><br><span class="xs muted">Ver em "Para você"</span></span>${icon('chevron-right')}</a>` : ''}
      ${l.length ? `<ul class="avisos">${l.map((a) => `<li class="${!a.fixo && a.data > vistoEm ? 'is-novo' : ''}"><span class="aviso-ico">${icon(a.icone)}</span><a href="#concurso/${a.slug}"><b>${esc(a.texto)}</b><span class="xs muted">${a.fixo ? 'contagem' : fmtD(a.data)}</span></a></li>`).join('')}</ul>`
        : `<div class="card vazio">${icon('bell-off')}<p><strong>Nenhum aviso ainda.</strong></p><a class="link-btn" href="#concursos">Seguir um concurso</a></div>`}`;
  }

  /* ---------- Concursos ---------- */
  function telaConcursos() {
    return `<header class="head"><a class="icon-btn back" href="#radar" aria-label="Voltar para o Radar">${icon('arrow-left')}</a><h1 style="flex:1">Concursos</h1><span class="badge badge--muted">exemplo</span></header>
      <p class="small muted">Acompanhe cada etapa, do concurso previsto ao resultado.</p>
      <ul class="concs card">${C.CONCURSOS.map((c) => `<li class="conc-row">${linhaConcurso(c).replace(/^<li>|<\/li>$/g, '')}<button class="btn btn--sm ${S.seguindo().includes(c.slug) ? 'btn--primary' : 'btn--ghost'}" type="button" data-seguir="${c.slug}" aria-pressed="${S.seguindo().includes(c.slug)}">${S.seguindo().includes(c.slug) ? 'Seguindo' : 'Seguir'}</button></li>`).join('')}</ul>
      <a class="link-btn" href="../concursos/index.html">Ver páginas públicas dos concursos</a>
      <p class="xs muted">Concursos fictícios de demonstração.</p>`;
  }

  function telaConcurso(slug) {
    const c = concurso(slug);
    if (!c) return `<header class="head"><a class="icon-btn back" href="#concursos" aria-label="Voltar">${icon('arrow-left')}</a><h1 style="flex:1">Concurso</h1></header><div class="card vazio">${icon('search-x')}<p><strong>Concurso não encontrado.</strong></p><a class="link-btn" href="#concursos">Ver concursos</a></div>`;
    const h = S.hoje(), atual = C.etapaAtual(c, h), idxAtual = C.ETAPAS.findIndex((e) => e[0] === atual), dp = diasAte(C.dataProva(c)), seg = S.seguindo().includes(slug);
    return `<header class="head"><a class="icon-btn back" href="#concursos" aria-label="Voltar para concursos">${icon('arrow-left')}</a><span class="badge badge--muted">concurso fictício</span></header>
      <section class="card card--dark edital" aria-labelledby="cc-t"><p class="edital__meta"><span class="tag tag--novo">${esc(nomeEtapa(atual).toUpperCase())}</span><span class="xs muted">${esc(c.abrangencia)}${c.uf !== 'BR' ? ' · ' + c.uf : ''}</span></p>
        <h1 id="cc-t" class="cc-t">${esc(c.titulo)}</h1><p class="small muted">${esc(c.banca)} · nível ${esc(c.escolaridade.toLowerCase())}</p>
        <dl class="stats3"><div><dt>vagas</dt><dd>${C.totalVagas(c).toLocaleString('pt-BR')}</dd></div><div><dt>até</dt><dd>${brl0(C.maiorSalario(c))}</dd></div><div><dt>prova${(c.previsao || []).includes('prova') ? ' (prev.)' : ''}</dt><dd>${fmtD(C.dataProva(c)).slice(0, 5)}</dd></div></dl>
        <p class="contagem-prova">${dp > 0 ? `Faltam <strong>${dp} dias</strong> para a prova` : dp === 0 ? '<strong>A prova é hoje</strong>' : `Prova realizada em ${fmtD(C.dataProva(c))}`}</p>
        <div class="row"><button class="btn ${seg ? 'btn--ghost-dark' : 'btn--mint'}" type="button" data-seguir="${slug}" aria-pressed="${seg}">${icon(seg ? 'check' : 'plus')} ${seg ? 'Seguindo' : 'Seguir concurso'}</button>${dp >= 0 ? `<button class="btn btn--ghost-dark" type="button" data-ics="${slug}">${icon('calendar-plus')} Adicionar à agenda</button>` : ''}</div></section>
      <a class="card linha-link" href="#verticalizado/${slug}"><span><b>Edital verticalizado e plano de estudo</b><br><span class="xs muted">${progressoConcurso(c)}% do conteúdo estudado</span></span>${icon('chevron-right')}</a>
      <section class="card" aria-labelledby="lt-t"><h2 class="card__t" id="lt-t">Linha do tempo</h2>
        <ol class="timeline">${C.ETAPAS.map(([id, nome], i) => { const v = c.etapas[id]; const prev = (c.previsao || []).includes(id); const st = i < idxAtual ? 'feito' : i === idxAtual ? 'atual' : 'futuro'; return `<li class="tl tl--${st}" ${st === 'atual' ? 'aria-current="step"' : ''}><span class="tl__dot" aria-hidden="true">${st === 'feito' ? icon('check') : ''}</span><span><b>${nome}</b><span class="xs muted">${Array.isArray(v) ? `${fmtD(v[0])} a ${fmtD(v[1])}` : fmtD(v)}${prev ? ' · previsão' : ''}${st === 'atual' ? ' · etapa atual' : ''}</span></span></li>`; }).join('')}</ol></section>
      <section class="card" aria-labelledby="cg-t"><h2 class="card__t" id="cg-t">Cargos</h2><ul class="concs">${c.cargos.map((x) => `<li class="cargo"><b>${esc(x.nome)}</b><span class="xs muted">${x.vagas} vagas · ${brl0(x.salario)} · nível ${x.escolaridade.toLowerCase()}</span></li>`).join('')}</ul></section>
      <a class="link-btn" href="../concursos/${slug}.html">Abrir a página pública deste concurso</a>`;
  }

  function baixarIcs(slug) {
    const c = concurso(slug), d = C.dataProva(c).replace(/-/g, '');
    const fim = S.addDias(C.dataProva(c), 1).replace(/-/g, '');
    const agora = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aprova Hub//Demonstracao//PT-BR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', `UID:prova-${slug}@aprova-hub.exemplo`, `DTSTAMP:${agora}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${fim}`,
      `SUMMARY:Prova - ${c.titulo}`, `DESCRIPTION:Concurso fictício de demonstração do Aprova Hub. Confira a data no edital oficial.`, 'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Prova amanhã', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const u = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a'); a.href = u; a.download = `prova-${slug}.ics`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
    toast('Arquivo da agenda baixado. Abra para adicionar a prova ao seu calendário.');
  }

  /* ---------- Edital verticalizado ---------- */
  const chave = (mid, t) => `${mid}|${t}`;
  function peso(mid, topico) {
    const d = D.INCIDENCIA['a-' + mid]; if (!d) return 8;
    const t = d.temas.find(([n]) => n === topico); return t ? t[1] : 6;
  }
  function pctMateria(m) { const p = S.progresso(); return Math.round((m.topicos.reduce((t, x) => t + (p[chave(m.id, x)] || 0), 0) / (m.topicos.length * 3)) * 100); }
  function progressoConcurso(c) { const p = S.progresso(); const tot = c.materias.reduce((t, m) => t + m.topicos.length * 3, 0); const f = c.materias.reduce((t, m) => t + m.topicos.reduce((s, x) => s + (p[chave(m.id, x)] || 0), 0), 0); return Math.round((f / tot) * 100); }

  function telaVerticalizado(slug) {
    const c = concurso(slug); if (!c) return telaConcurso(slug);
    const p = S.progresso(), pc = progressoConcurso(c);
    return `<header class="head"><a class="icon-btn back" href="#concurso/${slug}" aria-label="Voltar para o concurso">${icon('arrow-left')}</a><h1 style="flex:1">Edital verticalizado</h1></header>
      <section class="card" aria-labelledby="vg-t"><div class="card__head"><h2 class="card__t" id="vg-t">${esc(c.titulo)}</h2></div>
        <span class="bar" role="progressbar" aria-label="Progresso no conteúdo" aria-valuenow="${pc}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pc}%"></span></span>
        <p class="small"><strong>${pc}%</strong> do conteúdo · Estudei vale 1/3, Revisei 2/3 e Dominei conta inteiro.</p>
        <a class="btn btn--primary btn--block" href="#plano/${slug}">${icon('calendar-range')} ${S.planoEstudo(slug) ? 'Ver meu plano de estudo' : 'Gerar plano de estudo'}</a></section>
      ${c.materias.map((m, i) => `<details class="card mat" ${i === 0 || ui.matAberta === m.id ? 'open' : ''} data-mat="${m.id}"><summary><span><b>${esc(m.nome)}</b><span class="xs muted">${m.topicos.length} tópicos · ${pctMateria(m)}%</span></span><span class="bar bar--mini" aria-hidden="true"><span style="width:${pctMateria(m)}%"></span></span></summary>
        <ul class="topicos">${m.topicos.map((t) => { const k = chave(m.id, t), n = p[k] || 0; return `<li><span class="topico__n">${esc(t)}${D.INCIDENCIA['a-' + m.id] && D.INCIDENCIA['a-' + m.id].temas.some(([x]) => x === t) ? `<span class="xs muted"> · cai ${peso(m.id, t)}%</span>` : ''}</span>
          <span class="estados" role="group" aria-label="Situação de ${esc(t)}">${ESTADOS_T.map(([v, rot]) => `<button type="button" class="est est--${v}" data-topico="${esc(k)}" data-nivel="${v}" aria-pressed="${n === v}">${rot}</button>`).join('')}</span></li>`; }).join('')}</ul></details>`).join('')}
      <p class="xs muted">Conteúdo programático resumido de um concurso fictício. "Cai X%" vem da aba Análises (dados de exemplo).</p>`;
  }

  /* ---------- Plano de estudo ---------- */
  function segundaDe(iso) { const [y, m, d] = iso.split('-').map(Number); const dt = new Date(y, m - 1, d); return S.addDias(iso, -((dt.getDay() + 6) % 7)); }

  function gerarPlano(c, horasSemana, prova) {
    const p = S.progresso();
    const pend = [];
    c.materias.forEach((m) => m.topicos.forEach((t) => { const k = chave(m.id, t); if ((p[k] || 0) < 3) pend.push({ chave: k, peso: peso(m.id, t), horas: Math.max(1, Math.round((1 + peso(m.id, t) / 8) * 2) / 2) }); }));
    pend.sort((a, b) => b.peso - a.peso);
    const ini = segundaDe(S.hoje()), ultima = segundaDe(prova);
    const nSemanas = Math.max(1, Math.floor(S.diasEntre(ini, ultima) / 7)); // a semana da prova fica para revisão geral
    const semanas = Array.from({ length: nSemanas }, (_, i) => ({ inicio: S.addDias(ini, i * 7), itens: [] }));
    let w = 0, usado = 0, sobra = 0;
    pend.forEach((t) => {
      while (w < nSemanas - 1 && usado + t.horas > horasSemana) { w++; usado = 0; }
      if (usado + t.horas > horasSemana) sobra++;
      semanas[w].itens.push({ chave: t.chave, horas: t.horas }); usado += t.horas;
    });
    return { horasSemana, prova, criadoEm: S.hoje(), semanas, naoCabe: sobra };
  }

  function telaPlano(slug) {
    const c = concurso(slug); if (!c) return telaConcurso(slug);
    const pl = S.planoEstudo(slug);
    if (!pl || ui.editandoPlano) {
      const provaPadrao = diasAte(C.dataProva(c)) > 14 ? C.dataProva(c) : S.addDias(S.hoje(), 90);
      return `<header class="head"><a class="icon-btn back" href="#verticalizado/${slug}" aria-label="Voltar para o edital">${icon('arrow-left')}</a><h1 style="flex:1">Plano de estudo</h1></header>
        <form class="card form" id="f-gerar" data-slug="${slug}" novalidate><h2 class="card__t">${esc(c.titulo)}</h2>
          <p class="small muted">O app distribui os tópicos que faltam até a prova, começando pelos que mais caem. A semana da prova fica para revisão geral.</p>
          <div class="grid2">${campo('g-horas', 'Horas por semana', 'inputmode="numeric"', pl ? pl.horasSemana : 12)}${campo('g-prova', 'Data da prova', 'type="date"', pl ? pl.prova : provaPadrao)}</div>
          <div class="row">${pl ? '<button class="btn btn--ghost" type="button" data-act="cancelar-plano">Cancelar</button>' : ''}<button class="btn btn--primary" type="submit">${icon('sparkles')} Gerar plano</button></div></form>`;
    }
    const p = S.progresso(), h = S.hoje();
    const idx = pl.semanas.findIndex((s) => h >= s.inicio && h < S.addDias(s.inicio, 7));
    const atual = idx >= 0 ? pl.semanas[idx] : null;
    const atrasados = pl.semanas.slice(0, Math.max(0, idx < 0 ? pl.semanas.length : idx)).filter((s) => s.inicio < h).flatMap((s) => s.itens).filter((t) => !p[t.chave]);
    const feitos = pl.semanas.flatMap((s) => s.itens).filter((t) => p[t.chave]).length, total = pl.semanas.flatMap((s) => s.itens).length;
    const tarefa = (t) => { const [mid, top] = t.chave.split('|'); const n = p[t.chave] || 0; return `<li class="tarefa ${n ? 'is-feita' : ''}"><span><b>${esc(top)}</b><span class="xs muted">${esc(C.NOMES[mid] || mat(mid))} · ${String(t.horas).replace('.', ',')} h${n ? ' · ' + ESTADOS_T[n - 1][1].toLowerCase() : ''}</span></span>
      <span class="row">${n ? '' : `<button class="btn btn--ghost btn--sm" type="button" data-marcar="${esc(t.chave)}" aria-label="Marcar ${esc(top)} como estudado">${icon('check')}</button>`}<button class="btn btn--primary btn--sm" type="button" data-estudar="${esc(t.chave)}">${icon('play')} Estudar</button></span></li>`; };
    return `<header class="head"><a class="icon-btn back" href="#verticalizado/${slug}" aria-label="Voltar para o edital">${icon('arrow-left')}</a><h1 style="flex:1">Plano de estudo</h1><button class="link-btn" type="button" data-act="editar-plano-estudo">Ajustar</button></header>
      <section class="card card--dark" aria-labelledby="pe-t"><h2 class="card__t" id="pe-t">${esc(c.titulo)}</h2>
        <p class="small muted">${pl.horasSemana} h por semana · prova em ${fmtD(pl.prova)} · ${pl.semanas.length} semanas de estudo + revisão final</p>
        <span class="bar" role="progressbar" aria-label="Progresso do plano" aria-valuenow="${total ? Math.round((feitos / total) * 100) : 0}" aria-valuemin="0" aria-valuemax="100"><span style="width:${total ? (feitos / total) * 100 : 0}%"></span></span>
        <p class="xs muted">${feitos} de ${total} tópicos estudados</p></section>
      ${pl.naoCabe ? `<p class="aviso-plano">${icon('alert-triangle')}<span>${pl.naoCabe} tópicos não couberam nas horas escolhidas e ficaram na última semana. Aumente as horas por semana.</span></p>` : ''}
      ${atrasados.length ? `<div class="aviso-plano" role="alert">${icon('clock-alert')}<span>Você está <strong>${atrasados.length} ${atrasados.length === 1 ? 'tópico' : 'tópicos'} atrás</strong> do plano.</span><button class="btn btn--primary btn--sm" type="button" data-recalcular="${slug}">Recalcular plano</button></div>` : ''}
      <section class="card" aria-labelledby="sa-t"><div class="card__head"><h2 class="card__t" id="sa-t">Semana atual</h2>${atual ? `<span class="xs muted">${fmtD(atual.inicio).slice(0, 5)} a ${fmtD(S.addDias(atual.inicio, 6)).slice(0, 5)}</span>` : ''}</div>
        ${atual ? (atual.itens.length ? `<ul class="tarefas">${atual.itens.map(tarefa).join('')}</ul>` : '<p class="small muted">Semana livre para revisões.</p>') : '<p class="small muted">Semana de revisão geral antes da prova. Use o caderno de erros.</p>'}</section>
      <section class="card" aria-labelledby="pr-t"><h2 class="card__t" id="pr-t">Próximas semanas</h2>
        <ul class="semanas">${pl.semanas.slice(idx + 1, idx + 7).map((s, i) => `<li><b>Semana ${idx + i + 2}</b><span class="xs muted">${fmtD(s.inicio).slice(0, 5)} · ${s.itens.length} tópicos · ${s.itens.reduce((t, x) => t + x.horas, 0).toString().replace('.', ',')} h</span></li>`).join('') || '<li class="small muted">Depois desta, vem a revisão final.</li>'}</ul></section>`;
  }

  /* =========================== ROTAS =========================== */
  const TABS = [['radar', 'Radar', 'radar'], ['analises', 'Análises', 'bar-chart-3'], ['estudo', 'Estudo', 'timer'], ['grupos', 'Grupos', 'users'], ['perfil', 'Perfil', 'user']];
  const TELAS = { alertas: telaAlertas, avisos: telaAvisos, concursos: telaConcursos, concurso: telaConcurso, verticalizado: telaVerticalizado, plano: telaPlano, radar: telaRadar, editais: telaEditais, analises: telaAnalises, estudo: telaEstudo, grupos: telaGrupos, quiz: telaQuiz, perfil: telaPerfil, mentor: telaMentor };
  const TITULOS = { alertas: 'Meus alertas', avisos: 'Avisos', concursos: 'Concursos', concurso: 'Concurso', verticalizado: 'Edital verticalizado', plano: 'Plano de estudo', radar: 'Radar', editais: 'Editais', analises: 'Análises', estudo: 'Estudo', grupos: 'Grupos', quiz: 'Quiz relâmpago', perfil: 'Perfil', mentor: 'Modo mentor' };
  const ABA = { quiz: 'grupos', mentor: 'perfil', editais: 'radar', alertas: 'perfil', avisos: 'radar', concursos: 'radar', concurso: 'radar', verticalizado: 'estudo', plano: 'estudo' };
  let ultima = null;

  function render() {
    const hash = location.hash.slice(1);
    const [r, param] = hash.split('/');
    if (!TELAS[r]) { location.replace('#radar'); return; }
    const mudou = hash !== ultima;
    if (mudou && r !== 'alertas') ui.alertas = null;
    if (mudou && r !== 'plano') ui.editandoPlano = false;
    if (mudou) { if (r !== 'estudo') { ui.finalizando = false; } if (r !== 'quiz') ui.quiz = null; }
    view.innerHTML = TELAS[r](param);
    const ativa = ABA[r] || r;
    $('#tabs').innerHTML = TABS.map(([h, t, i]) => `<li><a class="tab" href="#${h}" ${h === ativa ? 'aria-current="page"' : ''}>${icon(i)}<span>${t}</span></a></li>`).join('');
    const c = S.cronometro(), pill = $('#crono-pill');
    if (c && r !== 'estudo') { pill.hidden = false; pill.innerHTML = `<span>${icon(c.inicioMs ? 'timer' : 'pause')}${c.inicioMs ? 'Estudando' : 'Pausado'} · <strong id="crono-mini">${crono(S.tempoMs())}</strong></span><a href="#estudo">Abrir</a>`; }
    else { pill.hidden = true; pill.innerHTML = ''; }
    if (r === 'editais' && window.EditaisUI) window.EditaisUI.montar($('#ed-root'));
    document.title = `${TITULOS[r]} · Aprova Hub`;
    icons();
    if (mudou) { window.scrollTo(0, 0); if (ultima !== null) { const h = view.querySelector('h1, h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } } }
    ultima = hash;
  }

  setInterval(() => {
    const t = crono(S.tempoMs());
    const a = $('#crono'); if (a && S.cronometro()) a.textContent = t;
    const b = $('#crono-mini'); if (b) b.textContent = t;
    const h = $('#tempo-hoje'); if (h) h.textContent = hm(S.resumoDia().minutos);
    const q = $('#contagem'); if (q) q.textContent = contagem();
  }, 1000);

  function lerAlertasForm() { const i = $('#al-sal'); if (i && ui.alertas) { const v = i.value.replace(/\D/g, ''); ui.alertas.salarioMin = v ? Number(v) : null; } }
  function refazer(foco) { lerAlertasForm(); const y = window.scrollY; render(); window.scrollTo(0, y); if (foco) { const el = $(foco); if (el) el.focus({ preventScroll: true }); } }

  document.addEventListener('click', async (ev) => {
    const t = ev.target;
    const al = t.closest('[data-al-area],[data-al-nivel],[data-al-uf],[data-al-rem]');
    if (al && ui.alertas) {
      const a = ui.alertas, ds = al.dataset;
      if (ds.alArea != null) { const i = a.areas.indexOf(ds.alArea); if (i >= 0) a.areas.splice(i, 1); else a.areas.push(ds.alArea); refazer(`[data-al-area="${ds.alArea}"]`); }
      else if (ds.alNivel != null) { a.escolaridade = ds.alNivel; refazer(`[data-al-nivel="${ds.alNivel}"]`); }
      else if (ds.alUf != null) { const i = a.ufs.indexOf(ds.alUf); if (i >= 0) a.ufs.splice(i, 1); else a.ufs.push(ds.alUf); a.ufs.sort(); refazer(`[data-al-uf="${ds.alUf}"]`); }
      else { a.palavras.splice(Number(ds.alRem), 1); refazer('#al-palavra'); }
      return;
    }
    const sg = t.closest('[data-seguir]'); if (sg) { const on = S.alternarSeguir(sg.dataset.seguir); refazer(`[data-seguir="${sg.dataset.seguir}"]`); toast(on ? 'Você está seguindo este concurso. Avisamos a cada etapa.' : 'Você deixou de seguir este concurso.'); return; }
    const ic = t.closest('[data-ics]'); if (ic) { baixarIcs(ic.dataset.ics); return; }
    const tp = t.closest('[data-topico]');
    if (tp) { const k = tp.dataset.topico, n = Number(tp.dataset.nivel); S.marcarTopico(k, S.progresso()[k] === n ? 0 : n); ui.matAberta = k.split('|')[0]; refazer(`[data-topico="${CSS.escape(k)}"][data-nivel="${n}"]`); return; }
    const mk = t.closest('[data-marcar]'); if (mk) { S.marcarTopico(mk.dataset.marcar, 1); refazer(); toast('Tópico marcado como estudado.'); return; }
    const es = t.closest('[data-estudar]');
    if (es) { const [mid, top] = es.dataset.estudar.split('|'); S.iniciar(D.MATERIAS.some((m) => m.id === mid) ? mid : 'port', top, es.dataset.estudar); location.hash = 'estudo'; toast(`Cronômetro ligado: ${top}.`); return; }
    const rc = t.closest('[data-recalcular]');
    if (rc) { const c = concurso(rc.dataset.recalcular), pl = S.planoEstudo(c.slug); S.salvarPlanoEstudo(c.slug, gerarPlano(c, pl.horasSemana, pl.prova)); refazer('#sa-t'); toast('Plano recalculado a partir desta semana.'); return; }
    const f = t.closest('[data-filtro]'); if (f) { S.set('radarFiltro', f.dataset.filtro); render(); $(`[data-filtro=${f.dataset.filtro}]`).focus(); return; }
    const rv = t.closest('[data-rev]'); if (rv) { const e = Number(rv.dataset.rev); ui.revAberta = ui.revAberta === e ? null : e; render(); $(`[data-rev="${e}"]`).focus(); return; }
    const rk = t.closest('[data-rank]'); if (rk) { ui.rank = rk.dataset.rank; render(); $(`[data-rank=${ui.rank}]`).focus(); return; }
    const rs = t.closest('[data-resp]'); if (rs) { ui.quiz.respostas[ui.quiz.i] = Number(rs.dataset.resp); render(); const fb = $('.feedback'); if (fb) $('[data-act=proxima]').focus(); return; }
    const re = t.closest('[data-revisar]');
    if (re) {
      const ok = re.dataset.ok === '1', id = re.dataset.revisar, etapa = Number(re.dataset.etapa);
      const antes = S.concluirRevisao(id, etapa, ok); render();
      toast(ok ? 'Revisão feita. Próxima etapa agendada.' : 'Volta amanhã para você revisar de novo.', { rotulo: 'Desfazer', fn: () => { S.restaurarRevisao(id, etapa, antes); render(); } });
      return;
    }
    const b = t.closest('[data-act]'); if (!b) return;
    switch (b.dataset.act) {
      case 'al-add': {
        lerAlertasForm(); const i = $('#al-palavra'), w = i.value.trim();
        if (w.length < 3) { erros($('#f-alertas'), { 'al-palavra': 'Digite pelo menos 3 letras.' }); break; }
        if (!ui.alertas.palavras.some((x) => x.toLowerCase() === w.toLowerCase())) ui.alertas.palavras.push(w);
        refazer('#al-palavra'); break;
      }
      case 'ir-paravoce': ev.preventDefault(); S.set('radarFiltro', 'paravoce'); location.hash = 'radar'; break;
      case 'editar-plano-estudo': ui.editandoPlano = true; render(); $('#g-horas').focus(); break;
      case 'cancelar-plano': ui.editandoPlano = false; render(); break;
      case 'telegram': toast('Demonstração: o link do canal do Telegram entra aqui.'); break;
      case 'ver-analise': S.setAnalise({ banca: b.dataset.banca, materia: b.dataset.materia, cargo: 'todos' }); location.hash = 'analises'; break;
      case 'prova': toast('Na versão real, este botão leva à prova no site oficial da banca.'); break;
      case 'todos-cargos': S.setAnalise({ cargo: 'todos' }); render(); $('#sel-cargo').focus(); break;
      case 'pausar': S.pausar(); render(); $('[data-act=continuar]').focus(); break;
      case 'continuar': S.continuar(); render(); $('[data-act=pausar]').focus(); break;
      case 'encerrar': S.pausar(); ui.finalizando = true; render(); $('#f-q').focus(); break;
      case 'voltar-timer': ui.finalizando = false; render(); break;
      case 'erro-sem-foto': formErro(null); break;
      case 'fechar': $('#modal').close(); break;
      case 'checkin': {
        const r = S.resumoDia();
        if (!r.sessoes) { toast('Encerre ao menos uma sessão de estudo hoje para fazer o check-in.'); break; }
        S.registrarCheckin(); render(); toast(`Check-in feito: ${hm(r.minutos)}, ${r.questoes} questões, ${r.pct}% de acertos. Sequência de ${S.sequencia()} dias.`); break;
      }
      case 'fila': S.entrarFila(); render(); toast('Você está na fila do quiz de domingo.'); break;
      case 'sair-quiz': location.hash = 'grupos'; break;
      case 'refazer-quiz': ui.quiz = null; render(); break;
      case 'proxima': if (ui.quiz.i + 1 < D.QUIZ.length) ui.quiz.i++; else { ui.quiz.fim = true; const ac = ui.quiz.respostas.filter((r, i) => r === D.QUIZ[i].certa).length; S.registrarQuiz(ui.quiz.respostas, ac); } render(); { const h = view.querySelector('.q-enun, .score'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } } break;
      case 'reportar': {
        modal(`<form class="modal__box form" id="f-reporte" novalidate><h2 class="modal__t" id="modal-t">Reportar erro na questão ${ui.quiz.i + 1}</h2>
          <div class="field"><label class="field__label" for="rp-mot">O que está errado?</label><select class="field__input" id="rp-mot"><option>Gabarito errado</option><option>Artigo citado errado</option><option>Texto confuso</option><option>Outro</option></select></div>
          <div class="field"><label class="field__label" for="rp-txt">Conte em poucas palavras</label><textarea class="field__input" id="rp-txt" rows="3" aria-describedby="rp-txt-e"></textarea><p class="field__erro" id="rp-txt-e" hidden></p></div>
          <div class="modal__acts"><button class="btn btn--ghost btn--sm" type="button" data-act="fechar">Cancelar</button><button class="btn btn--primary btn--sm" type="submit">Enviar</button></div></form>`);
        $('#rp-txt').focus(); break;
      }
      case 'novo-grupo':
        modal(`<form class="modal__box form" id="f-grupo" novalidate><h2 class="modal__t" id="modal-t">Entrar em um grupo</h2>${campo('g-cod', 'Código do grupo', 'placeholder="Ex.: ESCRIT-24" autocomplete="off"')}
          <div class="modal__acts"><button class="btn btn--ghost btn--sm" type="button" data-act="fechar">Cancelar</button><button class="btn btn--primary btn--sm" type="submit">Entrar</button></div></form>`);
        $('#g-cod').focus(); break;
      case 'copiar-ref': { const i = $('#ref-link'); try { await navigator.clipboard.writeText(i.value); toast('Link copiado.'); } catch (e) { i.focus(); i.select(); toast('Link selecionado. Use Ctrl+C.'); } break; }
      case 'exportar': {
        const blob = new Blob([S.exportar()], { type: 'application/json' }); const u = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = u; a.download = 'aprova-hub-meus-dados.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000);
        toast('Arquivo com seus dados baixado.'); break;
      }
      case 'excluir': if (await confirmar('Excluir sua conta?', 'Na demonstração, isso apaga tudo o que você registrou neste aparelho e volta aos dados de exemplo.', 'Excluir', true)) { S.recomecar(); ui.quiz = null; location.hash = 'radar'; render(); toast('Conta de demonstração excluída e recomeçada.'); } break;
      case 'recomecar': if (await confirmar('Recomeçar a demonstração?', 'Tudo o que você registrou neste aparelho volta aos dados de exemplo.', 'Recomeçar', true)) { S.recomecar(); ui.quiz = null; render(); toast('Demonstração recomeçada.'); } break;
      case 'editar-plano': {
        const m = S.mentor();
        modal(`<form class="modal__box form" id="f-plano" novalidate><h2 class="modal__t" id="modal-t">Meta da semana por aluno</h2><div class="grid2">${campo('p-h', 'Horas', 'inputmode="numeric"', m.metaHoras)}${campo('p-q', 'Questões', 'inputmode="numeric"', m.metaQuestoes)}</div>
          <div class="modal__acts"><button class="btn btn--ghost btn--sm" type="button" data-act="fechar">Cancelar</button><button class="btn btn--primary btn--sm" type="submit">Salvar</button></div></form>`);
        $('#p-h').focus(); break;
      }
      case 'add-aluno':
        if (S.mentor().alunos.length >= D.MENTOR.limiteGratis) { paywallMentor(); break; }
        modal(`<form class="modal__box form" id="f-aluno" novalidate><h2 class="modal__t" id="modal-t">Adicionar aluno</h2>${campo('n-nome', 'Nome e sobrenome', 'autocomplete="off"')}${campo('n-tel', 'WhatsApp com DDD', 'inputmode="tel" placeholder="(61) 98000-0000"')}
          <p class="xs muted">Você usa ${S.mentor().alunos.length} de ${D.MENTOR.limiteGratis} vagas grátis.</p>
          <div class="modal__acts"><button class="btn btn--ghost btn--sm" type="button" data-act="fechar">Cancelar</button><button class="btn btn--primary btn--sm" type="submit">Adicionar</button></div></form>`);
        $('#n-nome').focus(); break;
      case 'nova-turma':
        modal(`<form class="modal__box form" id="f-turma" novalidate><h2 class="modal__t" id="modal-t">Criar nova turma</h2>${campo('t-nome', 'Nome da turma', 'placeholder="Ex.: Turma Agente de Polícia"')}
          <p class="xs muted">As vagas grátis (${D.MENTOR.limiteGratis} alunos) valem somando todas as turmas.</p>
          <div class="modal__acts"><button class="btn btn--ghost btn--sm" type="button" data-act="fechar">Cancelar</button><button class="btn btn--primary btn--sm" type="submit">Criar</button></div></form>`);
        $('#t-nome').focus(); break;
      default: break;
    }
  });

  document.addEventListener('toggle', (e) => { if (e.target.dataset && e.target.dataset.aluno) ui.alunoAberto = e.target.open ? e.target.dataset.aluno : null; if (e.target.dataset && e.target.dataset.mat && e.target.open) ui.matAberta = e.target.dataset.mat; }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'al-palavra') { e.preventDefault(); $('[data-act=al-add]').click(); } });

  document.addEventListener('change', async (ev) => {
    const el = ev.target;
    if (el.dataset.analise) { S.setAnalise({ [el.dataset.analise]: el.value }); render(); $('#' + el.id).focus(); }
    if (el.id === 'foto' && el.files && el.files[0]) {
      try { const foto = await reduzirFoto(el.files[0]); formErro(foto); }
      catch (e) { toast('Não foi possível ler a foto. Tente outra imagem.'); }
      el.value = '';
    }
  });

  document.addEventListener('submit', (ev) => {
    const f = ev.target; ev.preventDefault();
    const v = (id) => ($('#' + id, f) || {}).value?.trim() ?? '';
    const n = (id) => (/^\d+$/.test(v(id)) ? Number(v(id)) : NaN);
    if (f.id === 'f-alertas') {
      lerAlertasForm(); const a = ui.alertas;
      if (!a.areas.length && !a.palavras.length) { erros(f, { 'al-area': 'Escolha pelo menos uma área ou adicione um cargo.' }); $('[data-al-area]').focus(); return; }
      S.salvarAlertas(JSON.parse(JSON.stringify(a))); ui.alertas = null; S.set('radarFiltro', 'paravoce'); location.hash = 'radar'; toast('Alertas salvos. Veja o que combina com você.'); return;
    }
    if (f.id === 'f-gerar') {
      const er = {}; const h = n('g-horas'), pv = v('g-prova');
      if (!(h >= 2 && h <= 80)) er['g-horas'] = 'De 2 a 80 horas.';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(pv)) er['g-prova'] = 'Escolha a data da prova.'; else if (S.diasEntre(S.hoje(), pv) < 14) er['g-prova'] = 'A prova precisa estar a pelo menos 2 semanas.';
      if (!erros(f, er)) return;
      const c = concurso(f.dataset.slug); S.salvarPlanoEstudo(c.slug, gerarPlano(c, h, pv)); ui.editandoPlano = false; render(); toast('Plano gerado. Comece pela semana atual.'); return;
    }
    if (f.id === 'f-iniciar') { S.iniciar($('#i-mat').value, v('i-ass')); render(); $('[data-act=pausar]').focus(); toast(`Cronômetro ligado: ${mat($('#i-mat') ? $('#i-mat').value : S.cronometro().materia)}.`); }
    else if (f.id === 'f-sessao') {
      const er = {}; const min = n('f-min'), q = n('f-q'), a = n('f-a');
      if (!(min >= 1 && min <= 720)) er['f-min'] = 'Entre 1 e 720.';
      if (!(q >= 1)) er['f-q'] = 'Pelo menos 1.';
      if (Number.isNaN(a)) er['f-a'] = 'Informe (pode ser 0).'; else if (a > q) er['f-a'] = 'Não pode passar das questões.';
      if (!erros(f, er)) return;
      const c = S.cronometro(); S.registrarSessao({ materia: c.materia, assunto: c.assunto, minutos: min, questoes: q, acertos: a });
      if (c.topico && !(S.progresso()[c.topico] >= 1)) S.marcarTopico(c.topico, 1);
      S.descartar(); ui.finalizando = false; render();
      toast(`Sessão salva: ${q} questões, ${Math.round((a / q) * 100)}% de acertos.${c.topico ? ' Tópico marcado como estudado no plano.' : ''}`);
    } else if (f.id === 'f-erro') {
      const er = {}; if (v('e-ass').length < 3) er['e-ass'] = 'Escreva o assunto. Ex.: Habeas data'; if (v('e-anot').length < 10) er['e-anot'] = 'Anote o erro e a regra certa (10 letras ou mais).';
      if (!erros(f, er)) return;
      S.registrarErro({ materia: $('#e-mat').value, assunto: v('e-ass'), anotacao: v('e-anot'), foto: $('#modal').dataset.foto || null });
      $('#modal').close(); render(); toast('Erro salvo no caderno. Primeira revisão amanhã.');
    } else if (f.id === 'f-reporte') {
      if (!erros(f, v('rp-txt').length < 5 ? { 'rp-txt': 'Conte o problema em poucas palavras.' } : {})) return;
      S.reportar(ui.quiz.i, $('#rp-mot').value, v('rp-txt')); $('#modal').close(); toast('Obrigado! O erro foi reportado para revisão.');
    } else if (f.id === 'f-grupo') {
      if (!erros(f, /^[A-Za-z0-9-]{4,12}$/.test(v('g-cod')) ? {} : { 'g-cod': 'Use de 4 a 12 letras, números ou hífen.' })) return;
      $('#modal').close(); toast('Demonstração: na versão real, você entraria no grupo com esse código.');
    } else if (f.id === 'f-plano') {
      const er = {}; if (!(n('p-h') >= 1 && n('p-h') <= 80)) er['p-h'] = 'De 1 a 80.'; if (!(n('p-q') >= 1 && n('p-q') <= 2000)) er['p-q'] = 'De 1 a 2000.';
      if (!erros(f, er)) return; S.salvarPlanoMentor(n('p-h'), n('p-q')); $('#modal').close(); render(); toast('Meta da semana atualizada para a turma.');
    } else if (f.id === 'f-aluno') {
      const er = {}; if (v('n-nome').split(' ').filter(Boolean).length < 2) er['n-nome'] = 'Escreva nome e sobrenome.'; if (!/^\d{10,11}$/.test(v('n-tel').replace(/\D/g, ''))) er['n-tel'] = 'Use DDD e número.';
      if (!erros(f, er)) return; S.adicionarAluno(v('n-nome'), v('n-tel').replace(/\D/g, '')); $('#modal').close(); render(); toast('Convite enviado (simulado).');
    } else if (f.id === 'f-turma') {
      if (!erros(f, v('t-nome').length < 3 ? { 't-nome': 'Dê um nome para a turma.' } : {})) return;
      S.criarTurma(v('t-nome')); $('#modal').close(); toast(`Turma "${esc(v('t-nome'))}" criada. Convide os alunos pelo link.`);
    }
  });

  window.addEventListener('hashchange', render);
  render();
})();
