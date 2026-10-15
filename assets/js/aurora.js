// Comportamento da vitrine: ícones, tema, menu no celular, filtro de projetos e índice da página de projeto.
(function () {
  if (window.lucide) window.lucide.createIcons();

  var raiz = document.documentElement;
  var escuroSistema = window.matchMedia('(prefers-color-scheme: dark)');

  // Tema claro/escuro
  var tema = document.getElementById('tema');
  function temaAtual() {
    return raiz.getAttribute('data-theme') || (escuroSistema.matches ? 'dark' : 'light');
  }
  function rotularTema() {
    if (tema) tema.setAttribute('aria-pressed', temaAtual() === 'dark' ? 'true' : 'false');
  }
  if (tema) {
    tema.addEventListener('click', function () {
      var novo = temaAtual() === 'dark' ? 'light' : 'dark';
      raiz.setAttribute('data-theme', novo);
      try {
        localStorage.setItem('portfolio-tema', novo);
      } catch (e) {
        /* sem armazenamento: vale só nesta visita */
      }
      rotularTema();
    });
    escuroSistema.addEventListener('change', rotularTema);
    rotularTema();
  }

  // Menu no celular
  var menuBtn = document.getElementById('menu-btn');
  var menu = document.getElementById('menu-mobile');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var aberto = menuBtn.getAttribute('aria-expanded') === 'true';
      menuBtn.setAttribute('aria-expanded', aberto ? 'false' : 'true');
      menu.hidden = aberto;
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Busca e filtros em "Todos os projetos"
  var lista = document.getElementById('lista-projetos');
  if (lista) {
    var busca = document.getElementById('busca');
    var chips = Array.prototype.slice.call(document.querySelectorAll('[data-filtro]'));
    var itens = Array.prototype.slice.call(lista.querySelectorAll('[data-tags]'));
    var vazio = document.getElementById('vazio');
    var contagem = document.getElementById('contagem');
    var filtro = 'todos';

    function normalizar(t) {
      return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function aplicar() {
      var termo = normalizar(busca.value.trim());
      var visiveis = 0;
      itens.forEach(function (li) {
        var okFiltro = filtro === 'todos' || li.getAttribute('data-tags').split(' ').indexOf(filtro) !== -1;
        var okBusca = !termo || normalizar(li.textContent).indexOf(termo) !== -1;
        li.hidden = !(okFiltro && okBusca);
        if (!li.hidden) visiveis++;
      });
      vazio.hidden = visiveis > 0;
      contagem.textContent = visiveis === 1 ? '1 projeto' : visiveis + ' projetos';
    }

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        filtro = chip.getAttribute('data-filtro');
        chips.forEach(function (c) {
          c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
        });
        aplicar();
      });
    });
    busca.addEventListener('input', aplicar);
    var limpar = document.getElementById('limpar');
    if (limpar) {
      limpar.addEventListener('click', function () {
        busca.value = '';
        chips[0].click();
        busca.focus();
      });
    }
    aplicar();
  }

  // Índice que acompanha a leitura na página de projeto
  var toc = document.querySelector('.a-toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
    var porId = {};
    links.forEach(function (a) {
      porId[a.getAttribute('href').slice(1)] = a;
    });
    var obs = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) {
            a.removeAttribute('aria-current');
          });
          if (porId[en.target.id]) porId[en.target.id].setAttribute('aria-current', 'true');
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    document.querySelectorAll('.a-chapter[id]').forEach(function (s) {
      obs.observe(s);
    });
  }
})();
