/* Aprova Hub · lista de editais resumidos (usada no app e na página pública /editais/) */
(function () {
  const E = window.Editais;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`;
  const TIPOS = ['edital de abertura', 'retificação', 'resultado', 'homologação', 'processo seletivo'];
  const classeTipo = (t) => 'tp--' + String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
  const POR_PAGINA = 8;

  function estadoLive(d) {
    if (d.modo === 'vivo') return `<p class="ao-vivo" role="status"><span class="ao-vivo__dot" aria-hidden="true"></span>Ao vivo · atualizado ${E.haQuanto(d.atualizado_em)} · fonte: Querido Diário</p>`;
    return `<p class="ao-vivo ao-vivo--demo" role="status"><span class="badge-demo">dados de exemplo</span>${d.motivo === 'erro' ? 'Não foi possível consultar os diários agora.' : 'Na versão publicada, esta lista vem dos diários oficiais.'}</p>`;
  }

  function cartao(i, demo) {
    const extras = [i.vagas ? `<li><b>${i.vagas.toLocaleString('pt-BR')}</b> vagas</li>` : '', i.salario ? `<li>até <b>${esc(i.salario)}</b></li>` : '', i.inscricoes_ate ? `<li>inscrições até <b>${E.fmtData(i.inscricoes_ate)}</b></li>` : '', i.banca ? `<li>banca: <b>${esc(i.banca)}</b></li>` : ''].join('');
    const link = (url, txt, ic) => url && !demo ? `<a class="btn-ed" href="${esc(url)}" target="_blank" rel="noopener">${icon(ic)} ${txt}</a>` : `<span class="btn-ed btn-ed--off" aria-disabled="true">${icon(ic)} ${txt}<small>link disponível na versão ao vivo</small></span>`;
    return `<li class="ed-card">
      <div class="ed-card__top"><span class="tp ${classeTipo(i.tipo)}">${esc(i.tipo)}</span><span class="ed-card__data">${i.uf ? esc(i.uf) + ' · ' : ''}${E.quandoData(i.data)}</span></div>
      <h3 class="ed-card__t">${esc(i.orgao)}</h3>
      <p class="ed-card__r">${esc(i.resumo)}</p>
      ${extras ? `<ul class="ed-card__x">${extras}</ul>` : ''}
      <div class="ed-card__acts">${link(i.links && i.links.diario, 'Ver no Diário Oficial', 'external-link')}${link(i.links && i.links.texto, 'Texto completo', 'file-text')}</div>
    </li>`;
  }

  const AL = () => window.AHAlertas;
  const adapt = (i) => ({ id: 'e-' + i.id, texto: `${i.orgao} ${i.resumo} ${i.municipio || ''}`, uf: i.uf, salario: i.salario });

  function montar(root, opts = {}) {
    const linkAlertas = opts.linkAlertas || '#alertas';
    const st = { uf: '', tipo: '', q: '', pv: false, mostrar: POR_PAGINA, dados: null };
    root.innerHTML = `<div class="ed" aria-busy="true"><p class="ed-carregando">${icon('loader')} Carregando editais…</p></div>`;
    if (window.lucide) window.lucide.createIcons();

    function filtrados() {
      const q = st.q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const p = AL() && AL().prefs();
      return st.dados.itens.filter((i) => (!st.pv || (p && AL().combina(adapt(i), p))) && (!st.uf || i.uf === st.uf) && (!st.tipo || i.tipo === st.tipo) && (!q || (i.orgao + ' ' + i.resumo + ' ' + (i.municipio || '')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').includes(q)));
    }

    function desenhar(focoId) {
      const d = st.dados, demo = d.modo !== 'vivo';
      const ufs = [...new Set(d.itens.map((i) => i.uf).filter(Boolean))].sort();
      const lista = filtrados();
      const prefs = AL() && AL().prefs();
      const nNovos = prefs ? AL().novos(d.itens.map(adapt), prefs).length : 0;
      if (st.pv && prefs) setTimeout(() => AL().marcarVistos(lista.map(adapt)), 0);
      const vis = lista.slice(0, st.mostrar);
      root.innerHTML = `<div class="ed">
        ${estadoLive(d)}
        ${d.motivo === 'erro' ? `<div class="ed-erro" role="alert">${icon('wifi-off')}<span>Os diários oficiais não responderam. Mostrando dados de exemplo.</span><button type="button" class="ed-link" data-ed="tentar">Tentar de novo</button></div>` : ''}
        <div class="ed-filtros">
          <div class="ed-busca"><label class="sr-only" for="ed-q">Buscar por cidade, cargo ou palavra</label>${icon('search')}<input id="ed-q" type="search" placeholder="Buscar cidade, cargo ou palavra" value="${esc(st.q)}" autocomplete="off" /></div>
          <div><label class="sr-only" for="ed-uf">Estado</label><select id="ed-uf"><option value="">Todos os estados</option>${ufs.map((u) => `<option ${st.uf === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
          <div><label class="sr-only" for="ed-tipo">Tipo de publicação</label><select id="ed-tipo"><option value="">Todos os tipos</option>${TIPOS.map((t) => `<option value="${t}" ${st.tipo === t ? 'selected' : ''}>${t[0].toUpperCase() + t.slice(1)}</option>`).join('')}</select></div>
        </div>
        ${AL() ? `<div class="ed-pv-linha"><button type="button" class="ed-pv" data-ed="pv" aria-pressed="${st.pv}">${icon('sparkles')} Para você${nNovos ? `<span class="ed-pv__n">${nNovos} ${nNovos === 1 ? 'novo' : 'novos'}</span>` : ''}</button>${st.pv ? `<a class="ed-link" href="${linkAlertas}">${prefs ? 'Editar alertas' : 'Configurar alertas'}</a>` : ''}</div>` : ''}
        ${st.pv && !prefs ? `<div class="ed-vazio">${icon('bell')}<p><strong>Você ainda não configurou seus alertas.</strong></p><a class="ed-link" href="${linkAlertas}">Configurar alertas no app</a></div>` : ''}
        <p class="ed-cont" aria-live="polite">${lista.length} ${lista.length === 1 ? 'publicação' : 'publicações'}</p>
        ${vis.length ? `<ul class="ed-lista">${vis.map((i) => cartao(i, demo)).join('')}</ul>` : `<div class="ed-vazio">${icon('search-x')}<p><strong>Nenhum edital com esses filtros.</strong></p><button type="button" class="ed-link" data-ed="limpar">Limpar filtros</button></div>`}
        ${lista.length > vis.length ? `<button type="button" class="ed-mais" data-ed="mais">Carregar mais (${lista.length - vis.length})</button>` : ''}
        <p class="ed-nota">${icon('info')} Resumo automático a partir do diário oficial. Confira sempre o documento original.</p>
      </div>`;
      if (window.lucide) window.lucide.createIcons();
      if (focoId) { const el = root.querySelector('#' + focoId); if (el) { el.focus(); if (el.setSelectionRange && el.type === 'search') el.setSelectionRange(el.value.length, el.value.length); } }
    }

    root.addEventListener('input', (e) => { if (e.target.id === 'ed-q') { st.q = e.target.value; st.mostrar = POR_PAGINA; desenhar('ed-q'); } });
    root.addEventListener('change', (e) => {
      if (e.target.id === 'ed-uf') { st.uf = e.target.value; st.mostrar = POR_PAGINA; desenhar('ed-uf'); }
      if (e.target.id === 'ed-tipo') { st.tipo = e.target.value; st.mostrar = POR_PAGINA; desenhar('ed-tipo'); }
    });
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-ed]'); if (!b) return;
      if (b.dataset.ed === 'mais') { const antes = st.mostrar; st.mostrar += POR_PAGINA; desenhar(); const card = root.querySelectorAll('.ed-card')[antes]; if (card) { card.setAttribute('tabindex', '-1'); card.focus(); } }
      if (b.dataset.ed === 'limpar') { st.uf = ''; st.tipo = ''; st.q = ''; st.pv = false; desenhar('ed-q'); }
      if (b.dataset.ed === 'pv') { st.pv = !st.pv; st.mostrar = POR_PAGINA; desenhar(); const x = root.querySelector('[data-ed=pv]'); if (x) x.focus(); }
      if (b.dataset.ed === 'tentar') { st.dados = await E.carregar(true); desenhar(); }
    });

    E.carregar().then((d) => { st.dados = d; desenhar(); });
  }

  window.EditaisUI = { montar, cartao, classeTipo };
})();
