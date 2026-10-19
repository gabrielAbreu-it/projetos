/* Dossiê Pix · painel do dono (demonstração com dados fictícios) */
(function () {
  "use strict";
  var P = window.Piloto, brl = P.brl, esc = P.esc;
  var view = document.getElementById("view");
  var CONTA = { banco: "Banco Exemplo (fictício)", agencia: "0001", conta: "••••4821-0", titular: "Gabriel A." };

  function ic(n) { return '<i data-lucide="' + n + '" aria-hidden="true"></i>'; }
  function nomePlano(id) { return P.PLANOS.filter(function (p) { return p.id === id; })[0].nome; }
  function nomeOrigem(id) { return P.ORIGENS.filter(function (o) { return o[0] === id; })[0][1]; }
  function dataBR(iso) { return new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("pt-BR"); }

  var SECOES = [["visao", "layout-dashboard", "Visão geral"], ["assinantes", "users", "Assinantes"], ["retiradas", "landmark", "Retiradas"], ["ajustes", "settings", "Ajustes"]];

  function nav(atual) {
    var html = SECOES.map(function (s) {
      return '<a href="#' + s[0] + '"' + (s[0] === atual ? ' aria-current="page"' : "") + ">" + ic(s[1]) + "<span>" + s[2] + "</span></a>";
    }).join("");
    document.getElementById("nav-lateral").innerHTML = html;
    document.getElementById("nav-topo").innerHTML = html;
  }

  function toast(msg) {
    var box = document.getElementById("toasts"), t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = ic("check-circle-2") + "<span>" + esc(msg) + "</span>";
    box.appendChild(t);
    P.icones();
    setTimeout(function () { t.remove(); }, 4500);
  }

  function kpi(rotulo, valor, sub, tom, icone) {
    return '<div class="kpi' + (tom ? " kpi--" + tom : "") + '"><p class="kpi__label">' + ic(icone) + rotulo + '</p><p class="kpi__value">' + valor + '</p><p class="kpi__sub">' + sub + "</p></div>";
  }

  /* ---------- gráfico de receita (SVG, uma série) ---------- */
  function grafico(serie) {
    var W = 640, H = 240, mL = 56, mR = 12, mT = 16, mB = 32;
    var max = Math.max.apply(null, serie.map(function (s) { return s.valor; }));
    var topo = Math.ceil(max / 2000) * 2000 || 2000;
    var bw = (W - mL - mR) / serie.length, barra = Math.min(44, bw * 0.5);
    var y = function (v) { return mT + (H - mT - mB) * (1 - v / topo); };
    var g = "";
    for (var i = 0; i <= 4; i++) {
      var v = (topo / 4) * i, yy = y(v);
      g += '<line x1="' + mL + '" x2="' + (W - mR) + '" y1="' + yy + '" y2="' + yy + '" class="grid"/>';
      g += '<text x="' + (mL - 8) + '" y="' + (yy + 4) + '" text-anchor="end" class="ax">' + (v >= 1000 ? (v / 1000).toLocaleString("pt-BR") + " mil" : v) + "</text>";
    }
    serie.forEach(function (s, i) {
      var x = mL + bw * i + (bw - barra) / 2, yt = y(s.valor), h = H - mB - yt, r = Math.min(4, h);
      var d = "M" + x + "," + (H - mB) + " V" + (yt + r) + " Q" + x + "," + yt + " " + (x + r) + "," + yt + " H" + (x + barra - r) + " Q" + (x + barra) + "," + yt + " " + (x + barra) + "," + (yt + r) + " V" + (H - mB) + " Z";
      var atual = i === serie.length - 1;
      g += '<path d="' + d + '" class="bar' + (atual ? " bar--atual" : "") + '"/>';
      g += '<rect x="' + (mL + bw * i) + '" y="' + mT + '" width="' + bw + '" height="' + (H - mT - mB) + '" class="hit" tabindex="0" role="img" aria-label="' + s.mes + ": " + brl(s.valor) + '" data-tip="' + s.mes + (atual ? " (mês atual)" : "") + "|" + brl(s.valor) + '"/>';
      g += '<text x="' + (mL + bw * i + bw / 2) + '" y="' + (H - 10) + '" text-anchor="middle" class="ax">' + s.mes + "</text>";
      if (atual) g += '<text x="' + (x + barra / 2) + '" y="' + (yt - 6) + '" text-anchor="middle" class="lbl">' + brl(s.valor).replace(/,\d\d$/, "") + "</text>";
    });
    g += '<line x1="' + mL + '" x2="' + (W - mR) + '" y1="' + (H - mB) + '" y2="' + (H - mB) + '" class="base"/>';
    return '<svg viewBox="0 0 ' + W + " " + H + '" class="chart" aria-label="Receita dos últimos 6 meses">' + g + "</svg>";
  }

  /* ---------- telas ---------- */
  function visao() {
    var n = P.numeros(), a = P.estado.ajustes;
    var maxOrig = Math.max(1, Math.max.apply(null, n.porOrigem.map(function (o) { return o.n; })));
    var ultima = P.estado.retiradas[0];
    return (
      '<header class="head"><div><p class="eyebrow">' + new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) + "</p><h1>Visão geral</h1><p class=\"lead\">Como o Dossiê Pix está indo este mês, com tudo o que rodou sozinho.</p></div></header>" +
      '<div class="top-grid">' +
      '<section class="saldo" aria-labelledby="h-saldo"><p id="h-saldo" class="saldo__label">' + ic("wallet") + "Saldo disponível para retirar</p>" +
      '<p class="saldo__valor">' + brl(n.saldo) + "</p>" +
      '<p class="saldo__conta">Vai para ' + CONTA.banco + " · Ag. " + CONTA.agencia + " · Conta " + CONTA.conta + "</p>" +
      '<button type="button" class="btn btn--mint btn--lg" data-retirar>' + ic("arrow-down-to-line") + "Retirar meu lucro</button>" +
      (ultima ? '<p class="saldo__ult">Última retirada: ' + brl(ultima.valor) + " em " + dataBR(ultima.em) + " · " + (ultima.status === "agendada" ? "agendada" : "concluída") + "</p>" : "") +
      "</section>" +
      '<section class="card conta" aria-labelledby="h-conta"><h2 id="h-conta">De onde vem o lucro</h2><dl class="conta__dl">' +
      "<dt>Receita do mês</dt><dd>" + brl(n.receita) + "</dd>" +
      "<dt>Taxas do provedor <span class=\"est\">estimadas</span></dt><dd>− " + brl(n.taxas) + "</dd>" +
      "<dt>Comissões de afiliados (" + a.comissaoPct + "%)</dt><dd>− " + brl(n.comissoes) + "</dd>" +
      "<dt>Custos fixos <span class=\"est\">estimados</span></dt><dd>− " + brl(n.custos) + "</dd>" +
      '<dt class="tot">Lucro estimado</dt><dd class="tot">' + brl(n.lucro) + "</dd></dl>" +
      '<p class="nota">Taxas e custos são estimativas que você ajusta em Ajustes. As taxas reais dependem do provedor de pagamento escolhido; confira no site dele.</p></section>' +
      "</div>" +
      '<section class="kpis" aria-label="Indicadores do mês">' +
      kpi("Receita do mês", brl(n.receita), "mensalidades + " + brl(n.extras) + " em dossiês extras", "", "banknote") +
      kpi("MRR", brl(n.mrr), "receita recorrente mensal", "", "repeat") +
      kpi("Assinantes ativos", n.ativas, n.novos + " novos este mês", "bom", "user-check") +
      kpi("Testes grátis", n.testes, "em andamento (" + a.diasTeste + " dias)", "", "hourglass") +
      kpi("Cancelamentos", n.canceladas, "no mês", "", "user-x") +
      kpi("Inadimplência", n.atrasadas, brl(n.inadValor) + " em atraso · acesso pausado", n.atrasadas ? "alerta" : "", "alert-triangle") +
      kpi("Comissões a pagar", brl(n.comissoes), "separadas automaticamente", "", "hand-coins") +
      kpi("Lucro estimado", brl(n.lucro), "depois de taxas, comissões e custos", "bom", "trending-up") +
      "</section>" +
      '<div class="grid-2">' +
      '<section class="card" aria-labelledby="h-graf"><div class="card__head"><h2 id="h-graf">Receita dos últimos 6 meses</h2></div>' + grafico(n.serie) +
      '<details class="tabela"><summary>Ver como tabela</summary><table class="tab"><thead><tr><th>Mês</th><th class="num">Receita</th></tr></thead><tbody>' +
      n.serie.map(function (s) { return "<tr><td>" + s.mes + '</td><td class="num">' + brl(s.valor) + "</td></tr>"; }).join("") + "</tbody></table></details></section>" +
      '<section class="card" aria-labelledby="h-orig"><div class="card__head"><h2 id="h-orig">Novos clientes por origem</h2><span class="muted">este mês</span></div><ul class="hbars">' +
      n.porOrigem.map(function (o) {
        return '<li><span class="hbars__lbl">' + o.nome + '</span><span class="hbars__track"><span style="width:' + Math.max(2, (o.n / maxOrig) * 100) + '%"></span></span><span class="hbars__n">' + o.n + "</span></li>";
      }).join("") + "</ul>" +
      '<h3 class="sub">O que rodou sozinho hoje</h3><ul class="feed">' +
      "<li>" + ic("check") + "Cobranças do dia geradas e confirmadas pelo provedor</li>" +
      "<li>" + ic("mail") + "E-mail de \"seu teste acaba em 2 dias\" enviado para 2 lojas</li>" +
      "<li>" + ic("lock") + "Acesso pausado para 1 conta com pagamento atrasado</li>" +
      "<li>" + ic("hand-coins") + "Comissões de afiliados separadas das cobranças pagas</li>" +
      '</ul><p class="nota">Exemplo do que a versão real faria sem ninguém mexer. Nada disso acontece de verdade nesta demonstração.</p></section>' +
      "</div>"
    );
  }

  var filtroAss = "todos", buscaAss = "";
  function assinantes() {
    var FS = [["todos", "Todos"], ["ativa", "Ativos"], ["teste", "Em teste"], ["atrasada", "Atrasados"], ["cancelada", "Cancelados"]];
    return (
      '<header class="head"><div><h1>Assinantes</h1><p class="lead">' + P.ASSINANTES.length + " lojas fictícias, com plano, situação e de onde vieram.</p></div></header>" +
      '<div class="toolbar"><div class="search">' + ic("search") + '<label class="sr-only" for="busca-ass">Buscar loja</label><input id="busca-ass" type="search" placeholder="Buscar loja ou código de afiliado" value="' + esc(buscaAss) + '"></div>' +
      '<div class="chips" role="group" aria-label="Filtrar por situação">' + FS.map(function (f) {
        var n = f[0] === "todos" ? P.ASSINANTES.length : P.ASSINANTES.filter(function (x) { return x.status === f[0]; }).length;
        return '<button type="button" class="chip" data-f="' + f[0] + '" aria-pressed="' + (filtroAss === f[0]) + '">' + f[1] + ' <span class="chip__n">' + n + "</span></button>";
      }).join("") + "</div></div>" +
      '<p class="muted" id="cont-ass" aria-live="polite"></p><div class="card table-card"><div class="table-wrap" id="tab-ass"></div></div>'
    );
  }
  var STATUS = { ativa: ["Ativo", "ok"], teste: ["Em teste", "info"], atrasada: ["Atrasado", "alerta"], cancelada: ["Cancelado", "off"] };
  function desenharAss() {
    var t = buscaAss.trim().toLowerCase();
    var l = P.ASSINANTES.filter(function (x) {
      return (filtroAss === "todos" || x.status === filtroAss) && (!t || (x.loja + " " + x.afiliado).toLowerCase().indexOf(t) >= 0);
    });
    document.getElementById("cont-ass").textContent = l.length + (l.length === 1 ? " loja" : " lojas");
    document.getElementById("tab-ass").innerHTML = l.length
      ? '<table class="tab"><thead><tr><th>Loja</th><th>Plano</th><th>Situação</th><th>Origem</th><th>Desde</th><th class="num">Valor/mês</th></tr></thead><tbody>' +
        l.map(function (x) {
          var s = STATUS[x.status];
          return "<tr><td><strong>" + esc(x.loja) + '</strong></td><td>' + nomePlano(x.plano) + '</td><td><span class="pill pill--' + s[1] + '">' + s[0] + "</span></td><td>" + nomeOrigem(x.origem) + (x.afiliado ? ' <span class="mono muted">' + x.afiliado + "</span>" : "") + "</td><td>" + dataBR(x.desde) + '</td><td class="num">' + (x.status === "cancelada" || x.status === "teste" ? "—" : brl(P.preco(x.plano))) + "</td></tr>";
        }).join("") + "</tbody></table>"
      : '<p class="vazio">' + ic("search-x") + "Nenhuma loja com esse filtro.</p>";
    P.icones();
  }

  function retiradas() {
    var n = P.numeros();
    return (
      '<header class="head"><div><h1>Retiradas</h1><p class="lead">O lucro que sai do provedor de pagamento para a sua conta.</p></div></header>' +
      '<div class="top-grid"><section class="saldo"><p class="saldo__label">' + ic("wallet") + 'Saldo disponível</p><p class="saldo__valor">' + brl(n.saldo) + '</p><p class="saldo__conta">' + CONTA.banco + " · Ag. " + CONTA.agencia + " · Conta " + CONTA.conta + " · " + CONTA.titular + '</p><button type="button" class="btn btn--mint btn--lg" data-retirar>' + ic("arrow-down-to-line") + "Retirar meu lucro</button></section>" +
      '<section class="card"><h2>Como funciona</h2><ol class="passos"><li>O cliente paga a mensalidade ao provedor de pagamento.</li><li>O provedor desconta a taxa dele e separa a comissão do afiliado.</li><li>O que sobra vira saldo disponível aqui.</li><li>Você retira quando quiser, para a conta cadastrada no provedor.</li></ol><p class="nota">Prazos e tarifas de transferência dependem do provedor escolhido; confira no site dele.</p></section></div>' +
      '<section class="card table-card" aria-labelledby="h-hist"><h2 id="h-hist">Histórico de retiradas</h2><div class="table-wrap"><table class="tab"><thead><tr><th>Data</th><th>Protocolo</th><th>Destino</th><th>Situação</th><th class="num">Valor</th></tr></thead><tbody>' +
      P.estado.retiradas.map(function (r) {
        return "<tr><td>" + dataBR(r.em) + '</td><td class="mono">' + r.protocolo + "</td><td>Conta " + CONTA.conta + '</td><td><span class="pill pill--' + (r.status === "agendada" ? "info" : "ok") + '">' + (r.status === "agendada" ? "Transferência agendada" : "Concluída") + '</span></td><td class="num">' + brl(r.valor) + "</td></tr>";
      }).join("") + "</tbody></table></div></section>"
    );
  }

  function ajustes() {
    var a = P.estado.ajustes;
    function campo(id, rot, val, attrs, dica) {
      return '<div class="field" data-field="' + id + '"><label for="' + id + '">' + rot + "</label>" + (dica ? '<p class="dica" id="' + id + '-d">' + dica + "</p>" : "") + '<input id="' + id + '" name="' + id + '" type="number" value="' + val + '" ' + attrs + ' aria-describedby="' + id + "-e" + (dica ? " " + id + "-d" : "") + '"><p class="erro" id="' + id + '-e"></p></div>';
    }
    return (
      '<header class="head"><div><h1>Ajustes</h1><p class="lead">Mudanças aqui aparecem na página de vendas, no cadastro e no programa de afiliados desta demonstração.</p></div></header>' +
      '<form class="card form" id="f-aj" novalidate><h2>Preços dos planos (R$/mês)</h2><div class="fgrid">' +
      campo("p-essencial", "Essencial", a.precos.essencial, 'min="1" max="9999" step="1" inputmode="numeric"') +
      campo("p-profissional", "Profissional", a.precos.profissional, 'min="1" max="9999" step="1" inputmode="numeric"') +
      campo("p-loja", "Loja", a.precos.loja, 'min="1" max="9999" step="1" inputmode="numeric"') +
      "</div><h2>Afiliados e teste grátis</h2><div class=\"fgrid\">" +
      campo("comissao", "Comissão dos afiliados (%)", a.comissaoPct, 'min="0" max="60" step="1" inputmode="numeric"', "Hipótese inicial: 30%.") +
      campo("dias", "Dias de teste grátis", a.diasTeste, 'min="0" max="30" step="1" inputmode="numeric"') +
      "</div><h2>Estimativas de custo</h2><div class=\"fgrid\">" +
      campo("taxa-fixa", "Taxa por cobrança (R$)", a.taxaFixa, 'min="0" max="50" step="0.01" inputmode="decimal"', "Exemplo. Confira a taxa real no site do provedor.") +
      campo("taxa-pct", "Taxa percentual (%)", a.taxaPct, 'min="0" max="20" step="0.1" inputmode="decimal"', "Exemplo. Varia por forma de pagamento.") +
      campo("custos", "Custos fixos por mês (R$)", a.custosFixos, 'min="0" max="100000" step="1" inputmode="numeric"', "Banco de dados, domínio, e-mail.") +
      '</div><div class="actions"><button type="button" class="btn btn--ghost" data-padrao>Voltar ao padrão</button><button type="submit" class="btn btn--primary">' + ic("check") + "Salvar ajustes</button></div></form>" +
      '<section class="card" style="margin-top:16px"><h2>Demonstração</h2><p class="nota" style="margin-bottom:12px">Apaga a conta de teste, o afiliado de exemplo, as retiradas feitas aqui e os ajustes.</p><button type="button" class="btn btn--secondary" data-recomecar>' + ic("rotate-ccw") + "Recomeçar demonstração</button></section>"
    );
  }

  /* ---------- retirada simulada ---------- */
  function retirar() {
    var dlg = document.getElementById("modal"), saldo = Math.floor(P.numeros().saldo * 100) / 100;
    var valor = saldo;
    function abrir(html) {
      dlg.innerHTML = '<div class="modal__box">' + html + "</div>";
      P.icones();
      if (!dlg.open) dlg.showModal();
      var f = dlg.querySelector("[autofocus]") || dlg.querySelector(".btn--primary");
      if (f) f.focus();
    }
    function passo1(erro) {
      abrir(
        '<h2 id="modal-title">Retirar meu lucro</h2><p class="nota">Saldo disponível: <strong>' + brl(saldo) + "</strong></p>" +
        '<form id="f-ret" novalidate><div class="field' + (erro ? " field--erro" : "") + '"><label for="ret-valor">Valor da retirada</label><div class="pre"><span>R$</span><input id="ret-valor" inputmode="decimal" autocomplete="off" value="' + valor.toFixed(2).replace(".", ",") + '" autofocus aria-describedby="ret-e"' + (erro ? ' aria-invalid="true"' : "") + '></div><p class="erro" id="ret-e">' + (erro || "") + "</p></div>" +
        '<div class="destino">' + ic("landmark") + "<div><strong>" + CONTA.banco + "</strong><span>Ag. " + CONTA.agencia + " · Conta " + CONTA.conta + " · " + CONTA.titular + "</span><span class=\"est\">conta fictícia</span></div></div>" +
        '<div class="actions"><button type="button" class="btn btn--ghost" data-fechar>Cancelar</button><button type="submit" class="btn btn--primary">Continuar</button></div></form>'
      );
      dlg.querySelector("#f-ret").addEventListener("submit", function (e) {
        e.preventDefault();
        var s = dlg.querySelector("#ret-valor").value.replace(/[R$\s.]/g, "").replace(",", ".");
        var v = Number(s);
        if (!s || isNaN(v)) return passo1("Digite um valor. Ex.: 1.500,00");
        if (v < 10) return passo1("O valor mínimo nesta demonstração é R$ 10,00.");
        if (v > saldo + 0.001) return passo1("O valor passa do saldo disponível (" + brl(saldo) + ").");
        valor = Math.round(v * 100) / 100;
        passo2();
      });
    }
    function passo2() {
      abrir(
        '<h2 id="modal-title">Confirme a retirada</h2><dl class="conta__dl">' +
        "<dt>Valor</dt><dd>" + brl(valor) + "</dd><dt>Destino</dt><dd>" + CONTA.banco + "<br>Conta " + CONTA.conta + "</dd><dt>Saldo depois</dt><dd>" + brl(saldo - valor) + "</dd></dl>" +
        '<p class="nota">Transferência simulada. Na versão real, o provedor de pagamento transfere para a conta cadastrada, com prazo e tarifa definidos por ele.</p>' +
        '<div class="actions"><button type="button" class="btn btn--ghost" data-voltar>Voltar</button><button type="button" class="btn btn--primary" data-confirmar>' + ic("check") + "Confirmar retirada</button></div>"
      );
    }
    function passo3(r) {
      abrir(
        '<div class="ok-icon">' + ic("calendar-check") + '</div><h2 id="modal-title">Transferência agendada</h2>' +
        '<p class="nota">' + brl(r.valor) + " para a conta " + CONTA.conta + '. Protocolo <strong class="mono">' + r.protocolo + "</strong>.</p>" +
        '<p class="nota">Status: <span class="pill pill--info">Transferência agendada</span></p>' +
        '<div class="actions"><button type="button" class="btn btn--primary" data-fechar>Fechar</button></div>'
      );
    }
    dlg.onclick = function (e) {
      if (e.target.closest("[data-fechar]")) dlg.close();
      if (e.target.closest("[data-voltar]")) passo1();
      if (e.target.closest("[data-confirmar]")) {
        var r = { id: "r" + Date.now(), valor: valor, em: new Date().toISOString(), status: "agendada", protocolo: "TRF-" + String(Date.now()).slice(-5) };
        P.estado.retiradas.unshift(r);
        P.salvar();
        passo3(r);
        toast("Retirada de " + brl(r.valor) + " agendada (simulação).");
      }
    };
    dlg.onclose = function () { render(); };
    if (saldo < 10) {
      abrir('<h2 id="modal-title">Sem saldo para retirar</h2><p class="nota">O saldo disponível é ' + brl(saldo) + '. Ele cresce conforme as mensalidades são pagas.</p><div class="actions"><button type="button" class="btn btn--primary" data-fechar>Entendi</button></div>');
      return;
    }
    passo1();
  }

  /* ---------- roteador ---------- */
  function render() {
    var r = location.hash.replace("#", "") || "visao";
    if (!SECOES.some(function (s) { return s[0] === r; })) r = "visao";
    nav(r);
    view.innerHTML = r === "visao" ? visao() : r === "assinantes" ? assinantes() : r === "retiradas" ? retiradas() : ajustes();
    document.title = SECOES.filter(function (s) { return s[0] === r; })[0][2] + " · Painel do dono · Dossiê Pix";
    P.icones();
    if (r === "assinantes") {
      desenharAss();
      document.getElementById("busca-ass").addEventListener("input", function (e) { buscaAss = e.target.value; desenharAss(); });
    }
    if (r === "ajustes") montarAjustes();
    if (render.foi) { var h = view.querySelector("h1"); h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    render.foi = true;
  }

  function montarAjustes() {
    var f = document.getElementById("f-aj");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var regras = { "p-essencial": [1, 9999], "p-profissional": [1, 9999], "p-loja": [1, 9999], comissao: [0, 60], dias: [0, 30], "taxa-fixa": [0, 50], "taxa-pct": [0, 20], custos: [0, 100000] };
      var vals = {}, primeiro = null;
      Object.keys(regras).forEach(function (k) {
        var el = f[k], v = Number(el.value), c = f.querySelector('[data-field="' + k + '"]');
        var ok = el.value !== "" && !isNaN(v) && v >= regras[k][0] && v <= regras[k][1];
        c.classList.toggle("field--erro", !ok);
        if (ok) el.removeAttribute("aria-invalid"); else el.setAttribute("aria-invalid", "true");
        document.getElementById(k + "-e").textContent = ok ? "" : "Use um número entre " + regras[k][0] + " e " + regras[k][1] + ".";
        if (!ok && !primeiro) primeiro = el;
        vals[k] = v;
      });
      if (primeiro) { primeiro.focus(); return; }
      P.estado.ajustes = {
        precos: { essencial: vals["p-essencial"], profissional: vals["p-profissional"], loja: vals["p-loja"] },
        comissaoPct: vals.comissao, diasTeste: vals.dias, taxaFixa: vals["taxa-fixa"], taxaPct: vals["taxa-pct"], custosFixos: vals.custos
      };
      P.salvar();
      toast("Ajustes salvos. A página de vendas já usa os novos valores.");
    });
    f.querySelector("[data-padrao]").addEventListener("click", function () {
      P.estado.ajustes = JSON.parse(JSON.stringify(P.AJUSTES_PADRAO));
      P.salvar(); render(); toast("Ajustes voltaram ao padrão.");
    });
    document.querySelector("[data-recomecar]").addEventListener("click", function () {
      P.recomecar(); P.salvar(); location.hash = "visao"; render(); toast("Demonstração recomeçada.");
    });
  }

  view.addEventListener("click", function (e) {
    if (e.target.closest("[data-retirar]")) retirar();
    var c = e.target.closest("[data-f]");
    if (c) {
      filtroAss = c.dataset.f;
      view.querySelectorAll("[data-f]").forEach(function (b) { b.setAttribute("aria-pressed", String(b === c)); });
      desenharAss();
    }
  });

  /* dica do gráfico: mouse e teclado */
  var tip = document.getElementById("tip");
  function mostrarTip(el) {
    var p = el.dataset.tip.split("|"), r = el.getBoundingClientRect();
    tip.innerHTML = "<span>" + p[0] + "</span><strong>" + p[1] + "</strong>";
    tip.hidden = false;
    var x = Math.min(window.innerWidth - tip.offsetWidth - 8, Math.max(8, r.left + r.width / 2 - tip.offsetWidth / 2));
    tip.style.left = x + "px";
    tip.style.top = Math.max(8, r.top + window.scrollY - tip.offsetHeight + 24) + "px";
  }
  ["mouseover", "focusin"].forEach(function (ev) {
    view.addEventListener(ev, function (e) { var h = e.target.closest && e.target.closest("[data-tip]"); if (h) mostrarTip(h); });
  });
  ["mouseout", "focusout"].forEach(function (ev) {
    view.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest("[data-tip]")) tip.hidden = true; });
  });

  window.addEventListener("hashchange", render);
  render();
})();
