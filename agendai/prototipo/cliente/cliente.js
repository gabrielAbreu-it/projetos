/* Agendaí — app do cliente
   Fluxo: serviço → profissional → data e hora → confirmar. Também ver, remarcar e cancelar. */
(function () {
  'use strict';

  var D = AG.D, U = AG.U, ic = AG.ic, esc = AG.esc;
  var view = document.getElementById('view');
  var nav = document.getElementById('nav');
  var app = document.getElementById('app');

  var EU = 'eu';
  var fluxo = novoFluxo();
  var abaAgendamentos = 'proximos';
  var primeira = true;

  function novoFluxo() {
    return { servico: null, prof: null, data: null, hora: null, remarcando: null, erro: null };
  }

  // ---------- Consultas do cliente ----------
  function meus() {
    return D.agendamentos.filter(function (a) { return a.cliente === EU; });
  }

  function futuro(a) {
    return !AG.noPassado(a.data, a.inicio);
  }

  function proximos() {
    return meus()
      .filter(function (a) { return futuro(a) && a.status !== 'cancelado'; })
      .sort(ordem);
  }

  function anteriores() {
    return meus()
      .filter(function (a) { return !futuro(a) || a.status === 'cancelado'; })
      .sort(function (a, b) { return -ordem(a, b); });
  }

  function ordem(a, b) {
    return (a.data + a.inicio).localeCompare(b.data + b.inicio);
  }

  // Pode mexer até 2 horas antes
  function podeAlterar(a) {
    if (a.data > D.hoje) return true;
    return a.data === D.hoje && U.min(a.inicio) - U.min(D.agora) >= 120;
  }

  function profsDoServico(sid) {
    return D.profissionais.filter(function (p) { return p.servicos.indexOf(sid) !== -1; });
  }

  // Horários livres considerando "sem preferência" (qualquer profissional do serviço)
  function livres(data) {
    var ids = fluxo.prof === 'qualquer' ? profsDoServico(fluxo.servico).map(function (p) { return p.id; }) : [fluxo.prof];
    var mapa = {};
    ids.forEach(function (pid) {
      AG.horariosLivres(pid, data, fluxo.servico, fluxo.remarcando).forEach(function (h) {
        if (h.livre && !mapa[h.hora]) mapa[h.hora] = pid;
      });
    });
    return Object.keys(mapa).sort().map(function (h) { return { hora: h, prof: mapa[h] }; });
  }

  function proximosDias(n) {
    var lista = [];
    for (var i = 0; i < n; i++) lista.push(U.somaDias(D.hoje, i));
    return lista;
  }

  // ---------- Peças ----------
  function caixaData(d) {
    var dt = U.parse(d);
    return '<span class="date-box" aria-hidden="true"><small>' + AG.DIAS[dt.getUTCDay()] + '</small><span>' + dt.getUTCDate() + '</span><small>' + AG.MESES[dt.getUTCMonth()] + '</small></span>';
  }

  function avatar(p) {
    return '<span class="ag-avatar pro-' + p.cor + '" aria-hidden="true">' + AG.iniciais(p.nome) + '</span>';
  }

  function passos(n) {
    var html = '<div class="steps" aria-hidden="true">';
    for (var i = 1; i <= 4; i++) html += '<span class="' + (i <= n ? 'on' : '') + '"></span>';
    return html + '</div>';
  }

  function topo(titulo, voltar, sub) {
    return (
      '<div class="topbar">' +
      (voltar ? '<a class="ag-icon-btn" href="' + voltar + '" aria-label="Voltar">' + ic('arrow-left') + '</a>' : '') +
      '<div><h1 tabindex="-1" data-focus>' + titulo + '</h1>' + (sub ? '<p class="topbar__sub">' + sub + '</p>' : '') + '</div></div>'
    );
  }

  // ---------- Telas ----------
  function telaInicio() {
    var n = D.negocio;
    var prox = proximos()[0];
    var populares = ['s3', 's1', 's4', 's8'].map(AG.servico);
    var horaAgora = U.min(D.agora);
    var aberto = AG.aberto(D.hoje) && horaAgora >= U.min(n.abre) && horaAgora < U.min(n.fecha);

    return (
      '<section class="screen screen--flush">' +
      '<div class="cover"><span class="cover__logo" aria-hidden="true">SL</span></div>' +
      '<div class="biz"><h1 tabindex="-1" data-focus>' + n.nome + '</h1>' +
      '<p class="muted small">' + n.tipo + '</p>' +
      '<div class="biz__meta">' +
      '<span>' + ic('star', ' fill="currentColor" style="color:#c27b00"') + '<strong style="color:var(--ag-text)">' + String(n.nota).replace('.', ',') + '</strong> (' + n.avaliacoes + ' avaliações)</span>' +
      '<span class="' + (aberto ? 'open-now' : '') + '">' + ic('clock') + (aberto ? 'Aberto agora · fecha às 19h' : 'Fechado agora') + '</span>' +
      '<span>' + ic('map-pin') + n.endereco + '</span>' +
      '</div></div>' +
      (prox
        ? '<div class="section"><h2>Seu próximo horário</h2>' +
          '<a class="ag-card ag-card--interactive next-card" href="#agendamentos">' + caixaData(prox.data) +
          '<div><span class="eyebrow">' + AG.dataLonga(prox.data) + ' · ' + prox.inicio + '</span><strong>' + AG.servico(prox.servico).nome + '</strong>' +
          '<span class="next-card__meta">com ' + AG.prof(prox.prof).curto + ' · ' + AG.STATUS[prox.status].txt + '</span></div></a></div>'
        : '') +
      '<div class="section"><a class="ag-btn ag-btn--primary ag-btn--lg ag-btn--block" href="#servico">' + ic('calendar-plus') + 'Agendar horário</a></div>' +
      '<div class="section"><h2>Mais pedidos</h2><ul class="list-plain">' +
      populares
        .map(function (s) {
          return (
            '<li><button type="button" class="ag-card ag-card--interactive service" style="grid-template-columns:1fr auto" data-action="rapido" data-id="' + s.id + '">' +
            '<span><strong>' + s.nome + '</strong><span class="small muted">' + AG.duracao(s.duracao) + '</span></span>' +
            '<span class="service__price">' + AG.brl(s.preco) + '</span></button></li>'
          );
        })
        .join('') +
      '</ul></div>' +
      '<div class="section"><p class="small muted">' + ic('info', ' style="width:14px;height:14px;display:inline;vertical-align:-2px"') + ' ' + n.politica + '</p></div>' +
      '</section>'
    );
  }

  function telaServico() {
    var cats = [];
    D.servicos.forEach(function (s) {
      if (s.ativo && cats.indexOf(s.categoria) === -1) cats.push(s.categoria);
    });
    return (
      '<section class="screen">' +
      topo('Qual serviço?', '#inicio', 'Passo 1 de 4') + passos(1) +
      '<form id="form-servico" class="stack" novalidate><fieldset><legend class="sr-only">Serviço</legend>' +
      cats
        .map(function (c) {
          return (
            '<p class="cat-title">' + c + '</p><div class="list-plain">' +
            D.servicos
              .filter(function (s) { return s.ativo && s.categoria === c; })
              .map(function (s) {
                return (
                  '<label class="ag-card service"><input type="radio" name="servico" value="' + s.id + '"' + (fluxo.servico === s.id ? ' checked' : '') + '>' +
                  '<span><strong>' + s.nome + '</strong><span class="small muted">' + AG.duracao(s.duracao) + '</span></span>' +
                  '<span class="service__price">' + AG.brl(s.preco) + '</span></label>'
                );
              })
              .join('') +
            '</div>'
          );
        })
        .join('') +
      '</fieldset>' +
      '<p class="ag-error-msg" id="erro-servico"' + (fluxo.erro === 'servico' ? '' : ' hidden') + '>' + ic('alert-circle') + 'Escolha um serviço para continuar.</p>' +
      '<div class="sticky-actions"><button type="submit" class="ag-btn ag-btn--primary ag-btn--lg">Continuar</button></div>' +
      '</form></section>'
    );
  }

  function telaProfissional() {
    if (!fluxo.servico) return redirecionar('#servico');
    var s = AG.servico(fluxo.servico);
    var profs = profsDoServico(s.id);
    var opcao = function (valor, av, nome, sub) {
      return (
        '<label class="ag-card pro"><input type="radio" name="prof" value="' + valor + '"' + (fluxo.prof === valor ? ' checked' : '') + '>' + av +
        '<span><strong>' + nome + '</strong><span class="small muted">' + sub + '</span></span></label>'
      );
    };
    return (
      '<section class="screen">' +
      topo('Com quem?', '#servico', 'Passo 2 de 4 · ' + s.nome) + passos(2) +
      '<form id="form-prof" class="stack" novalidate><fieldset><legend class="sr-only">Profissional</legend><div class="list-plain">' +
      opcao('qualquer', '<span class="ag-avatar pro-any" aria-hidden="true">' + ic('users') + '</span>', 'Sem preferência', 'Mostra o primeiro horário livre de qualquer profissional') +
      profs.map(function (p) { return opcao(p.id, avatar(p), p.nome, p.funcao); }).join('') +
      '</div></fieldset>' +
      '<p class="ag-error-msg" id="erro-prof"' + (fluxo.erro === 'prof' ? '' : ' hidden') + '>' + ic('alert-circle') + 'Escolha um profissional ou "Sem preferência".</p>' +
      '<div class="sticky-actions"><button type="submit" class="ag-btn ag-btn--primary ag-btn--lg">Continuar</button></div>' +
      '</form></section>'
    );
  }

  function telaHorario() {
    if (!fluxo.servico) return redirecionar('#servico');
    if (!fluxo.prof) return redirecionar('#profissional');
    var s = AG.servico(fluxo.servico);
    var dias = proximosDias(14);
    if (!fluxo.data) {
      fluxo.data = dias.filter(function (d) { return livres(d).length; })[0] || dias[0];
    }
    var lista = livres(fluxo.data);
    var grupos = [
      ['Manhã', 'sunrise', function (h) { return U.min(h) < 720; }],
      ['Tarde', 'sun', function (h) { return U.min(h) >= 720 && U.min(h) < 1020; }],
      ['Noite', 'moon', function (h) { return U.min(h) >= 1020; }]
    ];
    var quem = fluxo.prof === 'qualquer' ? 'qualquer profissional' : AG.prof(fluxo.prof).curto;
    var volta = fluxo.remarcando ? '#agendamentos' : '#profissional';
    var sub = fluxo.remarcando ? 'Remarcando · ' + s.nome + ' com ' + quem : 'Passo 3 de 4 · ' + s.nome + ' com ' + quem;

    var slots = lista.length
      ? grupos
          .map(function (g) {
            var hs = lista.filter(function (x) { return g[2](x.hora); });
            if (!hs.length) return '';
            return (
              '<div class="slot-group"><h3>' + ic(g[1]) + g[0] + '</h3><div class="slots">' +
              hs
                .map(function (x) {
                  return '<label class="ag-chip"><input class="sr-only" type="radio" name="hora" value="' + x.hora + '" data-prof="' + x.prof + '"' + (fluxo.hora === x.hora ? ' checked' : '') + '>' + x.hora + '</label>';
                })
                .join('') +
              '</div></div>'
            );
          })
          .join('')
      : '<div class="empty"><div class="empty__icon">' + ic('calendar-x') + '</div><h2 style="font-size:var(--ag-fs-lg)">' +
        (AG.aberto(fluxo.data) ? 'Nenhum horário livre nesse dia' : 'O salão não abre nesse dia') + '</h2>' +
        '<p class="small muted">Escolha outro dia' + (fluxo.prof !== 'qualquer' ? ' ou volte e escolha "Sem preferência"' : '') + '.</p></div>';

    return (
      '<section class="screen">' +
      topo('Quando?', volta, sub) + (fluxo.remarcando ? '' : passos(3)) +
      '<form id="form-horario" class="stack" novalidate>' +
      '<fieldset><legend class="eyebrow" style="margin-bottom:8px">' + AG.MESES_LONGO[U.parse(fluxo.data).getUTCMonth()] + ' de 2026</legend>' +
      '<div class="days">' +
      dias
        .map(function (d) {
          var dt = U.parse(d);
          var fechado = !AG.aberto(d);
          var rotulo = AG.dataLonga(d) + (fechado ? ', fechado' : '');
          return (
            '<button type="button" class="day" data-action="dia" data-dia="' + d + '" aria-pressed="' + (d === fluxo.data) + '"' + (fechado ? ' disabled' : '') + ' aria-label="' + rotulo + '">' +
            '<small>' + (d === D.hoje ? 'hoje' : AG.DIAS[dt.getUTCDay()]) + '</small><span>' + dt.getUTCDate() + '</span></button>'
          );
        })
        .join('') +
      '</div></fieldset>' +
      '<fieldset class="stack"><legend class="sr-only">Horário em ' + AG.dataLonga(fluxo.data) + '</legend>' + slots + '</fieldset>' +
      '<p class="ag-error-msg" id="erro-hora"' + (fluxo.erro === 'hora' ? '' : ' hidden') + '>' + ic('alert-circle') + 'Escolha um horário.</p>' +
      (fluxo.prof === 'qualquer' ? '<p class="small" id="quem-atende" aria-live="polite">' + quemAtende() + '</p>' : '') +
      '<p class="small muted">' + AG.duracao(s.duracao) + ' · ' + AG.brl(s.preco) + '</p>' +
      '<div class="sticky-actions"><button type="submit" class="ag-btn ag-btn--primary ag-btn--lg">Continuar</button></div>' +
      '</form></section>'
    );
  }

  function quemAtende() {
    if (!fluxo.hora || !fluxo.profEscolhido) return '<span class="muted">Escolha um horário para ver quem vai te atender.</span>';
    return ic('user-round', ' style="width:16px;height:16px;display:inline;vertical-align:-3px"') + ' Nesse horário, quem atende é <strong>' + AG.prof(fluxo.profEscolhido).nome + '</strong>.';
  }

  function telaConfirmar() {
    if (!fluxo.servico) return redirecionar('#servico');
    if (!fluxo.prof) return redirecionar('#profissional');
    if (!fluxo.hora) return redirecionar('#horario');
    var s = AG.servico(fluxo.servico);
    var p = AG.prof(fluxo.profEscolhido || fluxo.prof);
    var eu = AG.cliente(EU);

    var resumo =
      '<div class="ag-card"><dl class="summary">' +
      '<div><dt>Serviço</dt><dd>' + s.nome + '</dd></div>' +
      '<div><dt>Profissional</dt><dd>' + p.nome + '</dd></div>' +
      '<div><dt>Data</dt><dd>' + AG.dataLonga(fluxo.data) + '</dd></div>' +
      '<div><dt>Horário</dt><dd>' + fluxo.hora + ' às ' + U.hora(U.min(fluxo.hora) + s.duracao) + '</dd></div>' +
      '<div><dt>Onde</dt><dd>' + D.negocio.nome + ', Asa Sul</dd></div>' +
      '<div class="total"><dt>Valor</dt><dd>' + AG.brl(s.preco) + ' <span class="muted" style="font-weight:400">no local</span></dd></div>' +
      '</dl></div>';

    if (fluxo.remarcando) {
      var antigo = AG.agendamento(fluxo.remarcando);
      return (
        '<section class="screen">' + topo('Confirmar remarcação', '#horario') +
        '<div class="ag-card change" aria-label="De ' + AG.dataCurta(antigo.data) + ' às ' + antigo.inicio + ' para ' + AG.dataCurta(fluxo.data) + ' às ' + fluxo.hora + '">' +
        '<span class="old">' + AG.dataCurta(antigo.data) + '<br>' + antigo.inicio + '</span>' + ic('arrow-right') +
        '<span class="new">' + AG.dataCurta(fluxo.data) + '<br>' + fluxo.hora + '</span></div>' +
        resumo +
        '<form id="form-confirmar" class="stack" novalidate><div class="sticky-actions"><button type="submit" class="ag-btn ag-btn--primary ag-btn--lg">Confirmar remarcação</button>' +
        '<a class="ag-btn ag-btn--ghost" href="#agendamentos">Manter o horário antigo</a></div></form></section>'
      );
    }

    return (
      '<section class="screen">' + topo('Confirmar', '#horario', 'Passo 4 de 4') + passos(4) + resumo +
      '<form id="form-confirmar" class="stack" novalidate>' +
      '<div class="ag-field"><label class="ag-label" for="nome">Seu nome</label>' +
      '<input class="ag-input" id="nome" name="nome" autocomplete="name" value="' + esc(eu.nome) + '" aria-describedby="nome-erro">' +
      '<p class="ag-error-msg" id="nome-erro" hidden>' + ic('alert-circle') + 'Escreva seu nome, com pelo menos 3 letras.</p></div>' +
      '<div class="ag-field"><label class="ag-label" for="tel">WhatsApp</label>' +
      '<input class="ag-input" id="tel" name="tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="(61) 90000-0000" value="' + esc(eu.telefone) + '" aria-describedby="tel-dica tel-erro">' +
      '<p class="ag-hint" id="tel-dica">O lembrete e a confirmação chegam por aqui.</p>' +
      '<p class="ag-error-msg" id="tel-erro" hidden>' + ic('alert-circle') + 'Confira o número: DDD + 8 ou 9 dígitos.</p></div>' +
      '<div class="ag-field"><label class="ag-label" for="obs">Observação <span class="opt">(opcional)</span></label>' +
      '<textarea class="ag-textarea" id="obs" name="obs" maxlength="140" placeholder="Ex.: quero manter o comprimento"></textarea></div>' +
      '<label class="ag-check"><input type="checkbox" name="lembrete" checked><span>Me lembrar no WhatsApp um dia antes</span></label>' +
      (fluxo.data === D.hoje && U.min(fluxo.hora) - U.min(D.agora) < 120
        ? '<div class="note note--warn">' + ic('alert-triangle') + '<span>Esse horário é daqui a menos de 2 horas. Depois de confirmar, para mudar ou cancelar só falando com o salão.</span></div>'
        : '<div class="note">' + ic('info') + '<span>' + D.negocio.politica + '</span></div>') +
      '<div class="sticky-actions"><button type="submit" class="ag-btn ag-btn--primary ag-btn--lg">Confirmar agendamento</button></div>' +
      '</form></section>'
    );
  }

  function telaSucesso() {
    var a = AG.agendamento(fluxo.ultimo);
    if (!a) return redirecionar('#inicio');
    var s = AG.servico(a.servico);
    return (
      '<section class="screen">' +
      '<div class="success"><div class="success__icon">' + ic('calendar-check') + '</div>' +
      '<h1 tabindex="-1" data-focus>' + (fluxo.foiRemarcacao ? 'Horário remarcado' : 'Tudo certo!') + '</h1>' +
      '<p class="muted">' + s.nome + ' com ' + AG.prof(a.prof).curto + '<br><strong style="color:var(--ag-text)">' + AG.dataLonga(a.data) + ', às ' + a.inicio + '</strong></p>' +
      AG.badge(a.status) + '</div>' +
      '<div class="note">' + ic('message-circle') + '<span>Mandamos a confirmação para o seu WhatsApp. Um dia antes chega um lembrete.</span></div>' +
      '<div class="stack" style="margin-top:auto">' +
      '<button type="button" class="ag-btn ag-btn--secondary ag-btn--block" data-action="calendario">' + ic('calendar-plus') + 'Adicionar à agenda do celular</button>' +
      '<a class="ag-btn ag-btn--primary ag-btn--lg ag-btn--block" href="#agendamentos">Ver meus horários</a>' +
      '<a class="ag-btn ag-btn--ghost" href="#inicio">Voltar ao início</a></div></section>'
    );
  }

  function cartao(a, passado) {
    var s = AG.servico(a.servico);
    var p = AG.prof(a.prof);
    var alteravel = !passado && podeAlterar(a);
    return (
      '<li class="ag-card appt' + (passado ? ' appt--past' : '') + '">' +
      '<div class="appt__top">' + caixaData(a.data) +
      '<div><strong>' + s.nome + '</strong><span class="small muted">' + a.inicio + ' às ' + AG.fim(a) + ' · com ' + p.curto + '</span><div style="margin-top:6px">' + AG.badge(a.status) + '</div></div></div>' +
      (alteravel
        ? '<div class="appt__actions"><button type="button" class="ag-btn ag-btn--secondary" data-action="remarcar" data-id="' + a.id + '">' + ic('calendar-clock') + 'Remarcar</button>' +
          '<button type="button" class="ag-btn ag-btn--danger" data-action="cancelar" data-id="' + a.id + '">Cancelar</button></div>'
        : '') +
      (!passado && !alteravel ? '<p class="small muted">Faltam menos de 2 horas. Para mudar, fale com o salão pelo WhatsApp.</p>' : '') +
      (passado && a.status === 'concluido' ? '<button type="button" class="ag-btn ag-btn--ghost" data-action="repetir" data-id="' + a.id + '">' + ic('repeat') + 'Agendar de novo</button>' : '') +
      '</li>'
    );
  }

  function telaAgendamentos() {
    var lista = abaAgendamentos === 'proximos' ? proximos() : anteriores();
    return (
      '<section class="screen">' + topo('Meus horários') +
      '<div class="ag-segmented" role="group" aria-label="Filtrar horários" style="align-self:flex-start">' +
      '<button type="button" data-action="aba" data-aba="proximos" aria-pressed="' + (abaAgendamentos === 'proximos') + '">Próximos</button>' +
      '<button type="button" data-action="aba" data-aba="anteriores" aria-pressed="' + (abaAgendamentos === 'anteriores') + '">Anteriores</button></div>' +
      (lista.length
        ? '<ul class="list-plain">' + lista.map(function (a) { return cartao(a, abaAgendamentos === 'anteriores'); }).join('') + '</ul>'
        : '<div class="empty"><div class="empty__icon">' + ic('calendar') + '</div><h2 style="font-size:var(--ag-fs-lg)">' +
          (abaAgendamentos === 'proximos' ? 'Nenhum horário marcado' : 'Nada por aqui ainda') + '</h2>' +
          '<a class="ag-btn ag-btn--primary" href="#servico">Agendar horário</a></div>') +
      '</section>'
    );
  }

  function telaNaoEncontrada() {
    return '<section class="screen"><div class="empty"><h1 tabindex="-1" data-focus style="font-size:var(--ag-fs-xl)">Tela não encontrada</h1><a class="ag-btn ag-btn--primary" href="#inicio">Ir para o início</a></div></section>';
  }

  function redirecionar(h) {
    setTimeout(function () { location.replace(h); }, 0);
    return '';
  }

  // ---------- Navegação ----------
  function renderNav(rota) {
    var mapa = { inicio: 'inicio', agendamentos: 'agendamentos' };
    var mostrar = !!mapa[rota];
    app.classList.toggle('nav-hidden', !mostrar);
    if (!mostrar) {
      nav.innerHTML = '';
      return;
    }
    var itens = [['inicio', 'home', 'Início'], ['servico', 'calendar-plus', 'Agendar'], ['agendamentos', 'calendar-days', 'Meus horários']];
    nav.innerHTML =
      '<div class="ag-tabbar">' +
      itens
        .map(function (it) {
          return '<a class="ag-tabbar__item" href="#' + it[0] + '"' + (it[0] === rota ? ' aria-current="page"' : '') + '>' + ic(it[1]) + it[2] + '</a>';
        })
        .join('') +
      '</div>';
  }

  var TITULOS = { inicio: 'Início', servico: 'Serviço', profissional: 'Profissional', horario: 'Data e horário', confirmar: 'Confirmar', sucesso: 'Agendado', agendamentos: 'Meus horários' };

  function rota() {
    return location.hash.replace('#', '') || 'inicio';
  }

  function render() {
    var r = rota();
    var telas = { inicio: telaInicio, servico: telaServico, profissional: telaProfissional, horario: telaHorario, confirmar: telaConfirmar, sucesso: telaSucesso, agendamentos: telaAgendamentos };
    view.innerHTML = (telas[r] || telaNaoEncontrada)();
    renderNav(r);
    document.title = (TITULOS[r] || 'Agendaí') + ' · Studio Lume · Agendaí';
    document.querySelectorAll('#side-links a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + r) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    AG.icones();
  }

  function navegar() {
    fluxo.erro = null;
    render();
    view.scrollTop = 0;
    var alvo = view.querySelector('[data-focus]');
    if (alvo && !primeira) alvo.focus({ preventScroll: true });
    primeira = false;
  }

  function rerender(seletorFoco) {
    var sc = view.scrollTop;
    render();
    view.scrollTop = sc;
    var el = seletorFoco && view.querySelector(seletorFoco);
    if (el) el.focus();
  }

  window.addEventListener('hashchange', navegar);

  // ---------- Ações ----------
  view.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var acao = el.getAttribute('data-action');
    var id = el.getAttribute('data-id');

    if (acao === 'rapido') {
      fluxo = novoFluxo();
      fluxo.servico = id;
      location.hash = '#profissional';
    }
    if (acao === 'dia') {
      fluxo.data = el.getAttribute('data-dia');
      fluxo.hora = null;
      rerender('[data-dia="' + fluxo.data + '"]');
    }
    if (acao === 'aba') {
      abaAgendamentos = el.getAttribute('data-aba');
      rerender('[data-aba="' + abaAgendamentos + '"]');
    }
    if (acao === 'calendario') AG.toast('Evento salvo na agenda do celular.');
    if (acao === 'remarcar') {
      var a = AG.agendamento(id);
      fluxo = novoFluxo();
      fluxo.servico = a.servico;
      fluxo.prof = a.prof;
      fluxo.data = a.data;
      fluxo.remarcando = a.id;
      location.hash = '#horario';
    }
    if (acao === 'repetir') {
      var antigo = AG.agendamento(id);
      fluxo = novoFluxo();
      fluxo.servico = antigo.servico;
      fluxo.prof = antigo.prof;
      location.hash = '#horario';
    }
    if (acao === 'cancelar') cancelar(id);
  });

  function cancelar(id) {
    var a = AG.agendamento(id);
    var s = AG.servico(a.servico);
    AG.modal({
      titulo: 'Cancelar este horário?',
      texto: s.nome + ' com ' + AG.prof(a.prof).curto + ', ' + AG.dataLonga(a.data) + ' às ' + a.inicio + '. O horário fica livre para outra pessoa.',
      corpo:
        '<div class="ag-field"><label class="ag-label" for="motivo">Motivo <span class="opt">(opcional)</span></label>' +
        '<select class="ag-select" id="motivo" name="motivo"><option value="">Prefiro não dizer</option><option>Imprevisto</option><option>Achei outro horário</option><option>Não preciso mais</option></select></div>',
      confirmar: 'Cancelar horário',
      cancelar: 'Manter',
      perigo: true,
      onConfirmar: function () {
        var anterior = a.status;
        a.status = 'cancelado';
        AG.salvarAgendamento(a);
        rerender();
        AG.toast('Horário cancelado.', {
          acao: 'Desfazer',
          onAcao: function () {
            a.status = anterior;
            AG.salvarAgendamento(a);
            rerender();
            AG.toast('Cancelamento desfeito.');
          }
        });
      }
    });
  }

  view.addEventListener('change', function (e) {
    var t = e.target;
    if (t.name === 'servico') {
      if (fluxo.servico !== t.value) {
        fluxo.prof = null;
        fluxo.hora = null;
        fluxo.data = null;
      }
      fluxo.servico = t.value;
      document.getElementById('erro-servico').hidden = true;
    }
    if (t.name === 'prof') {
      if (fluxo.prof !== t.value) {
        fluxo.hora = null;
        fluxo.data = null;
      }
      fluxo.prof = t.value;
      document.getElementById('erro-prof').hidden = true;
    }
    if (t.name === 'hora') {
      fluxo.hora = t.value;
      fluxo.profEscolhido = t.getAttribute('data-prof');
      document.getElementById('erro-hora').hidden = true;
      var quem = document.getElementById('quem-atende');
      if (quem) {
        quem.innerHTML = quemAtende();
        AG.icones();
      }
    }
  });

  view.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;

    if (f.id === 'form-servico') {
      if (!fluxo.servico) return erro('erro-servico', f.querySelector('input[name="servico"]'));
      location.hash = '#profissional';
    }
    if (f.id === 'form-prof') {
      if (!fluxo.prof) return erro('erro-prof', f.querySelector('input[name="prof"]'));
      location.hash = '#horario';
    }
    if (f.id === 'form-horario') {
      if (!fluxo.hora) {
        var primeiro = f.querySelector('input[name="hora"]') || f.querySelector('.day[aria-pressed="true"]');
        return erro('erro-hora', primeiro);
      }
      location.hash = '#confirmar';
    }
    if (f.id === 'form-confirmar') confirmar(f);
  });

  function erro(id, foco) {
    document.getElementById(id).hidden = false;
    if (foco) foco.focus();
  }

  function confirmar(f) {
    var pid = fluxo.profEscolhido || fluxo.prof;
    var s = AG.servico(fluxo.servico);

    // Alguém pode ter pegado o horário enquanto a pessoa decidia
    if (AG.conflito(pid, fluxo.data, fluxo.hora, s.duracao, fluxo.remarcando)) {
      AG.toast('Esse horário acabou de ser ocupado. Escolha outro.', { erro: true });
      fluxo.hora = null;
      location.hash = '#horario';
      return;
    }

    if (fluxo.remarcando) {
      var a = AG.agendamento(fluxo.remarcando);
      a.data = fluxo.data;
      a.inicio = fluxo.hora;
      a.prof = pid;
      a.status = 'confirmado';
      AG.salvarAgendamento(a);
      fluxo = Object.assign(novoFluxo(), { ultimo: a.id, foiRemarcacao: true });
      location.hash = '#sucesso';
      return;
    }

    var nome = f.nome.value.trim();
    var digitos = f.tel.value.replace(/\D/g, '');
    var okNome = nome.length >= 3;
    var okTel = digitos.length === 10 || digitos.length === 11;
    f.nome.setAttribute('aria-invalid', okNome ? 'false' : 'true');
    f.tel.setAttribute('aria-invalid', okTel ? 'false' : 'true');
    document.getElementById('nome-erro').hidden = okNome;
    document.getElementById('tel-erro').hidden = okTel;
    if (!okNome) return f.nome.focus();
    if (!okTel) return f.tel.focus();

    var novo = {
      id: AG.novoId(),
      cliente: EU,
      servico: fluxo.servico,
      prof: pid,
      data: fluxo.data,
      inicio: fluxo.hora,
      status: 'confirmado',
      origem: 'app',
      obs: f.obs.value.trim()
    };
    AG.salvarAgendamento(novo);
    fluxo = Object.assign(novoFluxo(), { ultimo: novo.id });
    location.hash = '#sucesso';
  }

  navegar();
})();
