/* Vizinho — painel da portaria. Roteamento por hash. */
(function () {
  var V = window.VZ;
  var D = V.D;
  var esc = V.esc;
  var view = document.getElementById('view');
  var sidenav = document.getElementById('sidenav');
  var modal = document.getElementById('modal');

  var lista = { busca: '', ordem: 'antigas', soParadas: false };
  var reg = { unidade: null, tipo: 'caixa', descricao: '', foto: false, avisar: true, ultimo: null };

  function icon(n) {
    return '<i data-lucide="' + n + '"></i>';
  }

  function moradorDe(id) {
    var u = V.unidade(id);
    return u ? u.morador : '';
  }

  /* ---------- Navegação ---------- */
  function renderNav(r) {
    var pend = V.pendentes().length;
    var vis = D.visitantes.filter(function (v) {
      return v.data === V.hoje() && v.status === 'aguardando';
    }).length;
    var items = [
      ['pendentes', 'Encomendas', 'package', pend],
      ['registrar', 'Registrar encomenda', 'package-plus', 0],
      ['visitantes', 'Visitantes de hoje', 'door-open', vis]
    ];
    sidenav.innerHTML = items.map(function (it) {
      return (
        '<a href="#' + it[0] + '"' + (r === it[0] ? ' aria-current="page"' : '') + '>' + icon(it[2]) + '<span>' + it[1] + '</span>' +
        (it[3] ? '<span class="num" aria-label="' + it[3] + (it[0] === 'pendentes' ? ' na portaria' : ' esperados') + '">' + it[3] + '</span>' : '') + '</a>'
      );
    }).join('');
  }

  function route(fresh) {
    var r = (location.hash || '#pendentes').slice(1).split('/')[0];
    var html;
    if (r === 'pendentes') html = telaPendentes();
    else if (r === 'registrar') html = telaRegistrar();
    else if (r === 'visitantes') html = telaVisitantes();
    else {
      r = '';
      html = '<div class="vz-card empty"><span class="empty__icon">' + icon('circle-alert') + '</span><h1 class="small">Essa tela não existe no protótipo</h1><a class="vz-btn vz-btn--primary" href="#pendentes">Ver encomendas na portaria</a></div>';
    }
    view.innerHTML = html;
    renderNav(r);
    V.icons();
    bind(r);
    if (fresh === true) {
      window.scrollTo(0, 0);
      var h1 = view.querySelector('h1');
      if (h1 && document.activeElement !== document.body) {
        h1.setAttribute('tabindex', '-1');
        h1.focus({ preventScroll: true });
      }
      if (h1) document.title = h1.textContent + ' · Vizinho portaria';
    }
  }

  /* ---------- Encomendas na portaria ---------- */
  function filtradas() {
    var q = lista.busca.trim().toLowerCase().replace(/[^a-z0-9à-ú ]/g, ' ');
    var arr = V.pendentes().filter(function (e) {
      if (lista.soParadas && V.parado(e.chegou).nivel !== 'parada') return false;
      if (!q) return true;
      var u = V.unidade(e.unidade);
      var alvo = (u.bloco + ' ' + u.apto + ' ' + u.bloco + u.apto + ' bloco ' + u.bloco + ' ' + u.morador + ' ' + e.descricao).toLowerCase();
      return q.split(/\s+/).every(function (t) {
        return alvo.indexOf(t) > -1;
      });
    });
    if (lista.ordem === 'recentes') arr.reverse();
    return arr;
  }

  function telaPendentes() {
    var todas = V.pendentes();
    var paradas = todas.filter(function (e) {
      return V.parado(e.chegou).nivel === 'parada';
    }).length;
    var entreguesHoje = D.encomendas.filter(function (e) {
      return e.status === 'entregue' && e.entregue && e.entregue.slice(0, 10) === V.hoje();
    }).length;
    var h =
      '<header class="page-head"><div><h1>Encomendas na portaria</h1><p>' + V.dataLonga(V.hoje()) + ' · as mais antigas aparecem primeiro</p></div>' +
      '<a class="vz-btn vz-btn--primary" href="#registrar">' + icon('package-plus') + ' Registrar encomenda</a></header>';
    h +=
      '<section class="stats" aria-label="Resumo">' +
      '<div class="vz-card stat"><span class="ico">' + icon('package') + '</span><div><strong>' + todas.length + '</strong><span class="l">na portaria agora</span></div></div>' +
      '<div class="vz-card stat stat--alert"><span class="ico">' + icon('hourglass') + '</span><div><strong>' + paradas + '</strong><span class="l">paradas há mais de 3 dias</span></div></div>' +
      '<div class="vz-card stat stat--ok"><span class="ico">' + icon('package-check') + '</span><div><strong>' + entreguesHoje + '</strong><span class="l">entregues hoje</span></div></div></section>';
    h +=
      '<div class="toolbar" role="search"><div class="vz-field search"><label class="vz-label" for="busca">Buscar</label><input class="vz-input" id="busca" type="search" placeholder="Ex.: B 304 ou Mariana" value="' + esc(lista.busca) + '" autocomplete="off" />' + icon('search') + '</div>' +
      '<div class="vz-field"><label class="vz-label" for="ordem">Ordem</label><select class="vz-select" id="ordem"><option value="antigas"' + (lista.ordem === 'antigas' ? ' selected' : '') + '>Mais antigas primeiro</option><option value="recentes"' + (lista.ordem === 'recentes' ? ' selected' : '') + '>Mais recentes primeiro</option></select></div>' +
      '<label class="vz-check"><input type="checkbox" id="so-paradas"' + (lista.soParadas ? ' checked' : '') + ' /><span>Só as paradas há mais de 3 dias</span></label></div>';
    h +=
      '<p class="legend small muted" id="legenda"><span class="vz-badge vz-badge--neutral">menos de 1 dia</span> <span class="vz-badge vz-badge--warning">1 a 3 dias</span> <span class="vz-badge vz-badge--coral">' + icon('hourglass') + 'mais de 3 dias: vale avisar de novo ou ligar</span></p>';
    h += '<div id="lista">' + tabela() + '</div>';
    return h;
  }

  function minDesde(s) {
    return (V.now() - V.toDate(s)) / 60000;
  }

  function tabela() {
    var arr = filtradas();
    var status = '<p class="sr-only" id="lista-status" aria-live="polite">' + arr.length + (arr.length === 1 ? ' encomenda' : ' encomendas') + '</p>';
    if (!V.pendentes().length) {
      return status + '<div class="vz-card empty"><span class="empty__icon">' + icon('package-check') + '</span><strong>Nenhuma encomenda na portaria</strong><p class="small muted">Tudo foi entregue. Quando chegar algo, registre para avisar o morador.</p><a class="vz-btn vz-btn--primary" href="#registrar">Registrar encomenda</a></div>';
    }
    if (!arr.length) {
      return status + '<div class="vz-card empty"><span class="empty__icon">' + icon('search-x') + '</span><strong>Nada encontrado</strong><p class="small muted">Nenhuma encomenda pendente para "' + esc(lista.busca) + '"' + (lista.soParadas ? ' entre as paradas há mais de 3 dias' : '') + '.</p><button type="button" class="vz-btn vz-btn--secondary" data-action="limpar">Limpar busca</button></div>';
    }
    var h = status + '<div class="vz-card table-wrap"><table class="tbl"><caption class="sr-only">Encomendas esperando retirada</caption><thead><tr><th scope="col">Unidade</th><th scope="col">Encomenda</th><th scope="col">Chegou</th><th scope="col">Parada há</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead><tbody>';
    arr.forEach(function (e) {
      var p = V.parado(e.chegou);
      var badge = p.nivel === 'parada' ? 'vz-badge--coral' : p.nivel === 'atencao' ? 'vz-badge--warning' : 'vz-badge--neutral';
      var ultimoAviso = e.avisos[e.avisos.length - 1];
      var reavisado = e.avisos.length > 1;
      h +=
        '<tr class="' + (p.nivel === 'parada' ? 'is-old' : '') + '">' +
        '<td><span class="unit">' + V.unidadeCurta(e.unidade) + '</span><br /><span class="small muted">' + esc(moradorDe(e.unidade)) + '</span></td>' +
        '<td><div class="pk"><span class="vz-photo vz-photo--sm" aria-hidden="true">' + icon(D.tipos[e.tipo].icone) + '</span><span>' + esc(e.descricao) + '<small>' + D.tipos[e.tipo].nome + ' · recebida por ' + esc(e.recebidoPor) + '</small></span></div></td>' +
        '<td data-label="Chegou" class="time">' + V.quando(e.chegou) + '</td>' +
        '<td data-label="Parada há"><span class="vz-badge ' + badge + '">' + (p.nivel === 'parada' ? icon('hourglass') : '') + p.texto + '</span>' +
        (reavisado ? '<span class="re-sent">' + (e.avisos.length - 1) + (e.avisos.length > 2 ? ' lembretes enviados' : ' lembrete enviado') + '</span>' : '') + '</td>' +
        '<td><div class="acts">' +
        (p.nivel !== 'ok' && minDesde(ultimoAviso) < 120
          ? '<span class="small muted">Avisado às ' + V.hora(ultimoAviso) + '</span>'
          : p.nivel !== 'ok' ? '<button type="button" class="vz-btn vz-btn--ghost vz-btn--sm" data-reavisar="' + e.id + '" aria-label="Avisar de novo ' + V.unidadeCurta(e.unidade) + '">' + icon('bell-ring') + ' Avisar de novo</button>' : '') +
        '<button type="button" class="vz-btn vz-btn--primary vz-btn--sm" data-entregar="' + e.id + '" aria-label="Entregar encomenda do ' + V.unidadeCurta(e.unidade) + '">' + icon('package-check') + ' Entregar</button></div></td></tr>';
    });
    return h + '</tbody></table></div>';
  }

  function atualizarLista() {
    document.getElementById('lista').innerHTML = tabela();
    V.icons();
    bindLista();
  }

  function bindLista() {
    view.querySelectorAll('[data-entregar]').forEach(function (b) {
      b.addEventListener('click', function () {
        abrirEntrega(b.getAttribute('data-entregar'), b);
      });
    });
    view.querySelectorAll('[data-reavisar]').forEach(function (b) {
      b.addEventListener('click', function () {
        var e = V.encomenda(b.getAttribute('data-reavisar'));
        e.avisos.push(V.iso(V.now()));
        V.save();
        atualizarLista();
        V.toast(esc(moradorDe(e.unidade)) + ' (' + V.unidadeCurta(e.unidade) + ') recebeu um novo aviso pelo app', { icon: 'bell-ring' });
      });
    });
    var l = view.querySelector('[data-action=limpar]');
    if (l)
      l.addEventListener('click', function () {
        lista.busca = '';
        lista.soParadas = false;
        route();
        document.getElementById('busca').focus();
      });
  }

  /* ---------- Entregar ---------- */
  function abrirEntrega(id, origem) {
    var e = V.encomenda(id);
    var modo = 'codigo';
    function render() {
      modal.innerHTML =
        '<form class="vz-modal__body" id="f-ent" novalidate><div class="vz-modal__head"><h2 id="m-title">Entregar encomenda</h2><button type="button" class="vz-icon-btn" data-close aria-label="Fechar">' + icon('x') + '</button></div>' +
        '<div class="deliver-sum"><span class="vz-photo vz-photo--sm" aria-hidden="true">' + icon(D.tipos[e.tipo].icone) + '</span><div><strong>' + V.unidadeNome(e.unidade) + '</strong>' + esc(moradorDe(e.unidade)) + ' · ' + esc(e.descricao) + '</div></div>' +
        (modo === 'codigo'
          ? '<div class="vz-field"><label class="vz-label" for="cod">Código de retirada</label><input class="vz-input code-in" id="cod" inputmode="numeric" autocomplete="off" maxlength="7" aria-describedby="cod-hint cod-err" />' +
            '<p class="vz-hint" id="cod-hint">O morador vê o código de 6 números no app, na tela da encomenda.</p><p class="vz-error" id="cod-err"></p></div>' +
            '<button type="button" class="linkish" data-modo="doc">Morador está sem o código? Entregar com documento</button>'
          : '<div class="vz-alert vz-alert--info">' + icon('id-card') + '<div>Confira o documento com foto. A entrega fica registrada com o nome de quem retirou.</div></div>' +
            '<div class="vz-field"><label class="vz-label" for="quem">Quem está retirando</label><input class="vz-input" id="quem" autocomplete="off" value="' + esc(moradorDe(e.unidade)) + '" aria-describedby="quem-err" /><p class="vz-error" id="quem-err"></p></div>' +
            '<div class="vz-field"><label class="vz-label" for="doc">Últimos 4 números do documento</label><input class="vz-input" id="doc" inputmode="numeric" maxlength="4" autocomplete="off" aria-describedby="doc-err" /><p class="vz-error" id="doc-err"></p></div>' +
            '<button type="button" class="linkish" data-modo="codigo">Voltar para o código</button>') +
        '<div class="vz-modal__actions"><button type="button" class="vz-btn vz-btn--secondary" data-close>Cancelar</button><button type="submit" class="vz-btn vz-btn--primary">' + icon('package-check') + ' Confirmar entrega</button></div></form>';
      V.icons();
      modal.querySelectorAll('[data-close]').forEach(function (b) {
        b.addEventListener('click', function () {
          modal.close();
        });
      });
      var m = modal.querySelector('[data-modo]');
      m.addEventListener('click', function () {
        modo = m.getAttribute('data-modo');
        render();
        modal.querySelector(modo === 'codigo' ? '#cod' : '#quem').focus();
      });
      modal.querySelector('#f-ent').addEventListener('submit', function (ev) {
        ev.preventDefault();
        confirmar();
      });
    }
    function err(id, msg, inp) {
      var el = modal.querySelector('#' + id);
      el.innerHTML = msg ? icon('circle-alert') + '<span>' + msg + '</span>' : '';
      if (inp) {
        if (msg) inp.setAttribute('aria-invalid', 'true');
        else inp.removeAttribute('aria-invalid');
      }
      V.icons();
    }
    function confirmar() {
      var quem;
      if (modo === 'codigo') {
        var c = modal.querySelector('#cod');
        var v = c.value.replace(/\D/g, '');
        if (v.length !== 6) {
          err('cod-err', 'Digite os 6 números do código.', c);
          c.focus();
          return;
        }
        if (v !== e.codigo) {
          err('cod-err', 'O código não confere com esta encomenda. Confira se o morador abriu a encomenda certa no app.', c);
          c.select();
          return;
        }
        quem = moradorDe(e.unidade);
      } else {
        var q = modal.querySelector('#quem');
        var d = modal.querySelector('#doc');
        var ok = true;
        err('quem-err', q.value.trim().length < 3 ? 'Escreva o nome de quem está retirando.' : '', q);
        err('doc-err', !/^\d{4}$/.test(d.value) ? 'Digite os 4 últimos números do documento.' : '', d);
        if (q.value.trim().length < 3) {
          q.focus();
          ok = false;
        } else if (!/^\d{4}$/.test(d.value)) {
          d.focus();
          ok = false;
        }
        if (!ok) return;
        quem = q.value.trim();
      }
      e.status = 'entregue';
      e.entregue = V.iso(V.now());
      e.retiradoPor = quem;
      V.save();
      modal.close();
      route();
      V.toast('Entregue para ' + V.unidadeCurta(e.unidade) + '. O morador recebeu a confirmação.', {
        undo: function () {
          e.status = 'pendente';
          delete e.entregue;
          delete e.retiradoPor;
          V.save();
          route();
        }
      });
      var busca = document.getElementById('busca');
      if (busca) busca.focus();
    }
    render();
    modal.showModal();
    modal.querySelector('#cod').focus();
    modal.addEventListener(
      'close',
      function () {
        if (origem && document.body.contains(origem)) origem.focus();
      },
      { once: true }
    );
  }

  /* ---------- Registrar ---------- */
  function buscarUnidades(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    var toks = q.replace(/bloco|apto|apartamento|ap\b|[,.\-]/g, ' ').split(/\s+/).filter(Boolean);
    var res = D.unidades.filter(function (u) {
      var alvo = (u.bloco + ' ' + u.apto + ' ' + u.bloco.toLowerCase() + u.apto + ' ' + u.morador).toLowerCase();
      return toks.every(function (t) {
        if (t.length === 1 && /[a-d]/.test(t)) return u.bloco.toLowerCase() === t;
        if (/^[a-d]\d{3}$/.test(t)) return (u.bloco + u.apto).toLowerCase() === t;
        if (/^\d+$/.test(t)) return u.apto.indexOf(t) === 0;
        return alvo.indexOf(t) > -1;
      });
    });
    return res.slice(0, 8);
  }

  function telaRegistrar() {
    var h = '<header class="page-head"><div><h1>Registrar encomenda</h1><p>O morador recebe o aviso no app assim que você salvar.</p></div></header>';
    if (reg.ultimo) {
      var e = reg.ultimo;
      h +=
        '<section class="vz-card ok-panel vz-alert--success" style="border:1.5px solid var(--vz-success)" aria-labelledby="ok-t" id="ok">' + icon('circle-check') +
        '<div><h2 id="ok-t">Encomenda registrada para ' + V.unidadeNome(e.unidade) + '</h2><p>' +
        (e.avisos.length ? esc(moradorDe(e.unidade)) + ' foi avisada pelo app às ' + V.hora(e.avisos[0]) + '. ' : 'O morador ainda não foi avisado. ') +
        'O código de retirada aparece no app do morador.</p><div class="row">' +
        '<button type="button" class="vz-btn vz-btn--primary vz-btn--sm" data-action="nova">' + icon('plus') + ' Registrar outra</button>' +
        '<a class="vz-btn vz-btn--secondary vz-btn--sm" href="#pendentes">Ver encomendas na portaria</a></div></div></section>';
    }
    h += '<div class="reg"><form class="vz-card reg-form" id="f-reg" novalidate>';
    // Passo 1: unidade
    h += '<div class="vz-field"><h2 id="l-un"><span class="step" aria-hidden="true">1</span>Para quem é?</h2>';
    if (reg.unidade) {
      var u = V.unidade(reg.unidade);
      h +=
        '<div class="chosen"><span class="ico">' + icon('house') + '</span><div><strong>' + V.unidadeNome(u.id) + '</strong>' + esc(u.morador) + '</div>' +
        '<button type="button" class="vz-btn vz-btn--secondary vz-btn--sm" data-action="trocar">Trocar</button></div>';
    } else {
      h +=
        '<div class="combo">' + icon('search') +
        '<input class="vz-input" id="un" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="un-list" aria-labelledby="l-un" aria-describedby="un-hint un-err" autocomplete="off" placeholder="Bloco e apartamento ou nome. Ex.: B 304" />' +
        '<ul class="combo__list" id="un-list" role="listbox" aria-label="Unidades encontradas" hidden></ul></div>' +
        '<p class="vz-hint" id="un-hint">Use as setas para escolher e Enter para confirmar.</p><p class="vz-error" id="un-err"></p>';
    }
    h += '</div>';
    // Passo 2: o que chegou
    h += '<fieldset class="vz-seg"><legend><h2><span class="step" aria-hidden="true">2</span>O que chegou?</h2></legend>';
    Object.keys(D.tipos).forEach(function (k) {
      h += '<label><input type="radio" name="tipo" value="' + k + '"' + (reg.tipo === k ? ' checked' : '') + ' /><span>' + icon(D.tipos[k].icone) + D.tipos[k].nome + '</span></label>';
    });
    h += '</fieldset>';
    h += '<div class="vz-field"><label class="vz-label" for="desc">Descrição <span class="muted" style="font-weight:500">(ajuda o morador a reconhecer)</span></label><input class="vz-input" id="desc" maxlength="80" value="' + esc(reg.descricao) + '" placeholder="Ex.: caixa média, etiqueta dos Correios" /></div>';
    // Foto
    h += '<div class="vz-field"><span class="vz-label" id="l-foto">Foto da encomenda <span class="muted" style="font-weight:500">(opcional)</span></span><div class="photo-box">';
    h += reg.foto
      ? '<span class="vz-photo" role="img" aria-label="Foto anexada">' + icon(D.tipos[reg.tipo].icone) + '</span><button type="button" class="vz-btn vz-btn--secondary vz-btn--sm" data-action="foto">' + icon('trash-2') + ' Tirar a foto</button>'
      : '<span class="photo-empty" aria-hidden="true">' + icon('image') + '</span><button type="button" class="vz-btn vz-btn--secondary vz-btn--sm" data-action="foto" aria-describedby="l-foto">' + icon('camera') + ' Tirar foto</button>';
    h += '</div></div>';
    // Passo 3: avisar
    h += '<div><h2><span class="step" aria-hidden="true">3</span>Avisar o morador</h2><label class="vz-check"><input type="checkbox" id="avisar"' + (reg.avisar ? ' checked' : '') + ' /><span>Mandar o aviso pelo app agora, com o código de retirada</span></label></div>';
    h += '<button type="submit" class="vz-btn vz-btn--primary" id="btn-reg">' + (reg.avisar ? icon('send') + ' Registrar e avisar' : icon('package-plus') + ' Registrar sem avisar') + '</button></form>';

    // Coluna: últimas registradas
    var ult = D.encomendas.filter(function (x) {
      return x.chegou.slice(0, 10) === V.hoje();
    }).sort(function (a, b) {
      return a.chegou < b.chegou ? 1 : -1;
    }).slice(0, 6);
    h += '<aside class="side-col" aria-labelledby="t-ult"><h2 id="t-ult">Registradas hoje</h2><ul class="vz-card recent">';
    h += ult.length
      ? ult.map(function (x) {
          return (
            '<li><span class="vz-photo vz-photo--sm" aria-hidden="true" style="width:40px;height:40px">' + icon(D.tipos[x.tipo].icone) + '</span><div><strong>' + V.unidadeCurta(x.unidade) + ' · ' + esc(x.descricao) + '</strong><span class="muted">' + V.hora(x.chegou) + ' · ' + esc(moradorDe(x.unidade)) + '</span></div>' +
            (x.status === 'entregue' ? '<span class="vz-badge vz-badge--success">Entregue</span>' : '<span class="vz-badge vz-badge--primary">Avisado</span>') + '</li>'
          );
        }).join('')
      : '<li>Nenhuma encomenda registrada hoje.</li>';
    h += '</ul></aside></div>';
    return h;
  }

  function bindRegistrar() {
    var f = document.getElementById('f-reg');
    var inp = document.getElementById('un');
    var listEl = document.getElementById('un-list');
    var ativo = -1;
    var res = [];
    function fechar() {
      listEl.hidden = true;
      inp.setAttribute('aria-expanded', 'false');
      inp.removeAttribute('aria-activedescendant');
      ativo = -1;
    }
    function pintar() {
      if (!inp.value.trim()) return fechar();
      res = buscarUnidades(inp.value);
      listEl.innerHTML = res.length
        ? res.map(function (u, i) {
            return '<li role="option" id="op-' + i + '" data-un="' + u.id + '" aria-selected="' + (i === ativo) + '"><strong>' + V.unidadeNome(u.id) + '</strong><span>' + esc(u.morador) + '</span></li>';
          }).join('')
        : '<li class="none" role="option" aria-disabled="true">Nenhuma unidade encontrada</li>';
      listEl.hidden = false;
      inp.setAttribute('aria-expanded', 'true');
      if (ativo > -1) inp.setAttribute('aria-activedescendant', 'op-' + ativo);
      else inp.removeAttribute('aria-activedescendant');
    }
    function escolher(id) {
      reg.unidade = id;
      salvarCampos();
      route();
      var t = view.querySelector('[data-action=trocar]');
      if (t) t.focus();
      V.toast('Unidade ' + V.unidadeCurta(id) + ' escolhida', { icon: 'house' });
    }
    if (inp) {
      inp.addEventListener('input', function () {
        ativo = -1;
        pintar();
        erroUn('');
      });
      inp.addEventListener('keydown', function (ev) {
        if (ev.key === 'ArrowDown') {
          ev.preventDefault();
          if (listEl.hidden) pintar();
          ativo = Math.min(res.length - 1, ativo + 1);
          pintar();
        } else if (ev.key === 'ArrowUp') {
          ev.preventDefault();
          ativo = Math.max(0, ativo - 1);
          pintar();
        } else if (ev.key === 'Enter') {
          ev.preventDefault();
          if (ativo > -1 && res[ativo]) escolher(res[ativo].id);
          else if (res.length === 1) escolher(res[0].id);
          else if (inp.value.trim()) erroUn('Escolha uma unidade da lista.');
        } else if (ev.key === 'Escape') {
          fechar();
        }
      });
      inp.addEventListener('blur', function () {
        setTimeout(fechar, 150);
      });
      listEl.addEventListener('mousedown', function (ev) {
        var li = ev.target.closest('[data-un]');
        if (li) {
          ev.preventDefault();
          escolher(li.getAttribute('data-un'));
        }
      });
    }
    function erroUn(msg) {
      var el = document.getElementById('un-err');
      if (!el) return;
      el.innerHTML = msg ? icon('circle-alert') + '<span>' + msg + '</span>' : '';
      if (msg) inp.setAttribute('aria-invalid', 'true');
      else inp.removeAttribute('aria-invalid');
      V.icons();
    }
    function salvarCampos() {
      var t = f.querySelector('input[name=tipo]:checked');
      reg.tipo = t ? t.value : reg.tipo;
      reg.descricao = f.querySelector('#desc').value;
      reg.avisar = f.querySelector('#avisar').checked;
    }
    var tr = view.querySelector('[data-action=trocar]');
    if (tr)
      tr.addEventListener('click', function () {
        reg.unidade = null;
        salvarCampos();
        route();
        document.getElementById('un').focus();
      });
    view.querySelector('[data-action=foto]').addEventListener('click', function () {
      salvarCampos();
      reg.foto = !reg.foto;
      route();
      view.querySelector('[data-action=foto]').focus();
      if (reg.foto) V.toast('Foto anexada (simulada no protótipo)', { icon: 'camera' });
    });
    f.addEventListener('change', function (ev) {
      if (ev.target.id === 'avisar') {
        reg.avisar = ev.target.checked;
        document.getElementById('btn-reg').innerHTML = reg.avisar ? icon('send') + ' Registrar e avisar' : icon('package-plus') + ' Registrar sem avisar';
        V.icons();
      }
      if (ev.target.name === 'tipo' && reg.foto) {
        salvarCampos();
        route();
        f = document.getElementById('f-reg');
        view.querySelector('input[name=tipo]:checked').focus();
      }
    });
    var nova = view.querySelector('[data-action=nova]');
    if (nova)
      nova.addEventListener('click', function () {
        reg.ultimo = null;
        route();
        document.getElementById('un').focus();
      });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      salvarCampos();
      if (!reg.unidade) {
        erroUn(inp.value.trim() ? 'Escolha uma unidade da lista para o aviso ir para a pessoa certa.' : 'Diga para qual bloco e apartamento é a encomenda.');
        inp.focus();
        return;
      }
      var agora = V.iso(V.now());
      var e = {
        id: V.novoId('e'),
        unidade: reg.unidade,
        tipo: reg.tipo,
        descricao: reg.descricao.trim() || D.tipos[reg.tipo].nome,
        chegou: agora,
        codigo: V.codigo(6),
        recebidoPor: 'José',
        avisos: reg.avisar ? [agora] : [],
        status: 'pendente',
        foto: reg.foto
      };
      D.encomendas.push(e);
      V.save();
      reg = { unidade: null, tipo: 'caixa', descricao: '', foto: false, avisar: true, ultimo: e };
      route();
      window.scrollTo(0, 0);
      document.getElementById('ok-t').setAttribute('tabindex', '-1');
      document.getElementById('ok-t').focus();
    });
  }

  /* ---------- Visitantes ---------- */
  function telaVisitantes() {
    var hoje = D.visitantes.filter(function (v) {
      return v.data === V.hoje() && v.status !== 'cancelado';
    });
    var prox = D.visitantes.filter(function (v) {
      return v.data > V.hoje() && v.status !== 'cancelado';
    });
    var h = '<header class="page-head"><div><h1>Visitantes de hoje</h1><p>Liberados pelos moradores no app. Na chegada, confira o nome ou o código.</p></div></header>';
    function tab(arr, cap) {
      if (!arr.length) return '<div class="vz-card empty"><span class="empty__icon">' + icon('door-open') + '</span><strong>Ninguém liberado</strong></div>';
      return (
        '<div class="vz-card table-wrap"><table class="tbl"><caption class="sr-only">' + cap + '</caption><thead><tr><th scope="col">Visitante</th><th scope="col">Unidade</th><th scope="col">Liberado até</th><th scope="col">Código</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead><tbody>' +
        arr.map(function (v) {
          var tipo = { visita: 'Visita', prestador: 'Prestador de serviço', entregador: 'Entregador' }[v.tipo];
          return (
            '<tr><td><strong>' + esc(v.nome) + '</strong><br /><span class="small muted">' + tipo + (v.obs ? ' · ' + esc(v.obs) : '') + '</span></td>' +
            '<td data-label="Unidade"><span class="unit" style="font-size:inherit">' + V.unidadeCurta(v.unidade) + '</span> · ' + esc(moradorDe(v.unidade)) + '</td>' +
            '<td data-label="Liberado até">' + (v.data === V.hoje() ? '' : V.diaSemana(v.data) + ', ' + V.dataCurta(v.data) + ', ') + v.ate + '</td>' +
            '<td data-label="Código"><span class="vz-code">' + v.codigo + '</span></td>' +
            '<td><div class="acts">' +
            (v.status === 'entrou'
              ? '<span class="vz-badge vz-badge--success">' + icon('check') + ' Entrou às ' + V.hora(v.entrada) + '</span>'
              : v.data === V.hoje()
                ? '<button type="button" class="vz-btn vz-btn--primary vz-btn--sm" data-entrou="' + v.id + '" aria-label="Registrar entrada de ' + esc(v.nome) + '">' + icon('log-in') + ' Registrar entrada</button>'
                : '<span class="vz-badge vz-badge--neutral">Agendado</span>') +
            '</div></td></tr>'
          );
        }).join('') + '</tbody></table></div>'
      );
    }
    h += tab(hoje, 'Visitantes liberados para hoje');
    h += '<h2 style="font-size:var(--vz-fs-lg)">Próximos dias</h2>' + tab(prox, 'Visitantes liberados para os próximos dias');
    return h;
  }

  /* ---------- Eventos ---------- */
  function bind(r) {
    if (r === 'pendentes') {
      var b = document.getElementById('busca');
      b.addEventListener('input', function () {
        lista.busca = b.value;
        atualizarLista();
      });
      document.getElementById('ordem').addEventListener('change', function (ev) {
        lista.ordem = ev.target.value;
        atualizarLista();
      });
      document.getElementById('so-paradas').addEventListener('change', function (ev) {
        lista.soParadas = ev.target.checked;
        atualizarLista();
      });
      bindLista();
    }
    if (r === 'registrar') bindRegistrar();
    if (r === 'visitantes') {
      view.querySelectorAll('[data-entrou]').forEach(function (bt) {
        bt.addEventListener('click', function () {
          var v = D.visitantes.find(function (x) {
            return x.id === bt.getAttribute('data-entrou');
          });
          v.status = 'entrou';
          v.entrada = V.iso(V.now());
          V.save();
          route();
          V.toast('Entrada de ' + esc(v.nome) + ' registrada. O morador foi avisado.', {
            undo: function () {
              v.status = 'aguardando';
              delete v.entrada;
              V.save();
              route();
            }
          });
        });
      });
    }
  }

  V.onExternalChange(function () {
    if (modal.open) return;
    var r = (location.hash || '#pendentes').slice(1);
    if (r === 'registrar') return; // não apaga o que o porteiro está digitando
    route();
  });

  window.addEventListener('hashchange', function () {
    if (location.hash !== '#registrar') reg.ultimo = null;
    route(true);
  });
  route(true);
})();
