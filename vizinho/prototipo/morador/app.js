/* Vizinho — app do morador. Roteamento por hash. */
(function () {
  var V = window.VZ;
  var D = V.D;
  var esc = V.esc;
  var view = document.getElementById('view');
  var nav = document.getElementById('nav');
  var modal = document.getElementById('modal');
  var EU = D.eu.unidade;

  /* Estado da tela de reserva (não persiste) */
  var form = { area: 'salao', mes: null, data: null, periodo: null, regras: false, erroConflito: null };
  var filtroAvisos = { tipo: 'todos', naoLidos: false, aberto: null };
  var ultimoVisitante = null;
  var lidosAgora = {};

  function icon(n) {
    return '<i data-lucide="' + n + '"></i>';
  }

  /* ---------- Navegação ---------- */
  var TABS = [
    { id: 'inicio', nome: 'Início', icone: 'house', rotas: ['inicio', 'encomenda'] },
    { id: 'reservar', nome: 'Reservas', icone: 'calendar-days', rotas: ['reservar', 'reserva'] },
    { id: 'avisos', nome: 'Avisos', icone: 'megaphone', rotas: ['avisos'] },
    { id: 'visitante', nome: 'Visitantes', icone: 'user-plus', rotas: ['visitante'] }
  ];

  function naoLidosImportantes() {
    return D.avisos.filter(function (a) {
      return a.importante && !a.lido;
    }).length;
  }

  function renderNav(rota) {
    var n = naoLidosImportantes();
    nav.innerHTML = TABS.map(function (t) {
      var atual = t.rotas.indexOf(rota) > -1;
      var dot = t.id === 'avisos' && n ? '<span class="dot" aria-hidden="true">' + n + '</span>' : '';
      var extra = t.id === 'avisos' && n ? '<span class="sr-only">, ' + n + ' importantes não lidos</span>' : '';
      return '<a href="#' + t.id + '"' + (atual ? ' aria-current="page"' : '') + '>' + icon(t.icone) + '<span>' + t.nome + extra + '</span>' + dot + '</a>';
    }).join('');
  }

  function sideCurrent() {
    var h = location.hash || '#inicio';
    document.querySelectorAll('#side-links a').forEach(function (a) {
      if (a.getAttribute('href') === h) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function route(fresh) {
    var h = (location.hash || '#inicio').slice(1);
    var parts = h.split('/');
    var r = parts[0];
    var arg = parts[1];
    var html;
    switch (r) {
      case 'inicio':
        html = telaInicio();
        break;
      case 'encomenda':
        html = telaEncomenda(arg);
        break;
      case 'reservar':
        if (arg === 'conflito' && fresh === true) prepararConflito();
        html = telaReservar();
        break;
      case 'reserva':
        html = telaReservaOk(arg);
        break;
      case 'avisos':
        if (arg) filtroAvisos.aberto = arg;
        html = telaAvisos();
        break;
      case 'visitante':
        html = telaVisitante();
        break;
      default:
        r = 'inicio';
        html = telaNaoEncontrada();
    }
    view.innerHTML = html;
    renderNav(r);
    sideCurrent();
    V.icons();
    bind(r, arg);
    view.scrollTop = 0;
    var h1 = view.querySelector('h1');
    if (h1 && document.activeElement && document.activeElement !== document.body) {
      h1.setAttribute('tabindex', '-1');
      h1.focus({ preventScroll: true });
    }
    if (r === 'reservar' && arg === 'conflito' && fresh === true) {
      var al = document.getElementById('conflito');
      if (al) al.scrollIntoView({ block: 'center' });
    }
    document.title = (view.querySelector('h1') ? view.querySelector('h1').textContent + ' · ' : '') + 'Vizinho';
  }

  function telaNaoEncontrada() {
    return (
      '<div class="screen"><div class="empty vz-card"><span class="empty__icon">' + icon('circle-alert') +
      '</span><h1 class="small">Essa tela não existe no protótipo</h1><a class="vz-btn vz-btn--primary" href="#inicio">Ir para o início</a></div></div>'
    );
  }

  /* ---------- Início ---------- */
  function pkgCard(e) {
    var p = V.parado(e.chegou);
    var tipo = D.tipos[e.tipo];
    var alerta =
      p.nivel === 'parada'
        ? '<span class="vz-badge vz-badge--coral">' + icon('hourglass') + ' Parada há ' + p.texto + '</span>'
        : p.nivel === 'atencao'
          ? '<span class="vz-badge vz-badge--warning">Há ' + p.texto + ' na portaria</span>'
          : '';
    return (
      '<a class="vz-card pkg" href="#encomenda/' + e.id + '">' +
      '<span class="vz-photo vz-photo--sm">' + icon(tipo.icone) + '</span>' +
      '<span class="pkg__main"><strong>' + esc(e.descricao) + '</strong>' +
      '<span class="pkg__meta">Chegou ' + V.quando(e.chegou) + ' ' + alerta + '</span></span>' +
      icon('chevron-right') + '</a>'
    );
  }

  function telaInicio() {
    var pend = V.pendentes(EU);
    var urg = D.avisos
      .filter(function (a) {
        return a.importante && !a.lido;
      })
      .sort(function (a, b) {
        return a.data < b.data ? 1 : -1;
      })[0];
    var recentes = D.avisos
      .slice()
      .sort(function (a, b) {
        return a.data < b.data ? 1 : -1;
      })
      .slice(0, 3);
    var retiradas = D.encomendas
      .filter(function (e) {
        return e.unidade === EU && e.status === 'entregue';
      })
      .sort(function (a, b) {
        return a.entregue < b.entregue ? 1 : -1;
      })
      .slice(0, 2);
    var n = naoLidosImportantes();

    var h = '<div class="screen">';
    h +=
      '<header class="hello"><div><p class="hello__place">Jardim das Acácias · ' + V.unidadeCurta(EU) + '</p><h1>Boa noite, ' + esc(D.eu.primeiroNome) + '</h1></div>' +
      '<a class="vz-icon-btn bell" href="#avisos" aria-label="Avisos' + (n ? ', ' + n + ' importantes não lidos' : '') + '">' + icon('bell') + (n ? '<span class="dot"></span>' : '') + '</a></header>';

    if (urg) {
      h +=
        '<a class="urgent" href="' + (n > 1 ? '#avisos' : '#avisos/' + urg.id) + '">' + icon('triangle-alert') +
        '<span><small>Aviso importante</small><strong>' + esc(urg.titulo) + '</strong>' +
        (n > 1 ? '<span class="urgent__more">e mais ' + (n - 1) + (n - 1 === 1 ? ' aviso importante sem ler' : ' avisos importantes sem ler') + '</span>' : '') + '</span>' +
        '<i data-lucide="chevron-right" class="chev"></i></a>';
    }

    h += '<section class="stack" aria-labelledby="t-pend"><div class="section-head"><h2 id="t-pend">Na portaria para você' + (pend.length ? ' <span class="count" aria-label="' + pend.length + ' encomendas">' + pend.length + '</span>' : '') + '</h2></div>';
    if (pend.length) {
      h += '<ul class="list-plain stack">' + pend.map(function (e) {
        return '<li>' + pkgCard(e) + '</li>';
      }).join('') + '</ul>';
      h += '<p class="small muted">Para retirar, mostre o código de cada encomenda na portaria.</p>';
    } else {
      h +=
        '<div class="vz-card empty"><span class="empty__icon">' + icon('package-check') + '</span><strong>Nada esperando por você</strong>' +
        '<p class="small muted">Quando a portaria receber algo para o ' + V.unidadeCurta(EU) + ', você recebe um aviso aqui na hora.</p></div>';
    }
    h += '</section>';

    h +=
      '<nav class="quick" aria-label="Atalhos">' +
      '<a class="vz-card" href="#reservar"><span class="ico">' + icon('calendar-days') + '</span>Reservar área comum</a>' +
      '<a class="vz-card" href="#visitante"><span class="ico">' + icon('user-plus') + '</span>Liberar visitante</a></nav>';

    h += '<section aria-labelledby="t-av"><div class="section-head"><h2 id="t-av">Avisos recentes</h2><a href="#avisos">Ver todos</a></div><div class="vz-card" style="padding:0 16px">';
    h += recentes.map(function (a) {
      return (
        '<a class="notice-mini" href="#avisos/' + a.id + '"><span class="ico' + (a.importante ? ' ico--imp' : '') + '">' + icon(a.importante ? 'triangle-alert' : 'megaphone') + '</span>' +
        '<span><strong>' + esc(a.titulo) + '</strong><span class="when">' + (a.importante ? 'Importante · ' : '') + V.quando(a.data) + '</span></span></a>'
      );
    }).join('');
    h += '</div></section>';

    if (retiradas.length) {
      h += '<section class="stack" aria-labelledby="t-ret"><h2 id="t-ret" class="small muted" style="font-weight:800">Retiradas recentemente</h2>';
      h += retiradas.map(function (e) {
        return '<p class="history">' + icon('circle-check') + '<span>' + esc(e.descricao) + ' · ' + V.quando(e.entregue) + '</span></p>';
      }).join('');
      h += '</section>';
    }
    return h + '</div>';
  }

  /* ---------- Detalhe da encomenda ---------- */
  function telaEncomenda(id) {
    var e = V.encomenda(id);
    var back = '<header class="topbar"><a class="vz-icon-btn" href="#inicio" aria-label="Voltar para o início">' + icon('arrow-left') + '</a><h1>Encomenda</h1></header>';
    if (!e || e.unidade !== EU) {
      return '<div class="screen">' + back + '<div class="vz-card empty"><span class="empty__icon">' + icon('package') + '</span><strong>Encomenda não encontrada</strong><p class="small muted">Talvez ela já tenha sido retirada.</p><a class="vz-btn vz-btn--primary" href="#inicio">Ver minhas encomendas</a></div></div>';
    }
    var tipo = D.tipos[e.tipo];
    var p = V.parado(e.chegou);
    var entregue = e.status === 'entregue';
    var h = '<div class="screen">' + back;
    h += '<figure><div class="vz-photo" role="img" aria-label="Foto da encomenda: ' + esc(e.descricao) + '">' + icon(tipo.icone) + '</div><figcaption class="photo-cap">Foto tirada pela portaria na chegada (ilustração do protótipo)</figcaption></figure>';
    h += '<div><span class="vz-badge ' + (entregue ? 'vz-badge--success">' + icon('circle-check') + ' Retirada' : 'vz-badge--primary">' + icon('building-2') + ' Na portaria') + '</span><h2 style="font-size:var(--vz-fs-xl);margin-top:8px">' + esc(e.descricao) + '</h2></div>';

    if (!entregue) {
      h +=
        '<section class="vz-card code-card" aria-labelledby="t-cod"><span class="label" id="t-cod">Código de retirada</span>' +
        '<span class="vz-code" aria-label="' + e.codigo.split('').join(' ') + '">' + V.fmtCodigo(e.codigo) + '</span>' +
        '<p>Mostre ou diga este código ao porteiro. Ele vale só para esta encomenda.</p>' +
        '<button type="button" class="vz-btn vz-btn--sm" data-action="copiar" data-codigo="' + e.codigo + '">' + icon('copy') + ' Copiar código</button></section>';
      if (p.nivel !== 'ok') {
        h += '<div class="vz-alert vz-alert--warning">' + icon('hourglass') + '<div><strong>Está na portaria há ' + p.texto + '</strong>A portaria guarda encomendas por até 15 dias. Se não puder buscar, mande o código para quem vai retirar por você.</div></div>';
      }
    } else {
      h += '<div class="vz-alert vz-alert--success">' + icon('circle-check') + '<div><strong>Retirada por ' + esc(e.retiradoPor) + '</strong>' + V.quando(e.entregue) + '</div></div>';
    }

    h +=
      '<dl class="vz-card facts"><div><dt>Chegou</dt><dd>' + V.quando(e.chegou) + '</dd></div>' +
      '<div><dt>Tipo</dt><dd>' + tipo.nome + '</dd></div>' +
      '<div><dt>Recebida por</dt><dd>' + esc(e.recebidoPor) + ', portaria</dd></div>' +
      (entregue ? '' : '<div><dt>Na portaria há</dt><dd>' + p.texto + '</dd></div>') +
      '</dl>';

    h += '<section aria-labelledby="t-tl"><h2 id="t-tl" style="font-size:var(--vz-fs-lg);margin-bottom:12px">Andamento</h2><ol class="timeline">';
    h += '<li><span class="mark">' + icon('check') + '</span><div><strong>Chegou na portaria</strong><span>' + V.quando(e.chegou) + '</span></div></li>';
    h += '<li><span class="mark">' + icon('check') + '</span><div><strong>Você foi avisada pelo app</strong><span>' + V.quando(e.avisos[e.avisos.length - 1]) + (e.avisos.length > 1 ? ' · ' + e.avisos.length + ' avisos' : '') + '</span></div></li>';
    h += entregue
      ? '<li><span class="mark">' + icon('check') + '</span><div><strong>Retirada</strong><span>' + V.quando(e.entregue) + '</span></div></li>'
      : '<li><span class="mark mark--wait"></span><div><strong>Retirada</strong><span>Esperando você na portaria</span></div></li>';
    h += '</ol></section>';
    if (!entregue) h += '<button type="button" class="vz-btn vz-btn--secondary" data-action="enviar-codigo">' + icon('send') + ' Mandar o código para quem vai retirar</button><p class="small muted" style="margin-top:-8px">Quem estiver com o código retira no seu nome. A portaria registra quem levou.</p>';
    return h + '</div>';
  }

  /* ---------- Reservar ---------- */
  function prepararConflito() {
    var dp = D.disputa;
    form.area = dp.area;
    form.mes = dp.data.slice(0, 7);
    form.data = dp.data;
    form.periodo = null;
    form.regras = true;
    if (!D.disputaUsada) ocuparDisputa();
    form.erroConflito = { data: dp.data, periodo: dp.periodo, area: dp.area };
  }

  function ocuparDisputa() {
    var dp = D.disputa;
    D.reservas.push({ id: 'r-disputa', area: dp.area, data: dp.data, periodo: dp.periodo, unidade: dp.unidade });
    D.disputaUsada = true;
    V.save();
  }

  function addDias(s, n) {
    var d = V.toDate(s);
    d.setDate(d.getDate() + n);
    return V.iso(d).slice(0, 10);
  }

  function livres(area, data) {
    return D.periodos.filter(function (p) {
      return !V.reservado(area, data, p.id);
    });
  }

  function alternativas(c) {
    // horários livres mais próximos do que deu conflito
    var out = [];
    var outro = livres(c.area, c.data)[0];
    if (outro) out.push({ data: c.data, periodo: outro.id });
    for (var i = 1; i < 21 && out.length < 3; i++) {
      var d = addDias(c.data, i);
      if (!V.reservado(c.area, d, c.periodo)) out.push({ data: d, periodo: c.periodo });
    }
    return out;
  }

  function periodo(id) {
    return D.periodos.find(function (p) {
      return p.id === id;
    });
  }
  function area(id) {
    return D.areas.find(function (a) {
      return a.id === id;
    });
  }

  function calendario() {
    var hoje = V.hoje();
    if (!form.mes) form.mes = hoje.slice(0, 7);
    var y = +form.mes.slice(0, 4);
    var m = +form.mes.slice(5, 7) - 1;
    var first = new Date(y, m, 1);
    var dias = new Date(y, m + 1, 0).getDate();
    var minMes = hoje.slice(0, 7);
    var maxMes = '2026-11';
    var h =
      '<div class="vz-card cal"><div class="cal__head">' +
      '<button type="button" class="vz-icon-btn" data-mes="-1" aria-label="Mês anterior"' + (form.mes <= minMes ? ' disabled' : '') + '>' + icon('chevron-left') + '</button>' +
      '<h3 id="t-mes" aria-live="polite">' + V.MESES[m].charAt(0).toUpperCase() + V.MESES[m].slice(1) + ' de ' + y + '</h3>' +
      '<button type="button" class="vz-icon-btn" data-mes="1" aria-label="Próximo mês"' + (form.mes >= maxMes ? ' disabled' : '') + '>' + icon('chevron-right') + '</button></div>';
    h += '<div class="cal__grid" role="group" aria-labelledby="t-mes">';
    V.DIAS_C.forEach(function (d) {
      h += '<span class="cal__dow" aria-hidden="true">' + d.slice(0, 1) + '</span>';
    });
    for (var b = 0; b < first.getDay(); b++) h += '<span></span>';
    for (var d = 1; d <= dias; d++) {
      var ds = form.mes + '-' + String(d).padStart(2, '0');
      var passado = ds <= hoje; // reserva a partir de amanhã
      var lv = livres(form.area, ds).length;
      var cls = 'day' + (ds === hoje ? ' day--today' : '') + (!passado && lv === 0 ? ' day--full' : '');
      var pips = passado ? '' : '<span class="pips" aria-hidden="true">' + D.periodos.map(function (p) {
        return '<i' + (V.reservado(form.area, ds, p.id) ? ' class="busy"' : '') + '></i>';
      }).join('') + '</span>';
      var label = V.dataLonga(ds) + (passado ? ', indisponível' : lv === 0 ? ', sem horário livre' : ', ' + lv + (lv === 1 ? ' período livre' : ' períodos livres'));
      h +=
        '<button type="button" class="' + cls + '" data-dia="' + ds + '" aria-label="' + label + '" aria-pressed="' + (form.data === ds) + '"' + (passado ? ' disabled' : '') + '>' + d + pips + '</button>';
    }
    h += '</div><div class="cal__legend" aria-hidden="true"><span><i></i> período livre</span><span><i class="busy"></i> período reservado</span></div></div>';
    return h;
  }

  function telaReservar() {
    var a = area(form.area);
    var h = '<div class="screen"><header class="topbar"><a class="vz-icon-btn" href="#inicio" aria-label="Voltar para o início">' + icon('arrow-left') + '</a><h1>Reservar área comum</h1></header>';

    var minhas = D.minhasReservas.filter(function (r) {
      return r.data > V.hoje() && !r.cancelada;
    });
    if (minhas.length) {
      h += '<section class="stack" aria-labelledby="t-min"><h2 id="t-min" style="font-size:var(--vz-fs-lg)">Suas reservas</h2>';
      h += minhas.map(function (r) {
        var ar = area(r.area);
        return (
          '<div class="vz-card mine"><span class="ico">' + icon(ar.icone) + '</span><div><strong>' + ar.nome + '</strong>' + V.dataLonga(r.data) + ' · ' + periodo(r.periodo).nome +
          '</div><a class="vz-btn vz-btn--ghost vz-btn--sm" href="#reserva/' + r.id + '">Ver</a></div>'
        );
      }).join('');
      h += '</section>';
    }

    h += '<form class="form" id="f-res" novalidate>';
    h += '<fieldset class="areas"><legend class="vz-label">Qual espaço?</legend>';
    D.areas.forEach(function (ar) {
      h +=
        '<label class="area"><input type="radio" name="area" value="' + ar.id + '"' + (form.area === ar.id ? ' checked' : '') + ' />' +
        '<span>' + icon(ar.icone) + '<strong>' + ar.nome + '</strong>Até ' + ar.capacidade + ' pessoas · ' + V.moeda(ar.taxa) + '</span></label>';
    });
    h += '</fieldset>';

    h += '<div class="vz-field"><span class="vz-label" id="l-dia">Qual dia?</span>' + calendario() + '<p class="vz-error" id="err-dia"></p></div>';

    if (form.erroConflito) {
      var c = form.erroConflito;
      var alts = alternativas(c);
      h +=
        '<div class="vz-alert vz-alert--danger" id="conflito" role="alert" tabindex="-1">' + icon('calendar-x') + '<div><strong>Conflito de horário</strong>' +
        '<p>Outra unidade reservou o ' + area(c.area).nome.toLowerCase() + ' para ' + V.dataLonga(c.data) + ', ' + periodo(c.periodo).nome.toLowerCase() + ', enquanto você preenchia. Nada foi cobrado. Escolha outro horário:</p>' +
        '<div class="alts">' + alts.map(function (x) {
          return '<button type="button" class="vz-btn vz-btn--secondary vz-btn--sm" data-alt="' + x.data + '|' + x.periodo + '">' + V.diaSemana(x.data).slice(0, 3) + ', ' + V.dataCurta(x.data) + ' · ' + periodo(x.periodo).nome + '</button>';
        }).join('') + '</div></div></div>';
    }

    h += '<fieldset class="periods" id="periodos"><legend class="vz-label">' + (form.data ? 'Qual período em ' + V.dataLonga(form.data) + '?' : 'Qual período?') + '</legend>';
    if (!form.data) {
      h += '<p class="small muted">Escolha um dia no calendário para ver os períodos livres.</p>';
    } else {
      D.periodos.forEach(function (p) {
        var oc = V.reservado(form.area, form.data, p.id);
        h +=
          '<label class="period"><input type="radio" name="periodo" value="' + p.id + '"' + (form.periodo === p.id ? ' checked' : '') + (oc ? ' disabled' : '') + ' aria-describedby="err-per" />' +
          '<span class="period__box">' + icon(p.id === 'noite' ? 'moon' : 'sun') + '<span><strong>' + p.nome + '</strong> <em>' + p.horario + '</em></span>' +
          (oc ? '<span class="vz-badge vz-badge--neutral">Reservado</span>' : '<span class="vz-badge vz-badge--success">Livre</span>') + '</span></label>';
      });
    }
    h += '<p class="vz-error" id="err-per"></p></fieldset>';

    h +=
      '<details class="vz-card rules" open><summary>' + icon('list-checks') + ' Regras do ' + a.nome.toLowerCase() + '<i data-lucide="chevron-down" class="chev"></i></summary><ul>' +
      a.regras.map(function (r) {
        return '<li>' + esc(r) + '</li>';
      }).join('') + '</ul></details>';
    h +=
      '<div class="vz-field"><label class="vz-check"><input type="checkbox" id="regras"' + (form.regras ? ' checked' : '') + ' aria-describedby="err-reg" /><span>Li as regras e concordo com elas</span></label><p class="vz-error" id="err-reg"></p></div>';
    h +=
      '<div class="summary-bar"><span>Taxa de uso<br /><strong>' + V.moeda(a.taxa) + '</strong></span><span style="text-align:right">Cobrada no próximo<br />boleto do condomínio</span></div>';
    h += '<button type="submit" class="vz-btn vz-btn--primary vz-btn--block">' + icon('calendar-check') + ' Reservar</button>';
    h += '</form></div>';
    return h;
  }

  function erro(id, msg) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = msg ? icon('circle-alert') + '<span>' + msg + '</span>' : '';
  }

  function enviarReserva() {
    var ok = true;
    var first = null;
    erro('err-dia', '');
    erro('err-per', '');
    erro('err-reg', '');
    if (!form.data) {
      erro('err-dia', 'Escolha um dia no calendário.');
      ok = false;
      first = first || view.querySelector('.day:not([disabled])');
    } else if (!form.periodo) {
      erro('err-per', 'Escolha o almoço ou a noite.');
      ok = false;
      first = first || view.querySelector('input[name=periodo]:not(:disabled)');
    }
    if (!form.regras) {
      erro('err-reg', 'Para reservar, confirme que leu as regras.');
      ok = false;
      var r = document.getElementById('regras');
      r.setAttribute('aria-invalid', 'true');
      first = first || r;
    }
    V.icons();
    if (!ok) {
      if (first) first.focus();
      return;
    }
    // Conflito simulado: alguém reservou o mesmo horário enquanto a moradora preenchia
    var dp = D.disputa;
    if (!D.disputaUsada && form.area === dp.area && form.data === dp.data && form.periodo === dp.periodo) {
      ocuparDisputa();
      form.erroConflito = { area: form.area, data: form.data, periodo: form.periodo };
      form.periodo = null;
      route();
      var al = document.getElementById('conflito');
      al.scrollIntoView({ block: 'center' });
      al.focus();
      return;
    }
    if (V.reservado(form.area, form.data, form.periodo)) {
      form.erroConflito = { area: form.area, data: form.data, periodo: form.periodo };
      form.periodo = null;
      route();
      return;
    }
    var res = { id: V.novoId('m'), area: form.area, data: form.data, periodo: form.periodo, unidade: EU, criada: V.iso(V.now()) };
    D.reservas.push({ id: res.id, area: res.area, data: res.data, periodo: res.periodo, unidade: EU });
    D.minhasReservas.push(res);
    V.save();
    form = { area: form.area, mes: form.mes, data: null, periodo: null, regras: false, erroConflito: null };
    location.hash = '#reserva/' + res.id;
  }

  /* ---------- Reserva confirmada ---------- */
  function telaReservaOk(id) {
    var r = D.minhasReservas.find(function (x) {
      return x.id === id;
    });
    var demo = false;
    if (!r && id === 'demo') {
      demo = true;
      r = D.minhasReservas.filter(function (x) {
        return !x.cancelada;
      }).slice(-1)[0] || { id: 'demo', area: 'salao', data: '2026-10-24', periodo: 'almoco' };
    }
    if (!r) {
      return '<div class="screen"><div class="vz-card empty"><span class="empty__icon">' + icon('calendar-x') + '</span><h1 class="small">Reserva não encontrada</h1><a class="vz-btn vz-btn--primary" href="#reservar">Fazer uma reserva</a></div></div>';
    }
    var a = area(r.area);
    var p = periodo(r.periodo);
    var inicio = r.data + 'T' + (r.periodo === 'noite' ? '17:00:00' : '10:00:00');
    var limite = V.iso(new Date(new Date(inicio).getTime() - 48 * 3600e3));
    if (r.cancelada) {
      return '<div class="screen"><header class="topbar"><a class="vz-icon-btn" href="#reservar" aria-label="Voltar">' + icon('arrow-left') + '</a><h1>Reserva cancelada</h1></header><div class="vz-alert vz-alert--info">' + icon('info') + '<div>O ' + a.nome.toLowerCase() + ' em ' + V.dataLonga(r.data) + ' ficou livre de novo. Nada será cobrado.</div></div><a class="vz-btn vz-btn--primary" href="#reservar">Fazer outra reserva</a></div>';
    }
    var h = '<div class="screen done"><span class="done__icon">' + icon('calendar-check') + '</span>';
    h += '<div><h1>Reserva confirmada</h1><p class="muted" style="margin-top:6px">' + a.nome + ' é seu em ' + V.dataLonga(r.data) + ', ' + p.nome.toLowerCase() + '.</p></div>';
    h +=
      '<dl class="vz-card facts"><div><dt>Espaço</dt><dd>' + a.nome + '</dd></div>' +
      '<div><dt>Data</dt><dd>' + V.dataLonga(r.data) + '</dd></div>' +
      '<div><dt>Horário</dt><dd>' + p.nome + ', ' + p.horario + '</dd></div>' +
      '<div><dt>Taxa de uso</dt><dd>' + V.moeda(a.taxa) + ' no próximo boleto</dd></div>' +
      '<div><dt>Cancelar sem custo até</dt><dd>' + V.quando(limite) + '</dd></div></dl>';
    h +=
      '<section class="vz-card next-steps" aria-labelledby="t-next"><h2 id="t-next">Antes da festa</h2><ul>' +
      '<li>Mande a lista de convidados para a portaria até a véspera.</li><li>Pegue a chave com o zelador no dia, a partir do início do período.</li><li>A vistoria de devolução é até as 10h do dia seguinte.</li></ul></section>';
    h +=
      '<div class="actions"><button type="button" class="vz-btn vz-btn--primary" data-action="agenda">' + icon('calendar-plus') + ' Adicionar à agenda do celular</button>' +
      '<a class="vz-btn vz-btn--secondary" href="#inicio">Voltar ao início</a>' +
      (demo && r.id === 'demo' ? '' : '<button type="button" class="vz-btn vz-btn--ghost" data-action="cancelar-reserva" data-id="' + r.id + '">Cancelar reserva</button>') +
      '</div>';
    return h + '</div>';
  }

  function abrirModal(html, onOk) {
    modal.innerHTML = html;
    V.icons();
    modal.showModal();
    modal.querySelectorAll('[data-modal]').forEach(function (b) {
      b.addEventListener('click', function () {
        var ok = b.getAttribute('data-modal') === 'ok';
        modal.close();
        if (ok && onOk) onOk();
      });
    });
  }

  /* ---------- Avisos ---------- */
  function telaAvisos() {
    var f = filtroAvisos;
    // Importantes não lidos primeiro, depois os outros não lidos, depois o resto; dentro de cada grupo, do mais novo ao mais antigo
    var peso = function (a) {
      // quem foi lido agora continua no lugar, para o aviso não pular enquanto a pessoa lê
      var lido = a.lido && !lidosAgora[a.id];
      return lido ? 2 : a.importante ? 0 : 1;
    };
    var todos = D.avisos.slice().sort(function (a, b) {
      if (peso(a) !== peso(b)) return peso(a) - peso(b);
      return a.data < b.data ? 1 : -1;
    });
    var cont = {
      todos: todos.length,
      importantes: todos.filter(function (a) {
        return a.importante;
      }).length,
      gerais: todos.filter(function (a) {
        return !a.importante;
      }).length
    };
    var lista = todos.filter(function (a) {
      if (f.tipo === 'importantes' && !a.importante) return false;
      if (f.tipo === 'gerais' && a.importante) return false;
      if (f.naoLidos && a.lido && a.id !== f.aberto) return false;
      return true;
    });
    var h = '<div class="screen"><header class="topbar" style="margin-left:0"><h1>Avisos do condomínio</h1></header>';
    h += '<div class="filters"><fieldset class="vz-seg"><legend class="sr-only">Mostrar</legend>';
    [['todos', 'Todos'], ['importantes', 'Importantes'], ['gerais', 'Gerais']].forEach(function (o) {
      h += '<label><input type="radio" name="filtro" value="' + o[0] + '"' + (f.tipo === o[0] ? ' checked' : '') + ' /><span>' + (o[0] === 'importantes' ? icon('triangle-alert') : '') + o[1] + ' (' + cont[o[0]] + ')</span></label>';
    });
    h += '</fieldset><label class="vz-check"><input type="checkbox" id="nao-lidos"' + (f.naoLidos ? ' checked' : '') + ' /><span>Mostrar só os não lidos</span></label></div>';
    h += '<p class="sr-only" aria-live="polite" id="av-status">' + lista.length + ' avisos</p>';

    if (!lista.length) {
      h +=
        '<div class="vz-card empty"><span class="empty__icon">' + icon('check-check') + '</span><strong>Você está em dia</strong><p class="small muted">Nenhum aviso ' +
        (f.tipo === 'importantes' ? 'importante ' : f.tipo === 'gerais' ? 'geral ' : '') + 'sem ler.</p><button type="button" class="vz-btn vz-btn--secondary" data-action="mostrar-todos">Mostrar todos os avisos</button></div>';
    } else {
      h += '<ul class="list-plain stack">' + lista.map(avisoCard).join('') + '</ul>';
    }
    return h + '</div>';
  }

  function avisoCard(a) {
    var aberto = filtroAvisos.aberto === a.id;
    var h = '<li class="vz-card notice' + (a.importante ? ' notice--imp' : '') + '" id="aviso-' + a.id + '">';
    h +=
      '<button type="button" class="notice__btn" aria-expanded="' + aberto + '" aria-controls="corpo-' + a.id + '" data-aviso="' + a.id + '"><span class="txt"><span class="notice__tags">' +
      (a.importante ? '<span class="vz-badge vz-badge--coral">' + icon('triangle-alert') + ' Importante</span>' : '<span class="vz-badge vz-badge--neutral">Geral</span>') +
      (!a.lido ? '<span class="unread" aria-hidden="true"></span><span>Não lido</span>' : '') + (a.ciencia && !a.ciente ? '<span class="vz-badge vz-badge--primary">' + icon('check') + ' Pede sua confirmação</span>' : '') + '</span>' +
      '<strong>' + esc(a.titulo) + '</strong><span class="res">' + esc(a.resumo) + '</span><span class="res when">' + esc(a.autor) + ' · ' + V.quando(a.data) + '</span></span><i data-lucide="chevron-down" class="chev"></i></button>';
    h += '<div class="notice__body" id="corpo-' + a.id + '"' + (aberto ? '' : ' hidden') + '><p>' + esc(a.texto) + '</p>';
    if (a.ciencia) {
      h += a.ciente
        ? '<p class="vz-badge vz-badge--success" style="align-self:flex-start">' + icon('check') + ' Você confirmou que está ciente</p>'
        : '<button type="button" class="vz-btn vz-btn--primary vz-btn--sm" data-ciente="' + a.id + '">' + icon('check') + ' Estou ciente</button>';
    }
    h += '</div></li>';
    return h;
  }

  /* ---------- Visitante ---------- */
  function telaVisitante() {
    var meus = D.visitantes.filter(function (v) {
      return v.unidade === EU && v.status !== 'cancelado' && v.data >= V.hoje();
    });
    var h = '<div class="screen"><header class="topbar" style="margin-left:0"><h1>Liberar visitante</h1></header>';
    if (ultimoVisitante) {
      var v = ultimoVisitante;
      h +=
        '<section class="vz-card pass" aria-labelledby="t-pass"><span class="done__icon" style="width:64px;height:64px">' + icon('user-check') + '</span>' +
        '<h2 id="t-pass" style="font-size:var(--vz-fs-xl)">' + esc(v.nome) + ' está liberado</h2>' +
        '<p class="muted small">' + (v.data === V.hoje() ? 'Hoje' : V.dataLonga(v.data)) + ', até ' + v.ate + '. A portaria já recebeu o aviso.</p>' +
        '<span class="small" style="font-weight:700">Código de entrada</span><span class="vz-code" aria-label="' + v.codigo.split('').join(' ') + '">' + v.codigo + '</span>' +
        '<p class="small muted">Na chegada, a pessoa diz o nome ou este código ao porteiro.</p>' +
        '<button type="button" class="vz-btn vz-btn--primary vz-btn--block" data-action="whats">' + icon('send') + ' Enviar código para o visitante</button>' +
        '<button type="button" class="vz-btn vz-btn--secondary vz-btn--block" data-action="outro">Liberar outra pessoa</button></section>';
    } else {
      h += '<form class="form" id="f-vis" novalidate>';
      h += '<div class="vz-field"><label class="vz-label" for="v-nome">Nome do visitante</label><input class="vz-input" id="v-nome" name="nome" autocomplete="off" aria-describedby="err-nome" placeholder="Como está no documento" /><p class="vz-error" id="err-nome"></p></div>';
      h += '<fieldset class="vz-seg"><legend class="vz-label">Quem é?</legend>' +
        [['visita', 'Visita', 'users'], ['prestador', 'Prestador de serviço', 'wrench'], ['entregador', 'Entregador', 'package']].map(function (o, i) {
          return '<label><input type="radio" name="tipo" value="' + o[0] + '"' + (i === 0 ? ' checked' : '') + ' /><span>' + icon(o[2]) + o[1] + '</span></label>';
        }).join('') + '</fieldset>';
      h += '<fieldset class="vz-seg"><legend class="vz-label">Quando?</legend>' +
        [['hoje', 'Hoje'], ['amanha', 'Amanhã'], ['outra', 'Outra data']].map(function (o, i) {
          return '<label><input type="radio" name="quando" value="' + o[0] + '"' + (i === 0 ? ' checked' : '') + ' /><span>' + o[1] + '</span></label>';
        }).join('') + '</fieldset>';
      h += '<div class="vz-field" id="campo-data" hidden><label class="vz-label" for="v-data">Data</label><input class="vz-input" type="date" id="v-data" min="' + addDias(V.hoje(), 2) + '" max="2026-12-31" aria-describedby="err-data" /><p class="vz-error" id="err-data"></p></div>';
      h += '<div class="vz-field"><label class="vz-label" for="v-ate">Liberado até</label><select class="vz-select" id="v-ate" aria-describedby="ate-hint err-ate">' + opcoesAte('hoje') + '</select><p class="vz-hint" id="ate-hint">Horários que já passaram ficam desativados. Depois do horário escolhido, a portaria liga para você antes de deixar entrar.</p><p class="vz-error" id="err-ate"></p></div>';
      h += '<div class="vz-field"><label class="vz-label" for="v-obs">Recado para a portaria <span class="muted" style="font-weight:500">(opcional)</span></label><textarea class="vz-textarea" id="v-obs" placeholder="Ex.: pode subir direto, vai trazer ferramentas"></textarea></div>';
      h += '<button type="submit" class="vz-btn vz-btn--primary vz-btn--block">' + icon('door-open') + ' Liberar entrada</button></form>';
    }
    h += '<section class="stack" aria-labelledby="t-lib"><h2 id="t-lib" style="font-size:var(--vz-fs-lg)">Liberados por você</h2>';
    if (!meus.length) {
      h += '<p class="small muted">Ninguém liberado para hoje ou para os próximos dias.</p>';
    } else {
      h += '<ul class="list-plain stack">' + meus.map(function (v) {
        var st = v.status === 'entrou' ? '<span class="vz-badge vz-badge--success">Entrou às ' + V.hora(v.entrada) + '</span>' : '<span class="vz-badge vz-badge--primary">Código ' + v.codigo + '</span>';
        return (
          '<li class="vz-card visitor"><span class="av" aria-hidden="true">' + esc(v.nome.slice(0, 1)) + '</span><div><strong>' + esc(v.nome) + '</strong>' +
          (v.data === V.hoje() ? 'Hoje' : V.diaSemana(v.data) + ', ' + V.dataCurta(v.data)) + ' até ' + v.ate + '<br />' + st + '</div>' +
          (v.status === 'aguardando' ? '<button type="button" class="vz-btn vz-btn--ghost vz-btn--sm" data-cancel-vis="' + v.id + '" aria-label="Cancelar liberação de ' + esc(v.nome) + '">Cancelar</button>' : '') + '</li>'
        );
      }).join('') + '</ul>';
    }
    return h + '</section></div>';
  }

  function opcoesAte(quando) {
    var agora = V.hora(V.iso(V.now()));
    return [['12:00', '12h'], ['18:00', '18h'], ['20:00', '20h'], ['23:59', 'Fim do dia (23h59)']].map(function (o) {
      var passou = quando === 'hoje' && o[0] <= agora;
      return '<option value="' + o[0] + '"' + (o[0] === '23:59' ? ' selected' : '') + (passou ? ' disabled' : '') + '>' + o[1] + (passou ? ' (já passou)' : '') + '</option>';
    }).join('');
  }

  function enviarVisitante(f) {
    var nome = f.querySelector('#v-nome');
    var quando = f.querySelector('input[name=quando]:checked').value;
    var dataEl = f.querySelector('#v-data');
    var ok = true;
    erro('err-nome', '');
    erro('err-data', '');
    nome.removeAttribute('aria-invalid');
    dataEl.removeAttribute('aria-invalid');
    var nv = nome.value.trim();
    if (nv.length < 3 || nv.indexOf(' ') === -1) {
      erro('err-nome', nv ? 'Escreva nome e sobrenome, para o porteiro conferir no documento.' : 'Escreva o nome do visitante.');
      nome.setAttribute('aria-invalid', 'true');
      ok = false;
    }
    var data = quando === 'hoje' ? V.hoje() : quando === 'amanha' ? addDias(V.hoje(), 1) : dataEl.value;
    if (quando === 'outra' && !data) {
      erro('err-data', 'Escolha a data da visita.');
      dataEl.setAttribute('aria-invalid', 'true');
      ok = false;
    } else if (quando === 'outra' && data < addDias(V.hoje(), 2)) {
      erro('err-data', 'Para hoje ou amanhã, use os botões acima.');
      dataEl.setAttribute('aria-invalid', 'true');
      ok = false;
    }
    var ate = f.querySelector('#v-ate');
    erro('err-ate', '');
    if (quando === 'hoje' && ate.value <= V.hora(V.iso(V.now()))) {
      erro('err-ate', 'Esse horário já passou. Escolha um horário mais tarde.');
      ate.setAttribute('aria-invalid', 'true');
      ok = false;
    }
    V.icons();
    if (!ok) {
      (nome.getAttribute('aria-invalid') ? nome : dataEl.getAttribute('aria-invalid') ? dataEl : ate).focus();
      return;
    }
    var v = {
      id: V.novoId('v'),
      unidade: EU,
      nome: nv,
      tipo: f.querySelector('input[name=tipo]:checked').value,
      data: data,
      ate: f.querySelector('#v-ate').value,
      obs: f.querySelector('#v-obs').value.trim(),
      codigo: V.codigo(4),
      status: 'aguardando'
    };
    D.visitantes.push(v);
    V.save();
    ultimoVisitante = v;
    route();
    V.toast('Entrada liberada. A portaria já sabe.');
  }

  /* ---------- Eventos ---------- */
  function bind(r) {
    if (r === 'encomenda') {
      var ec = view.querySelector('[data-action=enviar-codigo]');
      if (ec)
        ec.addEventListener('click', function () {
          V.toast('Mensagem com o código pronta para enviar (simulado)', { icon: 'send' });
        });
      var c = view.querySelector('[data-action=copiar]');
      if (c)
        c.addEventListener('click', function () {
          var cod = c.getAttribute('data-codigo');
          try {
            if (navigator.clipboard) navigator.clipboard.writeText(cod).catch(function () {});
          } catch (e) {
            /* sem área de transferência */
          }
          V.toast('Código ' + V.fmtCodigo(cod) + ' copiado');
        });
    }
    if (r === 'reservar') {
      var f = document.getElementById('f-res');
      f.addEventListener('change', function (ev) {
        var t = ev.target;
        if (t.name === 'area') {
          form.area = t.value;
          form.periodo = null;
          form.erroConflito = null;
          rerenderReserva('input[name=area]:checked');
        } else if (t.name === 'periodo') {
          form.periodo = t.value;
          erro('err-per', '');
        } else if (t.id === 'regras') {
          form.regras = t.checked;
          if (t.checked) {
            erro('err-reg', '');
            t.removeAttribute('aria-invalid');
          }
        }
      });
      f.addEventListener('click', function (ev) {
        var d = ev.target.closest('[data-dia]');
        var m = ev.target.closest('[data-mes]');
        var alt = ev.target.closest('[data-alt]');
        if (d) {
          form.data = d.getAttribute('data-dia');
          form.periodo = null;
          rerenderReserva('[data-dia="' + form.data + '"]');
        } else if (m) {
          var y = +form.mes.slice(0, 4);
          var mm = +form.mes.slice(5, 7) - 1 + +m.getAttribute('data-mes');
          form.mes = V.iso(new Date(y, mm, 1)).slice(0, 7);
          rerenderReserva('[data-mes="' + m.getAttribute('data-mes') + '"]');
        } else if (alt) {
          var p = alt.getAttribute('data-alt').split('|');
          form.data = p[0];
          form.mes = p[0].slice(0, 7);
          form.periodo = p[1];
          form.erroConflito = null;
          rerenderReserva('input[name=periodo]:checked');
          V.toast('Horário trocado para ' + V.dataCurta(p[0]) + ', ' + periodo(p[1]).nome.toLowerCase(), { icon: 'calendar-check' });
        }
      });
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        enviarReserva();
      });
    }
    if (r === 'reserva') {
      var ag = view.querySelector('[data-action=agenda]');
      if (ag)
        ag.addEventListener('click', function () {
          V.toast('Evento criado na agenda do celular (simulado)', { icon: 'calendar-plus' });
        });
      var cr = view.querySelector('[data-action=cancelar-reserva]');
      if (cr)
        cr.addEventListener('click', function () {
          var id = cr.getAttribute('data-id');
          abrirModal(
            '<div class="vz-modal__body"><div class="vz-modal__head"><h2 id="m-t">Cancelar a reserva?</h2></div><p>O horário fica livre para outras unidades. Como faltam mais de 48 horas, nada é cobrado.</p>' +
              '<div class="vz-modal__actions"><button type="button" class="vz-btn vz-btn--secondary" data-modal="no">Manter reserva</button><button type="button" class="vz-btn vz-btn--danger" data-modal="ok">Cancelar reserva</button></div></div>',
            function () {
              var m = D.minhasReservas.find(function (x) {
                return x.id === id;
              });
              m.cancelada = true;
              D.reservas = D.reservas.filter(function (x) {
                return x.id !== id;
              });
              V.save();
              route();
              V.toast('Reserva cancelada');
            }
          );
        });
    }
    if (r === 'avisos') {
      view.addEventListener('change', onAvisosChange);
      view.querySelectorAll('[data-aviso]').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-aviso');
          var abrir = b.getAttribute('aria-expanded') !== 'true';
          filtroAvisos.aberto = abrir ? id : null;
          var a = D.avisos.find(function (x) {
            return x.id === id;
          });
          if (abrir && !a.lido) {
            a.lido = true;
            lidosAgora[id] = true;
            V.save();
          }
          route();
          var nb = view.querySelector('[data-aviso="' + id + '"]');
          if (nb) nb.focus();
        });
      });
      view.querySelectorAll('[data-ciente]').forEach(function (b) {
        b.addEventListener('click', function () {
          var a = D.avisos.find(function (x) {
            return x.id === b.getAttribute('data-ciente');
          });
          a.ciente = V.iso(V.now());
          a.lido = true;
          V.save();
          route();
          V.toast('A administração vai ver que você está ciente');
        });
      });
      var mt = view.querySelector('[data-action=mostrar-todos]');
      if (mt)
        mt.addEventListener('click', function () {
          filtroAvisos.tipo = 'todos';
          filtroAvisos.naoLidos = false;
          route();
        });
      if (filtroAvisos.aberto) {
        var el = document.getElementById('aviso-' + filtroAvisos.aberto);
        if (el) el.scrollIntoView({ block: 'start' });
      }
    } else {
      view.removeEventListener('change', onAvisosChange);
    }
    if (r === 'visitante') {
      var fv = document.getElementById('f-vis');
      if (fv) {
        fv.addEventListener('change', function (ev) {
          if (ev.target.name === 'quando') {
            var outra = ev.target.value === 'outra';
            document.getElementById('v-ate').innerHTML = opcoesAte(ev.target.value);
            document.getElementById('campo-data').hidden = !outra;
            if (outra) document.getElementById('v-data').focus();
          }
        });
        fv.addEventListener('submit', function (ev) {
          ev.preventDefault();
          enviarVisitante(fv);
        });
      }
      var w = view.querySelector('[data-action=whats]');
      if (w)
        w.addEventListener('click', function () {
          V.toast('Mensagem com o código pronta para enviar (simulado)', { icon: 'send' });
        });
      var o = view.querySelector('[data-action=outro]');
      if (o)
        o.addEventListener('click', function () {
          ultimoVisitante = null;
          route();
          document.getElementById('v-nome').focus();
        });
      view.querySelectorAll('[data-cancel-vis]').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = D.visitantes.find(function (x) {
            return x.id === b.getAttribute('data-cancel-vis');
          });
          v.status = 'cancelado';
          if (ultimoVisitante && ultimoVisitante.id === v.id) ultimoVisitante = null;
          V.save();
          route();
          V.toast('Liberação de ' + esc(v.nome) + ' cancelada', {
            undo: function () {
              v.status = 'aguardando';
              V.save();
              route();
            }
          });
        });
      });
    }
  }

  function onAvisosChange(ev) {
    var t = ev.target;
    if (t.name === 'filtro') {
      filtroAvisos.tipo = t.value;
      filtroAvisos.aberto = null;
      route();
      var n = view.querySelector('input[name=filtro]:checked');
      if (n) n.focus();
    } else if (t.id === 'nao-lidos') {
      filtroAvisos.naoLidos = t.checked;
      filtroAvisos.aberto = null;
      route();
      document.getElementById('nao-lidos').focus();
    }
  }

  function rerenderReserva(focusSel) {
    var st = view.scrollTop;
    route();
    view.scrollTop = st;
    if (focusSel) {
      var el = view.querySelector(focusSel);
      if (el) el.focus({ preventScroll: true });
    }
  }

  /* ---------- Início ---------- */
  document.getElementById('reiniciar').addEventListener('click', function () {
    V.reset();
    form = { area: 'salao', mes: null, data: null, periodo: null, regras: false, erroConflito: null };
    ultimoVisitante = null;
    route();
    V.toast('Protótipo voltou ao começo');
  });

  setInterval(function () {
    document.getElementById('relogio').textContent = V.hora(V.iso(V.now()));
  }, 15000);

  V.onExternalChange(function () {
    var r = (location.hash || '#inicio').slice(1).split('/')[0];
    if (r === 'inicio' || r === 'encomenda' || r === 'visitante') {
      var st = view.scrollTop;
      route();
      view.scrollTop = st;
    }
    if (r === 'inicio') V.toast('A portaria atualizou suas encomendas', { icon: 'package' });
  });

  window.addEventListener('hashchange', function () {
    if (!/^#reservar/.test(location.hash)) form.erroConflito = null;
    if (!/^#avisos/.test(location.hash)) {
      filtroAvisos.aberto = null;
      lidosAgora = {};
    }
    if (!/^#visitante/.test(location.hash)) ultimoVisitante = null;
    route(true);
  });
  route(true);
})();
