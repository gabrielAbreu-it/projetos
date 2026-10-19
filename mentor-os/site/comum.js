/* Mentor OS · topo, rodapé e captura do link de afiliado, comuns às páginas do site */
(function () {
  const N = window.Negocio;
  N.carregarRef = function () {
    const p = new URLSearchParams(location.search);
    const ref = p.get('ref');
    if (ref) { const af = N.registrarClique(ref); if (af) N.toast(`Você chegou pelo link de ${N.esc(af.nome)}.`); }
  };
  const pagina = document.body.dataset.pagina;
  const link = (href, txt, id) => `<a href="${href}" ${pagina === id ? 'aria-current="page"' : ''}>${txt}</a>`;
  const topo = document.getElementById('topo');
  if (topo) {
    topo.innerHTML = `<div class="demo-aviso"><div class="wrap"><i data-lucide="info" aria-hidden="true"></i><span>Demonstração: nenhum pagamento é feito e os dados são fictícios.</span></div></div>
    <header class="top"><div class="wrap">
      <a class="brand" href="index.html"><span class="brand__mark" aria-hidden="true"><i data-lucide="sprout"></i></span>Mentor OS</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="top-nav" aria-label="Abrir menu"><i data-lucide="menu" aria-hidden="true"></i></button>
      <nav class="top__nav" id="top-nav" aria-label="Site">
        ${link('index.html#como', 'Como funciona', 'x')}
        ${link('index.html#planos', 'Planos', 'x')}
        ${link('afiliados.html', 'Afiliados', 'afiliados')}
        ${link('ajuda.html', 'Ajuda', 'ajuda')}
        <a href="../prototipo/index.html#mentor/turma">Entrar</a>
        <a class="btn btn--lime" href="cadastro.html">Começar teste grátis</a>
      </nav>
    </div></header>`;
    const b = topo.querySelector('.menu-btn'), nav = topo.querySelector('#top-nav');
    b.addEventListener('click', () => { const ab = nav.classList.toggle('is-aberto'); b.setAttribute('aria-expanded', String(ab)); b.setAttribute('aria-label', ab ? 'Fechar menu' : 'Abrir menu'); });
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) { nav.classList.remove('is-aberto'); b.setAttribute('aria-expanded', 'false'); } });
  }
  const rodape = document.getElementById('rodape');
  if (rodape) {
    rodape.innerHTML = `<footer class="foot"><div class="wrap">
      <div class="foot__cols">
        <div><a class="brand" href="index.html"><span class="brand__mark" aria-hidden="true"><i data-lucide="sprout"></i></span>Mentor OS</a>
          <p>Acompanhamento de alunos para mentores de concurso público. O aluno usa de graça.</p></div>
        <div><h2>Produto</h2><ul><li><a href="index.html#planos">Planos</a></li><li><a href="../prototipo/index.html">Ver o app</a></li><li><a href="cadastro.html">Teste grátis</a></li></ul></div>
        <div><h2>Ajuda</h2><ul><li><a href="ajuda.html">Central de ajuda</a></li><li><a href="afiliados.html">Programa de afiliados</a></li></ul></div>
        <div><h2>Legal</h2><ul><li><a href="legal.html#termos">Termos de uso</a></li><li><a href="legal.html#privacidade">Privacidade</a></li></ul></div>
      </div>
      <div class="foot__base"><span>Mentor OS · projeto conceitual de Gabriel Abreu, 2026. Demonstração com dados fictícios.</span>
        <a class="foot__dono" href="../admin/index.html">Painel do dono (demonstração)</a></div>
    </div></footer>`;
  }
  N.icones();
})();
