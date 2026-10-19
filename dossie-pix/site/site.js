/* Dossiê Pix · partes comuns do site (topo, rodapé, avisos) */
(function () {
  "use strict";
  var P = window.Piloto;
  var pagina = document.body.dataset.pagina || "";

  function link(href, txt, chave, extra) {
    return '<a href="' + href + '"' + (pagina === chave ? ' aria-current="page"' : "") + (extra ? ' class="' + extra + '"' : "") + ">" + txt + "</a>";
  }

  var topo = document.getElementById("topo");
  if (topo) {
    topo.innerHTML =
      '<div class="demo-bar"><i data-lucide="info"></i>Demonstração: nenhum pagamento é feito e os dados são fictícios.</div>' +
      '<div class="top"><div class="wrap">' +
      '<a class="brand" href="index.html" aria-label="Dossiê Pix, página inicial"><img src="../prototipo/icon.svg" alt="" width="32" height="32"><span>Dossiê Pix</span></a>' +
      '<nav aria-label="Site">' +
      link("index.html#como-funciona", "Como funciona", "", "hide-md") +
      link("index.html#planos", "Planos", "") +
      link("afiliados.html", "Afiliados", "afiliados") +
      link("ajuda.html", "Ajuda", "ajuda") +
      link("../prototipo/index.html#painel", "Entrar", "") +
      '<a class="btn btn--primary" href="cadastro.html">Teste grátis</a>' +
      "</nav></div></div>";
  }

  var rodape = document.getElementById("rodape");
  if (rodape) {
    rodape.innerHTML =
      '<div class="wrap">' +
      '<div><a class="brand" href="index.html"><img src="../prototipo/icon.svg" alt="" width="28" height="28"><span>Dossiê Pix</span></a>' +
      "<p>Organiza as provas das suas vendas por Pix e gera um dossiê para contestar pedidos de devolução. Não é aconselhamento jurídico e não garante o resultado da contestação.</p></div>" +
      '<div><h3>Produto</h3><ul><li><a href="index.html#planos">Planos</a></li><li><a href="cadastro.html">Teste grátis</a></li><li><a href="../prototipo/index.html#painel">Abrir o app</a></li><li><a href="afiliados.html">Programa de afiliados</a></li></ul></div>' +
      '<div><h3>Suporte</h3><ul><li><a href="ajuda.html">Central de ajuda</a></li><li><a href="ajuda.html#termos">Termos de uso</a></li><li><a href="ajuda.html#privacidade">Privacidade</a></li><li><a href="https://github.com/gabrielAbreu-it/projetos/blob/main/dossie-pix/docs/08-piloto-automatico.md">Como esta demonstração funciona</a></li></ul></div>' +
      '<div class="foot__legal"><span>Projeto conceitual de 2026 · Demonstração com dados fictícios</span>' +
      '<a href="../admin/index.html">Painel do dono (demonstração)</a></div>' +
      "</div>";
  }

  window.Site = {
    toast: function (msg) {
      var box = document.getElementById("toasts");
      if (!box) return;
      var t = document.createElement("div");
      t.className = "toast";
      t.innerHTML = '<i data-lucide="check-circle-2"></i><span>' + P.esc(msg) + "</span>";
      box.appendChild(t);
      P.icones();
      setTimeout(function () { t.remove(); }, 4500);
    },
    copiar: function (texto) {
      if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(texto).then(function () { return true; }, function () { return copiaManual(texto); });
      }
      return Promise.resolve(copiaManual(texto));
    }
  };
  function copiaManual(texto) {
    var ta = document.createElement("textarea");
    ta.value = texto;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }

  document.addEventListener("DOMContentLoaded", P.icones);
  P.icones();
})();
