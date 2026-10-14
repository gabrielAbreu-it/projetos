/* Agendaí — painel do dono
   Agenda (dia/semana, arrastar para remarcar), números do mês, clientes, serviços e profissionais. */
(function () {
  'use strict';

  var D = AG.D, U = AG.U, ic = AG.ic, esc = AG.esc;
  var view = document.getElementById('view');
  var sidenav = document.getElementById('sidenav');
  var ghost = document.getElementById('ghost');
  var dialog = document.getElementById('modal');

  var estado = {
    modo: 'dia',
    data: D.hoje,
    filtroProf: 'todos',
    buscaCliente: ''
  };
  var primeira = true;
  var ROW = 52;

  // ---------- Utilidades ----------
  function profsAtivos() {
    return D.profissionais;
  }

  function slots() {
    var lista = [];
    for (var t = U.min(D.negocio.abre); t < U.min(D.negocio.fecha); t += 30) lista.push(U.hora(t));
    return lista;
  }

  function segundaDaSemana(d) {
    var dow = U.diaSemana(d);
    return U.somaDias(d, dow === 0 ? -6 : 1 - dow);
  }

  function nomeCurtoCliente(c) {
    var p = c.nome.split(' ');
    return p[0] + ' ' + p[p.length - 1][0] + '.';
  }

  // Mesmo número do cabeçalho da agenda: quem ainda não confirmou o horário de hoje
  function pendentesHoje() {
    return D.agendamentos.filter(function (a) {
      return a.status === 'pendente' && a.data === D.hoje;
    }).length;
  }

  function motivoInvalido(a, profId, data, hora) {
    var s = AG.servico(a.servico);
    var p = AG.prof(profId);
    if (!AG.aberto(data)) return 'O salão não abre nesse dia.';
    if (p.servicos.indexOf(a.servico) === -1) return p.curto + ' não faz ' + s.nome.toLowerCase() + '.';
    if (!AG.dentroDoHorario(hora, s.duracao)) return 'Não cabe antes do fechamento (19h).';
    if (AG.noPassado(data, hora)) return 'Esse horário já passou.';
    if (AG.conflito(profId, data, hora, s.duracao, a.id)) return p.curto + ' já tem cliente nesse horário.';
    return '';
  }

  // ---------- Menu ----------
  function renderMenu(rota) {
    var itens = [
      ['agenda', 'calendar-days', 'Agenda'],
      ['numeros', 'chart-column', 'Números do mês'],
      ['clientes', 'users', 'Clientes'],
      ['servicos', 'scissors', 'Serviços'],
      ['profissionais', 'user-round', 'Profissionais']
    ];
    var pend = pendentesHoje();
    sidenav.innerHTML = itens
      .map(function (it) {
        var atual = rota === it[0];
        return (
          '<a class="ag-sidenav__item" href="#' + it[0] + '"' + (atual ? ' aria-current="page"' : '') + '>' + ic(it[1]) + it[2] +
          (it[0] === 'agenda' && pend ? '<span class="ag-sidenav__count" title="Aguardando confirmação hoje">' + pend + '<span class="sr-only"> aguardando confirmação hoje</span></span>' : '') +
          '</a>'
        );
      })
      .join('');
  }

  // ---------- Agenda ----------
  function blocoAgendamento(a, col, linha, mini) {
    var c = AG.cliente(a.cliente);
    var s = AG.servico(a.servico);
    var p = AG.prof(a.prof);
    var span = s.duracao / 30;
    var label = c.nome + ', ' + s.nome + ', ' + a.inicio + ' às ' + AG.fim(a) + ', com ' + p.curto + ', ' + AG.STATUS[a.status].txt.toLowerCase();
    var movel = (a.status === 'confirmado' || a.status === 'pendente') && !AG.noPassado(a.data, a.inicio);
    return (
      '<button type="button"' + (mini ? ' title="' + esc(label) + '"' : '') + ' class="appt pro-' + p.cor + ' appt--' + a.status + (mini ? ' appt--mini' : '') + '" data-id="' + a.id + '"' + (movel ? ' data-movel="1"' : '') +
      ' style="grid-row:' + linha + ' / span ' + span + ';grid-column:' + col + '" aria-label="' + esc(label) + '">' +
      '<span class="appt__status" aria-hidden="true">' + ic(AG.STATUS[a.status].icone) + '</span>' +
      '<strong>' + esc(mini ? c.nome.split(' ')[0] : nomeCurtoCliente(c)) + '</strong>' +
      (mini ? '' : span === 1 ? '<span>' + a.inicio + ' · ' + s.nome + '</span>' : '<span>' + s.nome + '</span><span>' + a.inicio + '–' + AG.fim(a) + '</span>') +
      '</button>'
    );
  }

  function gradeDia() {
    var profs = profsAtivos();
    var hs = slots();
    var html = '';
    var dataAberta = AG.aberto(estado.data);
    html += '<div class="cal__corner" style="grid-row:1;grid-column:1"></div>';
    profs.forEach(function (p, i) {
      var qtd = D.agendamentos.filter(function (a) { return a.prof === p.id && a.data === estado.data && AG.ativo(a); }).length;
      html += '<div class="cal__head" style="grid-row:1;grid-column:' + (i + 2) + '"><span class="ag-avatar pro-' + p.cor + '" style="width:32px;height:32px;font-size:12px" aria-hidden="true">' + AG.iniciais(p.nome) + '</span><div>' + p.curto + '<small>' + qtd + (qtd === 1 ? ' horário' : ' horários') + '</small></div></div>';
    });
    hs.forEach(function (h, r) {
      html += '<div class="cal__time" style="grid-row:' + (r + 2) + ';grid-column:1">' + (h.slice(3) === '00' ? h : '') + '</div>';
      profs.forEach(function (p, i) {
        var cls = 'cal__cell';
        if (!dataAberta) cls += ' cal__cell--closed';
        else if (AG.noPassado(estado.data, h)) cls += ' cal__cell--past';
        html += '<div class="' + cls + '" style="grid-row:' + (r + 2) + ';grid-column:' + (i + 2) + '" data-slot data-prof="' + p.id + '" data-data="' + estado.data + '" data-hora="' + h + '"></div>';
      });
    });
    D.agendamentos.forEach(function (a) {
      if (a.data !== estado.data || !AG.ativo(a)) return;
      var i = profs.map(function (p) { return p.id; }).indexOf(a.prof);
      if (i === -1) return;
      var r = (U.min(a.inicio) - U.min(D.negocio.abre)) / 30;
      html += blocoAgendamento(a, i + 2, r + 2, false);
    });
    if (estado.data === D.hoje) {
      var off = (U.min(D.agora) - U.min(D.negocio.abre)) / 30;
      html += '<div class="now-line" style="position:absolute;left:56px;right:0;top:calc(56px + ' + off + ' * ' + ROW + 'px)" aria-hidden="true"></div>';
    }
    return '<div class="cal" style="grid-template-columns:56px repeat(' + profs.length + ', minmax(150px, 1fr));grid-template-rows:56px repeat(' + hs.length + ', ' + ROW + 'px)">' + html + '</div>';
  }

  function gradeSemana() {
    var seg = segundaDaSemana(estado.data);
    var dias = [0, 1, 2, 3, 4, 5].map(function (i) { return U.somaDias(seg, i); });
    var lanes = estado.filtroProf === 'todos' ? profsAtivos() : [AG.prof(estado.filtroProf)];
    var L = lanes.length;
    var hs = slots();
    var html = '<div class="cal__corner" style="grid-row:1;grid-column:1"></div>';
    dias.forEach(function (d, di) {
      var col = 2 + di * L;
      var qtd = D.agendamentos.filter(function (a) {
        return a.data === d && AG.ativo(a) && lanes.some(function (p) { return p.id === a.prof; });
      }).length;
      html += '<div class="cal__head' + (d === D.hoje ? ' cal__head--today' : '') + '" style="grid-row:1;grid-column:' + col + ' / span ' + L + '"><div>' + AG.dataCurta(d) + (d === D.hoje ? ' · hoje' : '') + '<small>' + qtd + ' horários</small></div></div>';
    });
    hs.forEach(function (h, r) {
      html += '<div class="cal__time" style="grid-row:' + (r + 2) + ';grid-column:1">' + (h.slice(3) === '00' ? h : '') + '</div>';
      dias.forEach(function (d, di) {
        lanes.forEach(function (p, li) {
          var cls = 'cal__cell' + (li === 0 ? ' lane-sep' : '');
          if (AG.noPassado(d, h)) cls += ' cal__cell--past';
          html += '<div class="' + cls + '" style="grid-row:' + (r + 2) + ';grid-column:' + (2 + di * L + li) + '" data-slot data-prof="' + p.id + '" data-data="' + d + '" data-hora="' + h + '"></div>';
        });
      });
    });
    D.agendamentos.forEach(function (a) {
      if (!AG.ativo(a)) return;
      var di = dias.indexOf(a.data);
      var li = lanes.map(function (p) { return p.id; }).indexOf(a.prof);
      if (di === -1 || li === -1) return;
      var r = (U.min(a.inicio) - U.min(D.negocio.abre)) / 30;
      html += blocoAgendamento(a, 2 + di * L + li, r + 2, L > 1);
    });
    var min = L > 1 ? '64px' : '140px';
    return '<div class="cal" style="grid-template-columns:56px repeat(' + dias.length * L + ', minmax(' + min + ', 1fr));grid-template-rows:56px repeat(' + hs.length + ', ' + ROW + 'px)">' + html + '</div>';
  }

  function telaAgenda() {
    var titulo;
    if (estado.modo === 'dia') titulo = AG.dataLonga(estado.data) + (estado.data === D.hoje ? ' · hoje' : '');
    else {
      var seg = segundaDaSemana(estado.data);
      titulo = 'Semana de ' + AG.dataCurta(seg).split(', ')[1] + ' a ' + AG.dataCurta(U.somaDias(seg, 5)).split(', ')[1];
    }
    var doDia = D.agendamentos.filter(function (a) { return a.data === estado.data && AG.ativo(a); });
    var cancelados = D.agendamentos.filter(function (a) { return a.data === estado.data && a.status === 'cancelado'; }).length;
    var pend = doDia.filter(function (a) { return a.status === 'pendente'; }).length;

    var filtro = '';
    if (estado.modo === 'semana') {
      filtro =
        '<div class="chips-row" role="group" aria-label="Filtrar por profissional">' +
        '<button type="button" class="ag-chip" data-action="filtro-prof" data-id="todos" aria-pressed="' + (estado.filtroProf === 'todos') + '">Todos</button>' +
        profsAtivos().map(function (p) {
          return '<button type="button" class="ag-chip" data-action="filtro-prof" data-id="' + p.id + '" aria-pressed="' + (estado.filtroProf === p.id) + '"><span class="pro-dot pro-' + p.cor + '" aria-hidden="true"></span>' + p.curto + '</button>';
        }).join('') +
        '</div>';
    }

    return (
      '<div class="page-head"><div><h1 tabindex="-1" data-focus>Agenda</h1>' +
      '<p>' + (estado.modo === 'dia' ? doDia.length + ' horários' + (pend ? ' · ' + pend + ' aguardando confirmação' : '') + (cancelados ? ' · ' + cancelados + ' cancelados' : '') : 'Visão da semana') + '</p></div>' +
      '<button type="button" class="ag-btn ag-btn--primary" data-action="novo">' + ic('plus') + 'Novo agendamento</button></div>' +
      '<div class="toolbar">' +
      '<div class="ag-segmented" role="group" aria-label="Visualização"><button type="button" data-action="modo" data-modo="dia" aria-pressed="' + (estado.modo === 'dia') + '">Dia</button><button type="button" data-action="modo" data-modo="semana" aria-pressed="' + (estado.modo === 'semana') + '">Semana</button></div>' +
      '<button type="button" class="ag-icon-btn" data-action="anterior" aria-label="' + (estado.modo === 'dia' ? 'Dia anterior' : 'Semana anterior') + '">' + ic('chevron-left') + '</button>' +
      '<button type="button" class="ag-icon-btn" data-action="proximo" aria-label="' + (estado.modo === 'dia' ? 'Próximo dia' : 'Próxima semana') + '">' + ic('chevron-right') + '</button>' +
      '<button type="button" class="ag-btn ag-btn--secondary ag-btn--sm" data-action="hoje"' + (estado.data === D.hoje ? ' disabled' : '') + '>Hoje</button>' +
      '<h2 class="date-label" aria-live="polite">' + titulo + '</h2>' +
      '</div>' +
      filtro +
      '<div class="legend" aria-label="Legenda">' +
      profsAtivos().map(function (p) { return '<span><i class="pro-' + p.cor + '" style="background:var(--c)"></i>' + p.curto + '</span>'; }).join('') +
      '<span>' + ic('check', ' style="width:14px;height:14px;color:var(--ag-success)"') + 'Confirmado</span>' +
      '<span>' + ic('clock', ' style="width:14px;height:14px;color:var(--ag-warn)"') + 'Aguardando (listrado)</span>' +
      '<span>' + ic('user-x', ' style="width:14px;height:14px;color:var(--ag-error)"') + 'Faltou</span></div>' +
      '<p class="tip">' + ic('move') + 'Arraste um horário para remarcar. Pelo teclado: abra o horário e use "Remarcar". Clique num espaço vazio para agendar.</p>' +
      '<div class="cal-wrap" id="cal-wrap">' + (estado.modo === 'dia' ? gradeDia() : gradeSemana()) + '</div>'
    );
  }

  function rolarParaAgora() {
    var wrap = document.getElementById('cal-wrap');
    if (!wrap) return;
    var alvo = estado.data === D.hoje ? U.min(D.agora) - 60 : U.min('09:00');
    wrap.scrollTop = Math.max(0, ((alvo - U.min(D.negocio.abre)) / 30) * ROW);
  }

  // ---------- Detalhe, remarcar, novo ----------
  function abrirDetalhe(id) {
    var a = AG.agendamento(id);
    var c = AG.cliente(a.cliente);
    var s = AG.servico(a.servico);
    var p = AG.prof(a.prof);
    var comecou = AG.noPassado(a.data, a.inicio);
    var aberto = a.status === 'confirmado' || a.status === 'pendente';
    var acoes = [];
    if (a.status === 'pendente' && !comecou) acoes.push('<button type="button" class="ag-btn ag-btn--primary" data-det="confirmar">' + ic('check') + 'Confirmar</button>');
    if (aberto && comecou) {
      acoes.push('<button type="button" class="ag-btn ag-btn--primary" data-det="concluir">' + ic('check-check') + 'Concluído</button>');
      acoes.push('<button type="button" class="ag-btn ag-btn--danger" data-det="faltou">' + ic('user-x') + 'Faltou</button>');
    }
    if (a.status === 'concluido' || a.status === 'faltou') {
      acoes.push('<button type="button" class="ag-btn ag-btn--secondary" data-det="corrigir">' + ic('undo-2') + 'Marquei errado</button>');
    }
    if (aberto && !comecou) {
      acoes.push('<button type="button" class="ag-btn ag-btn--secondary" data-det="remarcar">' + ic('calendar-clock') + 'Remarcar</button>');
      acoes.push('<button type="button" class="ag-btn ag-btn--danger" data-det="cancelar">Cancelar</button>');
    }

    dialog.innerHTML =
      '<div class="detail">' +
      '<div class="ag-modal__head"><h2 class="ag-modal__title" id="det-title">' + esc(c.nome) + '</h2><button type="button" class="ag-icon-btn" data-det="fechar" aria-label="Fechar">' + ic('x') + '</button></div>' +
      '<div class="ag-modal__body">' +
      '<div>' + AG.badge(a.status) + '</div>' +
      '<dl class="summary">' +
      '<div><dt>Serviço</dt><dd>' + s.nome + '</dd></div>' +
      '<div><dt>Quando</dt><dd>' + AG.dataLonga(a.data) + ', ' + a.inicio + '–' + AG.fim(a) + '</dd></div>' +
      '<div><dt>Profissional</dt><dd>' + p.nome + '</dd></div>' +
      '<div><dt>Valor</dt><dd>' + AG.brl(s.preco) + '</dd></div>' +
      '<div><dt>WhatsApp</dt><dd>' + c.telefone + '</dd></div>' +
      '<div><dt>Origem</dt><dd>' + (a.origem === 'app' ? 'App do cliente' : a.origem === 'whatsapp' ? 'WhatsApp' : 'Balcão') + '</dd></div>' +
      '</dl>' +
      (a.obs ? '<p class="small"><strong>Observação do cliente:</strong> ' + esc(a.obs) + '</p>' : '') +
      (c.obs ? '<p class="small"><strong>Na ficha:</strong> ' + esc(c.obs) + '</p>' : '') +
      (acoes.length ? '<div class="detail-actions">' + acoes.join('') + '</div>' : '') +
      '<a class="ag-btn ag-btn--ghost" href="#clientes/' + c.id + '" data-det="ficha">' + ic('contact') + 'Ver ficha do cliente</a>' +
      '</div></div>';
    dialog.setAttribute('aria-labelledby', 'det-title');
    dialog.removeAttribute('aria-describedby');
    AG.icones();
    dialog.onclick = function (e) {
      if (e.target === dialog) return dialog.close();
      var b = e.target.closest('[data-det]');
      if (!b) return;
      var acao = b.getAttribute('data-det');
      if (acao === 'fechar' || acao === 'ficha') return dialog.close();
      dialog.close();
      if (acao === 'remarcar') return formRemarcar(a.id);
      if (acao === 'cancelar') return cancelar(a.id);
      mudarStatus(a.id, { confirmar: 'confirmado', concluir: 'concluido', faltou: 'faltou', corrigir: 'confirmado' }[acao]);
    };
    dialog.showModal();
    dialog.querySelector('[data-det="fechar"]').focus();
  }

  function mudarStatus(id, novo) {
    var a = AG.agendamento(id);
    var antes = a.status;
    a.status = novo;
    AG.salvarAgendamento(a);
    render();
    var txt = { confirmado: antes === 'pendente' ? 'Presença confirmada.' : 'Status corrigido para confirmado.', concluido: 'Atendimento concluído.', faltou: 'Falta registrada.' }[novo];
    AG.toast(txt, {
      acao: 'Desfazer',
      onAcao: function () {
        a.status = antes;
        AG.salvarAgendamento(a);
        render();
      }
    });
  }

  function cancelar(id) {
    var a = AG.agendamento(id);
    var c = AG.cliente(a.cliente);
    AG.modal({
      titulo: 'Cancelar o horário de ' + c.nome.split(' ')[0] + '?',
      texto: AG.servico(a.servico).nome + ', ' + AG.dataLonga(a.data) + ' às ' + a.inicio + '. O cliente recebe um aviso no WhatsApp.',
      confirmar: 'Cancelar horário',
      cancelar: 'Manter',
      perigo: true,
      onConfirmar: function () {
        var antes = a.status;
        a.status = 'cancelado';
        AG.salvarAgendamento(a);
        render();
        AG.toast('Horário cancelado.', {
          acao: 'Desfazer',
          onAcao: function () {
            a.status = antes;
            AG.salvarAgendamento(a);
            render();
          }
        });
      }
    });
  }

  function opcoesHorario(profId, data, servicoId, ignorar, selecionado) {
    var hs = AG.horariosLivres(profId, data, servicoId, ignorar).filter(function (h) { return h.livre; });
    if (!hs.length) return '<option value="">Sem horário livre nesse dia</option>';
    return '<option value="">Escolha</option>' + hs.map(function (h) {
      return '<option' + (h.hora === selecionado ? ' selected' : '') + '>' + h.hora + '</option>';
    }).join('');
  }

  function opcoesProf(servicoId, selecionado) {
    return D.profissionais
      .filter(function (p) { return !servicoId || p.servicos.indexOf(servicoId) !== -1; })
      .map(function (p) { return '<option value="' + p.id + '"' + (p.id === selecionado ? ' selected' : '') + '>' + p.nome + '</option>'; })
      .join('');
  }

  function campoErro(id, msg) {
    return '<p class="ag-error-msg" id="' + id + '" hidden>' + ic('alert-circle') + msg + '</p>';
  }

  function marcarErro(form, nome, idErro, ok) {
    var el = form.elements[nome];
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    document.getElementById(idErro).hidden = ok;
    return ok;
  }

  function formRemarcar(id) {
    var a = AG.agendamento(id);
    var c = AG.cliente(a.cliente);
    AG.modal({
      titulo: 'Remarcar ' + c.nome.split(' ')[0],
      texto: AG.servico(a.servico).nome + '. Hoje está em ' + AG.dataCurta(a.data) + ' às ' + a.inicio + '.',
      corpo:
        '<div class="form-grid">' +
        '<div class="ag-field"><label class="ag-label" for="r-prof">Profissional</label><select class="ag-select" id="r-prof" name="prof">' + opcoesProf(a.servico, a.prof) + '</select></div>' +
        '<div class="form-grid form-grid--2">' +
        '<div class="ag-field"><label class="ag-label" for="r-data">Data</label><input class="ag-input" type="date" id="r-data" name="data" min="' + D.hoje + '" value="' + a.data + '"></div>' +
        '<div class="ag-field"><label class="ag-label" for="r-hora">Horário</label><select class="ag-select" id="r-hora" name="hora" aria-describedby="r-hora-erro">' + opcoesHorario(a.prof, a.data, a.servico, a.id, '') + '</select>' + campoErro('r-hora-erro', 'Escolha um horário livre.') + '</div>' +
        '</div></div>',
      confirmar: 'Remarcar',
      focoEm: '#r-prof',
      aoAbrir: function (form) {
        var atualizar = function () {
          form.hora.innerHTML = opcoesHorario(form.prof.value, form.data.value, a.servico, a.id, '');
        };
        form.prof.addEventListener('change', atualizar);
        form.data.addEventListener('change', atualizar);
      },
      validar: function (form) {
        var ok = marcarErro(form, 'hora', 'r-hora-erro', !!form.hora.value);
        if (!ok) form.hora.focus();
        return ok;
      },
      onConfirmar: function (dados) {
        mover(a.id, dados.get('prof'), dados.get('data'), dados.get('hora'));
      }
    });
  }

  function mover(id, profId, data, hora) {
    var a = AG.agendamento(id);
    var motivo = motivoInvalido(a, profId, data, hora);
    if (motivo) return AG.toast(motivo, { erro: true });
    var antes = { prof: a.prof, data: a.data, inicio: a.inicio };
    if (antes.prof === profId && antes.data === data && antes.inicio === hora) return;
    a.prof = profId;
    a.data = data;
    a.inicio = hora;
    AG.salvarAgendamento(a);
    render();
    AG.toast('Remarcado: ' + AG.dataCurta(data) + ', ' + hora + ' com ' + AG.prof(profId).curto + '. Avisamos o cliente.', {
      acao: 'Desfazer',
      onAcao: function () {
        a.prof = antes.prof;
        a.data = antes.data;
        a.inicio = antes.inicio;
        AG.salvarAgendamento(a);
        render();
      }
    });
  }

  function formNovo(pre) {
    pre = pre || {};
    var clientes = D.clientes.slice().sort(function (x, y) { return x.nome.localeCompare(y.nome); });
    var sid = pre.servico || '';
    AG.modal({
      titulo: 'Novo agendamento',
      corpo:
        '<div class="form-grid">' +
        '<div class="ag-field"><label class="ag-label" for="n-cli">Cliente</label><select class="ag-select" id="n-cli" name="cliente" aria-describedby="n-cli-erro">' +
        '<option value="">Escolha</option><option value="novo">+ Cliente novo</option>' +
        clientes.map(function (c) { return '<option value="' + c.id + '"' + (c.id === pre.cliente ? ' selected' : '') + '>' + esc(c.nome) + '</option>'; }).join('') +
        '</select>' + campoErro('n-cli-erro', 'Escolha o cliente.') + '</div>' +
        '<div class="form-grid form-grid--2" id="n-novo" hidden>' +
        '<div class="ag-field"><label class="ag-label" for="n-nome">Nome</label><input class="ag-input" id="n-nome" name="nome" aria-describedby="n-nome-erro">' + campoErro('n-nome-erro', 'Escreva o nome.') + '</div>' +
        '<div class="ag-field"><label class="ag-label" for="n-tel">WhatsApp</label><input class="ag-input" id="n-tel" name="tel" type="tel" placeholder="(61) 90000-0000" aria-describedby="n-tel-erro">' + campoErro('n-tel-erro', 'DDD + 8 ou 9 dígitos.') + '</div>' +
        '</div>' +
        '<div class="ag-field"><label class="ag-label" for="n-serv">Serviço</label><select class="ag-select" id="n-serv" name="servico" aria-describedby="n-serv-erro"><option value="">Escolha</option>' +
        D.servicos.filter(function (s) { return s.ativo; }).map(function (s) { return '<option value="' + s.id + '"' + (s.id === sid ? ' selected' : '') + '>' + s.nome + ' · ' + AG.duracao(s.duracao) + ' · ' + AG.brl(s.preco) + '</option>'; }).join('') +
        '</select>' + campoErro('n-serv-erro', 'Escolha o serviço.') + '</div>' +
        '<div class="ag-field"><label class="ag-label" for="n-prof">Profissional</label><select class="ag-select" id="n-prof" name="prof">' + opcoesProf(sid, pre.prof) + '</select></div>' +
        '<div class="form-grid form-grid--2">' +
        '<div class="ag-field"><label class="ag-label" for="n-data">Data</label><input class="ag-input" type="date" id="n-data" name="data" min="' + D.hoje + '" value="' + (pre.data || estado.data) + '"></div>' +
        '<div class="ag-field"><label class="ag-label" for="n-hora">Horário</label><select class="ag-select" id="n-hora" name="hora" aria-describedby="n-hora-erro"><option value="">Escolha o serviço</option></select>' + campoErro('n-hora-erro', 'Escolha um horário livre.') + '</div>' +
        '</div></div>',
      confirmar: 'Agendar',
      focoEm: pre.cliente ? '#n-serv' : '#n-cli',
      aoAbrir: function (form) {
        var horas = function () {
          if (!form.servico.value || !form.prof.value) {
            form.hora.innerHTML = '<option value="">Escolha o serviço</option>';
            return;
          }
          form.hora.innerHTML = opcoesHorario(form.prof.value, form.data.value, form.servico.value, null, pre.hora);
        };
        form.cliente.addEventListener('change', function () {
          document.getElementById('n-novo').hidden = form.cliente.value !== 'novo';
        });
        form.servico.addEventListener('change', function () {
          var atual = form.prof.value;
          form.prof.innerHTML = opcoesProf(form.servico.value, atual);
          horas();
        });
        form.prof.addEventListener('change', horas);
        form.data.addEventListener('change', horas);
        horas();
      },
      validar: function (form) {
        var ok = true, primeiro = null;
        var checa = function (nome, idErro, cond) {
          var r = marcarErro(form, nome, idErro, cond);
          if (!r && !primeiro) primeiro = form.elements[nome];
          ok = ok && r;
        };
        checa('cliente', 'n-cli-erro', !!form.cliente.value);
        if (form.cliente.value === 'novo') {
          checa('nome', 'n-nome-erro', form.nome.value.trim().length >= 3);
          var dig = form.tel.value.replace(/\D/g, '');
          checa('tel', 'n-tel-erro', dig.length === 10 || dig.length === 11);
        }
        checa('servico', 'n-serv-erro', !!form.servico.value);
        checa('hora', 'n-hora-erro', !!form.hora.value);
        if (primeiro) primeiro.focus();
        return ok;
      },
      onConfirmar: function (dados) {
        var cid = dados.get('cliente');
        if (cid === 'novo') {
          cid = 'c' + (D.clientes.length + 1) + 'n';
          D.clientes.push({ id: cid, nome: dados.get('nome').trim(), telefone: dados.get('tel'), obs: '' });
        }
        var novo = { id: AG.novoId(), cliente: cid, servico: dados.get('servico'), prof: dados.get('prof'), data: dados.get('data'), inicio: dados.get('hora'), status: 'confirmado', origem: 'balcao' };
        AG.salvarAgendamento(novo);
        estado.data = novo.data;
        render();
        AG.toast('Agendado: ' + AG.cliente(cid).nome.split(' ')[0] + ', ' + AG.dataCurta(novo.data) + ' às ' + novo.inicio + '.');
      }
    });
  }

  // ---------- Arrastar para remarcar ----------
  var drag = null;
  var ignorarClique = false;

  function celulaEm(x, y) {
    var el = document.elementFromPoint(x, y);
    return el ? el.closest('[data-slot]') : null;
  }

  function limparAlvo() {
    view.querySelectorAll('.is-target, .is-invalid').forEach(function (c) {
      c.classList.remove('is-target', 'is-invalid');
    });
  }

  view.addEventListener('pointerdown', function (e) {
    var bloco = e.target.closest('.appt[data-movel]');
    if (!bloco || e.button !== 0) return;
    drag = { id: bloco.getAttribute('data-id'), el: bloco, x: e.clientX, y: e.clientY, ativo: false, alvo: null };
  });

  window.addEventListener('pointermove', function (e) {
    if (!drag) return;
    if (!drag.ativo) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 8) return;
      drag.ativo = true;
      drag.el.classList.add('is-dragging');
      drag.el.style.pointerEvents = 'none';
      drag.el.closest('.cal').classList.add('is-dragging');
      ghost.style.display = 'block';
    }
    e.preventDefault();
    ghost.style.left = e.clientX + 'px';
    ghost.style.top = e.clientY + 'px';
    limparAlvo();
    var cel = celulaEm(e.clientX, e.clientY);
    var a = AG.agendamento(drag.id);
    drag.alvo = null;
    if (cel) {
      var p = cel.getAttribute('data-prof'), d = cel.getAttribute('data-data'), h = cel.getAttribute('data-hora');
      var motivo = motivoInvalido(a, p, d, h);
      cel.classList.add(motivo ? 'is-invalid' : 'is-target');
      ghost.textContent = motivo ? motivo : '→ ' + AG.prof(p).curto + ' · ' + AG.dataCurta(d) + ', ' + h;
      drag.alvo = { prof: p, data: d, hora: h, motivo: motivo };
    } else {
      ghost.textContent = 'Solte num horário da agenda';
    }
    // rolagem automática perto das bordas
    var wrap = document.getElementById('cal-wrap');
    if (wrap) {
      var r = wrap.getBoundingClientRect();
      if (e.clientY > r.bottom - 40) wrap.scrollTop += 12;
      if (e.clientY < r.top + 70) wrap.scrollTop -= 12;
      if (e.clientX > r.right - 40) wrap.scrollLeft += 12;
      if (e.clientX < r.left + 70) wrap.scrollLeft -= 12;
    }
  }, { passive: false });

  window.addEventListener('pointerup', function () {
    if (!drag) return;
    var d = drag;
    drag = null;
    if (!d.ativo) return;
    ignorarClique = true;
    setTimeout(function () { ignorarClique = false; }, 50);
    ghost.style.display = 'none';
    limparAlvo();
    d.el.classList.remove('is-dragging');
    d.el.style.pointerEvents = '';
    view.querySelectorAll('.cal.is-dragging').forEach(function (c) { c.classList.remove('is-dragging'); });
    if (!d.alvo) return;
    if (d.alvo.motivo) return AG.toast(d.alvo.motivo, { erro: true });
    mover(d.id, d.alvo.prof, d.alvo.data, d.alvo.hora);
  });

  window.addEventListener('pointercancel', function () {
    if (!drag) return;
    ghost.style.display = 'none';
    limparAlvo();
    drag.el.classList.remove('is-dragging');
    drag.el.style.pointerEvents = '';
    view.querySelectorAll('.cal.is-dragging').forEach(function (c) { c.classList.remove('is-dragging'); });
    drag = null;
  });

  // ---------- Números do mês ----------
  function numerosDoMes() {
    var mes = D.agendamentos.filter(function (a) { return a.data.slice(0, 7) === '2026-10'; });
    var concl = mes.filter(function (a) { return a.status === 'concluido'; });
    var faltas = mes.filter(function (a) { return a.status === 'faltou'; });
    var futuros = mes.filter(function (a) { return (a.status === 'confirmado' || a.status === 'pendente'); });
    var soma = function (l) { return l.reduce(function (t, a) { return t + AG.servico(a.servico).preco; }, 0); };
    return {
      mes: mes,
      faturado: soma(concl),
      previsto: soma(futuros),
      atendimentos: concl.length,
      faltas: faltas.length,
      taxaFaltas: concl.length + faltas.length ? faltas.length / (concl.length + faltas.length) : 0,
      ticket: concl.length ? soma(concl) / concl.length : 0,
      soma: soma
    };
  }

  function pct(n) {
    return (n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) + '%';
  }

  function graficoFaturamento(n) {
    var dias = [];
    for (var d = 1; d <= 31; d++) {
      var data = '2026-10-' + String(d).padStart(2, '0');
      if (!AG.aberto(data)) continue;
      var doDia = n.mes.filter(function (a) { return a.data === data; });
      dias.push({
        data: data,
        feito: n.soma(doDia.filter(function (a) { return a.status === 'concluido'; })),
        prev: n.soma(doDia.filter(function (a) { return a.status === 'confirmado' || a.status === 'pendente'; }))
      });
    }
    var max = Math.max.apply(null, dias.map(function (x) { return x.feito + x.prev; }));
    var passoY = max > 2500 ? 1000 : 500;
    var teto = Math.ceil(max / passoY) * passoY;
    var W = 760, H = 260, L = 52, B = 28, T = 12, R = 8;
    var bw = (W - L - R) / dias.length;
    var y = function (v) { return T + (H - T - B) * (1 - v / teto); };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="g1-t" id="g-fat"><title id="g1-t">Faturamento por dia em outubro: realizado e previsto</title>';
    for (var g = 0; g <= teto; g += passoY) {
      svg += '<line class="grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + y(g) + '" y2="' + y(g) + '"/>';
      svg += '<text class="axis" x="' + (L - 6) + '" y="' + (y(g) + 4) + '" text-anchor="end">' + (g >= 1000 ? (g / 1000).toLocaleString('pt-BR') + ' mil' : g) + '</text>';
    }
    dias.forEach(function (x, i) {
      var bx = L + i * bw + 2, w = Math.max(4, bw - 4);
      var dia = +x.data.slice(8);
      var yF = y(x.feito), yP = y(x.feito + x.prev);
      var hoje = x.data === D.hoje;
      svg += '<rect class="hit" x="' + (L + i * bw) + '" y="' + T + '" width="' + bw + '" height="' + (H - T - B) + '" data-tip="' + AG.dataCurta(x.data) + ' · realizado ' + AG.brl(x.feito) + (x.prev ? ' · previsto ' + AG.brl(x.prev) : '') + '"/>';
      if (x.feito) svg += '<rect class="bar-done" x="' + bx + '" y="' + yF + '" width="' + w + '" height="' + Math.max(0, y(0) - yF) + '" rx="3"/>';
      if (x.prev) svg += '<rect class="bar-plan" x="' + bx + '" y="' + yP + '" width="' + w + '" height="' + Math.max(0, yF - yP - (x.feito ? 2 : 0)) + '" rx="3"/>';
      if (dia === 1 || dia % 5 === 0 || hoje) svg += '<text class="axis" x="' + (bx + w / 2) + '" y="' + (H - 10) + '" text-anchor="middle"' + (hoje ? ' style="font-weight:800;fill:var(--ag-text)"' : '') + '>' + (hoje ? 'hoje' : dia) + '</text>';
    });
    svg += '</svg>';

    var tabela = '<details class="small" style="margin-top:12px"><summary style="min-height:44px;display:flex;align-items:center;cursor:pointer;font-weight:700;color:var(--ag-primary)">Ver dados em tabela</summary><div class="table-scroll"><table class="table" style="min-width:360px"><thead><tr><th scope="col">Dia</th><th scope="col" class="num">Realizado</th><th scope="col" class="num">Previsto</th></tr></thead><tbody>' +
      dias.map(function (x) { return '<tr><td>' + AG.dataCurta(x.data) + '</td><td class="num">' + AG.brl(x.feito) + '</td><td class="num">' + AG.brl(x.prev) + '</td></tr>'; }).join('') +
      '</tbody></table></div></details>';

    return '<div class="chart" data-tooltip>' + svg + '<div class="tooltip" role="presentation"></div></div>' +
      '<div class="chart-legend"><span><i style="background:var(--ag-primary)"></i>Realizado</span><span><i style="background:#a9cbc6"></i>Previsto (agendado)</span></div>' + tabela;
  }

  var RAMPA = ['#f1f6f5', '#cfe3df', '#9cc6bf', '#5f9e95', '#2f746d', '#1f5f5b'];

  function graficoHorarios(n) {
    var dias = [1, 2, 3, 4, 5, 6];
    var horas = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
    var cont = {};
    var max = 0;
    n.mes.forEach(function (a) {
      if (!AG.ativo(a)) return;
      var k = U.diaSemana(a.data) + '-' + Math.floor(U.min(a.inicio) / 60);
      cont[k] = (cont[k] || 0) + 1;
      max = Math.max(max, cont[k]);
    });
    var pico = { v: 0 };
    var W = 560, H = 250, L = 40, T = 24, cw = (W - L) / horas.length, ch = (H - T) / dias.length;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="g2-t"><title id="g2-t">Agendamentos por dia da semana e hora em outubro</title>';
    horas.forEach(function (h, i) {
      svg += '<text class="axis" x="' + (L + i * cw + cw / 2) + '" y="14" text-anchor="middle">' + h + 'h</text>';
    });
    dias.forEach(function (d, j) {
      svg += '<text class="axis" x="' + (L - 8) + '" y="' + (T + j * ch + ch / 2 + 4) + '" text-anchor="end">' + AG.DIAS[d] + '</text>';
      horas.forEach(function (h, i) {
        var v = cont[d + '-' + h] || 0;
        if (v > pico.v) pico = { v: v, d: d, h: h };
        var nivel = v === 0 ? 0 : Math.min(5, Math.ceil((v / max) * 5));
        var cor = RAMPA[nivel];
        svg += '<rect class="heat-cell" x="' + (L + i * cw) + '" y="' + (T + j * ch) + '" width="' + cw + '" height="' + ch + '" rx="4" fill="' + cor + '" data-tip="' + AG.DIAS[d] + ', ' + h + 'h às ' + (h + 1) + 'h · ' + v + ' agendamentos"/>';
        svg += '<text x="' + (L + i * cw + cw / 2) + '" y="' + (T + j * ch + ch / 2 + 4) + '" text-anchor="middle" style="font-size:11px;font-weight:700;font-family:var(--ag-font);pointer-events:none;fill:' + (nivel >= 4 ? '#fff' : 'var(--ag-text)') + '">' + v + '</text>';
      });
    });
    svg += '</svg>';
    var escala = '<div class="heat-scale" aria-hidden="true">menos' + RAMPA.map(function (c) { return '<i style="background:' + c + '"></i>'; }).join('') + 'mais</div>';
    var tabela = '<table class="sr-only"><caption>Agendamentos por dia e hora</caption><thead><tr><th scope="col">Dia</th>' + horas.map(function (h) { return '<th scope="col">' + h + 'h</th>'; }).join('') + '</tr></thead><tbody>' +
      dias.map(function (d) { return '<tr><th scope="row">' + AG.DIAS[d] + '</th>' + horas.map(function (h) { return '<td>' + (cont[d + '-' + h] || 0) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    return {
      html: '<div class="chart chart--narrow" data-tooltip>' + svg + '<div class="tooltip" role="presentation"></div></div>' + escala + tabela,
      pico: pico
    };
  }

  function faltasPorProf(n) {
    return D.profissionais
      .map(function (p) {
        var c = n.mes.filter(function (a) { return a.prof === p.id && a.status === 'concluido'; }).length;
        var f = n.mes.filter(function (a) { return a.prof === p.id && a.status === 'faltou'; }).length;
        return { p: p, taxa: c + f ? f / (c + f) : 0, f: f };
      })
      .map(function (x) {
        return '<div class="hbar"><span>' + x.p.curto + '</span><div class="hbar__track" aria-hidden="true"><div class="hbar__fill" style="width:' + Math.min(100, x.taxa * 400) + '%"></div></div><strong>' + pct(x.taxa) + '</strong></div>';
      })
      .join('');
  }

  function telaNumeros() {
    var n = numerosDoMes();
    var heat = graficoHorarios(n);
    return (
      '<div class="page-head"><div><h1 tabindex="-1" data-focus>Números de outubro</h1><p>Atualizado até hoje, ' + AG.dataCurta(D.hoje) + ', às ' + D.agora + '.</p></div></div>' +
      '<dl class="kpis">' +
      '<div class="ag-card kpi"><dt>Faturamento realizado</dt><dd>' + AG.brl(n.faturado) + '<span class="sub">+ ' + AG.brl(n.previsto) + ' já agendados até o fim do mês</span></dd></div>' +
      '<div class="ag-card kpi"><dt>Atendimentos</dt><dd>' + n.atendimentos + '<span class="sub">concluídos no mês</span></dd></div>' +
      '<div class="ag-card kpi"><dt>Taxa de faltas</dt><dd>' + pct(n.taxaFaltas) + '<span class="sub">' + n.faltas + ' clientes não vieram</span></dd></div>' +
      '<div class="ag-card kpi"><dt>Ticket médio</dt><dd>' + AG.brl(n.ticket) + '<span class="sub">por atendimento</span></dd></div>' +
      '</dl>' +
      '<div class="charts">' +
      '<section class="ag-card chart-card span-2" aria-labelledby="t-fat"><h2 id="t-fat">Faturamento por dia</h2><p>Barras escuras são o que já entrou. A parte clara é o que está agendado.</p>' + graficoFaturamento(n) + '</section>' +
      '<section class="ag-card chart-card" aria-labelledby="t-heat"><h2 id="t-heat">Horários mais cheios</h2><p>Quantidade de agendamentos por dia da semana e hora, no mês.</p>' + heat.html +
      '<div class="callout-num">' + ic('flame') + '<span>O horário mais disputado é <strong>' + AG.DIAS[heat.pico.d] + ', das ' + heat.pico.h + 'h às ' + (heat.pico.h + 1) + 'h</strong>. Bom momento para não marcar folga.</span></div></section>' +
      '<section class="ag-card chart-card" aria-labelledby="t-faltas"><h2 id="t-faltas">Faltas por profissional</h2><p>Clientes que não vieram, sobre o total de atendimentos de cada um.</p>' + faltasPorProf(n) +
      '<div class="callout-num">' + ic('message-circle') + '<span>Quem confirma o lembrete falta menos. Os ' + pendentesHoje() + ' clientes de hoje que ainda não confirmaram recebem um segundo lembrete 2 horas antes.</span></div></section>' +
      '</div>'
    );
  }

  // Tooltip dos gráficos
  view.addEventListener('mousemove', function (e) {
    var alvo = e.target.closest('[data-tip]');
    var box = e.target.closest('[data-tooltip]');
    view.querySelectorAll('.tooltip').forEach(function (t) {
      if (!box || t.parentNode !== box || !alvo) t.style.display = 'none';
    });
    if (!alvo || !box) return;
    var tip = box.querySelector('.tooltip');
    var r = box.getBoundingClientRect();
    tip.textContent = alvo.getAttribute('data-tip');
    tip.style.display = 'block';
    tip.style.left = e.clientX - r.left + box.scrollLeft + 'px';
    tip.style.top = e.clientY - r.top + 'px';
  });

  // ---------- Clientes ----------
  function statsCliente(c) {
    var ags = D.agendamentos.filter(function (a) { return a.cliente === c.id; });
    var concl = ags.filter(function (a) { return a.status === 'concluido'; });
    var ultima = concl.sort(function (a, b) { return (b.data + b.inicio).localeCompare(a.data + a.inicio); })[0];
    var porProf = {};
    concl.forEach(function (a) { porProf[a.prof] = (porProf[a.prof] || 0) + 1; });
    var fav = Object.keys(porProf).sort(function (a, b) { return porProf[b] - porProf[a]; })[0];
    return {
      ags: ags,
      visitas: concl.length,
      faltas: ags.filter(function (a) { return a.status === 'faltou'; }).length,
      gasto: concl.reduce(function (t, a) { return t + AG.servico(a.servico).preco; }, 0),
      ultima: ultima,
      fav: fav ? AG.prof(fav) : null,
      proximo: ags.filter(function (a) { return AG.ativo(a) && a.status !== 'concluido' && a.status !== 'faltou' && !AG.noPassado(a.data, a.inicio); })
        .sort(function (a, b) { return (a.data + a.inicio).localeCompare(b.data + b.inicio); })[0]
    };
  }

  function telaClientes() {
    var busca = estado.buscaCliente.trim().toLowerCase();
    var lista = D.clientes
      .map(function (c) { return { c: c, s: statsCliente(c) }; })
      .filter(function (x) { return !busca || (x.c.nome + ' ' + x.c.telefone).toLowerCase().indexOf(busca) !== -1; })
      .sort(function (a, b) {
        var ua = a.s.ultima ? a.s.ultima.data : '', ub = b.s.ultima ? b.s.ultima.data : '';
        return ub.localeCompare(ua) || a.c.nome.localeCompare(b.c.nome);
      });
    return (
      '<div class="page-head"><div><h1 tabindex="-1" data-focus>Clientes</h1><p>' + D.clientes.length + ' clientes cadastrados</p></div>' +
      '<form class="search" role="search" data-form="busca"><label class="sr-only" for="busca-cli">Buscar cliente por nome ou telefone</label>' + ic('search') +
      '<input class="ag-input" id="busca-cli" type="search" placeholder="Buscar por nome ou telefone" value="' + esc(estado.buscaCliente) + '" autocomplete="off"></form></div>' +
      '<div class="ag-card table-card"><div class="table-scroll"><table class="table"><caption class="sr-only">Lista de clientes</caption><thead><tr>' +
      '<th scope="col">Cliente</th><th scope="col">WhatsApp</th><th scope="col" class="num">Visitas</th><th scope="col" class="num">Faltas</th><th scope="col">Última visita</th><th scope="col">Próximo horário</th><th scope="col" class="num">Gasto total</th></tr></thead><tbody>' +
      (lista.length
        ? lista.map(function (x) {
            return '<tr><th scope="row"><a href="#clientes/' + x.c.id + '"><span class="ag-avatar" aria-hidden="true" style="width:32px;height:32px;font-size:12px">' + AG.iniciais(x.c.nome) + '</span>' + esc(x.c.nome) + '</a></th>' +
              '<td>' + x.c.telefone + '</td><td class="num">' + x.s.visitas + '</td><td class="num">' + x.s.faltas + '</td>' +
              '<td>' + (x.s.ultima ? AG.dataCurta(x.s.ultima.data) : '—') + '</td>' +
              '<td>' + (x.s.proximo ? AG.dataCurta(x.s.proximo.data) + ', ' + x.s.proximo.inicio : '—') + '</td>' +
              '<td class="num">' + AG.brl(x.s.gasto) + '</td></tr>';
          }).join('')
        : '<tr><td colspan="7" class="empty">Nenhum cliente encontrado para "' + esc(estado.buscaCliente) + '".</td></tr>') +
      '</tbody></table></div></div>'
    );
  }

  function telaFicha(id) {
    var c = AG.cliente(id);
    if (!c) return telaNaoEncontrada();
    var s = statsCliente(c);
    var hist = s.ags.slice().sort(function (a, b) { return (b.data + b.inicio).localeCompare(a.data + a.inicio); });
    return (
      '<a class="back-link" href="#clientes">' + ic('arrow-left') + 'Clientes</a>' +
      '<div class="profile">' +
      '<div class="stack">' +
      '<div class="ag-card stack">' +
      '<div class="profile__head"><span class="ag-avatar ag-avatar--lg" aria-hidden="true">' + AG.iniciais(c.nome) + '</span><div><h1 tabindex="-1" data-focus>' + esc(c.nome) + '</h1><p class="muted small">' + c.telefone + '</p></div></div>' +
      '<div class="row" style="flex-wrap:wrap"><button type="button" class="ag-btn ag-btn--secondary" data-action="whats">' + ic('message-circle') + 'Chamar no WhatsApp</button>' +
      '<button type="button" class="ag-btn ag-btn--primary" data-action="novo-cliente" data-id="' + c.id + '">' + ic('plus') + 'Agendar</button></div>' +
      '<dl class="mini-stats">' +
      '<div><dt>Visitas</dt><dd>' + s.visitas + '</dd></div>' +
      '<div><dt>Gasto total</dt><dd>' + AG.brl(s.gasto) + '</dd></div>' +
      '<div><dt>Faltas</dt><dd>' + s.faltas + '</dd></div>' +
      '<div><dt>Prefere</dt><dd>' + (s.fav ? s.fav.curto : '—') + '</dd></div>' +
      '</dl></div>' +
      '<form class="ag-card stack" id="form-obs" novalidate><div class="ag-field"><label class="ag-label" for="obs">Observações</label>' +
      '<textarea class="ag-textarea" id="obs" name="obs" maxlength="280" placeholder="Ex.: alergia, preferência de corte, como gosta de ser atendido">' + esc(c.obs || '') + '</textarea>' +
      '<p class="ag-hint">Só a equipe vê. Aparece quando você abre um horário desse cliente.</p></div>' +
      '<button type="submit" class="ag-btn ag-btn--secondary" style="align-self:flex-start">Salvar observação</button></form>' +
      '</div>' +
      '<section class="ag-card" aria-labelledby="t-hist"><h2 id="t-hist" style="font-size:var(--ag-fs-lg);margin-bottom:8px">Histórico</h2>' +
      (hist.length
        ? '<ul class="history">' + hist.map(function (a) {
            var sv = AG.servico(a.servico);
            return '<li><div><strong>' + sv.nome + '</strong><span class="muted">' + AG.dataCurta(a.data) + ', ' + a.inicio + ' · ' + AG.prof(a.prof).curto + '</span></div>' +
              '<div class="num">' + AG.brl(sv.preco) + '<div style="margin-top:4px">' + AG.badge(a.status, true) + '</div></div></li>';
          }).join('') + '</ul>'
        : '<p class="muted">Ainda sem horários.</p>') +
      '</section></div>'
    );
  }

  // ---------- Serviços ----------
  function telaServicos() {
    return (
      '<div class="page-head"><div><h1 tabindex="-1" data-focus>Serviços</h1><p>O que aparece para o cliente no app. Desative para esconder sem apagar.</p></div>' +
      '<button type="button" class="ag-btn ag-btn--primary" data-action="servico-novo">' + ic('plus') + 'Novo serviço</button></div>' +
      '<div class="ag-card table-card"><div class="table-scroll"><table class="table"><caption class="sr-only">Serviços</caption><thead><tr>' +
      '<th scope="col">Serviço</th><th scope="col">Categoria</th><th scope="col" class="num">Duração</th><th scope="col" class="num">Preço</th><th scope="col">Quem faz</th><th scope="col">No app</th><th scope="col"><span class="sr-only">Ações</span></th></tr></thead><tbody>' +
      D.servicos.map(function (s) {
        var quem = D.profissionais.filter(function (p) { return p.servicos.indexOf(s.id) !== -1; }).map(function (p) { return p.curto; }).join(', ');
        return '<tr' + (s.ativo ? '' : ' class="inactive"') + '><th scope="row">' + esc(s.nome) + '</th><td>' + s.categoria + '</td><td class="num">' + AG.duracao(s.duracao) + '</td><td class="num">' + AG.brl(s.preco) + '</td><td>' + (quem || '<span class="muted">Ninguém</span>') + '</td>' +
          '<td><label class="switch"><input type="checkbox" data-action="servico-ativo" data-id="' + s.id + '"' + (s.ativo ? ' checked' : '') + '><span>' + (s.ativo ? 'Ativo' : 'Oculto') + '</span><span class="sr-only"> ' + esc(s.nome) + '</span></label></td>' +
          '<td><button type="button" class="ag-btn ag-btn--ghost ag-btn--sm" data-action="servico-editar" data-id="' + s.id + '">' + ic('pencil') + 'Editar<span class="sr-only"> ' + esc(s.nome) + '</span></button></td></tr>';
      }).join('') +
      '</tbody></table></div></div>'
    );
  }

  function formServico(id) {
    var s = id ? AG.servico(id) : { nome: '', categoria: 'Barbearia', duracao: 30, preco: '', ativo: true };
    var cats = ['Barbearia', 'Cabelo', 'Unhas e sobrancelha', 'Estética'];
    AG.modal({
      titulo: id ? 'Editar serviço' : 'Novo serviço',
      corpo:
        '<div class="form-grid">' +
        '<div class="ag-field"><label class="ag-label" for="s-nome">Nome</label><input class="ag-input" id="s-nome" name="nome" maxlength="40" value="' + esc(s.nome) + '" aria-describedby="s-nome-erro">' + campoErro('s-nome-erro', 'Dê um nome com pelo menos 3 letras.') + '</div>' +
        '<div class="form-grid form-grid--2">' +
        '<div class="ag-field"><label class="ag-label" for="s-cat">Categoria</label><select class="ag-select" id="s-cat" name="categoria">' + cats.map(function (c) { return '<option' + (c === s.categoria ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></div>' +
        '<div class="ag-field"><label class="ag-label" for="s-dur">Duração</label><select class="ag-select" id="s-dur" name="duracao">' + [30, 60, 90, 120].map(function (m) { return '<option value="' + m + '"' + (m === s.duracao ? ' selected' : '') + '>' + AG.duracao(m) + '</option>'; }).join('') + '</select></div>' +
        '</div>' +
        '<div class="ag-field"><label class="ag-label" for="s-preco">Preço (R$)</label><input class="ag-input" id="s-preco" name="preco" inputmode="decimal" placeholder="0,00" value="' + (s.preco === '' ? '' : String(s.preco).replace('.', ',')) + '" aria-describedby="s-preco-erro">' + campoErro('s-preco-erro', 'Informe um valor maior que zero.') + '</div>' +
        '<fieldset><legend class="ag-label" style="margin-bottom:4px">Quem faz</legend><div class="checks">' +
        D.profissionais.map(function (p) { return '<label class="ag-check"><input type="checkbox" name="profs" value="' + p.id + '"' + (id && p.servicos.indexOf(id) !== -1 ? ' checked' : '') + '>' + p.nome + '</label>'; }).join('') +
        '</div></fieldset></div>',
      confirmar: id ? 'Salvar' : 'Criar serviço',
      focoEm: '#s-nome',
      validar: function (form) {
        var okN = marcarErro(form, 'nome', 's-nome-erro', form.nome.value.trim().length >= 3);
        var v = parseFloat(form.preco.value.replace(/\./g, '').replace(',', '.'));
        var okP = marcarErro(form, 'preco', 's-preco-erro', v > 0);
        if (!okN) form.nome.focus();
        else if (!okP) form.preco.focus();
        return okN && okP;
      },
      onConfirmar: function (dados) {
        var alvo = id ? AG.servico(id) : { id: 's' + (D.servicos.length + 1) + 'n', ativo: true };
        alvo.nome = dados.get('nome').trim();
        alvo.categoria = dados.get('categoria');
        alvo.duracao = +dados.get('duracao');
        alvo.preco = parseFloat(String(dados.get('preco')).replace(/\./g, '').replace(',', '.'));
        if (!id) D.servicos.push(alvo);
        var marcados = dados.getAll('profs');
        D.profissionais.forEach(function (p) {
          var i = p.servicos.indexOf(alvo.id);
          if (marcados.indexOf(p.id) !== -1 && i === -1) p.servicos.push(alvo.id);
          if (marcados.indexOf(p.id) === -1 && i !== -1) p.servicos.splice(i, 1);
        });
        AG.salvarServicos();
        AG.salvarProfissionais();
        render();
        AG.toast(id ? 'Serviço atualizado.' : 'Serviço criado. Já aparece no app do cliente.');
      }
    });
  }

  // ---------- Profissionais ----------
  function telaProfissionais() {
    var mes = D.agendamentos.filter(function (a) { return a.data.slice(0, 7) === '2026-10' && a.status === 'concluido'; });
    return (
      '<div class="page-head"><div><h1 tabindex="-1" data-focus>Profissionais</h1><p>Quem atende e o que cada um faz.</p></div>' +
      '<button type="button" class="ag-btn ag-btn--primary" data-action="prof-novo">' + ic('plus') + 'Novo profissional</button></div>' +
      '<div class="pros">' +
      D.profissionais.map(function (p) {
        var feitos = mes.filter(function (a) { return a.prof === p.id; });
        var fat = feitos.reduce(function (t, a) { return t + AG.servico(a.servico).preco; }, 0);
        return '<article class="ag-card pro-card"><div class="pro-card__head"><span class="ag-avatar ag-avatar--lg pro-' + p.cor + '" aria-hidden="true">' + AG.iniciais(p.nome) + '</span><div><strong>' + esc(p.nome) + '</strong><span class="muted small">' + esc(p.funcao) + '</span></div></div>' +
          '<div class="tags">' + (p.servicos.length ? p.servicos.map(function (sid) { var s = AG.servico(sid); return s ? '<span class="tag">' + esc(s.nome) + '</span>' : ''; }).join('') : '<span class="muted small">Nenhum serviço ainda</span>') + '</div>' +
          '<p class="small muted">' + feitos.length + ' atendimentos em outubro · ' + AG.brl(fat) + '</p>' +
          '<p class="small muted">' + ic('clock', ' style="width:14px;height:14px;display:inline;vertical-align:-2px"') + ' Seg a sáb, 9h às 19h</p></article>';
      }).join('') +
      '</div>'
    );
  }

  function formProfissional() {
    var usadas = D.profissionais.map(function (p) { return p.cor; });
    AG.modal({
      titulo: 'Novo profissional',
      corpo:
        '<div class="form-grid">' +
        '<div class="ag-field"><label class="ag-label" for="p-nome">Nome completo</label><input class="ag-input" id="p-nome" name="nome" maxlength="40" aria-describedby="p-nome-erro">' + campoErro('p-nome-erro', 'Escreva nome e sobrenome.') + '</div>' +
        '<div class="ag-field"><label class="ag-label" for="p-funcao">Função</label><input class="ag-input" id="p-funcao" name="funcao" maxlength="40" placeholder="Ex.: Cabeleireira" aria-describedby="p-funcao-erro">' + campoErro('p-funcao-erro', 'Informe a função.') + '</div>' +
        '<fieldset aria-describedby="p-serv-erro"><legend class="ag-label" style="margin-bottom:4px">Serviços que faz</legend><div class="checks">' +
        D.servicos.map(function (s) { return '<label class="ag-check"><input type="checkbox" name="servicos" value="' + s.id + '">' + esc(s.nome) + '</label>'; }).join('') +
        '</div>' + campoErro('p-serv-erro', 'Marque pelo menos um serviço.') + '</fieldset></div>',
      confirmar: 'Adicionar',
      focoEm: '#p-nome',
      validar: function (form) {
        var okN = marcarErro(form, 'nome', 'p-nome-erro', form.nome.value.trim().split(/\s+/).length >= 2);
        var okF = marcarErro(form, 'funcao', 'p-funcao-erro', form.funcao.value.trim().length >= 3);
        var okS = form.querySelectorAll('input[name="servicos"]:checked').length > 0;
        document.getElementById('p-serv-erro').hidden = okS;
        if (!okN) form.nome.focus();
        else if (!okF) form.funcao.focus();
        else if (!okS) form.querySelector('input[name="servicos"]').focus();
        return okN && okF && okS;
      },
      onConfirmar: function (dados) {
        var nome = dados.get('nome').trim();
        var cor = [1, 2, 3, 4].filter(function (c) { return usadas.indexOf(c) === -1; })[0] || (D.profissionais.length % 4) + 1;
        D.profissionais.push({ id: 'p' + Date.now().toString(36), nome: nome, curto: nome.split(' ')[0], funcao: dados.get('funcao').trim(), cor: cor, servicos: dados.getAll('servicos') });
        AG.salvarProfissionais();
        render();
        AG.toast(nome.split(' ')[0] + ' entrou na equipe e já aparece na agenda.');
      }
    });
  }

  function telaNaoEncontrada() {
    return '<div class="empty"><h1 tabindex="-1" data-focus>Página não encontrada</h1><p><a href="#agenda">Ir para a agenda</a></p></div>';
  }

  // ---------- Roteador ----------
  function rota() {
    var h = location.hash.replace('#', '') || 'agenda';
    var p = h.split('/');
    return { nome: p[0], param: p[1] };
  }

  var TITULOS = { agenda: 'Agenda', numeros: 'Números do mês', clientes: 'Clientes', servicos: 'Serviços', profissionais: 'Profissionais' };

  function render() {
    var r = rota();
    var html;
    if (r.nome === 'agenda') html = telaAgenda();
    else if (r.nome === 'numeros') html = telaNumeros();
    else if (r.nome === 'clientes' && r.param) html = telaFicha(r.param);
    else if (r.nome === 'clientes') html = telaClientes();
    else if (r.nome === 'servicos') html = telaServicos();
    else if (r.nome === 'profissionais') html = telaProfissionais();
    else html = telaNaoEncontrada();
    var wrap = document.getElementById('cal-wrap');
    var scroll = wrap ? { t: wrap.scrollTop, l: wrap.scrollLeft } : null;
    view.innerHTML = html;
    renderMenu(r.nome);
    document.title = (TITULOS[r.nome] || 'Painel') + ' · Studio Lume · Agendaí';
    AG.icones();
    var novo = document.getElementById('cal-wrap');
    if (novo && scroll) {
      novo.scrollTop = scroll.t;
      novo.scrollLeft = scroll.l;
    }
  }

  function navegar() {
    render();
    window.scrollTo(0, 0);
    if (rota().nome === 'agenda') rolarParaAgora();
    var alvo = view.querySelector('[data-focus]');
    if (alvo && !primeira) alvo.focus({ preventScroll: true });
    primeira = false;
  }

  window.addEventListener('hashchange', navegar);

  // ---------- Eventos ----------
  view.addEventListener('click', function (e) {
    if (ignorarClique) return;
    var bloco = e.target.closest('.appt');
    if (bloco) return abrirDetalhe(bloco.getAttribute('data-id'));

    var cel = e.target.closest('[data-slot]');
    if (cel && !cel.classList.contains('cal__cell--past') && !cel.classList.contains('cal__cell--closed')) {
      return formNovo({ prof: cel.getAttribute('data-prof'), data: cel.getAttribute('data-data'), hora: cel.getAttribute('data-hora') });
    }

    var el = e.target.closest('[data-action]');
    if (!el) return;
    var acao = el.getAttribute('data-action');
    var id = el.getAttribute('data-id');
    var passo = estado.modo === 'dia' ? 1 : 7;

    if (acao === 'modo') {
      estado.modo = el.getAttribute('data-modo');
      render();
      rolarParaAgora();
      view.querySelector('[data-modo="' + estado.modo + '"]').focus();
    }
    if (acao === 'anterior' || acao === 'proximo') {
      var d = U.somaDias(estado.data, acao === 'anterior' ? -passo : passo);
      // No modo dia, pula o domingo
      if (estado.modo === 'dia' && !AG.aberto(d)) d = U.somaDias(d, acao === 'anterior' ? -1 : 1);
      estado.data = d;
      render();
      view.querySelector('[data-action="' + acao + '"]').focus();
    }
    if (acao === 'hoje') {
      estado.data = D.hoje;
      render();
      rolarParaAgora();
      view.querySelector('[data-action="proximo"]').focus();
    }
    if (acao === 'filtro-prof') {
      estado.filtroProf = id;
      render();
      view.querySelector('[data-action="filtro-prof"][data-id="' + id + '"]').focus();
    }
    if (acao === 'novo') formNovo();
    if (acao === 'novo-cliente') formNovo({ cliente: id });
    if (acao === 'whats') AG.toast('Abrindo a conversa no WhatsApp…');
    if (acao === 'servico-novo') formServico(null);
    if (acao === 'servico-editar') formServico(id);
    if (acao === 'prof-novo') formProfissional();
  });

  view.addEventListener('change', function (e) {
    var t = e.target;
    if (t.getAttribute('data-action') === 'servico-ativo') {
      var s = AG.servico(t.getAttribute('data-id'));
      s.ativo = t.checked;
      AG.salvarServicos();
      render();
      view.querySelector('[data-action="servico-ativo"][data-id="' + s.id + '"]').focus();
      AG.toast(s.ativo ? s.nome + ' voltou a aparecer no app.' : s.nome + ' não aparece mais no app.');
    }
  });

  view.addEventListener('input', function (e) {
    if (e.target.id === 'busca-cli') {
      estado.buscaCliente = e.target.value;
      var pos = e.target.selectionStart;
      render();
      var campo = document.getElementById('busca-cli');
      campo.focus();
      campo.setSelectionRange(pos, pos);
    }
  });

  view.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (f.id === 'form-obs') {
      AG.salvarObs(rota().param, f.obs.value.trim());
      AG.toast('Observação salva.');
    }
  });

  navegar();
})();
