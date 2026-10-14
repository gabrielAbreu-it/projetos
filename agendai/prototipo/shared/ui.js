/* Agendaí — toast e modal de confirmação, usados pelas duas interfaces */
(function () {
  'use strict';

  function icones() {
    if (window.lucide) window.lucide.createIcons();
  }

  function toast(msg, opts) {
    opts = opts || {};
    var area = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'ag-toast' + (opts.erro ? ' ag-toast--error' : '');
    el.innerHTML =
      '<span class="ag-toast__icon">' + AG.ic(opts.erro ? 'alert-circle' : 'check-circle-2') + '</span>' +
      '<span>' + AG.esc(msg) + '</span>' +
      (opts.acao ? '<button type="button" class="ag-toast__action">' + AG.esc(opts.acao) + '</button>' : '');
    if (opts.acao) {
      el.querySelector('button').addEventListener('click', function () {
        el.remove();
        opts.onAcao();
      });
    }
    area.appendChild(el);
    icones();
    setTimeout(function () {
      el.remove();
    }, opts.acao ? 7000 : 4000);
  }

  // Modal genérico. o.corpo pode trazer HTML extra (ex.: um select de motivo).
  function modal(o) {
    var dlg = document.getElementById('modal');
    dlg.innerHTML =
      '<form method="dialog" class="ag-modal__form" novalidate>' +
      '<div class="ag-modal__head"><h2 class="ag-modal__title" id="modal-title">' + AG.esc(o.titulo) + '</h2>' +
      '<button type="button" class="ag-icon-btn" data-fechar aria-label="Fechar">' + AG.ic('x') + '</button></div>' +
      '<div class="ag-modal__body">' + (o.texto ? '<p id="modal-text">' + AG.esc(o.texto) + '</p>' : '') + (o.corpo || '') + '</div>' +
      '<div class="ag-modal__actions">' +
      '<button type="button" class="ag-btn ag-btn--secondary" data-fechar>' + AG.esc(o.cancelar || 'Voltar') + '</button>' +
      '<button type="submit" class="ag-btn ' + (o.perigo ? 'ag-btn--danger' : 'ag-btn--primary') + '">' + AG.esc(o.confirmar) + '</button>' +
      '</div></form>';
    dlg.setAttribute('aria-labelledby', 'modal-title');
    if (o.texto) dlg.setAttribute('aria-describedby', 'modal-text');
    else dlg.removeAttribute('aria-describedby');
    icones();

    var form = dlg.querySelector('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (o.validar && !o.validar(form)) return;
      var dados = new FormData(form);
      dlg.close();
      o.onConfirmar(dados, form);
    });
    dlg.querySelectorAll('[data-fechar]').forEach(function (b) {
      b.addEventListener('click', function () {
        dlg.close();
      });
    });
    dlg.onclick = function (e) {
      if (e.target === dlg) dlg.close();
    };
    dlg.showModal();
    var foco = o.focoEm ? dlg.querySelector(o.focoEm) : null;
    (foco || dlg.querySelector('.ag-modal__actions [data-fechar]')).focus();
    if (o.aoAbrir) o.aoAbrir(form);
  }

  window.AG.toast = toast;
  window.AG.modal = modal;
  window.AG.icones = icones;
})();
