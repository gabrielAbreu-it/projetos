// Comportamento comum dos estudos de caso: ícones e índice que acompanha a leitura.
(function () {
  if (window.lucide) window.lucide.createIcons();

  var toc = document.querySelector('.toc');
  if (!toc) return;

  var details = toc.querySelector('details');
  var desktop = window.matchMedia('(min-width: 1024px)');

  function syncDetails() {
    if (desktop.matches) details.open = true;
  }
  syncDetails();
  desktop.addEventListener('change', syncDetails);

  var links = Array.prototype.slice.call(toc.querySelectorAll('a[href^="#"]'));
  links.forEach(function (link) {
    link.addEventListener('click', function () {
      if (!desktop.matches) details.open = false;
    });
  });

  if (!('IntersectionObserver' in window)) return;

  var byId = {};
  links.forEach(function (link) {
    byId[link.getAttribute('href').slice(1)] = link;
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) {
          l.removeAttribute('aria-current');
        });
        var active = byId[entry.target.id];
        if (active) active.setAttribute('aria-current', 'true');
      });
    },
    { rootMargin: '-30% 0px -60% 0px' }
  );

  document.querySelectorAll('.case-section[id]').forEach(function (section) {
    observer.observe(section);
  });
})();
