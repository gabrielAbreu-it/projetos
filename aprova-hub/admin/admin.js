/* Aprova Hub · painel do dono (demonstração do piloto automático) */
(function () {
  const N = window.Negocio;
  const $ = (s, el = document) => el.querySelector(s);
  const view = $('#view');
  const icon = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`;
  const ui = { filtro: 'todos', busca: '' };

  const SECOES = [
    ['visao', 'Visão geral', 'layout-dashboard'],
    ['assinantes', 'Assinantes', 'users'],
    ['afiliados', 'Afiliados', 'handshake'],
    ['retiradas', 'Retiradas', 'landmark'],
    ['ajustes', 'Ajustes', 'sliders-horizontal']
  ];
  const STATUS = {
    ativo: '<span class="chip chip--ok">Ativo</span>', teste: '<span class="chip chip--info">Em teste</span>', atrasado: '<span class="chip chip--danger">Atrasado</span>',
    cancelado: '<span class="chip chip--muted">Cancelado</span>', 'teste-acabou': '<span class="chip chip--warn">Teste acabou</span>'
  };
  const MES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function nav(atual) {
    const li = SECOES.map(([h, t, i]) => `<li><a href="#${h}" ${h === atual ? 'aria-current="page"' : ''}>${icon(i)}<span>${t}</span></a></li>`).join('');
    $('#nav').innerHTML = li; $('#tabs').innerHTML = li;
  }

  /* ---------- visão geral ---------- */
  function visao() {
    const k = N.indicadores(), c = N.config(), m = k.mes, h = N.hoje();
    const max = Math.max(...k.meses.map((x) => x.receita), 1);
    const totNovos = k.porOrigem.reduce((t, o) => t + o.n, 0) || 1;
    const porAf = N.estado().afiliados.map((a) => ({ a, v: N.painelAfiliado(a.id).doMes })).filter((x) => x.v > 0);
    const mesNome = MES_LONGO[N.parse(h).getMonth()];
    return `<header class="page-head"><div><p class="eyebrow">${mesNome} de ${h.slice(0, 4)} · até hoje</p><h1>Olá, Gabriel</h1></div>
        <a class="btn btn--ghost" href="../site/index.html">${icon('store')} Ver página de vendas</a></header>
      <section class="saldo" aria-labelledby="sd-t">
        <div><p id="sd-t" class="small">Saldo disponível para retirar</p><p class="saldo__v">${N.brl(k.saldo)}</p>
          <p class="small muted">Já descontadas as taxas do provedor e as comissões dos afiliados.</p></div>
        <button class="btn btn--lime btn--lg" type="button" data-act="retirar" ${k.saldo < 10 ? 'disabled' : ''}>${icon('arrow-up-right')} Retirar meu lucro</button>
      </section>
      <dl class="kpis kpis--6">
        <div class="kpi"><dt>Receita do mês</dt><dd>${N.brl0(m.receita)}<small>${m.cobrancas} cobranças pagas</small></dd></div>
        <div class="kpi"><dt>MRR</dt><dd>${N.brl0(k.mrr)}<small>receita recorrente mensal</small></dd></div>
        <div class="kpi"><dt>Assinantes ativos</dt><dd>${k.ativos}</dd></div>
        <div class="kpi"><dt>Testes grátis</dt><dd>${k.testes.length}<small>em andamento</small></dd></div>
        <div class="kpi"><dt>Cancelamentos</dt><dd>${k.cancelMes.length}<small>neste mês</small></dd></div>
        <div class="kpi kpi--alerta"><dt>Inadimplência</dt><dd>${N.brl0(k.emAtraso)}<small>${k.atrasados.length} ${k.atrasados.length === 1 ? 'cliente' : 'clientes'} · ${k.inadPct.toLocaleString('pt-BR')}%</small></dd></div>
      </dl>
      <div class="cols">
        <section class="card" aria-labelledby="gr-t">
          <div class="card__head"><h2 class="h3" id="gr-t" style="margin:0">Receita dos últimos 6 meses</h2><span class="small muted">mês atual até hoje</span></div>
          <div class="grafico" aria-hidden="true">${k.meses.map((x, i) => `<div class="grafico__c"><span class="grafico__v">${N.brl0(x.receita)}</span>
            <span class="grafico__b ${i === 5 ? 'is-atual' : ''}" style="height:calc((100% - 24px) * ${(x.receita / max).toFixed(3)})"><span class="grafico__l" style="height:${x.receita ? Math.max(0, Math.round((x.lucro / x.receita) * 100)) : 0}%"></span></span>
            <span class="grafico__m">${x.nome}</span></div>`).join('')}</div>
          <div class="legenda"><span><i class="lg lg--r"></i>Receita</span><span><i class="lg lg--l"></i>Lucro estimado</span></div>
          <table class="sr-only"><caption>Receita e lucro estimado por mês</caption><thead><tr><th scope="col">Mês</th><th scope="col">Receita</th><th scope="col">Lucro estimado</th></tr></thead><tbody>${k.meses.map((x) => `<tr><th scope="row">${x.nome}</th><td>${N.brl(x.receita)}</td><td>${N.brl(x.lucro)}</td></tr>`).join('')}</tbody></table>
        </section>
        <section class="card" aria-labelledby="lu-t">
          <h2 class="h3" id="lu-t">Lucro estimado do mês</h2>
          <ul class="conta">
            <li><span>Receita</span><span>${N.brl(m.receita)}</span></li>
            <li class="menos"><span>Taxas do provedor (estimadas, ${c.taxaPct}%)</span><span>− ${N.brl(m.taxas)}</span></li>
            <li class="menos"><span>Comissões de afiliados (${c.comissao}%)</span><span>− ${N.brl(m.comissoes)}</span></li>
            <li class="menos"><span>Custos fixos (servidor, banco, domínio)</span><span>− ${N.brl(m.custo)}</span></li>
            <li class="total"><span>Lucro estimado</span><span>${N.brl(m.lucro)}</span></li>
          </ul>
          <p class="nota" style="margin-top:10px">Antes de impostos. Taxas e custos são hipóteses: ajuste em <a href="#ajustes">Ajustes</a>.</p>
        </section>
      </div>
      <div class="cols cols--2">
        <section class="card" aria-labelledby="or-t"><h2 class="h3" id="or-t">Novos clientes no mês por origem</h2>
          <ul class="origens">${k.porOrigem.map((o) => `<li><span>${o.nome}</span><span class="barra" role="img" aria-label="${o.nome}: ${o.n}"><span style="width:${(o.n / totNovos) * 100}%"></span></span><b>${o.n}</b></li>`).join('')}</ul>
          <p class="nota" style="margin-top:10px">Conta testes e assinaturas iniciados em ${mesNome}.</p>
        </section>
        <section class="card" aria-labelledby="cm-t"><h2 class="h3" id="cm-t">Comissões a pagar</h2>
          <p><strong style="font-size:1.4rem">${N.brl(m.comissoes)}</strong> <span class="muted small">saem sozinhas por Pix em ${N.data(N.addMeses(N.mesDe(h) + '-10', 1))}</span></p>
          ${porAf.length ? `<ul class="conta" style="margin-top:8px">${porAf.map((x) => `<li><span>${N.esc(x.a.nome)}</span><span>${N.brl(x.v)}</span></li>`).join('')}</ul>` : '<p class="muted small">Nenhuma comissão neste mês.</p>'}
          <a class="btn btn--ghost" href="#afiliados" style="margin-top:12px">Ver afiliados</a>
        </section>
      </div>`;
  }

  /* ---------- assinantes ---------- */
  function assinantes() {
    const todos = N.estado().assinantes;
    const conta = (s) => todos.filter((a) => a.status === s).length;
    let lista = ui.filtro === 'todos' ? todos : todos.filter((a) => (ui.filtro === 'teste' ? ['teste', 'teste-acabou'].includes(a.status) : a.status === ui.filtro));
    if (ui.busca) lista = lista.filter((a) => (a.nome + ' ' + a.negocio + ' ' + a.email).toLowerCase().includes(ui.busca.toLowerCase()));
    const filtros = [['todos', 'Todos', todos.length], ['ativo', 'Ativos', conta('ativo')], ['teste', 'Em teste', conta('teste') + conta('teste-acabou')], ['atrasado', 'Atrasados', conta('atrasado')], ['cancelado', 'Cancelados', conta('cancelado')]];
    const prox = (a) => a.status === 'teste' ? `fim do teste ${N.data(a.fimTeste)}` : a.status === 'ativo' ? (() => { let d = a.fimTeste; while (d <= N.hoje()) d = N.addMeses(d, 1); return 'próxima ' + N.data(d); })() : a.status === 'cancelado' ? `cancelou ${N.data(a.cancelEm)}` : a.status === 'atrasado' ? 'acesso pausado' : 'aguardando plano';
    return `<header class="page-head"><div><p class="eyebrow">${todos.length} contas</p><h1>Assinantes</h1></div></header>
      <section class="card">
        <div class="card__head"><div class="fchips" role="group" aria-label="Filtrar por situação">${filtros.map(([v, t, n]) => `<button class="fchip" type="button" data-filtro="${v}" aria-pressed="${ui.filtro === v}">${t} (${n})</button>`).join('')}</div>
          <div class="busca"><label class="sr-only" for="busca">Buscar assinante</label>${icon('search')}<input class="field__input" id="busca" type="search" placeholder="Buscar por nome ou e-mail" value="${N.esc(ui.busca)}" /></div></div>
        <p class="sr-only" aria-live="polite">${lista.length} assinantes na lista</p>
        ${lista.length ? `<div class="tabela-wrap"><table class="tabela tabela--cards"><thead><tr><th scope="col">Mentor</th><th scope="col">Plano</th><th scope="col" class="num">Valor</th><th scope="col">Situação</th><th scope="col">Origem</th><th scope="col">Cobrança</th></tr></thead>
          <tbody>${lista.map((a) => `<tr><td><strong>${N.esc(a.nome)}</strong><br><span class="small muted">${N.esc(a.negocio)}</span></td><td data-l="Plano">${N.PLANOS[a.plano].curto}</td><td data-l="Valor" class="num">${N.brl0(a.preco)}/mês</td><td data-l="Situação">${STATUS[a.status] || a.status}</td><td data-l="Origem">${N.ORIGENS[a.origem]}${a.afiliadoId ? `<br><span class="small muted">${N.esc((N.estado().afiliados.find((x) => x.id === a.afiliadoId) || {}).nome || '')}</span>` : ''}</td><td data-l="Cobrança" class="small">${prox(a)}<br><span class="muted">${a.pagamento === 'pix' ? 'Pix' : a.pagamento === 'boleto' ? 'Boleto' : 'Cartão'}</span></td></tr>`).join('')}</tbody></table></div>`
          : `<div class="vazio">${icon('search-x')}<p><strong>Nenhum assinante com esse filtro.</strong></p><button class="btn btn--ghost" type="button" data-act="limpar">Limpar filtro e busca</button></div>`}
        <p class="nota">Cobrança, aviso de atraso, pausa e liberação do acesso acontecem sozinhos. Você só olha.</p>
      </section>`;
  }

  /* ---------- afiliados ---------- */
  function afiliados() {
    const c = N.config();
    const linhas = N.estado().afiliados.map((a) => N.painelAfiliado(a.id));
    const total = linhas.reduce((t, d) => t + d.doMes, 0);
    return `<header class="page-head"><div><p class="eyebrow">Comissão recorrente de ${c.comissao}%</p><h1>Afiliados</h1></div>
        <a class="btn btn--ghost" href="../site/afiliados.html">${icon('external-link')} Página do programa</a></header>
      <dl class="kpis kpis--4">
        <div class="kpi"><dt>Afiliados</dt><dd>${linhas.length}</dd></div>
        <div class="kpi"><dt>Cliques no mês</dt><dd>${linhas.reduce((t, d) => t + d.af.cliques, 0).toLocaleString('pt-BR')}<small>acumulado na demonstração</small></dd></div>
        <div class="kpi"><dt>Clientes ativos por afiliados</dt><dd>${linhas.reduce((t, d) => t + d.ativos, 0)}</dd></div>
        <div class="kpi"><dt>Comissões a pagar</dt><dd>${N.brl0(total)}<small>Pix automático dia 10</small></dd></div>
      </dl>
      <section class="card"><h2 class="h3">Por afiliado</h2>
        <div class="tabela-wrap"><table class="tabela tabela--cards"><thead><tr><th scope="col">Afiliado</th><th scope="col" class="num">Cliques</th><th scope="col" class="num">Cadastros</th><th scope="col" class="num">Ativos</th><th scope="col" class="num">Comissão do mês</th><th scope="col">Link</th></tr></thead>
        <tbody>${linhas.map((d) => `<tr><td><strong>${N.esc(d.af.nome)}</strong><br><span class="small muted">Pix ${N.esc(d.af.pix)}</span></td><td data-l="Cliques" class="num">${d.af.cliques}</td><td data-l="Cadastros" class="num">${d.cadastros}</td><td data-l="Ativos" class="num">${d.ativos}</td><td data-l="Comissão" class="num">${N.brl(d.doMes)}</td><td data-l="Link" class="small">?ref=${N.esc(d.af.codigo)}</td></tr>`).join('')}</tbody></table></div>
        <p class="nota">A comissão é separada no momento em que a mensalidade é paga, então o seu saldo já aparece sem ela.</p>
      </section>`;
  }

  /* ---------- retiradas ---------- */
  function retiradas() {
    const k = N.indicadores(), st = N.estado();
    return `<header class="page-head"><div><p class="eyebrow">Conta ${N.esc(st.conta.banco)} · ag. ${st.conta.agencia} · c/c ${st.conta.conta}</p><h1>Retiradas</h1></div></header>
      <section class="saldo" aria-labelledby="sd2-t"><div><p id="sd2-t" class="small">Saldo disponível</p><p class="saldo__v">${N.brl(k.saldo)}</p><p class="small muted">A transferência vai para a conta cadastrada em nome do dono.</p></div>
        <button class="btn btn--lime btn--lg" type="button" data-act="retirar" ${k.saldo < 10 ? 'disabled' : ''}>${icon('arrow-up-right')} Retirar meu lucro</button></section>
      <section class="card" aria-labelledby="hr-t"><h2 class="h3" id="hr-t">Histórico de retiradas</h2>
        ${st.retiradas.length ? `<div class="tabela-wrap"><table class="tabela tabela--cards"><thead><tr><th scope="col">Pedido em</th><th scope="col" class="num">Valor</th><th scope="col">Destino</th><th scope="col">Situação</th></tr></thead>
        <tbody>${st.retiradas.slice().sort((a, b) => (a.data < b.data ? 1 : -1)).map((r) => `<tr><td>${N.data(r.data)}</td><td data-l="Valor" class="num">${N.brl(r.valor)}</td><td data-l="Destino">${N.esc(st.conta.banco)} ${st.conta.conta}</td><td data-l="Situação">${r.status === 'agendada' ? `<span class="chip chip--info">Agendada para ${N.data(r.previsao)}</span>` : '<span class="chip chip--ok">Concluída</span>'}</td></tr>`).join('')}</tbody></table></div>`
        : '<p class="muted">Nenhuma retirada ainda.</p>'}
      </section>`;
  }

  /* ---------- ajustes ---------- */
  function ajustes() {
    const c = N.config();
    const num = (id, rot, val, pre, hint, extra = '') => `<div class="field"><label class="field__label" for="${id}">${rot}</label><div class="prefix">${pre ? `<span aria-hidden="true">${pre}</span>` : ''}<input class="field__input" id="${id}" inputmode="decimal" value="${val}" aria-describedby="${id}-h ${id}-e" ${pre ? '' : 'style="padding-left:12px"'} ${extra} /></div><p class="field__hint" id="${id}-h">${hint}</p><p class="field__erro" id="${id}-e" hidden></p></div>`;
    return `<header class="page-head"><div><p class="eyebrow">Regras do negócio</p><h1>Ajustes</h1></div></header>
      <form class="card form" id="f-ajustes" novalidate>
        <h2 class="h3">Preço dos planos (por mês)</h2>
        <div class="ajustes">${num('p-solo', 'Mentor solo', c.precos.solo, 'R$', 'Plano de entrada.')}${num('p-turma', 'Turma grande', c.precos.turma, 'R$', 'Plano principal.')}${num('p-escola', 'Escola', c.precos.escola, 'R$', 'Ticket alto.')}</div>
        <p class="nota">Preço novo vale para novos clientes. Quem já assina continua com o preço contratado.</p>
        <h2 class="h3">Afiliados, teste e custos</h2>
        <div class="ajustes">${num('a-com', 'Comissão de afiliado (%)', c.comissao, '', 'Recorrente, sobre cada mensalidade paga.')}${num('a-dias', 'Dias de teste grátis', c.diasTeste, '', 'Aparece na página de vendas e no cadastro.')}${num('a-taxa', 'Taxa estimada do provedor (%)', c.taxaPct, '', 'Hipótese. Confira a tabela do provedor.')}</div>
        <div class="ajustes">${num('a-custo', 'Custos fixos por mês', c.custoFixo, 'R$', 'Servidor, banco, domínio e e-mail.')}</div>
        <div class="row"><button class="btn btn--primary" type="submit">${icon('save')} Salvar ajustes</button><button class="btn btn--ghost" type="button" data-act="recomecar">${icon('rotate-ccw')} Recomeçar demonstração</button></div>
      </form>`;
  }

  /* ---------- retirada: fluxo em 3 passos ---------- */
  function abrirRetirada() {
    const saldo = N.indicadores().saldo, st = N.estado();
    const d = $('#modal');
    const passo1 = () => {
      d.innerHTML = `<form class="modal__box passo-ret" id="f-ret" novalidate>
        <h2 class="modal__t" id="modal-t">Retirar meu lucro</h2>
        <p class="small muted">Disponível: <strong>${N.brl(saldo)}</strong></p>
        <div class="field"><label class="field__label" for="r-valor">Quanto quer retirar?</label><div class="prefix"><span aria-hidden="true">R$</span><input class="field__input" id="r-valor" inputmode="decimal" value="${saldo.toFixed(2).replace('.', ',')}" aria-describedby="r-valor-e" /></div><p class="field__erro" id="r-valor-e" hidden></p></div>
        <div class="row"><button class="btn btn--ghost" type="button" data-pct="0.5">Metade</button><button class="btn btn--ghost" type="button" data-pct="1">Tudo</button></div>
        <div class="card" style="padding:14px"><p class="small muted">Para a conta</p><p><strong>${N.esc(st.conta.banco)}</strong> · ag. ${st.conta.agencia} · c/c ${st.conta.conta}</p><p class="small muted">${N.esc(st.conta.titular)}</p></div>
        <div class="modal__acts"><button class="btn btn--ghost" type="button" data-fechar>Cancelar</button><button class="btn btn--primary" type="submit">Continuar</button></div>
      </form>`;
      N.icones(); $('#r-valor').focus(); $('#r-valor').select();
    };
    let valor = 0;
    const passo2 = () => {
      const prev = N.addDias(N.hoje(), 1);
      d.innerHTML = `<div class="modal__box passo-ret"><h2 class="modal__t" id="modal-t">Confirme a retirada</h2>
        <p class="ret-valor">${N.brl(valor)}</p>
        <ul class="conta"><li><span>Para</span><span>${N.esc(st.conta.banco)} ${st.conta.conta}</span></li><li><span>Taxa de transferência</span><span>conforme o provedor</span></li><li><span>Saldo depois</span><span>${N.brl(saldo - valor)}</span></li></ul>
        <p class="small muted">Demonstração: nenhum dinheiro é movimentado.</p>
        <div class="modal__acts"><button class="btn btn--ghost" type="button" data-voltar>Voltar</button><button class="btn btn--primary" type="button" data-confirmar>${icon('check')} Confirmar retirada</button></div></div>`;
      N.icones(); $('[data-confirmar]', d).focus();
      void prev;
    };
    const passo3 = (r) => {
      d.innerHTML = `<div class="modal__box passo-ret ret-ok"><span class="ico">${icon('check')}</span><h2 class="modal__t" id="modal-t">Transferência agendada</h2>
        <p>${N.brl(r.valor)} para ${N.esc(st.conta.banco)} ${st.conta.conta}. Previsão: <strong>${N.data(r.previsao)}</strong>.</p>
        <div class="modal__acts" style="justify-content:center"><button class="btn btn--primary" type="button" data-fechar>Ver histórico</button></div></div>`;
      N.icones(); $('[data-fechar]', d).focus();
    };
    d.onsubmit = (e) => {
      e.preventDefault();
      const v = Number($('#r-valor').value.replace(/\./g, '').replace(',', '.'));
      const er = {};
      if (!(v > 0)) er['r-valor'] = 'Digite um valor. Ex.: 1.500,00';
      else if (v < 10) er['r-valor'] = 'O mínimo para retirar é R$ 10,00.';
      else if (v > saldo + 0.001) er['r-valor'] = `O valor passa do saldo disponível (${N.brl(saldo)}).`;
      if (!N.erros(e.target, er)) return;
      valor = Math.round(v * 100) / 100; passo2();
    };
    d.onclick = (e) => {
      const p = e.target.closest('[data-pct]'); if (p) { $('#r-valor').value = (Math.floor(saldo * Number(p.dataset.pct) * 100) / 100).toFixed(2).replace('.', ','); return; }
      if (e.target.closest('[data-voltar]')) { passo1(); $('#r-valor').value = valor.toFixed(2).replace('.', ','); return; }
      if (e.target.closest('[data-confirmar]')) { const r = N.retirar(valor); passo3(r); render(); return; }
      if (e.target.closest('[data-fechar]')) { const ok = d.querySelector('.ret-ok'); d.close(); if (ok) location.hash = 'retiradas'; }
    };
    passo1(); d.showModal();
  }

  /* ---------- roteamento ---------- */
  let ultima = null;
  function render() {
    const h = (location.hash.slice(1) || 'visao');
    const sec = SECOES.find((s) => s[0] === h) ? h : 'visao';
    const telas = { visao, assinantes, afiliados, retiradas, ajustes };
    view.innerHTML = telas[sec]();
    nav(sec);
    N.icones();
    document.title = `${SECOES.find((s) => s[0] === sec)[1]} · Painel do dono · Aprova Hub`;
    if (ultima !== null && ultima !== sec) { window.scrollTo(0, 0); const t = view.querySelector('h1'); t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    ultima = sec;
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    const f = e.target.closest('[data-filtro]');
    if (f) { ui.filtro = f.dataset.filtro; render(); $(`[data-filtro=${ui.filtro}]`).focus(); return; }
    if (!b) return;
    if (b.dataset.act === 'retirar') abrirRetirada();
    if (b.dataset.act === 'limpar') { ui.filtro = 'todos'; ui.busca = ''; render(); $('#busca').focus(); }
    if (b.dataset.act === 'recomecar') {
      const d = $('#modal');
      d.innerHTML = `<form method="dialog" class="modal__box"><h2 class="modal__t" id="modal-t">Recomeçar a demonstração?</h2><p>Assinantes, cobranças, retiradas e ajustes voltam aos dados de exemplo.</p><div class="modal__acts"><button class="btn btn--ghost" value="no">Cancelar</button><button class="btn btn--danger" value="ok">Recomeçar</button></div></form>`;
      d.onsubmit = null; d.onclick = null; d.showModal();
      d.addEventListener('close', () => { if (d.returnValue === 'ok') { N.recomecar(); render(); N.toast('Demonstração recomeçada.'); } }, { once: true });
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'busca') { ui.busca = e.target.value; const pos = e.target.selectionStart; render(); const b = $('#busca'); b.focus(); b.setSelectionRange(pos, pos); }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'f-ajustes') return;
    e.preventDefault();
    const f = e.target, n = (id) => Number(f.querySelector('#' + id).value.replace(',', '.'));
    const er = {};
    [['p-solo', 'solo'], ['p-turma', 'turma'], ['p-escola', 'escola']].forEach(([id]) => { if (!(n(id) >= 1 && n(id) <= 10000)) er[id] = 'Informe um preço entre R$ 1 e R$ 10.000.'; });
    if (!(n('a-com') >= 0 && n('a-com') <= 60)) er['a-com'] = 'Use de 0 a 60%.';
    if (!(Number.isInteger(n('a-dias')) && n('a-dias') >= 0 && n('a-dias') <= 30)) er['a-dias'] = 'Use um número inteiro de 0 a 30.';
    if (!(n('a-taxa') >= 0 && n('a-taxa') <= 20)) er['a-taxa'] = 'Use de 0 a 20%.';
    if (!(n('a-custo') >= 0)) er['a-custo'] = 'Informe um valor igual ou maior que zero.';
    if (!N.erros(f, er)) return;
    N.salvarConfig({ precos: { solo: n('p-solo'), turma: n('p-turma'), escola: n('p-escola') }, comissao: n('a-com'), diasTeste: n('a-dias'), taxaPct: n('a-taxa'), custoFixo: n('a-custo') });
    N.toast('Ajustes salvos. A página de vendas já mostra os novos valores.');
  });
  window.addEventListener('hashchange', render);
  render();
})();
