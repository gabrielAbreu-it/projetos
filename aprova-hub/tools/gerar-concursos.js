/* Aprova Hub · gera as páginas públicas dos concursos (HTML estático, bom para buscadores).
   Uso: node aprova-hub/tools/gerar-concursos.js
   Lê prototipo/concursos-dados.js e escreve concursos/<slug>.html e concursos/index.html. */
const fs = require('fs');
const path = require('path');
const { ETAPAS, CONCURSOS, etapaAtual, dataProva, totalVagas, maiorSalario } = require('../prototipo/concursos-dados.js');

const OUT = path.join(__dirname, '..', 'concursos');
const SITE = 'https://gabriel-abreu-portfolio.vercel.app/aprova-hub/concursos/';
const IMG = 'https://gabriel-abreu-portfolio.vercel.app/assets/img/capa-aprova-hub.png';
const hoje = process.env.HOJE || new Date().toISOString().slice(0, 10);

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (iso) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const brl = (v) => 'R$ ' + v.toLocaleString('pt-BR');
const quando = (v) => (Array.isArray(v) ? `${fmt(v[0])} a ${fmt(v[1])}` : fmt(v));
const nomeEtapa = (id) => ETAPAS.find((e) => e[0] === id)[1];

function head({ titulo, desc, url, extra = '' }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#0f2621" />
  <title>${esc(titulo)}</title>
  <meta name="description" content="${esc(desc)}" />
  <!-- Concurso fictício de demonstração: fica fora dos buscadores. Nas páginas reais, remover o noindex. -->
  <meta name="robots" content="noindex, follow" />
  <link rel="canonical" href="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Aprova Hub" />
  <meta property="og:title" content="${esc(titulo)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${IMG}" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="../prototipo/icon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../../assets/css/base.css" />
  <link rel="stylesheet" href="../prototipo/tokens.css" />
  <link rel="stylesheet" href="concursos.css" />
${extra}</head>`;
}

const topo = `<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
  <header class="topo"><div class="in"><a class="marca" href="index.html"><span aria-hidden="true"><svg viewBox="0 0 512 512" width="18" height="18"><path d="M150 268l70 70 142-150" fill="none" stroke="#fff" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Aprova Hub</a>
  <nav aria-label="Site"><a href="index.html">Concursos</a><a href="../editais/index.html">Editais do dia</a><a class="app" href="../prototipo/index.html#radar">Abrir o app</a></nav></div></header>`;
const rodape = `<footer class="rodape"><div class="in"><p>Aprova Hub · projeto conceitual de Gabriel Abreu, 2026. Todos os concursos desta seção são fictícios, criados para demonstração.</p>
  <p><a href="index.html">Todos os concursos</a> · <a href="../editais/index.html">Editais do dia</a> · <a href="../prototipo/index.html#radar">App</a></p></div></footer>`;

function pagina(c) {
  const atual = etapaAtual(c, hoje);
  const ia = ETAPAS.findIndex((e) => e[0] === atual);
  const vagas = totalVagas(c), sal = maiorSalario(c);
  const insc = c.etapas.inscricoes;
  const titulo = `${c.titulo}: ${vagas.toLocaleString('pt-BR')} vagas, até ${brl(sal)} · Aprova Hub`;
  const desc = `Concurso fictício de demonstração. ${c.orgao}: ${c.cargos.map((x) => x.nome).join(', ')}, ${vagas} vagas, salário até ${brl(sal)}, nível ${c.escolaridade.toLowerCase()}. Etapa atual: ${nomeEtapa(atual)}. Prova em ${fmt(dataProva(c))}.`;
  const url = SITE + c.slug + '.html';
  const ld = {
    '@context': 'https://schema.org', '@type': 'Event',
    name: `Prova do concurso ${c.titulo}`,
    description: desc,
    startDate: dataProva(c),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: { '@type': 'Place', name: 'Local a definir no edital', address: { '@type': 'PostalAddress', ...(c.uf !== 'BR' ? { addressRegion: c.uf } : {}), addressCountry: 'BR' } },
    organizer: { '@type': 'Organization', name: c.orgao },
    url
  };
  const extra = `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n`;
  return `${head({ titulo, desc, url, extra })}
<body>
  ${topo}
  <main id="conteudo" class="in">
    <p class="aviso" role="note">Concurso fictício de demonstração. Nomes, datas e números não são reais.</p>
    <nav class="trilha" aria-label="Você está em"><a href="index.html">Concursos</a> › <span>${esc(c.orgao)}</span></nav>
    <h1>${esc(c.titulo)}</h1>
    <p class="sub">Etapa atual: <strong>${esc(nomeEtapa(atual))}</strong> (em ${fmt(hoje)})</p>
    <div class="grade">
      <section class="card" aria-labelledby="r-t"><h2 id="r-t">Resumo</h2>
        <dl class="resumo">
          <div><dt>Órgão</dt><dd>${esc(c.orgao)}</dd></div>
          <div><dt>Cargos</dt><dd>${c.cargos.map((x) => esc(x.nome)).join(', ')}</dd></div>
          <div><dt>Vagas</dt><dd>${vagas.toLocaleString('pt-BR')}</dd></div>
          <div><dt>Salário</dt><dd>até ${brl(sal)}</dd></div>
          <div><dt>Escolaridade</dt><dd>${esc(c.escolaridade)}${c.cargos.some((x) => x.escolaridade !== c.escolaridade) ? ' e superior' : ''}</dd></div>
          <div><dt>Banca</dt><dd>${esc(c.banca)}</dd></div>
          <div><dt>Inscrições</dt><dd>${quando(insc)}${(c.previsao || []).includes('inscricoes') ? ' (previsão)' : ''}</dd></div>
          <div><dt>Data da prova</dt><dd>${fmt(dataProva(c))}${(c.previsao || []).includes('prova') ? ' (previsão)' : ''}</dd></div>
        </dl>
        <table class="cargos"><caption>Cargos</caption><thead><tr><th scope="col">Cargo</th><th scope="col">Vagas</th><th scope="col">Salário</th></tr></thead>
          <tbody>${c.cargos.map((x) => `<tr><th scope="row">${esc(x.nome)}</th><td>${x.vagas}</td><td>${brl(x.salario)}</td></tr>`).join('')}</tbody></table>
      </section>
      <section class="card" aria-labelledby="t-t"><h2 id="t-t">Linha do tempo</h2>
        <ol class="tl">${ETAPAS.map(([id, nome], i) => `<li class="${i < ia ? 'feito' : i === ia ? 'atual' : 'futuro'}" ${i === ia ? 'aria-current="step"' : ''}><b>${nome}</b><span>${quando(c.etapas[id])}${(c.previsao || []).includes(id) ? ' · previsão' : ''}${i === ia ? ' · etapa atual' : ''}</span></li>`).join('')}</ol>
      </section>
    </div>
    <section class="card" aria-labelledby="c-t"><h2 id="c-t">Conteúdo programático resumido</h2>
      <div class="materias">${c.materias.map((m) => `<div><h3>${esc(m.nome)}</h3><ul>${m.topicos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('')}</div>
    </section>
    <section class="cta"><h2>Acompanhe este concurso no Aprova Hub</h2><p>Receba aviso a cada etapa, marque o que já estudou no edital verticalizado e gere um plano até a prova.</p>
      <a class="btn" href="../prototipo/index.html#concurso/${c.slug}">Acompanhar no app</a></section>
  </main>
  ${rodape}
</body>
</html>
`;
}

function indice() {
  const titulo = 'Concursos acompanhados · Aprova Hub';
  const desc = 'Concursos fictícios de demonstração do Aprova Hub, com vagas, salário, banca, linha do tempo e conteúdo programático resumido.';
  return `${head({ titulo, desc, url: SITE })}
<body>
  ${topo}
  <main id="conteudo" class="in">
    <p class="aviso" role="note">Concursos fictícios de demonstração. Nomes, datas e números não são reais.</p>
    <h1>Concursos</h1>
    <p class="sub">Uma página por concurso, com o resumo, a linha do tempo e o conteúdo programático.</p>
    <ul class="lista">${CONCURSOS.map((c) => { const at = etapaAtual(c, hoje); return `<li class="card"><p class="etapa">${esc(nomeEtapa(at))}</p><h2><a href="${c.slug}.html">${esc(c.titulo)}</a></h2>
      <p>${totalVagas(c).toLocaleString('pt-BR')} vagas · até ${brl(maiorSalario(c))} · nível ${esc(c.escolaridade.toLowerCase())} · ${esc(c.abrangencia)}${c.uf !== 'BR' ? ' (' + c.uf + ')' : ''}</p><p class="prova">Prova: ${fmt(dataProva(c))}${(c.previsao || []).includes('prova') ? ' (previsão)' : ''}</p></li>`; }).join('')}</ul>
  </main>
  ${rodape}
</body>
</html>
`;
}

fs.mkdirSync(OUT, { recursive: true });
CONCURSOS.forEach((c) => fs.writeFileSync(path.join(OUT, c.slug + '.html'), pagina(c)));
fs.writeFileSync(path.join(OUT, 'index.html'), indice());
console.log(`ok: ${CONCURSOS.length} páginas + índice em ${OUT} (data de referência ${hoje})`);
