/* Mentor OS · programa de afiliados (demonstração) */
(function () {
  const N = window.Negocio;
  const main = document.getElementById('conteudo');
  const icon = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`;
  const statusChip = { ativo: '<span class="chip chip--ok">Assinante</span>', teste: '<span class="chip chip--info">Em teste</span>', atrasado: '<span class="chip chip--warn">Pagamento atrasado</span>', cancelado: '<span class="chip chip--muted">Cancelou</span>' };
  const curto = (n) => { const p = n.split(' '); return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : n; };

  function apresentacao() {
    const c = N.config();
    return `<section class="sec--dark af-hero"><div class="wrap">
        <div><p class="eyebrow">Programa de afiliados</p><h1 class="h1">Indique o Mentor OS para outros mentores e receba todo mês.</h1>
          <p class="lead" style="margin-top:14px">Enquanto o mentor que você indicou continuar assinando, uma parte da mensalidade é sua. A comissão é separada automaticamente a cada pagamento.</p>
          <div class="row" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px"><a class="btn btn--lime btn--lg" href="#quero">Quero ser afiliado</a><button class="btn btn--ghost-dark btn--lg" type="button" data-act="exemplo">Ver painel de exemplo</button></div></div>
        <div class="af-num"><span class="small">Comissão recorrente</span><strong>${c.comissao}%</strong><span class="small">de cada mensalidade paga pelo mentor indicado, todo mês (hipótese a validar)</span></div>
      </div></section>
      <section class="sec"><div class="wrap">
        <p class="eyebrow">Como funciona</p><h2 class="h2">Três passos</h2>
        <ol class="af-passos">
          <li class="card">${icon('link')}<h3 class="h3">Pegue seu link</h3><p class="muted">Depois do cadastro, você recebe um link só seu, como mentoros.app/?ref=seunome.</p></li>
          <li class="card">${icon('share-2')}<h3 class="h3">Compartilhe</h3><p class="muted">No seu canal, grupo de mentores ou conversa. Quem clicar fica ligado a você por 30 dias.</p></li>
          <li class="card">${icon('wallet')}<h3 class="h3">Receba todo mês</h3><p class="muted">A cada mensalidade paga, sua parte é separada sozinha e cai por Pix no dia 10 do mês seguinte.</p></li>
        </ol>
      </div></section>
      <section class="sec sec--alt" id="quero"><div class="wrap af-cols">
        <div><p class="eyebrow">Regras</p><h2 class="h2">Simples e por escrito</h2>
          <ul class="regras">
            <li>Comissão de <strong>${c.comissao}%</strong> sobre cada mensalidade paga, enquanto o cliente continuar assinando.</li>
            <li>Mensalidade atrasada ou devolvida não gera comissão.</li>
            <li>Pagamento por Pix no dia 10 do mês seguinte, a partir de R$ 50 acumulados.</li>
            <li>Não vale indicar a si mesmo nem anunciar usando o nome Mentor OS em buscadores.</li>
            <li>Não prometa renda nem resultado de aprovação para quem você indicar.</li>
          </ul>
          <p class="aviso-renda" style="margin-top:12px">Percentual, prazos e valor mínimo são hipóteses deste projeto e podem mudar antes do lançamento.</p></div>
        <form class="card form" id="f-af" novalidate aria-labelledby="fa-t">
          <h3 class="h3" id="fa-t">Cadastro de afiliado</h3>
          <div class="field"><label class="field__label" for="af-nome">Nome ou nome do canal</label><input class="field__input" id="af-nome" aria-describedby="af-nome-e" /><p class="field__erro" id="af-nome-e" hidden></p></div>
          <div class="field"><label class="field__label" for="af-cod">Como quer seu link</label><input class="field__input" id="af-cod" placeholder="seunome" aria-describedby="af-cod-h af-cod-e" /><p class="field__hint" id="af-cod-h">Só letras minúsculas e números, de 3 a 20.</p><p class="field__erro" id="af-cod-e" hidden></p></div>
          <div class="field"><label class="field__label" for="af-pix">Chave Pix para receber</label><input class="field__input" id="af-pix" aria-describedby="af-pix-h af-pix-e" /><p class="field__hint" id="af-pix-h">Demonstração: use uma chave inventada.</p><p class="field__erro" id="af-pix-e" hidden></p></div>
          <label class="check" style="display:flex;gap:10px;font-size:var(--fs-sm);min-height:44px"><input type="checkbox" id="af-ok" style="width:22px;height:22px;accent-color:var(--primary)" aria-describedby="af-ok-e" /><span>Li as regras do programa.</span></label><p class="field__erro" id="af-ok-e" hidden></p>
          <button class="btn btn--primary btn--lg" type="submit">Criar meu link</button>
        </form>
      </div></section>`;
  }

  function painel(id) {
    const d = N.painelAfiliado(id);
    if (!d) { N.sairAfiliado(); return apresentacao(); }
    const base = location.href.split('afiliados.html')[0];
    const link = `${base}index.html?ref=${d.af.codigo}`;
    return `<div class="wrap">
      <div class="painel-head"><div><p class="eyebrow">Painel do afiliado · desde ${N.data(d.af.desde)}</p><h1>Olá, ${N.esc(d.af.nome.split(' ')[0])}</h1></div>
        <button class="btn btn--ghost" type="button" data-act="sair">${icon('log-out')} Sair do painel</button></div>
      <section class="card" aria-labelledby="lk-t">
        <h2 class="h3" id="lk-t">Seu link de indicação</h2>
        <div class="link-box"><div class="field"><label class="sr-only" for="meu-link">Seu link</label><input class="field__input" id="meu-link" readonly value="${N.esc(link)}" /></div>
          <button class="btn btn--primary" type="button" data-act="copiar">${icon('copy')} Copiar link</button></div>
        <p class="small muted">Teste: abra o link em outra aba. O clique é contado e o cadastro feito por ele aparece aqui e no painel do dono.</p>
      </section>
      <dl class="kpis kpis--af">
        <div class="kpi"><dt>Cliques no link</dt><dd>${d.af.cliques.toLocaleString('pt-BR')}</dd></div>
        <div class="kpi"><dt>Cadastros</dt><dd>${d.cadastros}<small>${d.af.cliques ? ((d.cadastros / d.af.cliques) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '% dos cliques' : 'sem cliques ainda'}</small></dd></div>
        <div class="kpi"><dt>Assinantes ativos</dt><dd>${d.ativos}</dd></div>
        <div class="kpi"><dt>Comissão do mês</dt><dd>${N.brl(d.doMes)}<small>${N.config().comissao}% das mensalidades pagas</small></dd></div>
        <div class="kpi"><dt>A receber</dt><dd>${N.brl(d.aReceber)}<small>Pix em ${N.data(d.proximoPagamento)}</small></dd></div>
      </dl>
      <div class="af-grid">
        <section class="card" aria-labelledby="hi-t"><h2 class="h3" id="hi-t">Histórico de pagamentos</h2>
          ${d.historico.length ? `<div class="tabela-wrap"><table class="tabela"><thead><tr><th scope="col">Mês</th><th scope="col" class="num">Comissão</th><th scope="col">Pago em</th><th scope="col">Status</th></tr></thead>
          <tbody>${d.historico.map((h) => `<tr><td>${h.nome}</td><td class="num">${N.brl(h.valor)}</td><td>${N.data(h.pagoEm)}</td><td><span class="chip chip--ok">Pago por Pix</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Ainda não há pagamentos. A primeira comissão aparece depois da primeira mensalidade paga por alguém que você indicou.</p>'}
        </section>
        <section class="card" aria-labelledby="cl-t"><h2 class="h3" id="cl-t">Mentores que você indicou</h2>
          ${d.clientes.length ? `<div class="tabela-wrap"><table class="tabela"><thead><tr><th scope="col">Mentor</th><th scope="col">Plano</th><th scope="col">Situação</th></tr></thead>
          <tbody>${d.clientes.map((c) => `<tr><td>${N.esc(curto(c.nome))}</td><td>${N.PLANOS[c.plano].curto}</td><td>${statusChip[c.status] || ''}</td></tr>`).join('')}</tbody></table></div>
          <p class="small muted">Por privacidade, você vê só o primeiro nome e a inicial.</p>` : '<p class="muted">Ninguém se cadastrou pelo seu link ainda. Compartilhe com um mentor que hoje usa planilha.</p>'}
        </section>
      </div>
    </div>`;
  }

  function render(focar) {
    const id = N.estado().afiliadoLogado;
    main.innerHTML = id ? painel(id) : apresentacao();
    N.icones();
    if (focar) { const h = main.querySelector('h1'); h.setAttribute('tabindex', '-1'); h.focus(); }
  }

  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'exemplo') { N.entrarAfiliado('af1'); render(true); N.toast('Você está vendo o painel de exemplo da afiliada Marina Couto.'); }
    if (b.dataset.act === 'sair') { N.sairAfiliado(); render(true); }
    if (b.dataset.act === 'copiar') { const i = document.getElementById('meu-link'); const ok = await N.copiar(i.value, i); N.toast(ok ? 'Link copiado. Cole onde quiser compartilhar.' : 'Link selecionado. Use Ctrl+C para copiar.'); }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'f-af') return;
    e.preventDefault();
    const f = e.target, v = (id) => f.querySelector('#' + id).value.trim();
    const er = {};
    if (v('af-nome').length < 3) er['af-nome'] = 'Escreva seu nome ou o nome do canal.';
    if (!/^[a-z0-9]{3,20}$/.test(v('af-cod'))) er['af-cod'] = 'Use de 3 a 20 letras minúsculas ou números, sem espaço.';
    else if (N.afiliadoPorCodigo(v('af-cod'))) er['af-cod'] = 'Esse link já existe. Tente outro.';
    if (v('af-pix').length < 5) er['af-pix'] = 'Informe a chave Pix (CPF, e-mail, telefone ou aleatória).';
    if (!f.querySelector('#af-ok').checked) er['af-ok'] = 'Confirme que leu as regras.';
    if (!N.erros(f, er)) return;
    N.cadastrarAfiliado({ nome: v('af-nome'), codigo: v('af-cod'), pix: v('af-pix') });
    render(true); N.toast('Cadastro feito. Seu link está pronto.');
  });
  render(false);
})();
