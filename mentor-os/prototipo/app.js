/* Mentor OS · interface (roteamento por hash, telas do aluno e do mentor). */
(function () {
  const S = window.Store;
  const R = window.Regras;
  const { MATERIAS, SIMULADO, util } = window.MOS_DATA;
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const view = $('#view');

  /* ---------- utilidades de texto ---------- */
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const dt = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtDia = (iso) => { const d = dt(iso); return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, '0')}`; };
  const fmtDiaSemana = (iso) => `${DIAS[dt(iso).getDay()]}, ${fmtDia(iso)}`;
  const fmtLongo = (iso) => { const d = dt(iso); return `${['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][d.getDay()]}, ${d.getDate()} de ${['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][d.getMonth()]}`; };
  const fmtMin = (min) => { const h = Math.floor(min / 60), m = Math.round(min % 60); return h ? (m ? `${h}h ${m}min` : `${h}h`) : `${m}min`; };
  const fmtHoras = (min) => (min / 60).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + 'h';
  const relDias = (iso) => {
    if (!iso) return 'nunca';
    const n = R.diasEntre(iso, S.hoje());
    return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`;
  };
  const primeiroNome = (n) => n.split(' ')[0];
  const nomeCurto = (n) => { const p = n.split(' '); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0]; };
  const iniciais = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const fmtTel = (t) => { const d = String(t).replace(/\D/g, ''); return d.length === 11 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : t; };
  const wa = (tel, texto) => `https://wa.me/${tel ? '55' + String(tel).replace(/\D/g, '') : ''}?text=${encodeURIComponent(texto)}`;
  const icon = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`;
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const semanaLabel = (seg) => `${fmtDia(seg)} a ${fmtDia(R.fimSemana(seg))}`;

  /* ---------- toasts e diálogo ---------- */
  function toast(msg, acao) {
    const box = $('#toasts');
    while (box.children.length >= 2) box.firstElementChild.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span>${msg}</span>` + (acao ? `<button type="button" class="toast__btn">${esc(acao.rotulo)}</button>` : '');
    if (acao) el.querySelector('button').addEventListener('click', () => { acao.fn(); el.remove(); });
    box.appendChild(el);
    setTimeout(() => el.remove(), acao ? 7000 : 4200);
  }

  function confirmar({ titulo, texto, ok = 'Confirmar', perigo = false }) {
    const d = $('#modal');
    d.innerHTML = `<form method="dialog" class="modal__box">
      <h2 id="modal-t" class="modal__t">${titulo}</h2>
      <p class="modal__p">${texto}</p>
      <div class="modal__acts">
        <button class="btn btn--ghost" value="cancel">Cancelar</button>
        <button class="btn ${perigo ? 'btn--danger' : 'btn--primary'}" value="ok">${ok}</button>
      </div></form>`;
    d.showModal();
    window.lucide && window.lucide.createIcons();
    return new Promise((res) => d.addEventListener('close', () => res(d.returnValue === 'ok'), { once: true }));
  }

  /* ---------- estado só da interface (não precisa salvar) ---------- */
  const ui = {
    checkin: 'idle', // idle | final | manual | ok
    ultimaSessao: null,
    simuladoAberto: false,
    filtroTurma: 'todos',
    busca: '',
    filtroErros: 'todas',
    relatorio: 'turma',
    planoSalvo: false,
    planoRascunho: null,
    msgTipo: null
  };

  /* ---------- rotas ---------- */
  const NAV = {
    aluno: [
      ['aluno/hoje', 'Hoje', 'timer'],
      ['aluno/ranking', 'Ranking', 'trophy'],
      ['aluno/simulado', 'Simulado', 'list-checks'],
      ['aluno/erros', 'Caderno de erros', 'notebook-pen']
    ],
    mentor: [
      ['mentor/turma', 'Turma', 'users'],
      ['mentor/plano', 'Plano da semana', 'calendar-range'],
      ['mentor/simulado', 'Simulado', 'list-checks'],
      ['mentor/relatorio', 'Relatório', 'file-text']
    ]
  };
  const TITULOS = {
    'aluno/hoje': 'Hoje', 'aluno/ranking': 'Ranking da semana', 'aluno/simulado': 'Simulado relâmpago', 'aluno/erros': 'Caderno de erros',
    'mentor/turma': 'Painel da turma', 'mentor/aluno': 'Detalhe do aluno', 'mentor/plano': 'Plano da semana', 'mentor/simulado': 'Resultados do simulado', 'mentor/relatorio': 'Relatório semanal'
  };

  function rota() {
    const h = location.hash.replace(/^#\/?/, '');
    const partes = h.split('/');
    if (partes[0] === 'mentor' && partes[1] === 'aluno' && partes[2]) return { nome: 'mentor/aluno', id: partes[2], papel: 'mentor' };
    const nome = partes.slice(0, 2).join('/');
    if (TITULOS[nome]) return { nome, papel: partes[0] };
    return null;
  }

  function irPara(h) { if (location.hash === '#' + h) render(); else location.hash = h; }

  function renderNav(r) {
    const papel = S.papel();
    const itens = NAV[papel];
    const ativo = r.nome === 'mentor/aluno' ? 'mentor/turma' : r.nome;
    const li = (classe) => itens.map(([h, t, i]) => `<li><a class="${classe}" href="#${h}" ${h === ativo ? 'aria-current="page"' : ''}>${icon(i)}<span>${t}</span>${badge(h)}</a></li>`).join('');
    $('#nav-side').innerHTML = li('nav-link');
    $('#nav-tab').innerHTML = li('tab-link');
    $$('[data-slot=papel]').forEach((el) => {
      el.innerHTML = `<div class="seg" role="group" aria-label="Escolha a visão">
        <button type="button" class="seg__btn" data-act="papel" data-papel="aluno" aria-pressed="${papel === 'aluno'}">${icon('graduation-cap')}<span>Sou aluno</span></button>
        <button type="button" class="seg__btn" data-act="papel" data-papel="mentor" aria-pressed="${papel === 'mentor'}">${icon('clipboard-list')}<span>Sou mentor</span></button>
      </div>`;
    });
    const sel = $('#aluno-demo');
    sel.innerHTML = S.alunos().map((a) => `<option value="${a.id}" ${a.id === S.alunoAtualId() ? 'selected' : ''}>${esc(a.nome)}</option>`).join('');
  }

  function badge(h) {
    if (h === 'aluno/erros') { const n = R.revisoesHoje(S.alunoAtualId()).length; return n ? `<span class="nav-badge" aria-label="${n} para revisar hoje">${n}</span>` : ''; }
    if (h === 'mentor/turma') { const n = S.alunos().filter((a) => R.situacao(a.id).tipo !== 'emdia').length; return n ? `<span class="nav-badge nav-badge--warn" aria-label="${n} alunos pedem atenção">${n}</span>` : ''; }
    return '';
  }

  let ultimaRota = null;

  /* Relógio único: atualiza o cronômetro da tela Hoje e o aviso fixo nas outras telas */
  setInterval(() => {
    if (!S.cronometro()) return;
    const t = cronoTexto(S.tempoCronometroMs());
    const a = $('#crono'); if (a) a.textContent = t;
    const b = $('#crono-mini'); if (b) b.textContent = t;
  }, 1000);

  function renderBanner(r) {
    const el = $('#crono-banner');
    const c = S.cronometro();
    if (!c || S.papel() !== 'aluno' || r.nome === 'aluno/hoje' || c.alunoId !== S.alunoAtualId()) { el.hidden = true; el.innerHTML = ''; return; }
    el.hidden = false;
    el.innerHTML = `<span class="crono-banner__txt">${icon(c.inicioMs ? 'timer' : 'pause')}<span>${c.inicioMs ? 'Estudando' : 'Pausado'}: ${R.materia(c.materia).nome} · <strong id="crono-mini">${cronoTexto(S.tempoCronometroMs())}</strong></span></span>
      <a class="crono-banner__btn" href="#aluno/hoje" aria-label="Abrir o cronômetro">Abrir</a>`;
  }

  function render() {
    const r = rota();
    if (!r) { location.replace('#' + (S.papel() === 'mentor' ? 'mentor/turma' : 'aluno/hoje')); return; }
    if (r.papel !== S.papel()) S.definirPapel(r.papel);
    const mudou = ultimaRota !== location.hash;
    if (mudou) { ui.simuladoAberto = !!(ui.simRascunho && ui.simRascunho.some((x) => x != null)); if (ui.checkin === 'ok') ui.checkin = 'idle'; ui.planoSalvo = false; }
    const telas = {
      'aluno/hoje': telaHoje, 'aluno/ranking': telaRanking, 'aluno/simulado': telaSimulado, 'aluno/erros': telaErros,
      'mentor/turma': telaTurma, 'mentor/aluno': telaAluno, 'mentor/plano': telaPlano, 'mentor/simulado': telaSimuladoMentor, 'mentor/relatorio': telaRelatorio
    };
    view.innerHTML = telas[r.nome](r);
    document.title = `${TITULOS[r.nome]} · Mentor OS`;
    renderNav(r);
    document.body.dataset.papel = S.papel();
    renderBanner(r);
    if (window.lucide) window.lucide.createIcons();
    if (r.nome === 'aluno/simulado' && ui.simRascunho) restaurarSimulado();
    if (mudou) {
      fecharMenu();
      window.scrollTo(0, 0);
      const h1 = view.querySelector('h1');
      if (ultimaRota !== null && h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
    ultimaRota = location.hash;
  }

  /* =====================================================================
     ALUNO · HOJE
     ===================================================================== */
  function opcoesMateria(sel) {
    return `<option value="">Escolha a matéria</option>` + MATERIAS.map((m) => `<option value="${m.id}" ${m.id === sel ? 'selected' : ''}>${m.nome}</option>`).join('');
  }

  function cronoTexto(ms) {
    const t = Math.floor(ms / 1000), h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  function blocoCheckin() {
    const c = S.cronometro();
    const aid = S.alunoAtualId();
    if (ui.checkin === 'ok' && ui.ultimaSessao) {
      const s = ui.ultimaSessao, seq = R.sequencia(aid);
      return `<section class="card card--ok" aria-labelledby="ck-t">
        <div class="ok-head"><span class="ok-ico">${icon('check')}</span><div>
          <h2 id="ck-t" class="card__t">Check-in feito</h2>
          <p class="muted">${R.materia(s.materia).nome} · ${fmtMin(s.minutos)} · ${s.questoes} questões, ${s.acertos} acertos (${pct(s.acertos, s.questoes)}%)</p></div></div>
        <p class="ok-streak">${icon('flame')} <strong>${seq.dias} ${seq.dias === 1 ? 'dia' : 'dias'}</strong> seguidos. Você somou <strong>${Math.min(s.acertos, R.REGRA.tetoAcertosDia)} pontos</strong> de acertos${seq.dias && S.sessoes(aid, S.hoje(), S.hoje()).length === 1 ? ` e <strong>${R.REGRA.pontosPorDia}</strong> pelo dia estudado` : ''}.</p>
        <div class="row-acts">
          <button class="btn btn--primary" type="button" data-act="nova-sessao">${icon('plus')} Registrar outra sessão</button>
          <a class="btn btn--ghost" href="#aluno/erros" data-act="ir-erro">${icon('notebook-pen')} Anotar um erro</a>
        </div>
      </section>`;
    }
    if (ui.checkin === 'final' || ui.checkin === 'manual') {
      const manual = ui.checkin === 'manual';
      const min = c ? Math.max(1, Math.round(S.tempoCronometroMs() / 60000)) : '';
      return `<section class="card" aria-labelledby="ck-t">
        <h2 id="ck-t" class="card__t">${manual ? 'Registrar estudo sem cronômetro' : 'Finalizar sessão'}</h2>
        <p class="muted small">A prova de estudo é o número de questões. Sem foto, sem print: só o que você fez.</p>
        <form id="form-sessao" class="form" novalidate>
          <div class="erro-resumo" id="sessao-erros" tabindex="-1" hidden></div>
          <div class="field">
            <label class="field__label" for="f-materia">Matéria</label>
            <select class="field__input" id="f-materia" name="materia" required aria-describedby="f-materia-e">${opcoesMateria(c ? c.materia : '')}</select>
            <p class="field__erro" id="f-materia-e" hidden></p>
          </div>
          <div class="grid3">
            <div class="field">
              <label class="field__label" for="f-min">Tempo (minutos)</label>
              <input class="field__input" id="f-min" name="minutos" inputmode="numeric" value="${min}" aria-describedby="${manual ? '' : 'f-min-h '}f-min-e" />
              ${manual ? '' : '<p class="field__hint" id="f-min-h">Esqueceu de pausar? Corrija aqui.</p>'}
              <p class="field__erro" id="f-min-e" hidden></p>
            </div>
            <div class="field">
              <label class="field__label" for="f-q">Questões feitas</label>
              <input class="field__input" id="f-q" name="questoes" inputmode="numeric" autocomplete="off" aria-describedby="f-q-e" />
              <p class="field__erro" id="f-q-e" hidden></p>
            </div>
            <div class="field">
              <label class="field__label" for="f-a">Acertos</label>
              <input class="field__input" id="f-a" name="acertos" inputmode="numeric" autocomplete="off" aria-describedby="f-a-e" />
              <p class="field__erro" id="f-a-e" hidden></p>
            </div>
          </div>
          <div class="row-acts">
            <button class="btn btn--primary" type="submit">${icon('check')} Salvar check-in</button>
            <button class="btn btn--ghost" type="button" data-act="voltar-crono">${manual ? 'Cancelar' : 'Voltar ao cronômetro'}</button>
          </div>
        </form>
      </section>`;
    }
    if (c) {
      const rodando = !!c.inicioMs;
      return `<section class="card card--crono" aria-labelledby="ck-t">
        <div class="crono-head"><h2 id="ck-t" class="card__t">${rodando ? 'Estudando agora' : 'Sessão pausada'}</h2>
          <span class="chip ${rodando ? 'chip--live' : ''}">${rodando ? '<span class="dot" aria-hidden="true"></span>Cronômetro ligado' : 'Pausado'}</span></div>
        <p class="crono" id="crono" aria-live="off">${cronoTexto(S.tempoCronometroMs())}</p>
        <div class="field field--inline">
          <label class="field__label" for="c-materia">Matéria</label>
          <select class="field__input field__input--sm" id="c-materia" data-act="crono-materia">${opcoesMateria(c.materia).replace('<option value="">Escolha a matéria</option>', '')}</select>
        </div>
        <div class="row-acts">
          ${rodando ? `<button class="btn btn--ghost" type="button" data-act="pausar">${icon('pause')} Pausar</button>` : `<button class="btn btn--ghost" type="button" data-act="continuar">${icon('play')} Continuar</button>`}
          <button class="btn btn--primary" type="button" data-act="finalizar">${icon('square')} Finalizar e registrar</button>
        </div>
        <button class="link-btn" type="button" data-act="descartar">Descartar esta sessão</button>
      </section>`;
    }
    return `<section class="card" aria-labelledby="ck-t">
      <h2 id="ck-t" class="card__t">Check-in de estudo</h2>
      <p class="muted">Ligue o cronômetro, estude e no fim conte quantas questões fez e acertou.</p>
      <form id="form-iniciar" class="form" novalidate>
        <div class="field">
          <label class="field__label" for="i-materia">O que você vai estudar agora?</label>
          <select class="field__input" id="i-materia" name="materia" aria-describedby="i-materia-e">${opcoesMateria(sugerirMateria())}</select>
          <p class="field__erro" id="i-materia-e" hidden></p>
        </div>
        <div class="row-acts">
          <button class="btn btn--primary btn--lg" type="submit">${icon('play')} Iniciar cronômetro</button>
          <button class="btn btn--ghost" type="button" data-act="manual">${icon('pencil')} Estudei sem cronômetro</button>
        </div>
      </form>
    </section>`;
  }

  function sugerirMateria() {
    const seg = R.semanaAtual(), p = S.plano(seg);
    if (!p) return '';
    const r = R.resumo(S.alunoAtualId(), seg);
    let melhor = null, menor = Infinity;
    p.metas.forEach((m) => { const f = ((r.porMateria[m.materia] || {}).questoes || 0) / (m.questoes || 1); if (f < menor) { menor = f; melhor = m.materia; } });
    return melhor || '';
  }

  function blocoPlanoAluno(aid) {
    const seg = R.semanaAtual(), p = S.plano(seg), r = R.resumo(aid, seg);
    if (!p) {
      return `<section class="card" aria-labelledby="pl-t"><h2 id="pl-t" class="card__t">Plano da semana</h2>
        <div class="vazio">${icon('calendar-x')}<p><strong>Seu mentor ainda não publicou o plano desta semana.</strong></p><p class="muted small">Enquanto isso, mantenha a sequência: qualquer matéria conta.</p></div></section>`;
    }
    const total = R.metaTotal(seg);
    return `<section class="card" aria-labelledby="pl-t">
      <div class="card__head"><h2 id="pl-t" class="card__t">Plano da semana</h2><span class="muted small">${semanaLabel(seg)}</span></div>
      ${p.recado ? `<blockquote class="recado">${icon('message-square-quote')}<p>${esc(p.recado)}<span class="recado__de">${esc(S.mentor().nome)}, seu mentor</span></p></blockquote>` : ''}
      <ul class="metas">
        ${p.metas.map((m) => {
          const f = r.porMateria[m.materia] || { questoes: 0, minutos: 0 };
          const pq = Math.min(100, pct(f.questoes, m.questoes));
          return `<li class="meta">
            <div class="meta__top"><span class="meta__nome">${R.materia(m.materia).nome}</span><span class="meta__num"><strong>${f.questoes}</strong> de ${m.questoes} questões</span></div>
            <div class="bar" role="progressbar" aria-label="${R.materia(m.materia).nome}: ${pq}% da meta de questões" aria-valuenow="${pq}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pq}%"></span></div>
            <p class="meta__sub muted small">${fmtHoras(f.minutos)} de ${m.horas}h ${pq >= 100 ? '· <span class="ok-txt">meta batida</span>' : ''}</p>
          </li>`;
        }).join('')}
      </ul>
      <p class="muted small">Total da semana: <strong>${r.questoes}</strong> de ${total.questoes} questões · ${fmtHoras(r.minutos)} de ${total.horas}h</p>
    </section>`;
  }

  function telaHoje() {
    const aid = S.alunoAtualId(), al = S.aluno(aid), hoje = S.hoje();
    const seq = R.sequencia(aid);
    const fila = R.revisoesHoje(aid);
    const seg = R.semanaAtual();
    const tent = S.tentativa(aid, seg);
    const hora = new Date().getHours();
    const saud = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
    const sessoesHoje = S.sessoes(aid, hoje, hoje).sort((a, b) => b.criadoEm - a.criadoEm);
    const ult14 = Array.from({ length: 14 }, (_, i) => util.addDias(hoje, i - 13));
    const datas = new Set(S.sessoes(aid, ult14[0], hoje).map((s) => s.data));

    return `<header class="page-head">
        <div><p class="eyebrow">${fmtLongo(hoje)}</p><h1 class="h1">${saud}, ${esc(primeiroNome(al.nome))}</h1></div>
        <span class="chip chip--streak">${icon('flame')} ${seq.dias} ${seq.dias === 1 ? 'dia seguido' : 'dias seguidos'}</span>
      </header>
      <div class="layout-2">
        <div class="col">
          ${blocoCheckin()}
          ${sessoesHoje.length ? `<section class="card" aria-labelledby="sh-t"><h2 id="sh-t" class="card__t">Sessões de hoje</h2>
            <ul class="lista">${sessoesHoje.map((s) => `<li class="lista__item">
              <span class="tag" style="--c:${R.materia(s.materia).cor}">${R.materia(s.materia).nome}</span>
              <span class="lista__txt">${fmtMin(s.minutos)} · ${s.questoes} questões · ${s.acertos} acertos</span>
              <button class="icon-btn icon-btn--sm" type="button" data-act="excluir-sessao" data-id="${s.id}" aria-label="Excluir sessão de ${R.materia(s.materia).nome}">${icon('trash-2')}</button></li>`).join('')}</ul></section>` : ''}
          ${blocoPlanoAluno(aid)}
        </div>
        <div class="col col--side">
          <section class="card card--streak" aria-labelledby="st-t">
            <h2 id="st-t" class="card__t card__t--sm">Sequência</h2>
            <p class="streak"><span class="streak__n">${seq.dias}</span> ${seq.dias === 1 ? 'dia seguido' : 'dias seguidos'}</p>
            <p class="small">${seq.fezHoje ? 'Hoje já conta. Até amanhã!' : seq.dias ? 'Faça um check-in hoje para não perder a sequência.' : 'Comece hoje: um check-in já abre a sequência.'}</p>
            <ol class="dots" aria-label="Últimos 14 dias">${ult14.map((d) => `<li class="dots__d ${datas.has(d) ? 'is-on' : ''} ${d === hoje ? 'is-hoje' : ''}" title="${fmtDiaSemana(d)}"><span class="sr-only">${fmtDiaSemana(d)}: ${datas.has(d) ? 'estudou' : 'sem registro'}</span></li>`).join('')}</ol>
          </section>
          <a class="card card--link" href="#aluno/erros">
            <span class="card-ico">${icon('notebook-pen')}</span>
            <span><strong>${fila.length ? `${fila.length} ${fila.length === 1 ? 'erro' : 'erros'} para revisar hoje` : 'Nada para revisar hoje'}</strong><span class="muted small block">Caderno de erros com revisão em 1, 7 e 21 dias</span></span>
            ${icon('chevron-right')}
          </a>
          <a class="card card--link" href="#aluno/simulado">
            <span class="card-ico">${icon('list-checks')}</span>
            <span><strong>${tent ? `Simulado feito: ${tent.acertos} de 10` : 'Simulado relâmpago da semana'}</strong><span class="muted small block">${tent ? 'Veja as correções' : '10 questões, corrige na hora, entra no ranking'}</span></span>
            ${icon('chevron-right')}
          </a>
          <a class="card card--link" href="#aluno/ranking">
            <span class="card-ico">${icon('trophy')}</span>
            <span><strong>Faixa ${R.ranking(seg).lista.find((l) => l.aluno.id === aid).faixa.nome}</strong><span class="muted small block">Ranking da turma premia acertos e constância</span></span>
            ${icon('chevron-right')}
          </a>
        </div>
      </div>`;
  }

  function restaurarSimulado() {
    const f = $('#form-simulado'); if (!f) return;
    ui.simRascunho.forEach((v, i) => { if (v != null) { const inp = f.querySelector(`input[name=q${i}][value="${v}"]`); if (inp) inp.checked = true; } });
    contarSimulado();
  }
  function contarSimulado() {
    const n = $$('#form-simulado input:checked').length;
    $('#sim-cont').textContent = `${n} de 10 respondidas${n && n < 10 ? ' · suas respostas ficam guardadas se você sair desta tela' : ''}`; $('#sim-prog').style.width = n * 10 + '%';
  }

  function mostrarErros(form, erros, resumoId) {
    $$('.field__erro', form).forEach((p) => { p.hidden = true; p.textContent = ''; });
    $$('[aria-invalid]', form).forEach((i) => i.removeAttribute('aria-invalid'));
    const box = resumoId ? $('#' + resumoId) : null;
    const chaves = Object.keys(erros);
    if (!chaves.length) { if (box) box.hidden = true; return true; }
    chaves.forEach((id) => {
      const inp = $('#' + id, form); const p = $('#' + id + '-e', form);
      if (inp) inp.setAttribute('aria-invalid', 'true');
      if (p) { p.hidden = false; p.innerHTML = icon('circle-alert') + esc(erros[id]); }
    });
    if (box) {
      box.hidden = false;
      box.innerHTML = `<p><strong>${chaves.length === 1 ? 'Falta corrigir 1 campo' : `Faltam corrigir ${chaves.length} campos`}</strong></p><ul>${chaves.map((id) => `<li><a href="#${id}" data-foco="${id}">${esc(erros[id])}</a></li>`).join('')}</ul>`;
    }
    window.lucide && window.lucide.createIcons();
    const primeiro = $('#' + chaves[0], form);
    if (primeiro) primeiro.focus();
    return false;
  }

  const inteiro = (v) => (/^\d+$/.test(String(v).trim()) ? Number(v) : NaN);

  function salvarSessao(form) {
    const f = Object.fromEntries(new FormData(form));
    const erros = {};
    const min = inteiro(f.minutos), q = inteiro(f.questoes), a = inteiro(f.acertos);
    if (!f.materia) erros['f-materia'] = 'Escolha a matéria que você estudou.';
    if (!(min >= 1 && min <= 720)) erros['f-min'] = 'Informe o tempo em minutos, entre 1 e 720. Ex.: 50';
    if (Number.isNaN(q) || q < 1) erros['f-q'] = 'Informe quantas questões você fez (pelo menos 1). Ex.: 20';
    else if (q > 500) erros['f-q'] = 'Confira o número: mais de 500 questões numa sessão.';
    if (Number.isNaN(a)) erros['f-a'] = 'Informe quantas você acertou. Pode ser 0.';
    else if (!Number.isNaN(q) && a > q) erros['f-a'] = `Os acertos não podem passar das questões feitas (${q}).`;
    if (!mostrarErros(form, erros, 'sessao-erros')) return;
    const s = S.registrarSessao({ alunoId: S.alunoAtualId(), materia: f.materia, minutos: min, questoes: q, acertos: a });
    S.descartarCronometro();
    ui.checkin = 'ok'; ui.ultimaSessao = s;
    render();
    toast('Check-in salvo.');
    const t = $('#ck-t'); if (t) { t.setAttribute('tabindex', '-1'); t.focus(); }
  }

  /* =====================================================================
     ALUNO · RANKING
     ===================================================================== */
  function telaRanking() {
    const aid = S.alunoAtualId();
    const seg = R.semanaAtual();
    const { lista, corte } = R.ranking(seg);
    const eu = lista.find((l) => l.aluno.id === aid);
    const diasPassados = R.diasEntre(seg, S.hoje());
    const segPassada = util.addDias(seg, -7);
    const antes = R.pontos(aid, segPassada, util.addDias(segPassada, diasPassados));
    const delta = eu.total - antes.total;
    const rAgora = R.resumo(aid, seg), rAntes = R.resumo(aid, segPassada, util.addDias(segPassada, diasPassados));
    const idx = R.FAIXAS.findIndex((f) => f.id === eu.faixa.id);
    const proxima = idx > 0 ? R.FAIXAS[idx - 1] : null;
    const falta = proxima ? Math.max(1, corte[proxima.id] - eu.total + 1) : 0;
    const semanas = [3, 2, 1, 0].map((k) => { const s = util.addDias(seg, -7 * k); return { s, p: R.pontos(aid, s).total }; });
    const max = Math.max(...semanas.map((x) => x.p), 1);

    return `<header class="page-head"><div><p class="eyebrow">Semana de ${semanaLabel(seg)}</p><h1 class="h1">Ranking da turma</h1></div></header>
      <div class="layout-2">
        <div class="col">
          <section class="card card--faixa faixa--${eu.faixa.id}" aria-labelledby="fx-t">
            <p class="eyebrow">Sua faixa nesta semana</p>
            <h2 id="fx-t" class="faixa__nome">${eu.faixa.nome}</h2>
            <p class="faixa__pts"><strong>${eu.total}</strong> pontos · ${eu.dias} ${eu.dias === 1 ? 'dia' : 'dias'} com check-in</p>
            <p class="small">${proxima ? `Faltam <strong>${falta} pontos</strong> para a faixa ${proxima.nome}. Um dia de estudo vale ${R.REGRA.pontosPorDia} pontos mais os seus acertos.` : 'Você está entre quem mais pontuou. Manter a sequência é o que segura a faixa.'}</p>
          </section>

          <section class="card" aria-labelledby="ev-t">
            <h2 id="ev-t" class="card__t">Sua evolução</h2>
            <p class="muted small">Comparando com a semana passada até o mesmo dia.</p>
            <dl class="kpis kpis--3">
              <div class="kpi"><dt>Pontos</dt><dd>${eu.total}<span class="delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta}</span></dd></div>
              <div class="kpi"><dt>Acerto</dt><dd>${rAgora.pct ?? '–'}%${rAgora.pct != null && rAntes.pct != null ? `<span class="delta ${rAgora.pct >= rAntes.pct ? 'up' : 'down'}">${rAgora.pct >= rAntes.pct ? '+' : ''}${rAgora.pct - rAntes.pct} p.p.</span>` : ''}</dd></div>
              <div class="kpi"><dt>Dias estudados</dt><dd>${rAgora.dias}<span class="delta ${rAgora.dias >= rAntes.dias ? 'up' : 'down'}">${rAgora.dias >= rAntes.dias ? '+' : ''}${rAgora.dias - rAntes.dias}</span></dd></div>
            </dl>
            <figure class="mini-chart" aria-label="Pontos nas últimas 4 semanas">
              ${semanas.map((x, i) => `<div class="mini-chart__col"><span class="mini-chart__v">${x.p}</span><span class="mini-chart__bar ${i === 3 ? 'is-now' : ''}" style="height:${Math.max(4, (x.p / max) * 100)}%"></span><span class="mini-chart__l">${i === 3 ? 'esta' : fmtDia(x.s)}</span></div>`).join('')}
            </figure>
          </section>

          <section class="card" aria-labelledby="rg-t">
            <h2 id="rg-t" class="card__t">Como os pontos funcionam</h2>
            <ul class="regra">
              <li>${icon('circle-check')}<span><strong>1 ponto por acerto</strong> nas questões do check-in (até ${R.REGRA.tetoAcertosDia} por dia).</span></li>
              <li>${icon('flame')}<span><strong>${R.REGRA.pontosPorDia} pontos por dia</strong> com pelo menos um check-in. Constância vale mais que maratona.</span></li>
              <li>${icon('list-checks')}<span><strong>${R.REGRA.pontosPorAcertoSimulado} pontos por acerto</strong> no simulado relâmpago da semana.</span></li>
              <li>${icon('clock')}<span>Horas estudadas <strong>não dão pontos sozinhas</strong>: elas aparecem no seu histórico e para o mentor.</span></li>
            </ul>
            <p class="muted small">Sem prêmio em dinheiro. O reconhecimento é a faixa e o destaque no relatório da turma. A turma é dividida em três faixas do mesmo tamanho e o ranking zera toda segunda.</p>
          </section>
        </div>
        <div class="col col--side">
          <section class="card" aria-labelledby="tm-t">
            <h2 id="tm-t" class="card__t">Turma por faixa</h2>
            <p class="muted small">Mostramos faixas, não posições, para ninguém se sentir no fim da fila.</p>
            ${R.FAIXAS.map((f) => `<h3 class="faixa-t faixa--${f.id}">${f.nome}</h3>
              <ul class="rank">${lista.filter((l) => l.faixa.id === f.id).map((l) => `<li class="rank__i ${l.aluno.id === aid ? 'is-eu' : ''}">
                <span class="avatar" aria-hidden="true">${iniciais(l.aluno.nome)}</span>
                <span class="rank__n">${l.aluno.id === aid ? 'Você' : esc(nomeCurto(l.aluno.nome))}</span>
                <span class="rank__p">${l.total} pts</span></li>`).join('')}</ul>`).join('')}
          </section>
        </div>
      </div>`;
  }

  /* =====================================================================
     ALUNO · SIMULADO
     ===================================================================== */
  function telaSimulado() {
    const aid = S.alunoAtualId(), seg = R.semanaAtual();
    const t = S.tentativa(aid, seg);
    if (t) return resultadoSimulado(t);
    if (!ui.simuladoAberto) {
      return `<header class="page-head"><div><p class="eyebrow">Semana de ${semanaLabel(seg)}</p><h1 class="h1">Simulado relâmpago</h1></div></header>
        <section class="card card--hero" aria-labelledby="si-t">
          <h2 id="si-t" class="card__t">10 questões, cerca de 15 minutos</h2>
          <ul class="regra">
            <li>${icon('book-open')}<span>Português, raciocínio lógico e direito constitucional básico.</span></li>
            <li>${icon('circle-check')}<span>Corrige na hora, com a explicação de cada questão.</span></li>
            <li>${icon('trophy')}<span>Cada acerto vale ${R.REGRA.pontosPorAcertoSimulado} pontos no ranking. Uma tentativa por semana.</span></li>
            <li>${icon('notebook-pen')}<span>O que errar, você manda para o caderno de erros com um toque.</span></li>
          </ul>
          <button class="btn btn--primary btn--lg" type="button" data-act="abrir-simulado">${icon('play')} Começar simulado</button>
          <p class="muted small">Questões fictícias, criadas para esta demonstração.</p>
        </section>`;
    }
    return `<header class="page-head"><div><p class="eyebrow">Simulado relâmpago · semana de ${semanaLabel(seg)}</p><h1 class="h1">Responda as 10 questões</h1></div></header>
      <form id="form-simulado" class="sim" novalidate>
        <div class="sim__bar" aria-live="polite"><span id="sim-cont">0 de 10 respondidas</span><span class="bar bar--thin" aria-hidden="true"><span id="sim-prog" style="width:0%"></span></span></div>
        <div class="erro-resumo" id="sim-erros" tabindex="-1" hidden></div>
        ${SIMULADO.map((q, i) => `<fieldset class="card q" id="q-${i}">
          <legend class="q__leg"><span class="q__n">Questão ${i + 1}</span><span class="tag" style="--c:${R.materia(q.materia).cor}">${R.materia(q.materia).nome}</span></legend>
          <p class="q__enun">${esc(q.enunciado)}</p>
          <div class="opts">${q.opcoes.map((o, k) => `<label class="opt"><input type="radio" name="q${i}" value="${k}" /><span class="opt__l">${'ABCD'[k]}</span><span>${esc(o)}</span></label>`).join('')}</div>
        </fieldset>`).join('')}
        <div class="row-acts sim__fim">
          <button class="btn btn--primary btn--lg" type="submit">${icon('send')} Enviar e corrigir</button>
          <button class="btn btn--ghost" type="button" data-act="fechar-simulado">Sair sem enviar</button>
        </div>
      </form>`;
  }

  function resultadoSimulado(t) {
    const seg = R.semanaAtual();
    const media = (() => { const ts = S.tentativas(seg); return ts.length ? (ts.reduce((s, x) => s + x.acertos, 0) / ts.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '–'; })();
    const jaNoCaderno = new Set(S.erros(S.alunoAtualId()).map((e) => e.origemId).filter(Boolean));
    return `<header class="page-head"><div><p class="eyebrow">Simulado relâmpago · semana de ${semanaLabel(seg)}</p><h1 class="h1">Resultado do simulado</h1></div></header>
      <section class="card card--score" aria-labelledby="sc-t">
        <div class="score"><span class="score__n" id="sc-t">${t.acertos}<small>/10</small></span>
          <div><p><strong>+${t.acertos * R.REGRA.pontosPorAcertoSimulado} pontos</strong> no ranking da semana.</p>
          <p class="muted small">Média da turma até agora: ${media} acertos. Próximo simulado na segunda.</p></div></div>
      </section>
      <h2 class="h2">Correção</h2>
      <ol class="corr">${SIMULADO.map((q, i) => {
        const r = t.respostas[i], ok = r === q.certa;
        return `<li class="card corr__i ${ok ? 'is-ok' : 'is-erro'}">
          <div class="corr__head"><span class="corr__st">${icon(ok ? 'circle-check' : 'circle-x')} Questão ${i + 1}: ${ok ? 'acertou' : 'errou'}</span><span class="tag" style="--c:${R.materia(q.materia).cor}">${R.materia(q.materia).nome}</span></div>
          <p class="q__enun">${esc(q.enunciado)}</p>
          ${ok ? `<p class="small"><strong>Resposta:</strong> ${esc(q.opcoes[q.certa])}</p>` : `<p class="small"><strong>Sua resposta:</strong> ${r == null ? 'em branco' : esc(q.opcoes[r])}</p><p class="small"><strong>Certa:</strong> ${esc(q.opcoes[q.certa])}</p>`}
          <p class="explic">${esc(q.explicacao)}</p>
          ${ok ? '' : jaNoCaderno.has(q.id + t.semana) ? `<p class="ok-txt small">${icon('check')} Já está no caderno de erros</p>` : `<button class="btn btn--ghost btn--sm" type="button" data-act="sim-caderno" data-q="${i}">${icon('notebook-pen')} Mandar para o caderno de erros</button>`}
        </li>`;
      }).join('')}</ol>`;
  }

  function enviarSimulado(form, forcar) {
    const respostas = SIMULADO.map((q, i) => { const v = form.querySelector(`input[name=q${i}]:checked`); return v ? Number(v.value) : null; });
    const vazias = respostas.map((r, i) => (r == null ? i : -1)).filter((i) => i >= 0);
    const box = $('#sim-erros');
    if (vazias.length && !forcar) {
      box.hidden = false;
      box.innerHTML = `<p><strong>${vazias.length === 1 ? 'Falta responder 1 questão' : `Faltam responder ${vazias.length} questões`}</strong>. Em branco conta como erro.</p>
        <ul>${vazias.map((i) => `<li><a href="#q-${i}" data-foco-q="${i}">Questão ${i + 1}</a></li>`).join('')}</ul>
        <button class="btn btn--ghost btn--sm" type="button" data-act="sim-forcar">Enviar mesmo assim</button>`;
      $$('.q', form).forEach((f, i) => f.classList.toggle('is-vazia', vazias.includes(i)));
      box.focus();
      return;
    }
    const acertos = respostas.filter((r, i) => r === SIMULADO[i].certa).length;
    S.registrarTentativa(S.alunoAtualId(), R.semanaAtual(), respostas, acertos);
    ui.simuladoAberto = false; ui.simRascunho = null;
    render();
    toast(`Simulado corrigido: ${acertos} de 10. +${acertos * R.REGRA.pontosPorAcertoSimulado} pontos no ranking.`);
    $('#sc-t') && ($('#sc-t').setAttribute('tabindex', '-1'), $('#sc-t').focus());
  }

  /* =====================================================================
     ALUNO · CADERNO DE ERROS
     ===================================================================== */
  function etapasHtml(e) {
    return `<ol class="etapas" aria-label="Revisões">${e.revisoes.map((r) => `<li class="etapa ${r.feita ? 'is-feita' : ''}"><span>${r.etapa}d</span><span class="sr-only">${r.feita ? 'feita' : 'pendente, ' + fmtDia(r.data)}</span></li>`).join('')}</ol>`;
  }

  function telaErros() {
    const aid = S.alunoAtualId(), hoje = S.hoje();
    const fila = R.revisoesHoje(aid);
    const todos = S.erros(aid);
    const filtrados = ui.filtroErros === 'todas' ? todos : todos.filter((e) => e.materia === ui.filtroErros);
    const prox = todos.map((e) => R.proximaRevisao(e)).filter((r) => r && r.data > hoje).sort((a, b) => (a.data < b.data ? -1 : 1))[0];

    return `<header class="page-head"><div><p class="eyebrow">Revisão em 1, 7 e 21 dias</p><h1 class="h1">Caderno de erros</h1></div>
        <a class="btn btn--primary" href="#novo-erro" data-act="foco-novo">${icon('plus')} Registrar erro</a></header>
      <div class="layout-2">
        <div class="col">
          <section class="card" aria-labelledby="rv-t">
            <div class="card__head"><h2 id="rv-t" class="card__t">Revisar hoje</h2>${fila.length ? `<span class="chip chip--warn">${fila.length} na fila</span>` : ''}</div>
            ${fila.length ? `<ul class="fila">${fila.map(({ erro: e, revisao: r, atraso }) => `<li class="fila__i">
                <div class="fila__top"><span class="tag" style="--c:${R.materia(e.materia).cor}">${R.materia(e.materia).nome}</span><span class="small muted">Revisão de ${r.etapa} ${r.etapa === 1 ? 'dia' : 'dias'}${atraso ? ` · atrasada ${atraso} ${atraso === 1 ? 'dia' : 'dias'}` : ''}</span></div>
                <h3 class="fila__t">${esc(e.assunto)}</h3>
                <details class="fila__nota"><summary>Ver minha anotação</summary><p>${esc(e.anotacao)}</p></details>
                <div class="row-acts">
                  <button class="btn btn--primary btn--sm" type="button" data-act="revisar" data-id="${e.id}" data-etapa="${r.etapa}" data-ok="1">${icon('check')} Revisei e acertei</button>
                  <button class="btn btn--ghost btn--sm" type="button" data-act="revisar" data-id="${e.id}" data-etapa="${r.etapa}" data-ok="0">${icon('rotate-ccw')} Ainda erro, revisar amanhã</button>
                </div></li>`).join('')}</ul>`
              : `<div class="vazio">${icon('party-popper')}<p><strong>Nada para revisar hoje.</strong></p><p class="muted small">${prox ? `Próxima revisão: ${fmtDiaSemana(prox.data)}.` : 'Registre um erro e ele volta para você amanhã.'}</p></div>`}
          </section>

          <section class="card" aria-labelledby="ne-t" id="novo-erro">
            <h2 id="ne-t" class="card__t">Registrar uma questão que errei</h2>
            <form id="form-erro" class="form" novalidate>
              <div class="grid2">
                <div class="field"><label class="field__label" for="e-materia">Matéria</label>
                  <select class="field__input" id="e-materia" name="materia" aria-describedby="e-materia-e">${opcoesMateria('')}</select><p class="field__erro" id="e-materia-e" hidden></p></div>
                <div class="field"><label class="field__label" for="e-assunto">Assunto</label>
                  <input class="field__input" id="e-assunto" name="assunto" maxlength="80" placeholder="Ex.: crase antes de horas" aria-describedby="e-assunto-e" /><p class="field__erro" id="e-assunto-e" hidden></p></div>
              </div>
              <div class="field"><label class="field__label" for="e-anot">O que errei e qual é a regra certa</label>
                <textarea class="field__input" id="e-anot" name="anotacao" rows="3" maxlength="600" aria-describedby="e-anot-h e-anot-e"></textarea>
                <p class="field__hint" id="e-anot-h">Escreva com suas palavras. É isso que você vai reler na revisão.</p>
                <p class="field__erro" id="e-anot-e" hidden></p></div>
              <button class="btn btn--primary" type="submit">${icon('save')} Salvar no caderno</button>
            </form>
          </section>
        </div>
        <div class="col col--side">
          <section class="card" aria-labelledby="te-t">
            <h2 id="te-t" class="card__t">Todos os erros <span class="muted small">(${todos.length})</span></h2>
            <label class="field__label" for="f-erros">Filtrar por matéria</label>
            <select class="field__input field__input--sm" id="f-erros" data-act="filtro-erros"><option value="todas">Todas as matérias</option>${MATERIAS.map((m) => `<option value="${m.id}" ${ui.filtroErros === m.id ? 'selected' : ''}>${m.nome}</option>`).join('')}</select>
            ${filtrados.length ? `<ul class="erros">${filtrados.map((e) => { const p = R.proximaRevisao(e); return `<li class="erros__i">
              <div class="erros__top"><span class="tag" style="--c:${R.materia(e.materia).cor}">${R.materia(e.materia).nome}</span>${etapasHtml(e)}</div>
              <p class="erros__t">${esc(e.assunto)}</p>
              <p class="small muted">${p ? `Próxima revisão: ${p.data <= hoje ? '<strong>hoje</strong>' : fmtDiaSemana(p.data)}` : '<span class="ok-txt">Revisões completas</span>'}</p></li>`; }).join('')}</ul>`
              : `<div class="vazio vazio--sm">${icon('search-x')}<p><strong>Nenhum erro ${ui.filtroErros === 'todas' ? 'registrado ainda' : 'nesta matéria'}.</strong></p>${ui.filtroErros !== 'todas' ? '<button class="link-btn" type="button" data-act="limpar-filtro-erros">Ver todas as matérias</button>' : '<p class="muted small">Errar e anotar é o jeito mais rápido de não errar de novo.</p>'}</div>`}
          </section>
        </div>
      </div>`;
  }

  function salvarErro(form) {
    const f = Object.fromEntries(new FormData(form));
    const erros = {};
    if (!f.materia) erros['e-materia'] = 'Escolha a matéria.';
    if (!f.assunto || f.assunto.trim().length < 3) erros['e-assunto'] = 'Escreva o assunto em poucas palavras. Ex.: crase antes de horas';
    if (!f.anotacao || f.anotacao.trim().length < 10) erros['e-anot'] = 'Anote o que errou e a regra certa (pelo menos 10 letras).';
    if (!mostrarErros(form, erros)) return;
    S.registrarErro({ alunoId: S.alunoAtualId(), materia: f.materia, assunto: f.assunto, anotacao: f.anotacao });
    ui.filtroErros = 'todas';
    render();
    toast('Erro salvo no caderno. A primeira revisão é amanhã.');
  }

  /* =====================================================================
     MENTOR · TURMA
     ===================================================================== */
  function chipSituacao(s) {
    if (s.tipo === 'sumiu') return `<span class="chip chip--danger">${icon('user-x')} ${s.semAtividade == null ? 'Sem atividade' : `Sumiu há ${s.semAtividade} dias`}</span>`;
    if (s.tipo === 'abaixo') return `<span class="chip chip--warn">${icon('trending-down')} Abaixo da meta</span>`;
    return `<span class="chip chip--ok">${icon('check')} Em dia</span>`;
  }

  function telaTurma() {
    const seg = R.semanaAtual(), hoje = S.hoje();
    const alunos = S.alunos();
    const dados = alunos.map((a) => ({ a, s: R.situacao(a.id) }));
    const sumiram = dados.filter((d) => d.s.tipo === 'sumiu');
    const abaixo = dados.filter((d) => d.s.tipo === 'abaixo');
    const qTurma = dados.reduce((t, d) => t + d.s.resumo.questoes, 0);
    const acTurma = dados.reduce((t, d) => t + d.s.resumo.acertos, 0);
    const hojeN = alunos.filter((a) => S.sessoes(a.id, hoje, hoje).length).length;
    const simN = S.tentativas(seg).length;
    let lista = dados;
    if (ui.filtroTurma !== 'todos') lista = lista.filter((d) => d.s.tipo === ui.filtroTurma);
    if (ui.busca) lista = lista.filter((d) => d.a.nome.toLowerCase().includes(ui.busca.toLowerCase()));
    const ordem = { sumiu: 0, abaixo: 1, emdia: 2 };
    lista = lista.slice().sort((x, y) => ordem[x.s.tipo] - ordem[y.s.tipo] || x.a.nome.localeCompare(y.a.nome));
    const meta = R.metaTotal(seg).questoes;
    const filtros = [['todos', 'Todos', alunos.length], ['sumiu', 'Sumiram', sumiram.length], ['abaixo', 'Abaixo da meta', abaixo.length], ['emdia', 'Em dia', dados.length - sumiram.length - abaixo.length]];

    const alerta = (titulo, ico, cls, itens, vazio) => `<section class="card alerta alerta--${cls}" aria-labelledby="al-${cls}">
      <h2 class="card__t card__t--sm" id="al-${cls}">${icon(ico)} ${titulo} <span class="alerta__n">${itens.length}</span></h2>
      ${itens.length ? `<ul class="alerta__l">${itens.map(({ a, s }) => `<li><a href="#mentor/aluno/${a.id}">${esc(a.nome)}</a><span class="small muted">${cls === 'sumiu' ? `última atividade ${relDias(s.ult)}` : `${s.feito} de ${s.esperado} questões esperadas`}</span></li>`).join('')}</ul>` : `<p class="small muted">${vazio}</p>`}
    </section>`;

    return `<header class="page-head"><div><p class="eyebrow">${esc(S.mentor().turma)} · semana de ${semanaLabel(seg)}</p><h1 class="h1">Painel da turma</h1></div>
        <button class="btn btn--primary" type="button" data-act="add-aluno">${icon('user-plus')} Adicionar aluno</button></header>
      <dl class="kpis kpis--4">
        <div class="kpi card"><dt>Estudaram hoje</dt><dd>${hojeN}<small> de ${alunos.length}</small></dd></div>
        <div class="kpi card"><dt>Questões na semana</dt><dd>${qTurma.toLocaleString('pt-BR')}</dd></div>
        <div class="kpi card"><dt>Acerto médio</dt><dd>${pct(acTurma, qTurma)}%</dd></div>
        <div class="kpi card"><dt>Fizeram o simulado</dt><dd>${simN}<small> de ${alunos.length}</small></dd></div>
      </dl>
      <div class="alertas">
        ${alerta('Sumiram há 3 dias ou mais', 'user-x', 'sumiu', sumiram, 'Ninguém sumiu. Boa!')}
        ${alerta('Abaixo da meta', 'trending-down', 'abaixo', abaixo, 'Todo mundo no ritmo do plano.')}
      </div>
      <p class="muted small regra-txt">${icon('info')} "Sumiu": nenhum check-in há ${R.REGRA.diasSumiu} dias ou mais. "Abaixo da meta": menos de ${Math.round(R.REGRA.limiteMeta * 100)}% das questões esperadas até hoje (meta da semana: ${meta} questões).</p>

      <section class="card" aria-labelledby="al-t">
        <div class="card__head"><h2 id="al-t" class="card__t">Alunos</h2>
          <div class="busca"><label class="sr-only" for="busca">Buscar aluno</label>${icon('search')}<input class="field__input field__input--sm" id="busca" type="search" placeholder="Buscar aluno" value="${esc(ui.busca)}" data-act="busca" /></div></div>
        <div class="chips" role="group" aria-label="Filtrar alunos">${filtros.map(([v, t, n]) => `<button type="button" class="fchip" data-act="filtro-turma" data-v="${v}" aria-pressed="${ui.filtroTurma === v}">${t} <span>${n}</span></button>`).join('')}</div>
        <p class="sr-only" aria-live="polite" id="turma-cont">${lista.length} alunos na lista</p>
        ${lista.length ? `<div class="tabela-wrap"><table class="tabela">
          <thead><tr><th scope="col">Aluno</th><th scope="col">Última atividade</th><th scope="col">Horas</th><th scope="col">Questões</th><th scope="col">Acerto</th><th scope="col">Situação</th></tr></thead>
          <tbody>${lista.map(({ a, s }) => `<tr>
            <th scope="row"><a class="aluno-link" href="#mentor/aluno/${a.id}"><span class="avatar" aria-hidden="true">${iniciais(a.nome)}</span>${esc(a.nome)}</a></th>
            <td data-l="Última atividade">${relDias(s.ult)}</td>
            <td data-l="Horas">${fmtHoras(s.resumo.minutos)}</td>
            <td data-l="Questões">${s.resumo.questoes}<span class="muted small"> de ${meta}</span></td>
            <td data-l="Acerto">${s.resumo.pct == null ? '–' : s.resumo.pct + '%'}</td>
            <td data-l="Situação">${chipSituacao(s)}</td></tr>`).join('')}</tbody></table></div>`
          : `<div class="vazio">${icon('search-x')}<p><strong>Nenhum aluno encontrado com esse filtro.</strong></p><button class="btn btn--ghost btn--sm" type="button" data-act="limpar-turma">Limpar filtro e busca</button></div>`}
      </section>`;
  }

  function dialogAddAluno() {
    const d = $('#modal');
    d.innerHTML = `<form class="modal__box" id="form-aluno" novalidate>
      <h2 id="modal-t" class="modal__t">Adicionar aluno à turma</h2>
      <p class="modal__p">O aluno usa de graça. Na versão com login ele recebe um convite pelo WhatsApp.</p>
      <div class="field"><label class="field__label" for="n-nome">Nome completo</label><input class="field__input" id="n-nome" name="nome" autocomplete="off" aria-describedby="n-nome-e" /><p class="field__erro" id="n-nome-e" hidden></p></div>
      <div class="field"><label class="field__label" for="n-tel">WhatsApp com DDD</label><input class="field__input" id="n-tel" name="telefone" inputmode="tel" placeholder="(61) 98000-0000" aria-describedby="n-tel-e" /><p class="field__erro" id="n-tel-e" hidden></p></div>
      <div class="modal__acts"><button class="btn btn--ghost" type="button" data-act="fechar-modal">Cancelar</button><button class="btn btn--primary" type="submit">Adicionar</button></div>
    </form>`;
    d.showModal();
    window.lucide && window.lucide.createIcons();
    $('#n-nome').focus();
  }

  /* =====================================================================
     MENTOR · DETALHE DO ALUNO
     ===================================================================== */
  function mensagens(a, s) {
    const nome = primeiroNome(a.nome), m = primeiroNome(S.mentor().nome);
    return {
      sumiu: `Oi, ${nome}! Aqui é o ${m}. Senti sua falta nos check-ins dos últimos dias. Está tudo bem? Se a rotina apertou, me conta que a gente ajusta o plano. Um bloco de 30 minutos hoje já retoma a sequência.`,
      abaixo: `Oi, ${nome}! Vi que você fez ${s.feito} questões nesta semana e o plano pede cerca de ${s.esperado} até hoje. Quer que eu reorganize as metas para caber na sua rotina? O importante é não parar.`,
      parabens: `Oi, ${nome}! Passando para dizer que vi seu ritmo nesta semana: ${s.resumo.questoes} questões com ${s.resumo.pct ?? 0}% de acerto. Continua assim!`
    };
  }

  function grafico(aid) {
    const hoje = S.hoje();
    const dias = Array.from({ length: 7 }, (_, i) => util.addDias(hoje, i - 6));
    const vals = dias.map((d) => { const ss = S.sessoes(aid, d, d); return { d, q: ss.reduce((t, s) => t + s.questoes, 0), a: ss.reduce((t, s) => t + s.acertos, 0) }; });
    const max = Math.max(40, ...vals.map((v) => v.q));
    return `<figure class="chart">
      <div class="chart__plot" aria-hidden="true">
        ${vals.map((v) => `<div class="chart__col">
          <span class="chart__track"><span class="chart__v">${v.q}</span><span class="chart__q" style="height:calc((100% - 22px) * ${(v.q / max).toFixed(3)})"><span class="chart__a" style="height:${v.q ? Math.round((v.a / v.q) * 100) : 0}%"></span></span></span>
          <span class="chart__ax ${v.d === hoje ? 'is-hoje' : ''}">${v.d === hoje ? 'hoje' : DIAS[dt(v.d).getDay()]}</span>
        </div>`).join('')}
      </div>
      <figcaption class="legenda"><span><i class="lg lg--q"></i>Questões</span><span><i class="lg lg--a"></i>Acertos</span></figcaption>
      <table class="sr-only"><caption>Questões e acertos nos últimos 7 dias</caption><thead><tr><th scope="col">Dia</th><th scope="col">Questões</th><th scope="col">Acertos</th></tr></thead>
        <tbody>${vals.map((v) => `<tr><th scope="row">${fmtDiaSemana(v.d)}</th><td>${v.q}</td><td>${v.a}</td></tr>`).join('')}</tbody></table>
    </figure>`;
  }

  function telaAluno(r) {
    const a = S.aluno(r.id);
    if (!a) {
      return `<a class="voltar" href="#mentor/turma">${icon('arrow-left')} Voltar para a turma</a>
        <section class="card"><div class="vazio">${icon('user-x')}<h1 class="h2">Aluno não encontrado</h1><p class="muted">Ele pode ter sido removido ou a demonstração foi recomeçada.</p><a class="btn btn--primary" href="#mentor/turma">Ver a turma</a></div></section>`;
    }
    const seg = R.semanaAtual();
    const s = R.situacao(a.id), seq = R.sequencia(a.id), plano = S.plano(seg);
    const t = S.tentativa(a.id, seg);
    const erros = S.erros(a.id);
    const atrasadas = R.revisoesHoje(a.id).filter((x) => x.atraso > 0).length;
    const msgs = mensagens(a, s);
    const tipo = ui.msgTipo && ui.msgId === a.id ? ui.msgTipo : s.tipo === 'emdia' ? 'parabens' : s.tipo;
    const pts = R.ranking(seg).lista.find((l) => l.aluno.id === a.id);

    return `<a class="voltar" href="#mentor/turma">${icon('arrow-left')} Voltar para a turma</a>
      <header class="page-head page-head--aluno">
        <span class="avatar avatar--lg" aria-hidden="true">${iniciais(a.nome)}</span>
        <div><h1 class="h1">${esc(a.nome)}</h1><p class="muted">Última atividade: ${relDias(s.ult)} · WhatsApp ${fmtTel(a.telefone)} (fictício)</p></div>
        ${chipSituacao(s)}
        <button class="btn btn--wa btn--sm ir-wa" type="button" data-act="ir-wa">${icon('message-circle')} Mandar mensagem</button>
      </header>
      <dl class="kpis kpis--5">
        <div class="kpi card"><dt>Horas na semana</dt><dd>${fmtHoras(s.resumo.minutos)}</dd></div>
        <div class="kpi card"><dt>Questões (meta ${R.metaTotal(seg).questoes})</dt><dd>${s.resumo.questoes}<small> ${pct(s.resumo.questoes, R.metaTotal(seg).questoes)}% da meta</small></dd></div>
        <div class="kpi card"><dt>Acerto</dt><dd>${s.resumo.pct ?? '–'}${s.resumo.pct == null ? '' : '%'}</dd></div>
        <div class="kpi card"><dt>Sequência</dt><dd>${seq.dias}<small> dias</small></dd></div>
        <div class="kpi card"><dt>Simulado</dt><dd>${t ? `${t.acertos}<small>/10</small>` : '<small>não fez</small>'}</dd></div>
      </dl>
      <div class="layout-2">
        <div class="col">
          <section class="card" aria-labelledby="gr-t"><div class="card__head"><h2 id="gr-t" class="card__t">Últimos 7 dias</h2><span class="muted small">Faixa ${pts.faixa.nome} · ${pts.total} pts</span></div>${grafico(a.id)}</section>
          <section class="card" aria-labelledby="mt-t"><h2 id="mt-t" class="card__t">Matérias da semana</h2>
            ${plano ? `<ul class="metas">${plano.metas.map((m) => { const f = s.resumo.porMateria[m.materia] || { questoes: 0, acertos: 0 }; const pq = Math.min(100, pct(f.questoes, m.questoes)); return `<li class="meta"><div class="meta__top"><span class="meta__nome">${R.materia(m.materia).nome}</span><span class="meta__num"><strong>${f.questoes}</strong> de ${m.questoes} · ${f.questoes ? pct(f.acertos, f.questoes) + '% de acerto' : 'sem questões'}</span></div><div class="bar" role="progressbar" aria-label="${R.materia(m.materia).nome}: ${pq}% da meta" aria-valuenow="${pq}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pq}%"></span></div></li>`; }).join('')}</ul>` : '<p class="muted">Sem plano publicado nesta semana.</p>'}
          </section>
        </div>
        <div class="col col--side">
          <section class="card card--wa" aria-labelledby="wa-t">
            <h2 id="wa-t" class="card__t">Mandar mensagem</h2>
            <div class="chips" role="group" aria-label="Modelo de mensagem">
              ${[['sumiu', 'Sentimos sua falta'], ['abaixo', 'Ajustar a meta'], ['parabens', 'Parabéns']].map(([v, t]) => `<button type="button" class="fchip" data-act="msg-tipo" data-v="${v}" data-id="${a.id}" aria-pressed="${tipo === v}">${t}</button>`).join('')}
            </div>
            <label class="field__label" for="wa-txt">Texto (pode editar)</label>
            <textarea class="field__input" id="wa-txt" rows="6" data-act="wa-txt" data-tel="${a.telefone}">${esc(msgs[tipo])}</textarea>
            <a class="btn btn--wa btn--block" id="wa-link" href="${wa(a.telefone, msgs[tipo])}" target="_blank" rel="noopener">${icon('message-circle')} Mandar mensagem no WhatsApp</a>
            <p class="muted small">Abre o WhatsApp com o texto pronto. Você confere e envia.</p>
          </section>
          <section class="card" aria-labelledby="ce-t"><h2 id="ce-t" class="card__t">Caderno de erros</h2>
            <p><strong>${erros.length}</strong> ${erros.length === 1 ? 'erro registrado' : 'erros registrados'} · <strong>${atrasadas}</strong> ${atrasadas === 1 ? 'revisão atrasada' : 'revisões atrasadas'}</p>
            <p class="muted small">Você vê a quantidade, não o conteúdo. O caderno é do aluno.</p>
          </section>
        </div>
      </div>`;
  }

  /* =====================================================================
     MENTOR · PLANO DA SEMANA
     ===================================================================== */
  function telaPlano() {
    const seg = R.semanaAtual();
    const p = S.plano(seg);
    if (ui.planoSalvo) {
      const tot = R.metaTotal(seg);
      const texto = `Plano da semana (${semanaLabel(seg)})\n` + p.metas.map((m) => `- ${R.materia(m.materia).nome}: ${m.questoes} questões, ${m.horas}h`).join('\n') + `\nTotal: ${tot.questoes} questões e ${tot.horas}h.` + (p.recado ? `\n\n${p.recado}` : '') + `\n\nRegistre seus check-ins no Mentor OS.`;
      return `<header class="page-head"><div><p class="eyebrow">Semana de ${semanaLabel(seg)}</p><h1 class="h1">Plano da semana</h1></div></header>
        <section class="card card--ok" aria-labelledby="ps-t">
          <div class="ok-head"><span class="ok-ico">${icon('check')}</span><div><h2 id="ps-t" class="card__t" tabindex="-1">Plano publicado para ${S.alunos().length} alunos</h2>
          <p class="muted">${tot.questoes} questões e ${tot.horas}h na semana. Já aparece na tela "Hoje" de cada aluno, com o progresso por matéria.</p></div></div>
          <div class="row-acts">
            <a class="btn btn--wa" href="${wa('', texto)}" target="_blank" rel="noopener">${icon('message-circle')} Avisar a turma no WhatsApp</a>
            <button class="btn btn--ghost" type="button" data-act="ver-como-aluno">${icon('eye')} Ver como o aluno vê</button>
            <button class="btn btn--ghost" type="button" data-act="editar-plano">${icon('pencil')} Editar de novo</button>
          </div>
        </section>`;
    }
    const metas = ui.planoRascunho || (p ? p.metas.map((m) => ({ ...m })) : [{ materia: '', questoes: '', horas: '' }]);
    const recado = ui.planoRecado ?? (p ? p.recado : '');
    const totQ = metas.reduce((t, m) => t + (Number(m.questoes) || 0), 0), totH = metas.reduce((t, m) => t + (Number(String(m.horas).replace(',', '.')) || 0), 0);
    return `<header class="page-head"><div><p class="eyebrow">Semana de ${semanaLabel(seg)}</p><h1 class="h1">Plano da semana</h1></div></header>
      <form id="form-plano" class="card form" novalidate aria-labelledby="pf-t">
        <h2 id="pf-t" class="card__t">Metas por matéria para a turma</h2>
        <p class="muted small">O mesmo plano vale para toda a turma. Questões contam mais que horas: é o que os alunos registram no check-in.</p>
        <div class="erro-resumo" id="plano-erros" tabindex="-1" hidden></div>
        <div class="plano">
          <div class="plano__head" aria-hidden="true"><span>Matéria</span><span>Questões</span><span>Horas</span><span></span></div>
          ${metas.map((m, i) => `<div class="plano__row" data-i="${i}">
            <div class="field"><label class="field__label plano__lbl" for="p-m-${i}">Matéria ${i + 1}</label><select class="field__input" id="p-m-${i}" name="materia" aria-describedby="p-m-${i}-e">${opcoesMateria(m.materia)}</select><p class="field__erro" id="p-m-${i}-e" hidden></p></div>
            <div class="field"><label class="field__label plano__lbl" for="p-q-${i}">Questões</label><input class="field__input" id="p-q-${i}" name="questoes" inputmode="numeric" value="${esc(m.questoes)}" aria-describedby="p-q-${i}-e" /><p class="field__erro" id="p-q-${i}-e" hidden></p></div>
            <div class="field"><label class="field__label plano__lbl" for="p-h-${i}">Horas</label><input class="field__input" id="p-h-${i}" name="horas" inputmode="decimal" value="${esc(m.horas)}" aria-describedby="p-h-${i}-e" /><p class="field__erro" id="p-h-${i}-e" hidden></p></div>
            <button class="icon-btn" type="button" data-act="rem-meta" data-i="${i}" aria-label="Remover matéria ${i + 1}" ${metas.length === 1 ? 'disabled' : ''}>${icon('trash-2')}</button>
          </div>`).join('')}
        </div>
        <button class="btn btn--ghost btn--sm" type="button" data-act="add-meta" ${metas.length >= MATERIAS.length ? 'disabled' : ''}>${icon('plus')} Adicionar matéria</button>
        <p class="plano__tot" aria-live="polite">Total: <strong>${totQ} questões</strong> e <strong>${totH.toLocaleString('pt-BR')}h</strong> na semana · cerca de ${Math.round(totQ / 7)} questões por dia</p>
        <div class="field"><label class="field__label" for="p-recado">Recado para a turma (opcional)</label>
          <textarea class="field__input" id="p-recado" name="recado" rows="3" maxlength="280">${esc(recado)}</textarea></div>
        <div class="row-acts"><button class="btn btn--primary btn--lg" type="submit">${icon('send')} Publicar plano</button></div>
      </form>`;
  }

  function lerPlano(form) {
    const linhas = $$('.plano__row', form).map((row) => ({
      materia: $('select', row).value,
      questoes: $('input[name=questoes]', row).value.trim(),
      horas: $('input[name=horas]', row).value.trim()
    }));
    ui.planoRascunho = linhas;
    ui.planoRecado = $('#p-recado', form).value;
    return linhas;
  }

  function salvarPlano(form) {
    const linhas = lerPlano(form);
    const erros = {};
    const vistos = new Set();
    linhas.forEach((m, i) => {
      if (!m.materia) erros[`p-m-${i}`] = `Linha ${i + 1}: escolha a matéria.`;
      else if (vistos.has(m.materia)) erros[`p-m-${i}`] = `Linha ${i + 1}: ${R.materia(m.materia).nome} já está no plano.`;
      vistos.add(m.materia);
      const q = inteiro(m.questoes);
      if (!(q >= 1 && q <= 2000)) erros[`p-q-${i}`] = `Linha ${i + 1}: informe as questões da semana (número inteiro). Ex.: 40`;
      const h = Number(String(m.horas).replace(',', '.'));
      if (!(h > 0 && h <= 80)) erros[`p-h-${i}`] = `Linha ${i + 1}: informe as horas (maior que zero). Ex.: 3 ou 1,5`;
    });
    if (!mostrarErros(form, erros, 'plano-erros')) return;
    S.salvarPlano(R.semanaAtual(), linhas.map((m) => ({ materia: m.materia, questoes: Number(m.questoes), horas: Number(String(m.horas).replace(',', '.')) })), ui.planoRecado.trim());
    ui.planoRascunho = null; ui.planoRecado = undefined; ui.planoSalvo = true;
    render();
    toast('Plano publicado para a turma.');
    $('#ps-t') && $('#ps-t').focus();
  }

  /* =====================================================================
     MENTOR · SIMULADO
     ===================================================================== */
  function telaSimuladoMentor() {
    const seg = R.semanaAtual();
    const ts = S.tentativas(seg);
    const alunos = S.alunos();
    const fez = new Set(ts.map((t) => t.alunoId));
    const faltam = alunos.filter((a) => !fez.has(a.id));
    const media = ts.length ? ts.reduce((s, t) => s + t.acertos, 0) / ts.length : 0;
    const porQ = SIMULADO.map((q, i) => ({ q, i, ac: ts.filter((t) => t.respostas[i] === q.certa).length }));
    const pior = porQ.slice().sort((a, b) => a.ac - b.ac)[0];
    const dist = Array.from({ length: 11 }, (_, k) => ts.filter((t) => t.acertos === k).length);

    return `<header class="page-head"><div><p class="eyebrow">Simulado relâmpago · semana de ${semanaLabel(seg)}</p><h1 class="h1">Resultados do simulado</h1></div></header>
      <dl class="kpis kpis--3">
        <div class="kpi card"><dt>Fizeram</dt><dd>${ts.length}<small> de ${alunos.length}</small></dd></div>
        <div class="kpi card"><dt>Média de acertos</dt><dd>${ts.length ? media.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '–'}<small>/10</small></dd></div>
        <div class="kpi card"><dt>Maior nota</dt><dd>${ts.length ? Math.max(...ts.map((t) => t.acertos)) : '–'}<small>/10</small></dd></div>
      </dl>
      ${ts.length ? `<div class="layout-2">
        <div class="col">
          <section class="card" aria-labelledby="pq-t"><h2 id="pq-t" class="card__t">Acerto por questão</h2>
            <p class="destaque">${icon('target')} <span>A mais errada foi a <strong>questão ${pior.i + 1}</strong> (${esc(pior.q.assunto)}): só ${pct(pior.ac, ts.length)}% acertaram. Bom tema para a próxima aula ao vivo.</span></p>
            <ul class="qbar">${porQ.map(({ q, i, ac }) => { const p = pct(ac, ts.length); return `<li class="qbar__i"><span class="qbar__l"><strong>Q${i + 1}</strong> ${esc(q.assunto)}</span><span class="bar ${p < 50 ? 'bar--warn' : ''}" role="progressbar" aria-label="Questão ${i + 1}: ${p}% de acerto" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p}%"></span></span><span class="qbar__v">${p}%</span></li>`; }).join('')}</ul>
          </section>
          <section class="card" aria-labelledby="ds-t"><h2 id="ds-t" class="card__t">Distribuição de notas</h2>
            <div class="dist" role="img" aria-label="${dist.map((n, k) => (n ? `${n} com ${k} acertos` : '')).filter(Boolean).join(', ')}">${dist.map((n, k) => `<div class="dist__c"><span class="dist__b" style="height:${n ? Math.max(10, (n / Math.max(...dist)) * 100) : 0}%"></span><span class="dist__l">${k}</span></div>`).join('')}</div>
            <p class="muted small">Número de alunos por quantidade de acertos (0 a 10).</p>
          </section>
        </div>
        <div class="col col--side">
          <section class="card" aria-labelledby="nt-t"><h2 id="nt-t" class="card__t">Notas</h2>
            <ul class="rank">${ts.slice().sort((a, b) => b.acertos - a.acertos).map((t) => { const a = S.aluno(t.alunoId); return a ? `<li class="rank__i"><span class="avatar" aria-hidden="true">${iniciais(a.nome)}</span><a class="rank__n" href="#mentor/aluno/${a.id}">${esc(a.nome)}</a><span class="rank__p">${t.acertos}/10</span></li>` : ''; }).join('')}</ul>
          </section>
          <section class="card" aria-labelledby="nf-t"><h2 id="nf-t" class="card__t">Ainda não fizeram (${faltam.length})</h2>
            ${faltam.length ? `<ul class="rank">${faltam.map((a) => `<li class="rank__i"><span class="avatar" aria-hidden="true">${iniciais(a.nome)}</span><span class="rank__n">${esc(a.nome)}</span><a class="icon-btn icon-btn--wa" href="${wa(a.telefone, `Oi, ${primeiroNome(a.nome)}! O simulado relâmpago da semana está aberto no Mentor OS até domingo. São 10 questões, uns 15 minutos. Bora?`)}" target="_blank" rel="noopener" aria-label="Lembrar ${esc(a.nome)} no WhatsApp">${icon('message-circle')}</a></li>`).join('')}</ul>` : '<p class="muted small">A turma toda fez. Excelente.</p>'}
          </section>
        </div>
      </div>` : `<section class="card"><div class="vazio">${icon('list-checks')}<p><strong>Ninguém fez o simulado desta semana ainda.</strong></p><p class="muted small">Ele abre na segunda e fecha no domingo. Que tal lembrar a turma?</p><a class="btn btn--wa" href="${wa('', 'O simulado relâmpago da semana está aberto no Mentor OS. São 10 questões, uns 15 minutos.')}" target="_blank" rel="noopener">${icon('message-circle')} Lembrar a turma</a></div></section>`}`;
  }

  /* =====================================================================
     MENTOR · RELATÓRIO
     ===================================================================== */
  function textoRelatorio(tipo) {
    const seg = R.semanaAtual();
    const alunos = S.alunos();
    const dados = alunos.map((a) => ({ a, s: R.situacao(a.id), p: R.pontos(a.id, seg), seq: R.sequencia(a.id) }));
    const q = dados.reduce((t, d) => t + d.s.resumo.questoes, 0), ac = dados.reduce((t, d) => t + d.s.resumo.acertos, 0), min = dados.reduce((t, d) => t + d.s.resumo.minutos, 0);
    const ativos = dados.filter((d) => d.s.resumo.dias > 0).length;
    const ts = S.tentativas(seg);
    const media = ts.length ? (ts.reduce((s, t) => s + t.acertos, 0) / ts.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : null;
    const constantes = dados.slice().sort((x, y) => y.s.resumo.dias - x.s.resumo.dias || y.p.total - x.p.total).slice(0, 3);
    const porQ = SIMULADO.map((qq, i) => ({ qq, i, ac: ts.filter((t) => t.respostas[i] === qq.certa).length })).sort((a, b) => a.ac - b.ac)[0];
    const plano = S.plano(seg), meta = R.metaTotal(seg);
    const L = [];
    L.push(`${S.mentor().turma} · resumo da semana ${semanaLabel(seg)}`);
    L.push('');
    L.push(`- ${ativos} de ${alunos.length} alunos estudaram pelo menos um dia`);
    L.push(`- ${q.toLocaleString('pt-BR')} questões resolvidas, ${pct(ac, q)}% de acerto`);
    L.push(`- ${fmtHoras(min)} de estudo registradas`);
    if (media) L.push(`- Simulado relâmpago: ${ts.length} participantes, média de ${media} acertos`);
    if (porQ && ts.length) L.push(`- Tema que mais derrubou: ${porQ.qq.assunto} (questão ${porQ.i + 1})`);
    L.push('');
    L.push('Destaques de constância:');
    constantes.forEach((d) => L.push(`- ${tipo === 'turma' ? nomeCurto(d.a.nome) : d.a.nome}: ${d.s.resumo.dias} dias com check-in`));
    if (tipo === 'mentor') {
      const sumiu = dados.filter((d) => d.s.tipo === 'sumiu'), abaixo = dados.filter((d) => d.s.tipo === 'abaixo');
      L.push('');
      L.push(`Pedem atenção (${sumiu.length + abaixo.length}):`);
      sumiu.forEach((d) => L.push(`- ${d.a.nome}: sem check-in ${relDias(d.s.ult)}`));
      abaixo.forEach((d) => L.push(`- ${d.a.nome}: ${d.s.feito} de ${d.s.esperado} questões esperadas`));
      if (!sumiu.length && !abaixo.length) L.push('- Ninguém. Turma no ritmo.');
      L.push('');
      L.push(`Meta da semana: ${meta.questoes} questões por aluno. Bateram a meta: ${dados.filter((d) => d.s.resumo.questoes >= meta.questoes).length}.`);
    } else {
      L.push('');
      L.push(plano && plano.recado ? `Recado: ${plano.recado}` : 'Semana que vem tem plano novo e simulado novo. Bora manter a sequência!');
    }
    return L.join('\n');
  }

  function telaRelatorio() {
    const seg = R.semanaAtual();
    const tipo = ui.relatorio;
    const texto = textoRelatorio(tipo);
    return `<header class="page-head"><div><p class="eyebrow">Gerado automaticamente · semana de ${semanaLabel(seg)}</p><h1 class="h1">Relatório semanal</h1></div></header>
      <div class="layout-2">
        <div class="col">
          <section class="card" aria-labelledby="rl-t">
            <div class="card__head"><h2 id="rl-t" class="card__t">Resumo pronto</h2>
              <div class="seg seg--sm" role="group" aria-label="Versão do relatório">
                <button type="button" class="seg__btn" data-act="rel-tipo" data-v="turma" aria-pressed="${tipo === 'turma'}">Para a turma</button>
                <button type="button" class="seg__btn" data-act="rel-tipo" data-v="mentor" aria-pressed="${tipo === 'mentor'}">Só para mim</button>
              </div></div>
            <label class="sr-only" for="rel-txt">Texto do relatório</label>
            <textarea class="field__input relatorio" id="rel-txt" rows="18" readonly>${esc(texto)}</textarea>
            <div class="row-acts">
              <button class="btn btn--primary" type="button" data-act="copiar">${icon('copy')} Copiar texto</button>
              <a class="btn btn--wa" href="${wa('', texto)}" target="_blank" rel="noopener">${icon('message-circle')} Enviar no WhatsApp</a>
              ${navigator.share ? `<button class="btn btn--ghost" type="button" data-act="compartilhar">${icon('share-2')} Compartilhar</button>` : ''}
            </div>
          </section>
        </div>
        <div class="col col--side">
          <section class="card" aria-labelledby="oq-t"><h2 id="oq-t" class="card__t">O que entra em cada versão</h2>
            <h3 class="h3">Para a turma</h3>
            <p class="small">Números gerais, simulado e destaques de constância com nome abreviado. <strong>Não cita quem sumiu</strong> nem quem ficou abaixo da meta.</p>
            <h3 class="h3">Só para mim</h3>
            <p class="small">Tudo da versão da turma, mais a lista de quem pede atenção e quantos bateram a meta. Bom para fechar a semana e planejar as mensagens.</p>
          </section>
        </div>
      </div>`;
  }

  /* =====================================================================
     EVENTOS
     ===================================================================== */
  document.addEventListener('click', async (ev) => {
    const foco = ev.target.closest('[data-foco]');
    if (foco) { ev.preventDefault(); const el = $('#' + foco.dataset.foco); el && el.focus(); return; }
    const fq = ev.target.closest('[data-foco-q]');
    if (fq) { ev.preventDefault(); const el = $(`input[name=q${fq.dataset.focoQ}]`); el && (el.scrollIntoView({ block: 'center' }), el.focus()); return; }
    const el = ev.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    switch (act) {
      case 'home': ev.preventDefault(); irPara(S.papel() === 'mentor' ? 'mentor/turma' : 'aluno/hoje'); break;
      case 'abrir-menu': abrirMenu(); break;
      case 'fechar-menu': fecharMenu(true); break;
      case 'papel': {
        const p = el.dataset.papel; if (p === S.papel()) return;
        S.definirPapel(p); irPara(p === 'mentor' ? 'mentor/turma' : 'aluno/hoje');
        toast(p === 'mentor' ? `Visão do mentor: ${esc(S.mentor().nome)}` : `Visão do aluno: ${esc(S.aluno(S.alunoAtualId()).nome)}`);
        break;
      }
      case 'recomecar': {
        const ok = await confirmar({ titulo: 'Recomeçar a demonstração?', texto: 'Tudo o que você registrou neste aparelho será apagado e os dados de exemplo voltam ao início.', ok: 'Recomeçar', perigo: true });
        if (!ok) return;
        S.recomecar(); Object.assign(ui, { checkin: 'idle', simuladoAberto: false, filtroTurma: 'todos', busca: '', filtroErros: 'todas', planoRascunho: null, planoRecado: undefined, planoSalvo: false });
        ultimaRota = null; irPara('aluno/hoje'); toast('Demonstração recomeçada.');
        break;
      }
      case 'manual': S.descartarCronometro(); ui.checkin = 'manual'; render(); $('#f-materia').focus(); break;
      case 'pausar': S.pausarCronometro(); render(); $('[data-act=continuar]').focus(); break;
      case 'continuar': S.continuarCronometro(); render(); $('[data-act=pausar]').focus(); break;
      case 'finalizar': S.pausarCronometro(); ui.checkin = 'final'; render(); $('#f-q').focus(); break;
      case 'voltar-crono': ui.checkin = 'idle'; render(); break;
      case 'descartar': {
        const ok = await confirmar({ titulo: 'Descartar esta sessão?', texto: `O tempo de ${cronoTexto(S.tempoCronometroMs())} não será registrado.`, ok: 'Descartar', perigo: true });
        if (ok) { S.descartarCronometro(); ui.checkin = 'idle'; render(); toast('Sessão descartada.'); }
        break;
      }
      case 'nova-sessao': ui.checkin = 'idle'; render(); $('#i-materia').focus(); break;
      case 'excluir-sessao': {
        const s = S.estado.sessoes.find((x) => x.id === el.dataset.id); if (!s) return;
        const ok = await confirmar({ titulo: 'Excluir esta sessão?', texto: `${R.materia(s.materia).nome}: ${s.questoes} questões. Ela sai da sua sequência e do ranking.`, ok: 'Excluir', perigo: true });
        if (!ok) return;
        S.excluirSessao(s.id); if (ui.ultimaSessao && ui.ultimaSessao.id === s.id) ui.checkin = 'idle'; render();
        toast('Sessão excluída.', { rotulo: 'Desfazer', fn: () => { S.restaurarSessao(s); render(); toast('Sessão restaurada.'); } });
        break;
      }
      case 'abrir-simulado': ui.simuladoAberto = true; render(); $('input[name=q0]').focus(); break;
      case 'fechar-simulado': {
        const marcadas = $$('#form-simulado input:checked').length;
        if (marcadas) { const ok = await confirmar({ titulo: 'Sair sem enviar?', texto: `Você marcou ${marcadas} ${marcadas === 1 ? 'resposta' : 'respostas'}. Elas não serão salvas.`, ok: 'Sair', perigo: true }); if (!ok) return; }
        ui.simuladoAberto = false; ui.simRascunho = null; render(); break;
      }
      case 'sim-forcar': enviarSimulado($('#form-simulado'), true); break;
      case 'sim-caderno': {
        const t = S.tentativa(S.alunoAtualId(), R.semanaAtual()); const i = Number(el.dataset.q); const q = SIMULADO[i];
        S.registrarErro({ alunoId: S.alunoAtualId(), materia: q.materia, assunto: q.assunto, anotacao: `${q.enunciado} Certa: ${q.opcoes[q.certa]}. ${q.explicacao}`, origem: 'Simulado relâmpago', origemId: q.id + t.semana });
        render(); toast(`Questão ${i + 1} foi para o caderno. Primeira revisão amanhã.`);
        break;
      }
      case 'revisar': {
        const ok = el.dataset.ok === '1', etapa = Number(el.dataset.etapa), id = el.dataset.id;
        const antes = { ...S.erros(S.alunoAtualId()).find((x) => x.id === id).revisoes.find((x) => x.etapa === etapa) };
        S.concluirRevisao(id, etapa, ok); render();
        toast(ok ? 'Revisão feita. Próxima etapa agendada.' : 'Sem problema: volta amanhã para você revisar de novo.', { rotulo: 'Desfazer', fn: () => { S.restaurarRevisao(id, etapa, antes); render(); toast('Revisão desfeita. Ela voltou para a fila.'); } });
        const prox = $('[data-act=revisar]'); (prox || $('#rv-t')).focus();
        break;
      }
      case 'ir-wa': $('#wa-t').scrollIntoView({ block: 'start' }); $('#wa-txt').focus({ preventScroll: true }); break;
      case 'foco-novo': ev.preventDefault(); $('#novo-erro').scrollIntoView({ block: 'start' }); $('#e-materia').focus(); break;
      case 'limpar-filtro-erros': ui.filtroErros = 'todas'; render(); $('#f-erros').focus(); break;
      case 'filtro-turma': ui.filtroTurma = el.dataset.v; render(); $(`[data-act=filtro-turma][data-v=${ui.filtroTurma}]`).focus(); break;
      case 'limpar-turma': ui.filtroTurma = 'todos'; ui.busca = ''; render(); $('#busca').focus(); break;
      case 'add-aluno': dialogAddAluno(); break;
      case 'fechar-modal': $('#modal').close(); break;
      case 'msg-tipo': {
        ui.msgTipo = el.dataset.v; ui.msgId = el.dataset.id;
        const a = S.aluno(el.dataset.id), txt = mensagens(a, R.situacao(a.id))[ui.msgTipo];
        $$('[data-act=msg-tipo]').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
        $('#wa-txt').value = txt; $('#wa-link').href = wa(a.telefone, txt);
        break;
      }
      case 'add-meta': { lerPlano($('#form-plano')); ui.planoRascunho.push({ materia: '', questoes: '', horas: '' }); render(); $(`#p-m-${ui.planoRascunho.length - 1}`).focus(); break; }
      case 'rem-meta': { lerPlano($('#form-plano')); ui.planoRascunho.splice(Number(el.dataset.i), 1); render(); $('#p-m-0').focus(); break; }
      case 'ver-como-aluno': S.definirPapel('aluno'); irPara('aluno/hoje'); break;
      case 'editar-plano': ui.planoSalvo = false; render(); break;
      case 'rel-tipo': ui.relatorio = el.dataset.v; render(); $(`[data-act=rel-tipo][data-v=${ui.relatorio}]`).focus(); break;
      case 'copiar': {
        const txt = $('#rel-txt').value;
        try { await navigator.clipboard.writeText(txt); toast('Relatório copiado. É só colar no grupo ou no e-mail.'); }
        catch (e) { const t = $('#rel-txt'); t.focus(); t.select(); toast('Texto selecionado. Use Ctrl+C (ou copiar no celular).'); }
        break;
      }
      case 'compartilhar': try { await navigator.share({ title: 'Relatório da semana', text: $('#rel-txt').value }); } catch (e) { /* cancelado */ } break;
      default: break;
    }
  });


  document.addEventListener('submit', (ev) => {
    const f = ev.target;
    if (f.id === 'form-iniciar') {
      ev.preventDefault();
      const m = f.materia.value;
      if (!mostrarErros(f, m ? {} : { 'i-materia': 'Escolha a matéria antes de ligar o cronômetro.' })) return;
      S.iniciarCronometro(m); ui.checkin = 'idle'; render(); $('[data-act=pausar]').focus();
      toast(`Cronômetro ligado: ${R.materia(m).nome}.`);
    } else if (f.id === 'form-sessao') { ev.preventDefault(); salvarSessao(f); }
    else if (f.id === 'form-simulado') { ev.preventDefault(); enviarSimulado(f, false); }
    else if (f.id === 'form-erro') { ev.preventDefault(); salvarErro(f); }
    else if (f.id === 'form-plano') { ev.preventDefault(); salvarPlano(f); }
    else if (f.id === 'form-aluno') {
      ev.preventDefault();
      const nome = f.nome.value.trim(), tel = f.telefone.value.replace(/\D/g, '');
      const erros = {};
      if (nome.split(' ').filter(Boolean).length < 2) erros['n-nome'] = 'Escreva nome e sobrenome.';
      if (!/^\d{10,11}$/.test(tel)) erros['n-tel'] = 'Use DDD e número, só dígitos ou no formato (61) 98000-0000.';
      if (!mostrarErros(f, erros)) return;
      const a = S.adicionarAluno({ nome, telefone: tel });
      $('#modal').close(); render(); toast(`${esc(a.nome)} entrou na turma.`);
    }
  });

  document.addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.id === 'aluno-demo') { S.definirAlunoAtual(el.value); ui.checkin = 'idle'; S.definirPapel('aluno'); ultimaRota = null; irPara(location.hash.startsWith('#aluno') ? location.hash.slice(1) : 'aluno/hoje'); toast(`Agora você vê o app como ${esc(S.aluno(el.value).nome)}.`); }
    if (el.dataset.act === 'crono-materia') { S.trocarMateriaCronometro(el.value); toast(`Matéria trocada para ${R.materia(el.value).nome}.`); }
    if (el.dataset.act === 'filtro-erros') { ui.filtroErros = el.value; render(); $('#f-erros').focus(); }
    if (el.form && el.form.id === 'form-simulado') {
      ui.simRascunho = SIMULADO.map((q, i) => { const v = el.form.querySelector(`input[name=q${i}]:checked`); return v ? Number(v.value) : null; });
      contarSimulado();
      el.closest('.q').classList.remove('is-vazia');
    }
    if (el.form && el.form.id === 'form-plano') { lerPlano(el.form); atualizarTotalPlano(); }
  });

  document.addEventListener('input', (ev) => {
    const el = ev.target;
    if (el.dataset.act === 'busca') {
      ui.busca = el.value; const pos = el.selectionStart; render(); const b = $('#busca'); b.focus(); b.setSelectionRange(pos, pos);
    }
    if (el.dataset.act === 'wa-txt') $('#wa-link').href = wa(el.dataset.tel, el.value);
    if (el.form && el.form.id === 'form-plano') { lerPlano(el.form); atualizarTotalPlano(); }
  });

  function atualizarTotalPlano() {
    const m = ui.planoRascunho || [];
    const q = m.reduce((t, x) => t + (Number(x.questoes) || 0), 0), h = m.reduce((t, x) => t + (Number(String(x.horas).replace(',', '.')) || 0), 0);
    const el = $('.plano__tot'); if (el) el.innerHTML = `Total: <strong>${q} questões</strong> e <strong>${h.toLocaleString('pt-BR')}h</strong> na semana · cerca de ${Math.round(q / 7)} questões por dia`;
  }

  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && document.body.classList.contains('menu-aberto')) fecharMenu(true); });

  function abrirMenu() {
    document.body.classList.add('menu-aberto');
    $('.backdrop').hidden = false;
    $('[data-act=abrir-menu]').setAttribute('aria-expanded', 'true');
    $('.side__close').focus();
  }
  function fecharMenu(devolver) {
    if (!document.body.classList.contains('menu-aberto')) return;
    document.body.classList.remove('menu-aberto');
    $('.backdrop').hidden = true;
    $('[data-act=abrir-menu]').setAttribute('aria-expanded', 'false');
    if (devolver) $('[data-act=abrir-menu]').focus();
  }

  window.addEventListener('hashchange', render);
  S.carregar();
  render();
})();
