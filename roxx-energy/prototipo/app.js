/* Roxx Energy — protótipo navegável
   Um roteador simples por hash, estado em memória e telas renderizadas como string. */
(function () {
  'use strict';

  var D = window.RX_DATA;
  var view = document.getElementById('view');
  var nav = document.getElementById('nav');
  var app = document.getElementById('app');
  var toasts = document.getElementById('toasts');
  var modal = document.getElementById('modal');

  // ---------- Estado ----------
  var state = {
    onbStep: 0,
    vehicle: null,
    filtros: { livres: false, rapida: false, tipos: [] },
    busca: '',
    selecionada: null,
    reservaForm: { ponto: null, horario: '19:00' },
    reserva: null,
    sessao: null,
    pagamento: { metodo: 'pix', pixAberto: false, processando: false },
    recibo: null,
    historico: D.historico.slice()
  };

  var timer = null;
  var proximoRecibo = 10452;

  function salvarVeiculo() {
    try {
      sessionStorage.setItem('rx-veiculo', JSON.stringify(state.vehicle));
    } catch (e) {
      /* sem armazenamento: segue só em memória */
    }
  }

  function carregarVeiculo() {
    try {
      var v = sessionStorage.getItem('rx-veiculo');
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  }

  function veiculoPadrao() {
    var v = D.veiculos[0];
    return { id: v.id, modelo: v.modelo, apelido: '', bateria: v.bateria, conectores: v.conectores.slice() };
  }

  function veiculo() {
    if (!state.vehicle) state.vehicle = carregarVeiculo() || veiculoPadrao();
    return state.vehicle;
  }

  // ---------- Utilidades ----------
  function brl(n) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function num(n, casas) {
    return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  }

  function km(n) {
    return num(n, 1) + ' km';
  }

  function ic(nome, extra) {
    return '<i data-lucide="' + nome + '" aria-hidden="true"' + (extra || '') + '></i>';
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function nomeConector(tipo) {
    return D.conectores[tipo].nome;
  }

  function estacao(id) {
    for (var i = 0; i < D.estacoes.length; i++) if (D.estacoes[i].id === id) return D.estacoes[i];
    return null;
  }

  function somaMinutos(hhmm, min) {
    var p = hhmm.split(':');
    var t = parseInt(p[0], 10) * 60 + parseInt(p[1], 10) + min;
    return String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
  }

  function diferencaMin(de, ate) {
    var a = de.split(':'),
      b = ate.split(':');
    return parseInt(b[0], 10) * 60 + parseInt(b[1], 10) - (parseInt(a[0], 10) * 60 + parseInt(a[1], 10));
  }

  function duracao(min) {
    min = Math.max(0, Math.round(min));
    if (min < 60) return min + ' min';
    return Math.floor(min / 60) + ' h ' + String(min % 60).padStart(2, '0') + ' min';
  }

  // Situação da estação para o carro cadastrado
  function resumo(st) {
    var v = veiculo();
    var compat = st.pontos.filter(function (p) {
      return v.conectores.indexOf(p.tipo) !== -1;
    });
    var livres = compat.filter(function (p) {
      return p.status === 'livre';
    });
    var ocupados = compat.filter(function (p) {
      return p.status === 'ocupado';
    });
    var status = 'incompativel';
    if (compat.length) status = livres.length ? 'livre' : ocupados.length ? 'ocupado' : 'fora';
    var potMax = Math.max.apply(null, st.pontos.map(function (p) { return p.potencia; }));
    var precoMin = Math.min.apply(null, (compat.length ? compat : st.pontos).map(function (p) { return p.preco; }));
    return { compat: compat, livres: livres, status: status, potMax: potMax, precoMin: precoMin };
  }

  var STATUS_TXT = {
    livre: 'Livre',
    ocupado: 'Ocupado',
    fora: 'Fora de serviço',
    incompativel: 'Incompatível'
  };

  function badgeStatus(status) {
    var cls = { livre: 'free', ocupado: 'busy', fora: 'off', incompativel: 'off' }[status];
    return '<span class="rx-status rx-status--' + cls + '">' + STATUS_TXT[status] + '</span>';
  }

  function textoDisponibilidade(st, r) {
    if (r.status === 'incompativel') return 'Nenhum conector serve no seu carro';
    if (r.status === 'fora') return 'Conectores compatíveis fora de serviço';
    return r.livres.length + ' de ' + r.compat.length + ' compatíveis livres';
  }

  function estrelas(nota) {
    var html = '<span class="stars" aria-hidden="true">';
    for (var i = 1; i <= 5; i++) html += ic('star', i <= Math.round(nota) ? ' fill="currentColor"' : ' class="off" fill="currentColor"');
    return html + '</span>';
  }

  // ---------- Toast ----------
  function toast(msg, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'rx-toast' + (opts.erro ? ' rx-toast--error' : '');
    el.innerHTML =
      '<span class="rx-toast__icon">' + ic(opts.erro ? 'alert-circle' : 'check-circle-2') + '</span><span>' + esc(msg) + '</span>' +
      (opts.acao ? '<button type="button" class="rx-toast__action">' + esc(opts.acao) + '</button>' : '');
    if (opts.acao) {
      el.querySelector('button').addEventListener('click', function () {
        el.remove();
        opts.onAcao();
      });
    }
    toasts.appendChild(el);
    icones();
    setTimeout(function () {
      el.remove();
    }, opts.acao ? 6000 : 3500);
  }

  // ---------- Modal ----------
  function confirmar(o) {
    modal.innerHTML =
      '<div class="rx-modal__body">' +
      '<div class="rx-modal__icon">' + ic(o.icone || 'alert-triangle') + '</div>' +
      '<h2 class="rx-modal__title" id="modal-title">' + esc(o.titulo) + '</h2>' +
      '<p class="rx-modal__text" id="modal-text">' + esc(o.texto) + '</p>' +
      '<div class="rx-modal__actions">' +
      '<button type="button" class="rx-btn rx-btn--danger rx-btn--block" data-modal="ok">' + esc(o.confirmar) + '</button>' +
      '<button type="button" class="rx-btn rx-btn--secondary rx-btn--block" data-modal="cancel">' + esc(o.cancelar || 'Voltar') + '</button>' +
      '</div></div>';
    icones();
    modal.querySelector('[data-modal="ok"]').onclick = function () {
      modal.close();
      o.onConfirmar();
    };
    modal.querySelector('[data-modal="cancel"]').onclick = function () {
      modal.close();
    };
    modal.showModal();
    modal.querySelector('[data-modal="cancel"]').focus();
  }

  modal.addEventListener('click', function (e) {
    if (e.target === modal) modal.close();
  });

  function icones() {
    if (window.lucide) window.lucide.createIcons();
  }

  // ---------- Navegação inferior ----------
  function renderNav(atual) {
    var mostrar = ['mapa', 'recarga', 'historico', 'perfil'].indexOf(atual) !== -1;
    app.classList.toggle('nav-hidden', !mostrar);
    if (!mostrar) {
      nav.innerHTML = '';
      return;
    }
    var itens = [
      ['mapa', 'map', 'Mapa'],
      ['recarga', 'battery-charging', 'Recarga'],
      ['historico', 'receipt', 'Histórico'],
      ['perfil', 'car', 'Veículo']
    ];
    var ativa = state.sessao && state.sessao.status !== 'concluida';
    nav.innerHTML =
      '<div class="rx-navbar">' +
      itens
        .map(function (it) {
          return (
            '<a class="rx-navbar__item" href="#' + it[0] + '"' + (it[0] === atual ? ' aria-current="page"' : '') + '>' +
            ic(it[1]) + it[2] +
            (it[0] === 'recarga' && ativa ? '<span class="rx-navbar__dot"></span><span class="sr-only"> (em andamento)</span>' : '') +
            '</a>'
          );
        })
        .join('') +
      '</div>';
  }

  // ---------- Telas ----------
  var ONB = [
    {
      titulo: 'Saiba antes de sair de casa',
      texto: 'Veja em tempo real se o carregador está livre, ocupado ou fora de serviço.',
      icone: 'map-pin',
      badges: ['<span class="rx-status rx-status--free b1">Livre</span>', '<span class="rx-status rx-status--busy b2">Ocupado</span>', '<span class="rx-status rx-status--off b3">Fora de serviço</span>']
    },
    {
      titulo: 'Só o que encaixa no seu carro',
      texto: 'Você cadastra o carro uma vez e o mapa já mostra os conectores compatíveis.',
      icone: 'plug-zap',
      badges: ['<span class="rx-status rx-status--free b1">CCS2</span>', '<span class="rx-status rx-status--free b2">Tipo 2</span>', '<span class="rx-status rx-status--off b3">CHAdeMO</span>']
    },
    {
      titulo: 'Reserve, carregue e pague',
      texto: 'Segure o conector com 15 minutos de tolerância e pague com Pix ou cartão no fim.',
      icone: 'calendar-check',
      badges: ['<span class="rx-status rx-status--info b1">Reserva 15 min</span>', '<span class="rx-status rx-status--free b2">Pix</span>', '<span class="rx-status rx-status--free b3">Recibo no app</span>']
    }
  ];

  function telaOnboarding() {
    var p = ONB[state.onbStep];
    var ultimo = state.onbStep === ONB.length - 1;
    var dots = ONB.map(function (_, i) {
      return '<span class="' + (i === state.onbStep ? 'is-on' : '') + '"></span>';
    }).join('');
    return (
      '<section class="onb" aria-roledescription="introdução">' +
      '<div class="onb__top"><span class="logo">' + ic('zap') + 'ROXX</span>' +
      (ultimo ? '' : '<button type="button" class="rx-btn rx-btn--ghost" data-action="onb-pular">Pular</button>') +
      '</div>' +
      '<div class="onb__art" aria-hidden="true"><div class="onb-art"><div class="onb-art__ring">' + ic(p.icone) + '</div>' + p.badges.join('') + '</div></div>' +
      '<p class="eyebrow">Passo ' + (state.onbStep + 1) + ' de ' + ONB.length + '</p>' +
      '<h1 tabindex="-1" data-focus>' + p.titulo + '</h1>' +
      '<p>' + p.texto + '</p>' +
      '<div class="dots" aria-hidden="true">' + dots + '</div>' +
      '<div class="row">' +
      (state.onbStep > 0 ? '<button type="button" class="rx-btn rx-btn--secondary rx-btn--lg" data-action="onb-voltar" aria-label="Passo anterior">' + ic('arrow-left') + '</button>' : '') +
      '<button type="button" class="rx-btn rx-btn--primary rx-btn--lg" style="flex:1" data-action="onb-proximo">' +
      (ultimo ? 'Cadastrar meu carro' : 'Próximo') + '</button></div>' +
      '</section>'
    );
  }

  function telaVeiculo() {
    var v = state.vehicle || carregarVeiculo();
    var primeiraVez = !v;
    var sel = v ? v.id : '';
    var opts = D.veiculos
      .map(function (m) {
        return '<option value="' + m.id + '"' + (m.id === sel ? ' selected' : '') + '>' + m.modelo + '</option>';
      })
      .join('');
    var conectores = v ? v.conectores : [];
    var outro = sel === 'outro';
    return (
      '<section class="screen">' +
      '<div class="topbar">' +
      (primeiraVez ? '' : '<a class="rx-icon-btn" href="#perfil" aria-label="Voltar">' + ic('arrow-left') + '</a>') +
      '<div><h1 tabindex="-1" data-focus>Seu carro</h1></div></div>' +
      '<p class="muted">Com o modelo e o conector, o mapa mostra só os carregadores que funcionam no seu carro.</p>' +
      '<form id="form-veiculo" class="stack" novalidate>' +
      '<div class="rx-field">' +
      '<label class="rx-label" for="modelo">Modelo</label>' +
      '<select class="rx-select" id="modelo" name="modelo" aria-describedby="modelo-erro" required>' +
      '<option value=""' + (sel ? '' : ' selected') + ' disabled>Escolha o modelo</option>' + opts +
      '<option value="outro"' + (outro ? ' selected' : '') + '>Outro modelo</option>' +
      '</select>' +
      '<p class="rx-error-msg" id="modelo-erro" hidden>' + ic('alert-circle') + 'Escolha o modelo do carro.</p>' +
      '</div>' +
      '<div class="rx-field" id="campo-bateria"' + (outro ? '' : ' hidden') + '>' +
      '<label class="rx-label" for="bateria">Capacidade da bateria (kWh)</label>' +
      '<input class="rx-input" id="bateria" name="bateria" inputmode="decimal" placeholder="Ex.: 44,9" aria-describedby="bateria-dica bateria-erro" value="' + (outro && v ? num(v.bateria, 1) : '') + '">' +
      '<p class="rx-hint" id="bateria-dica">Está no manual ou no painel do carro.</p>' +
      '<p class="rx-error-msg" id="bateria-erro" hidden>' + ic('alert-circle') + 'Informe um número entre 10 e 150.</p>' +
      '</div>' +
      '<fieldset class="chip-group" id="grupo-conectores" aria-describedby="conectores-dica conectores-erro">' +
      '<legend class="rx-label">Conectores que o carro aceita</legend>' +
      ['CCS2', 'T2', 'CHADEMO']
        .map(function (t) {
          return (
            '<label class="rx-chip"><input class="sr-only" type="checkbox" name="conector" value="' + t + '"' +
            (conectores.indexOf(t) !== -1 ? ' checked' : '') + '>' + nomeConector(t) +
            ' <span class="muted small">' + D.conectores[t].corrente + '</span></label>'
          );
        })
        .join('') +
      '</fieldset>' +
      '<p class="rx-hint" id="conectores-dica">Preenchemos pelo modelo. Mude se o seu carro tiver adaptador.</p>' +
      '<p class="rx-error-msg" id="conectores-erro" hidden>' + ic('alert-circle') + 'Marque pelo menos um conector.</p>' +
      '<div class="rx-field">' +
      '<label class="rx-label" for="apelido">Apelido <span class="muted">(opcional)</span></label>' +
      '<input class="rx-input" id="apelido" name="apelido" maxlength="20" placeholder="Ex.: Carro do trabalho" value="' + esc(v && v.apelido ? v.apelido : '') + '">' +
      '</div>' +
      '<div id="info-bateria">' + infoBateria(sel) + '</div>' +
      '<button type="submit" class="rx-btn rx-btn--primary rx-btn--lg rx-btn--block">' + (primeiraVez ? 'Salvar e ver o mapa' : 'Salvar alterações') + '</button>' +
      '</form></section>'
    );
  }

  function infoBateria(id) {
    var m = D.veiculos.filter(function (x) {
      return x.id === id;
    })[0];
    if (!m) return '';
    return '<div class="info-box">' + ic('battery-medium') + '<span>Bateria de ' + num(m.bateria, 1) + ' kWh (valor aproximado do modelo). Usamos para estimar tempo e custo.</span></div>';
  }

  function chip(acao, valor, rotulo, ligado) {
    return '<button type="button" class="rx-chip" data-action="' + acao + '" data-valor="' + valor + '" aria-pressed="' + (ligado ? 'true' : 'false') + '">' + rotulo + '</button>';
  }

  function filtrarEstacoes() {
    var f = state.filtros;
    var busca = state.busca.trim().toLowerCase();
    return D.estacoes
      .filter(function (st) {
        if (busca && (st.nome + ' ' + st.endereco).toLowerCase().indexOf(busca) === -1) return false;
        var pts = st.pontos.filter(function (p) {
          return !f.tipos.length || f.tipos.indexOf(p.tipo) !== -1;
        });
        if (f.rapida) pts = pts.filter(function (p) { return p.potencia >= 50; });
        if (f.livres) pts = pts.filter(function (p) { return p.status === 'livre'; });
        return pts.length > 0;
      })
      .sort(function (a, b) {
        return a.distancia - b.distancia;
      });
  }

  function mapaSVG() {
    return (
      '<svg viewBox="0 0 360 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' +
      '<rect width="360" height="300" fill="#0f1714"/>' +
      '<g stroke="#18231f" stroke-width="1">' +
      [30, 60, 90, 120, 150, 180, 210, 240, 270].map(function (y) { return '<line x1="0" y1="' + y + '" x2="360" y2="' + y + '"/>'; }).join('') +
      [40, 80, 120, 160, 200, 240, 280, 320].map(function (x) { return '<line x1="' + x + '" y1="0" x2="' + x + '" y2="300"/>'; }).join('') +
      '</g>' +
      // Lago Paranoá
      '<path d="M300 0 C 262 40, 250 80, 268 120 C 286 160, 250 205, 262 240 C 272 270, 300 290, 296 300 L360 300 L360 0 Z" fill="#0f2a33"/>' +
      '<path d="M300 0 C 262 40, 250 80, 268 120 C 286 160, 250 205, 262 240 C 272 270, 300 290, 296 300" fill="none" stroke="#17414d" stroke-width="2"/>' +
      // Eixo Rodoviário (asas) e Eixo Monumental
      '<path d="M150 8 C 230 70, 232 230, 150 292" fill="none" stroke="#2c3b36" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M150 8 C 230 70, 232 230, 150 292" fill="none" stroke="#3c4f49" stroke-width="1.5" stroke-dasharray="6 6"/>' +
      '<path d="M30 168 L 300 138" stroke="#2c3b36" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M60 70 C 120 110, 160 120, 210 120" fill="none" stroke="#22302b" stroke-width="4"/>' +
      '<path d="M50 240 C 110 205, 170 200, 220 190" fill="none" stroke="#22302b" stroke-width="4"/>' +
      '<path d="M0 262 C 60 250, 120 245, 200 232" fill="none" stroke="#22302b" stroke-width="4"/>' +
      // Ponte JK
      '<path d="M262 228 C 285 222, 300 236, 330 230" fill="none" stroke="#3c4f49" stroke-width="4" stroke-linecap="round"/>' +
      '<text x="318" y="70" fill="#2f6474" font-size="10" font-family="Inter, sans-serif" text-anchor="middle">Lago</text>' +
      '<text x="318" y="82" fill="#2f6474" font-size="10" font-family="Inter, sans-serif" text-anchor="middle">Paranoá</text>' +
      '</svg>'
    );
  }

  function telaMapa() {
    var v = veiculo();
    var lista = filtrarEstacoes();
    var f = state.filtros;
    var sel = state.selecionada ? estacao(state.selecionada) : null;
    if (sel && lista.indexOf(sel) === -1) sel = null;

    var pins = lista
      .map(function (st) {
        var r = resumo(st);
        var label = st.nome + ', ' + STATUS_TXT[r.status].toLowerCase() + ', ' + textoDisponibilidade(st, r).toLowerCase() + ', até ' + r.potMax + ' kW';
        return (
          '<button type="button" class="pin pin--' + r.status + '" style="left:' + st.mapa.x + '%;top:' + st.mapa.y + '%"' +
          ' data-action="pin" data-id="' + st.id + '" aria-pressed="' + (sel === st) + '" aria-label="' + esc(label) + '">' +
          ic('zap') + r.potMax + '</button>'
        );
      })
      .join('');

    var preview = '';
    if (sel) {
      var rs = resumo(sel);
      preview =
        '<div class="map__preview">' +
        '<div style="flex:1"><strong>' + sel.nome + '</strong><span class="small muted">' + km(sel.distancia) + ' · ' + textoDisponibilidade(sel, rs) + '</span></div>' +
        '<a class="rx-btn rx-btn--primary" href="#estacao/' + sel.id + '">Ver estação</a></div>';
    }

    var cards = lista.length
      ? '<ul class="station-list">' +
        lista
          .map(function (st) {
            var r = resumo(st);
            return (
              '<li><a class="rx-card rx-card--interactive station-card' + (sel === st ? ' rx-card--selected' : '') + '" href="#estacao/' + st.id + '">' +
              '<div><div class="station-card__name">' + st.nome + '</div>' + badgeStatus(r.status) + '</div>' +
              '<div class="station-card__price">' + brl(r.precoMin) + '<small>por kWh</small></div>' +
              '<div class="station-card__meta">' +
              '<span>' + ic('navigation') + km(st.distancia) + '</span>' +
              '<span>' + ic('plug') + textoDisponibilidade(st, r) + '</span>' +
              '<span>' + ic('gauge') + 'até ' + r.potMax + ' kW</span>' +
              '</div></a></li>'
            );
          })
          .join('') +
        '</ul>'
      : '<div class="empty"><div class="empty__icon">' + ic('search-x') + '</div><h2>Nenhuma estação com esses filtros</h2>' +
        '<p class="muted small">Tente tirar o filtro de disponibilidade ou de potência.</p>' +
        '<button type="button" class="rx-btn rx-btn--secondary" data-action="limpar-filtros">Limpar filtros</button></div>';

    return (
      '<section class="screen screen--flush">' +
      '<div class="map-head">' +
      '<div class="row row--between"><div><h1 tabindex="-1" data-focus style="font-size:var(--rx-fs-xl)">Estações perto de você</h1>' +
      '<p class="small muted">Brasília · ' + (v.apelido ? esc(v.apelido) + ' · ' : '') + v.modelo + '</p></div>' +
      '<a class="rx-icon-btn" href="#perfil" aria-label="Trocar veículo">' + ic('car') + '</a></div>' +
      '<form class="search" role="search" data-form="busca"><label class="sr-only" for="busca">Buscar estação ou endereço</label>' +
      ic('search') + '<input class="rx-input" id="busca" type="search" placeholder="Buscar estação ou endereço" value="' + esc(state.busca) + '" autocomplete="off"></form>' +
      '<div class="chips-scroll" role="group" aria-label="Filtros">' +
      chip('filtro', 'livres', ic('circle-check') + 'Só livres', f.livres) +
      chip('filtro', 'rapida', ic('gauge') + '50 kW ou mais', f.rapida) +
      chip('tipo', 'CCS2', 'CCS2', f.tipos.indexOf('CCS2') !== -1) +
      chip('tipo', 'T2', 'Tipo 2', f.tipos.indexOf('T2') !== -1) +
      chip('tipo', 'CHADEMO', 'CHAdeMO', f.tipos.indexOf('CHADEMO') !== -1) +
      '</div></div>' +
      '<div class="map">' + mapaSVG() + '<span class="map__me" style="left:46%;top:44%" title="Você está aqui"></span>' + pins + '</div>' +
      '<div class="legend" aria-label="Legenda do mapa"><span><i style="background:var(--rx-free)"></i>Livre</span><span><i style="background:var(--rx-busy)"></i>Ocupado</span><span><i style="background:var(--rx-surface-3);border:1px solid var(--rx-line-strong)"></i>Fora de serviço ou incompatível</span><span><i style="background:var(--rx-info)"></i>Você</span></div>' +
      preview +
      '<div class="list-head"><h2>Lista</h2><p class="small muted" aria-live="polite">' + lista.length + (lista.length === 1 ? ' estação' : ' estações') + '</p></div>' +
      cards +
      '</section>'
    );
  }

  function telaEstacao(id) {
    var st = estacao(id);
    if (!st) return telaNaoEncontrada();
    var v = veiculo();
    var r = resumo(st);
    var compatTxt;
    if (r.status === 'incompativel') {
      compatTxt = '<div class="info-box info-box--warn">' + ic('alert-triangle') + '<span>Nenhum conector daqui serve no seu ' + v.modelo + '.</span></div>';
    } else {
      compatTxt = '<div class="info-box info-box--ok">' + ic('check-circle-2') + '<span>Compatível com seu ' + v.modelo + ' (' + v.conectores.map(nomeConector).join(', ') + ').</span></div>';
    }

    var conectores = st.pontos
      .map(function (p) {
        var ok = v.conectores.indexOf(p.tipo) !== -1;
        var stt = p.status === 'livre' ? 'livre' : p.status === 'ocupado' ? 'ocupado' : 'fora';
        return (
          '<li class="rx-card connector' + (ok ? '' : ' connector--incompat') + '">' +
          '<span class="connector__icon">' + ic(D.conectores[p.tipo].corrente === 'DC' ? 'zap' : 'plug') + '</span>' +
          '<div><div class="connector__name">' + p.id + ' · ' + nomeConector(p.tipo) + '</div>' +
          '<div class="connector__sub">' + D.conectores[p.tipo].corrente + ' ' + p.potencia + ' kW · ' + brl(p.preco) + '/kWh' + (ok ? '' : ' · não serve no seu carro') + '</div></div>' +
          badgeStatus(stt) + '</li>'
        );
      })
      .join('');

    var podeReservar = r.livres.length > 0;
    var ICONES = { Banheiro: 'bath', 'Café': 'coffee', Coberto: 'umbrella', 'Segurança': 'shield-check', Mercado: 'shopping-cart', 'Wi-Fi': 'wifi' };

    return (
      '<section class="screen screen--flush">' +
      '<div class="hero-station"><a class="rx-icon-btn" href="#mapa" aria-label="Voltar para o mapa">' + ic('arrow-left') + '</a>' +
      '<span class="hero-station__icon" aria-hidden="true">' + ic('zap') + '</span></div>' +
      '<div class="station-head">' +
      '<h1 tabindex="-1" data-focus>' + st.nome + '</h1>' +
      '<p class="small muted">' + st.endereco + ' · ' + km(st.distancia) + '</p>' +
      '<div class="row" style="flex-wrap:wrap">' + badgeStatus(r.status) + '<span class="small muted">' + textoDisponibilidade(st, r) + ' · atualizado há ' + st.atualizado + ' min</span></div>' +
      '<p class="small muted">' + ic('clock', ' style="width:14px;height:14px;display:inline;vertical-align:-2px"') + ' ' + st.horario + '</p>' +
      compatTxt +
      '</div>' +
      '<div class="section"><h2>Conectores</h2><ul class="list-plain">' + conectores + '</ul></div>' +
      '<div class="section"><h2>No local</h2><ul class="amenities">' +
      st.comodidades.map(function (c) { return '<li>' + ic(ICONES[c] || 'circle') + c + '</li>'; }).join('') +
      '</ul></div>' +
      '<div class="section"><h2>Avaliações</h2>' +
      '<div class="rating"><span class="rating__value">' + num(st.nota, 1) + '</span><div>' + estrelas(st.nota) +
      '<p class="small muted">' + st.totalAvaliacoes + ' avaliações</p></div></div>' +
      '<div class="rx-card stack">' +
      st.avaliacoes
        .map(function (a) {
          return '<div class="review"><div class="row row--between"><strong class="small">' + a.autor + '</strong><span class="small muted">' + a.quando + '</span></div>' +
            '<span class="sr-only">Nota ' + a.nota + ' de 5</span>' + estrelas(a.nota) + '<p>' + a.texto + '</p></div>';
        })
        .join('') +
      '</div>' +
      '<button type="button" class="rx-btn rx-btn--ghost" data-action="reportar">' + ic('flag') + 'Reportar problema no carregador</button>' +
      '</div>' +
      '<div class="screen" style="min-height:0;padding-top:0">' +
      (podeReservar ? '' : '<p class="small muted" id="motivo-reserva">Sem conector compatível livre agora. Tente outra estação ou volte mais tarde.</p>') +
      '<div class="sticky-actions">' +
      '<button type="button" class="rx-btn rx-btn--secondary rx-btn--lg" data-action="rota" data-id="' + st.id + '">' + ic('navigation') + 'Como chegar</button>' +
      (podeReservar
        ? '<a class="rx-btn rx-btn--primary rx-btn--lg" href="#reserva/' + st.id + '">' + ic('calendar-check') + 'Reservar</a>'
        : '<button type="button" class="rx-btn rx-btn--primary rx-btn--lg" disabled aria-describedby="motivo-reserva">Reservar</button>') +
      '</div></div>' +
      '</section>'
    );
  }

  function telaReserva(id) {
    var st = estacao(id);
    if (!st) return telaNaoEncontrada();
    if (state.reserva && state.reserva.estacaoId === id) return telaReservaConfirmada();
    var v = veiculo();
    var r = resumo(st);
    var form = state.reservaForm;
    if (form.estacaoId !== id) {
      form.estacaoId = id;
      form.ponto = r.livres.length ? r.livres[0].id : null;
      form.horario = '19:00';
    }
    var pontoSel = st.pontos.filter(function (p) { return p.id === form.ponto; })[0];
    var ate = somaMinutos(form.horario, D.reserva.tolerancia);

    var opcoes = r.compat
      .map(function (p) {
        var livre = p.status === 'livre';
        return (
          '<label class="rx-card option-card">' +
          '<input type="radio" name="ponto" value="' + p.id + '"' + (form.ponto === p.id ? ' checked' : '') + (livre ? '' : ' disabled') + '>' +
          '<span><strong>' + p.id + ' · ' + nomeConector(p.tipo) + '</strong><br><span class="small muted">' + p.potencia + ' kW · ' + brl(p.preco) + '/kWh</span></span>' +
          badgeStatus(livre ? 'livre' : p.status === 'ocupado' ? 'ocupado' : 'fora') +
          '</label>'
        );
      })
      .join('');

    var slots = D.reserva.horarios
      .map(function (h) {
        return '<label class="rx-chip"><input class="sr-only" type="radio" name="horario" value="' + h + '"' + (form.horario === h ? ' checked' : '') + '>' + h + '</label>';
      })
      .join('');

    return (
      '<section class="screen">' +
      '<div class="topbar"><a class="rx-icon-btn" href="#estacao/' + id + '" aria-label="Voltar para a estação">' + ic('arrow-left') + '</a>' +
      '<div><h1 tabindex="-1" data-focus>Reservar</h1><p class="topbar__sub">' + st.nome + '</p></div></div>' +
      '<form id="form-reserva" class="stack" novalidate>' +
      '<fieldset class="stack" style="border:0;padding:0;margin:0" aria-describedby="ponto-erro">' +
      '<legend class="rx-label" style="margin-bottom:8px">Conector compatível com seu ' + v.modelo + '</legend>' + opcoes + '</fieldset>' +
      '<p class="rx-error-msg" id="ponto-erro" hidden>' + ic('alert-circle') + 'Escolha um conector livre.</p>' +
      '<fieldset style="border:0;padding:0;margin:0"><legend class="rx-label" style="margin-bottom:8px">Que horas você chega?</legend>' +
      '<div class="slots">' + slots + '</div></fieldset>' +
      '<div class="info-box">' + ic('timer') + '<span id="texto-tolerancia">Tolerância de ' + D.reserva.tolerancia + ' min: seguramos o ' + (pontoSel ? pontoSel.id : 'conector') + ' até <strong>' + ate + '</strong>. Depois disso a reserva cai e o conector volta a ficar livre.</span></div>' +
      '<div class="rx-card"><dl class="summary">' +
      '<div><dt>Taxa de reserva</dt><dd>' + brl(D.reserva.taxa) + '</dd></div>' +
      '<div><dt>Na hora de pagar</dt><dd>' + brl(D.reserva.taxa) + ' abatidos da recarga</dd></div>' +
      '<div><dt>Cancelamento</dt><dd>Grátis até ' + form.horario + '</dd></div>' +
      '</dl></div>' +
      '<div class="sticky-actions"><button type="submit" class="rx-btn rx-btn--primary rx-btn--lg">Confirmar reserva · ' + brl(D.reserva.taxa) + '</button></div>' +
      '</form></section>'
    );
  }

  function telaReservaConfirmada() {
    var rv = state.reserva;
    var st = estacao(rv.estacaoId);
    var p = st.pontos.filter(function (x) { return x.id === rv.ponto; })[0];
    var faltam = diferencaMin(D.agora.hora, rv.horario);
    return (
      '<section class="screen">' +
      '<div class="success-head"><div class="success-head__icon">' + ic('calendar-check') + '</div>' +
      '<h1 tabindex="-1" data-focus>Reserva confirmada</h1>' +
      '<p class="muted">O conector ' + p.id + ' fica separado pra você.</p>' +
      '<p class="countdown">' + rv.horario + '</p><p class="small muted">chegada prevista · faltam ' + duracao(faltam) + '</p></div>' +
      '<div class="rx-card"><dl class="summary">' +
      '<div><dt>Estação</dt><dd>' + st.nome + '</dd></div>' +
      '<div><dt>Conector</dt><dd>' + p.id + ' · ' + nomeConector(p.tipo) + ' ' + p.potencia + ' kW</dd></div>' +
      '<div><dt>Preço</dt><dd>' + brl(p.preco) + '/kWh</dd></div>' +
      '<div><dt>Seguramos até</dt><dd>' + rv.ate + '</dd></div>' +
      '<div><dt>Taxa paga</dt><dd>' + brl(D.reserva.taxa) + ' (abatida no fim)</dd></div>' +
      '</dl></div>' +
      '<div class="stack" style="margin-top:auto">' +
      '<button type="button" class="rx-btn rx-btn--primary rx-btn--lg rx-btn--block" data-action="iniciar">' + ic('plug-zap') + 'Cheguei, iniciar recarga</button>' +
      '<div class="row"><button type="button" class="rx-btn rx-btn--secondary" style="flex:1" data-action="rota" data-id="' + st.id + '">' + ic('navigation') + 'Como chegar</button>' +
      '<button type="button" class="rx-btn rx-btn--danger" style="flex:1" data-action="cancelar-reserva">Cancelar reserva</button></div>' +
      '<a class="rx-btn rx-btn--ghost" href="#mapa">Voltar ao mapa</a>' +
      '</div></section>'
    );
  }

  // ---------- Recarga ----------
  function novaSessao(estacaoId, pontoId, credito) {
    var st = estacao(estacaoId);
    var p = st.pontos.filter(function (x) { return x.id === pontoId; })[0];
    var v = veiculo();
    var dc = D.conectores[p.tipo].corrente === 'DC';
    var kw = dc ? Math.round(Math.min(p.potencia, 60) * 0.9) : Math.min(p.potencia, 7);
    return {
      estacaoId: estacaoId,
      pontoId: pontoId,
      tipo: p.tipo,
      preco: p.preco,
      kw: kw,
      bateria: v.bateria,
      inicio: 23,
      pct: 23,
      meta: 80,
      kwh: 0,
      minutos: 0,
      credito: credito,
      status: 'conectando',
      inicioHora: D.agora.hora,
      ultimoAviso: 20
    };
  }

  function sessaoDemoConcluida() {
    var s = novaSessao('cln204', 'A1', D.reserva.taxa);
    s.pct = 80;
    s.kwh = ((s.meta - s.inicio) / 100) * s.bateria;
    s.minutos = Math.round((s.kwh / s.kw) * 60);
    s.status = 'concluida';
    return s;
  }

  function minutosRestantes(s) {
    var kwhFalta = ((s.meta - s.pct) / 100) * s.bateria;
    return (kwhFalta / s.kw) * 60;
  }

  function passo(s) {
    // Demo acelerada: a recarga inteira leva cerca de 30 segundos
    var total = ((s.meta - s.inicio) / 100) * s.bateria / s.kw * 60;
    return Math.max(1, Math.round(total / 30));
  }

  function iniciarTimer() {
    pararTimer();
    timer = setInterval(function () {
      var s = state.sessao;
      if (!s || s.status !== 'carregando') return pararTimer();
      var m = passo(s);
      s.minutos += m;
      s.kwh += (s.kw * m) / 60;
      s.pct = s.inicio + (s.kwh / s.bateria) * 100;
      if (s.pct >= s.meta) {
        s.pct = s.meta;
        s.kwh = ((s.meta - s.inicio) / 100) * s.bateria;
        s.status = 'concluida';
        pararTimer();
        toast('Recarga concluída. Já pode tirar o cabo.');
        if (rotaAtual().nome === 'recarga') render();
        else renderNav(rotaAtual().nome);
        return;
      }
      if (rotaAtual().nome === 'recarga') atualizarRecarga();
    }, 1000);
  }

  function pararTimer() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function anelOffset(pct) {
    var c = 2 * Math.PI * 100;
    return c - (pct / 100) * c;
  }

  function atualizarRecarga() {
    var s = state.sessao;
    var set = function (id, txt) {
      var el = document.getElementById(id);
      if (el) el.textContent = txt;
    };
    set('r-pct', Math.floor(s.pct) + '%');
    set('r-kwh', num(s.kwh, 1) + ' kWh');
    set('r-tempo', duracao(minutosRestantes(s)));
    set('r-custo', brl(s.kwh * s.preco));
    set('r-decorrido', duracao(s.minutos));
    var bar = document.getElementById('r-anel');
    if (bar) bar.setAttribute('stroke-dashoffset', anelOffset(s.pct));
    var meter = document.getElementById('r-meter');
    if (meter) {
      meter.setAttribute('aria-valuenow', Math.floor(s.pct));
      meter.setAttribute('aria-valuetext', Math.floor(s.pct) + '% de bateria');
    }
    // Avisa leitores de tela a cada 10%, não a cada segundo
    var marco = Math.floor(s.pct / 10) * 10;
    if (marco > s.ultimoAviso) {
      s.ultimoAviso = marco;
      set('r-anuncio', 'Bateria em ' + marco + '%');
    }
  }

  function telaRecarga() {
    var s = state.sessao;
    if (!s) {
      if (state.reserva) {
        var stR = estacao(state.reserva.estacaoId);
        return (
          '<section class="screen"><div class="topbar"><h1 tabindex="-1" data-focus>Recarga</h1></div>' +
          '<div class="rx-card stack"><p class="eyebrow">Reserva ativa</p><strong>' + stR.nome + '</strong>' +
          '<p class="small muted">Conector ' + state.reserva.ponto + ' · chegada ' + state.reserva.horario + ' · seguramos até ' + state.reserva.ate + '</p>' +
          '<button type="button" class="rx-btn rx-btn--primary rx-btn--block" data-action="iniciar">' + ic('plug-zap') + 'Cheguei, iniciar recarga</button>' +
          '<a class="rx-btn rx-btn--ghost" href="#reserva/' + stR.id + '">Ver reserva</a></div></section>'
        );
      }
      return (
        '<section class="screen"><div class="topbar"><h1 tabindex="-1" data-focus>Recarga</h1></div>' +
        '<div class="empty"><div class="empty__icon">' + ic('battery-charging') + '</div>' +
        '<h2>Nenhuma recarga em andamento</h2><p class="muted small">Ache uma estação livre no mapa, reserve e comece por aqui.</p>' +
        '<a class="rx-btn rx-btn--primary" href="#mapa">' + ic('map') + 'Encontrar estação</a></div></section>'
      );
    }

    var st = estacao(s.estacaoId);
    var cab = '<div class="topbar"><div><h1 tabindex="-1" data-focus>Recarga</h1><p class="topbar__sub">' + st.nome + ' · ' + s.pontoId + ' ' + nomeConector(s.tipo) + '</p></div></div>';

    if (s.status === 'conectando') {
      return (
        '<section class="screen">' + cab +
        '<div class="rx-card stack"><h2 style="font-size:var(--rx-fs-xl)">Conecte o cabo</h2>' +
        '<ol class="steps-list"><li>Estacione na vaga do conector ' + s.pontoId + '.</li><li>Tire o cabo do carregador e encaixe no carro até ouvir o clique.</li><li>Toque no botão abaixo. A gente libera a energia em seguida.</li></ol></div>' +
        '<div class="info-box">' + ic('info') + '<span>Demonstração: a recarga é acelerada e dura cerca de 30 segundos.</span></div>' +
        '<div style="margin-top:auto"><button type="button" class="rx-btn rx-btn--primary rx-btn--lg rx-btn--block" data-action="conectado">' + ic('plug-zap') + 'Já conectei, começar</button></div>' +
        '</section>'
      );
    }

    var concluida = s.status === 'concluida';
    var circ = 2 * Math.PI * 100;
    return (
      '<section class="screen">' + cab +
      '<div class="ring" id="r-meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.floor(s.pct) + '" aria-valuetext="' + Math.floor(s.pct) + '% de bateria" aria-label="Bateria">' +
      '<svg viewBox="0 0 230 230" aria-hidden="true"><circle class="ring__track" cx="115" cy="115" r="100" fill="none" stroke-width="14"/>' +
      '<circle class="ring__bar" id="r-anel" cx="115" cy="115" r="100" fill="none" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + circ + '" stroke-dashoffset="' + anelOffset(s.pct) + '"/></svg>' +
      '<div class="ring__center"><span class="ring__pct" id="r-pct">' + Math.floor(s.pct) + '%</span>' +
      '<span class="ring__label">' + (concluida ? ic('check') + 'Concluída' : ic('zap', ' class="pulse"') + s.kw + ' kW agora') + '</span></div></div>' +
      '<p class="sr-only" aria-live="polite" id="r-anuncio"></p>' +
      '<dl class="metrics">' +
      '<div class="metric"><dt>Energia</dt><dd id="r-kwh">' + num(s.kwh, 1) + ' kWh</dd></div>' +
      '<div class="metric"><dt>' + (concluida ? 'Tempo total' : 'Tempo restante') + '</dt><dd id="' + (concluida ? 'r-decorrido' : 'r-tempo') + '">' + duracao(concluida ? s.minutos : minutosRestantes(s)) + '</dd></div>' +
      '<div class="metric"><dt>Custo até agora</dt><dd id="r-custo">' + brl(s.kwh * s.preco) + '</dd></div>' +
      '<div class="metric"><dt>Meta</dt><dd>' + s.meta + '%</dd></div>' +
      '</dl>' +
      (concluida
        ? '<div class="info-box info-box--ok">' + ic('check-circle-2') + '<span>Chegou em ' + s.meta + '%. Tire o cabo e libere a vaga pro próximo motorista.</span></div>' +
          '<div style="margin-top:auto"><a class="rx-btn rx-btn--primary rx-btn--lg rx-btn--block" href="#pagamento">Ir para o pagamento · ' + brl(s.kwh * s.preco - s.credito) + '</a></div>'
        : '<fieldset style="border:0;padding:0;margin:0"><legend class="rx-label" style="margin-bottom:8px">Parar automaticamente em</legend><div class="row">' +
          [80, 90, 100]
            .map(function (m) {
              return '<button type="button" class="rx-chip" data-action="meta" data-valor="' + m + '" aria-pressed="' + (s.meta === m) + '"' + (m <= s.pct ? ' disabled' : '') + '>' + m + '%</button>';
            })
            .join('') +
          '</div></fieldset>' +
          '<div style="margin-top:auto" class="stack"><p class="small muted" style="text-align:center">Preço: ' + brl(s.preco) + '/kWh · ' + brl(s.credito) + ' da reserva abatidos no fim</p>' +
          '<button type="button" class="rx-btn rx-btn--danger rx-btn--lg rx-btn--block" data-action="encerrar">' + ic('square') + 'Encerrar recarga</button></div>') +
      '</section>'
    );
  }

  // ---------- Pagamento e recibo ----------
  function qrSVG() {
    // Padrão decorativo com cara de QR code, gerado de forma determinística
    var n = 25,
      cel = '',
      seed = 7;
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        seed = (seed * 9301 + 49297) % 233280;
        var canto = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
        if (!canto && seed / 233280 > 0.52) cel += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
      }
    }
    var olho = function (x, y) {
      return '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>';
    };
    return '<svg class="pix__qr" viewBox="0 0 25 25" shape-rendering="crispEdges" role="img" aria-label="QR code Pix (ilustrativo)"><g fill="#0a0f0d">' + cel + olho(0, 0) + olho(18, 0) + olho(0, 18) + '</g></svg>';
  }

  function telaPagamento() {
    if (!state.sessao || state.sessao.status !== 'concluida') state.sessao = sessaoDemoConcluida();
    var s = state.sessao;
    var st = estacao(s.estacaoId);
    var energia = s.kwh * s.preco;
    var total = energia - s.credito;
    var pg = state.pagamento;
    var c = D.pagamento.cartao;

    var metodo = function (valor, icone, titulo, sub) {
      return (
        '<label class="rx-card option-card"><input type="radio" name="metodo" value="' + valor + '"' + (pg.metodo === valor ? ' checked' : '') + '>' +
        '<span><strong>' + titulo + '</strong><br><span class="small muted">' + sub + '</span></span>' + ic(icone) + '</label>'
      );
    };

    var corpo;
    if (pg.pixAberto) {
      corpo =
        '<div class="rx-card pix">' + qrSVG() +
        '<p class="small muted">Abra o app do seu banco e leia o QR code, ou copie o código.</p>' +
        '<div class="pix__code" id="pix-code">00020126580014BR.GOV.BCB.PIX0136roxx-demo-' + total.toFixed(2).replace('.', '') + '5204000053039865802BR</div>' +
        '<button type="button" class="rx-btn rx-btn--secondary rx-btn--block" data-action="copiar-pix">' + ic('copy') + 'Copiar código Pix</button></div>' +
        '<div class="sticky-actions"><button type="button" class="rx-btn rx-btn--primary rx-btn--lg" data-action="pix-pago">Já paguei</button></div>';
    } else {
      corpo =
        '<fieldset class="stack" style="border:0;padding:0;margin:0"><legend class="rx-label" style="margin-bottom:8px">Forma de pagamento</legend>' +
        metodo('pix', 'qr-code', 'Pix', 'Aprovação na hora') +
        metodo('cartao', 'credit-card', c.bandeira + ' •••• ' + c.final, 'Cartão salvo') +
        '</fieldset>' +
        '<div class="sticky-actions"><button type="button" class="rx-btn rx-btn--primary rx-btn--lg" data-action="pagar"' + (pg.processando ? ' disabled aria-busy="true"' : '') + '>' +
        (pg.processando ? '<span class="spinner" aria-hidden="true"></span>Processando…' : 'Pagar ' + brl(total)) + '</button></div>';
    }

    return (
      '<section class="screen">' +
      '<div class="topbar">' + (pg.pixAberto ? '<button type="button" class="rx-icon-btn" data-action="pix-voltar" aria-label="Voltar para formas de pagamento">' + ic('arrow-left') + '</button>' : '') +
      '<div><h1 tabindex="-1" data-focus>Pagamento</h1><p class="topbar__sub">' + st.nome + '</p></div></div>' +
      '<div class="rx-card"><dl class="summary">' +
      '<div><dt>Energia</dt><dd>' + num(s.kwh, 1) + ' kWh × ' + brl(s.preco) + '</dd></div>' +
      '<div><dt>Subtotal</dt><dd>' + brl(energia) + '</dd></div>' +
      (s.credito ? '<div><dt>Taxa da reserva (já paga)</dt><dd>− ' + brl(s.credito) + '</dd></div>' : '') +
      '<div class="total"><dt>Total</dt><dd>' + brl(total) + '</dd></div>' +
      '</dl></div>' + corpo + '</section>'
    );
  }

  function finalizarPagamento() {
    var s = state.sessao;
    var total = s.kwh * s.preco - s.credito;
    var rec = {
      id: 'RX-' + proximoRecibo++,
      data: '14 out',
      hora: somaMinutos(D.agora.hora, Math.max(20, s.minutos)),
      estacao: s.estacaoId,
      ponto: s.pontoId,
      tipo: s.tipo,
      kwh: Math.round(s.kwh * 10) / 10,
      preco: s.preco,
      minutos: s.minutos,
      credito: s.credito,
      total: total,
      metodo: state.pagamento.metodo === 'pix' ? 'Pix' : D.pagamento.cartao.bandeira + ' •••• ' + D.pagamento.cartao.final
    };
    state.recibo = rec;
    state.historico.unshift(rec);
    state.sessao = null;
    state.reserva = null;
    state.pagamento = { metodo: 'pix', pixAberto: false, processando: false };
    location.hash = '#recibo';
  }

  function totalItem(h) {
    return h.total != null ? h.total : h.kwh * h.preco - (h.credito || 0);
  }

  function telaRecibo() {
    var r = state.recibo;
    if (!r) {
      var s = sessaoDemoConcluida();
      r = { id: 'RX-10452', data: '14 out', hora: '19:07', estacao: s.estacaoId, ponto: s.pontoId, tipo: s.tipo, kwh: Math.round(s.kwh * 10) / 10, preco: s.preco, minutos: s.minutos, credito: s.credito, metodo: 'Pix' };
      r.total = s.kwh * s.preco - s.credito;
    }
    var st = estacao(r.estacao);
    return (
      '<section class="screen">' +
      '<div class="success-head"><div class="success-head__icon">' + ic('check') + '</div>' +
      '<h1 tabindex="-1" data-focus>Pagamento aprovado</h1>' +
      '<p class="countdown">' + brl(r.total) + '</p><p class="small muted">' + r.metodo + ' · ' + r.data + ', ' + r.hora + '</p></div>' +
      '<div class="rx-card"><dl class="summary">' +
      '<div><dt>Recibo</dt><dd>' + r.id + '</dd></div>' +
      '<div><dt>Estação</dt><dd>' + st.nome + '</dd></div>' +
      '<div><dt>Conector</dt><dd>' + r.ponto + ' · ' + nomeConector(r.tipo) + '</dd></div>' +
      '<div><dt>Energia</dt><dd>' + num(r.kwh, 1) + ' kWh</dd></div>' +
      '<div><dt>Duração</dt><dd>' + duracao(r.minutos) + '</dd></div>' +
      '<div><dt>Preço</dt><dd>' + brl(r.preco) + '/kWh</dd></div>' +
      (r.credito ? '<div><dt>Reserva abatida</dt><dd>− ' + brl(r.credito) + '</dd></div>' : '') +
      '<div class="total"><dt>Total pago</dt><dd>' + brl(r.total) + '</dd></div>' +
      '</dl></div>' +
      '<div class="stack" style="margin-top:auto">' +
      '<button type="button" class="rx-btn rx-btn--secondary rx-btn--block" data-action="compartilhar">' + ic('share-2') + 'Compartilhar recibo</button>' +
      '<a class="rx-btn rx-btn--primary rx-btn--lg rx-btn--block" href="#mapa">Voltar ao mapa</a>' +
      '<a class="rx-btn rx-btn--ghost" href="#historico">Ver histórico</a></div>' +
      '</section>'
    );
  }

  function telaHistorico() {
    var doMes = state.historico.filter(function (h) {
      return / out$/.test(h.data);
    });
    var totalMes = doMes.reduce(function (a, h) { return a + totalItem(h); }, 0);
    var kwhMes = doMes.reduce(function (a, h) { return a + h.kwh; }, 0);
    var meses = D.mesesAnteriores.concat([{ mes: 'out', total: totalMes }]);
    var max = Math.max.apply(null, meses.map(function (m) { return m.total; }));

    var barras = meses
      .map(function (m, i) {
        var atual = i === meses.length - 1;
        var h = Math.max(4, Math.round((m.total / max) * 100));
        return (
          '<div class="bar' + (atual ? ' bar--current' : '') + '" tabindex="0" role="img" aria-label="' + m.mes + ': ' + brl(m.total) + (atual ? ', mês atual até agora' : '') + '">' +
          '<span class="bar__value" aria-hidden="true">' + brl(m.total) + '</span>' +
          '<span class="bar__fill" style="height:' + h + '%" aria-hidden="true"></span><span aria-hidden="true">' + m.mes + '</span></div>'
        );
      })
      .join('');

    var itens = state.historico
      .map(function (h) {
        var st = estacao(h.estacao);
        return (
          '<li class="rx-card history-item"><span class="connector__icon">' + ic('zap') + '</span>' +
          '<div><strong>' + st.nome + '</strong><span class="small muted">' + h.data + ', ' + h.hora + ' · ' + num(h.kwh, 1) + ' kWh · ' + duracao(h.minutos) + '</span></div>' +
          '<div class="value">' + brl(totalItem(h)) + '<small>' + brl(h.preco) + '/kWh</small></div></li>'
        );
      })
      .join('');

    return (
      '<section class="screen">' +
      '<div class="topbar"><h1 tabindex="-1" data-focus>Histórico</h1></div>' +
      '<div class="rx-card month"><p class="eyebrow">Gastos de outubro</p>' +
      '<p class="month__total">' + brl(totalMes) + '</p>' +
      '<dl class="month__stats"><div><dt>Recargas</dt><dd>' + doMes.length + '</dd></div><div><dt>Energia</dt><dd>' + num(kwhMes, 1) + ' kWh</dd></div>' +
      '<div><dt>Média</dt><dd>' + brl(kwhMes ? totalMes / kwhMes : 0) + '/kWh</dd></div></dl>' +
      '<div class="bars" role="group" aria-label="Gasto por mês, de maio a outubro">' + barras + '</div>' +
      '<table class="sr-only"><caption>Gasto por mês</caption><thead><tr><th>Mês</th><th>Total</th></tr></thead><tbody>' +
      meses.map(function (m) { return '<tr><td>' + m.mes + '</td><td>' + brl(m.total) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' +
      '<h2 style="font-size:var(--rx-fs-lg)">Recargas</h2>' +
      '<ul class="list-plain">' + itens + '</ul>' +
      '</section>'
    );
  }

  function telaPerfil() {
    var v = veiculo();
    var c = D.pagamento.cartao;
    return (
      '<section class="screen">' +
      '<div class="topbar"><h1 tabindex="-1" data-focus>Veículo</h1></div>' +
      '<div class="rx-card stack"><div class="row"><span class="connector__icon">' + ic('car') + '</span><div><strong>' + v.modelo + '</strong>' +
      (v.apelido ? '<p class="small muted">' + esc(v.apelido) + '</p>' : '') + '</div></div>' +
      '<dl class="summary"><div><dt>Conectores</dt><dd>' + v.conectores.map(nomeConector).join(', ') + '</dd></div>' +
      '<div><dt>Bateria</dt><dd>' + num(v.bateria, 1) + ' kWh</dd></div></dl>' +
      '<a class="rx-btn rx-btn--secondary rx-btn--block" href="#veiculo">' + ic('pencil') + 'Editar veículo</a></div>' +
      '<div class="rx-card stack"><p class="eyebrow">Pagamento</p><div class="row">' + ic('credit-card') + '<span>' + c.bandeira + ' •••• ' + c.final + '</span></div>' +
      '<div class="row">' + ic('qr-code') + '<span>Pix</span></div></div>' +
      '<div class="stack" style="margin-top:auto">' +
      '<button type="button" class="rx-btn rx-btn--ghost" data-action="rever-intro">Ver a introdução de novo</button>' +
      '<button type="button" class="rx-btn rx-btn--ghost" data-action="reiniciar">Reiniciar protótipo</button></div>' +
      '</section>'
    );
  }

  function telaNaoEncontrada() {
    return (
      '<section class="screen"><div class="empty"><div class="empty__icon">' + ic('map-pin-off') + '</div>' +
      '<h1 tabindex="-1" data-focus style="font-size:var(--rx-fs-xl)">Tela não encontrada</h1>' +
      '<a class="rx-btn rx-btn--primary" href="#mapa">Ir para o mapa</a></div></section>'
    );
  }

  // ---------- Roteador ----------
  function rotaAtual() {
    var h = location.hash.replace(/^#/, '') || 'onboarding';
    var partes = h.split('/');
    return { nome: partes[0], param: partes[1] };
  }

  var TITULOS = {
    onboarding: 'Boas-vindas',
    veiculo: 'Seu carro',
    mapa: 'Mapa',
    estacao: 'Estação',
    reserva: 'Reserva',
    recarga: 'Recarga',
    pagamento: 'Pagamento',
    recibo: 'Recibo',
    historico: 'Histórico',
    perfil: 'Veículo'
  };

  function render() {
    var r = rotaAtual();
    if (r.nome !== 'onboarding' && r.nome !== 'veiculo') veiculo();
    if (!state.filtros.iniciado && state.vehicle) {
      state.filtros.tipos = state.vehicle.conectores.slice();
      state.filtros.iniciado = true;
    }

    // Atalho do painel lateral: inicia uma recarga de demonstração
    if (r.nome === 'recarga' && r.param === 'demo') {
      if (!state.sessao) state.sessao = novaSessao('cln204', 'A1', 0);
      history.replaceState(null, '', '#recarga');
      r = { nome: 'recarga' };
    }

    var html;
    switch (r.nome) {
      case 'onboarding': html = telaOnboarding(); break;
      case 'veiculo': html = telaVeiculo(); break;
      case 'mapa': html = telaMapa(); break;
      case 'estacao': html = telaEstacao(r.param); break;
      case 'reserva': html = telaReserva(r.param); break;
      case 'recarga': html = telaRecarga(); break;
      case 'pagamento': html = telaPagamento(); break;
      case 'recibo': html = telaRecibo(); break;
      case 'historico': html = telaHistorico(); break;
      case 'perfil': html = telaPerfil(); break;
      default: html = telaNaoEncontrada();
    }
    view.innerHTML = html;
    renderNav(r.nome);
    document.title = (TITULOS[r.nome] || 'Roxx Energy') + ' · Roxx Energy';
    marcarLateral();
    icones();
  }

  function marcarLateral() {
    var h = location.hash || '#onboarding';
    document.querySelectorAll('#side-links a').forEach(function (a) {
      var alvo = a.getAttribute('href');
      if (alvo === h || (alvo === '#recarga/demo' && h === '#recarga')) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function navegar() {
    render();
    view.scrollTop = 0;
    var alvo = view.querySelector('[data-focus]');
    if (alvo && primeiraRenderizacao === false) alvo.focus({ preventScroll: true });
    primeiraRenderizacao = false;
  }

  var primeiraRenderizacao = true;
  window.addEventListener('hashchange', navegar);

  // ---------- Ações ----------
  view.addEventListener('click', function (e) {
    var el = e.target.closest('[data-action]');
    if (!el) return;
    var acao = el.getAttribute('data-action');
    var valor = el.getAttribute('data-valor');

    switch (acao) {
      case 'onb-proximo':
        if (state.onbStep < ONB.length - 1) {
          state.onbStep++;
          render();
          view.querySelector('[data-focus]').focus();
        } else {
          state.onbStep = 0;
          location.hash = '#veiculo';
        }
        break;
      case 'onb-voltar':
        state.onbStep = Math.max(0, state.onbStep - 1);
        render();
        view.querySelector('[data-focus]').focus();
        break;
      case 'onb-pular':
        state.onbStep = 0;
        location.hash = '#veiculo';
        break;
      case 'filtro':
        state.filtros[valor] = !state.filtros[valor];
        rerenderMantendoFoco(el);
        break;
      case 'tipo':
        var i = state.filtros.tipos.indexOf(valor);
        if (i === -1) state.filtros.tipos.push(valor);
        else state.filtros.tipos.splice(i, 1);
        rerenderMantendoFoco(el);
        break;
      case 'limpar-filtros':
        state.filtros.livres = false;
        state.filtros.rapida = false;
        state.filtros.tipos = veiculo().conectores.slice();
        state.busca = '';
        render();
        break;
      case 'pin':
        var id = el.getAttribute('data-id');
        state.selecionada = state.selecionada === id ? null : id;
        rerenderMantendoFoco(el);
        break;
      case 'rota':
        toast('Abrindo a rota no seu app de mapas…');
        break;
      case 'reportar':
        toast('Obrigado! Avisamos o operador e marcamos o carregador para revisão.');
        break;
      case 'cancelar-reserva':
        confirmar({
          titulo: 'Cancelar a reserva?',
          texto: 'Como ainda falta para o horário marcado, os ' + brl(D.reserva.taxa) + ' voltam pra você. O conector fica livre pra outros motoristas.',
          confirmar: 'Cancelar reserva',
          cancelar: 'Manter reserva',
          icone: 'calendar-x',
          onConfirmar: function () {
            var antiga = state.reserva;
            state.reserva = null;
            location.hash = '#estacao/' + antiga.estacaoId;
            toast('Reserva cancelada. ' + brl(D.reserva.taxa) + ' devolvidos.', {
              acao: 'Desfazer',
              onAcao: function () {
                state.reserva = antiga;
                location.hash = '#reserva/' + antiga.estacaoId;
              }
            });
          }
        });
        break;
      case 'iniciar':
        var rv = state.reserva;
        state.sessao = novaSessao(rv.estacaoId, rv.ponto, D.reserva.taxa);
        location.hash = '#recarga';
        break;
      case 'conectado':
        state.sessao.status = 'carregando';
        iniciarTimer();
        render();
        view.querySelector('[data-focus]').focus();
        break;
      case 'meta':
        state.sessao.meta = parseInt(valor, 10);
        rerenderMantendoFoco(el);
        break;
      case 'encerrar':
        var s = state.sessao;
        confirmar({
          titulo: 'Encerrar a recarga agora?',
          texto: 'A bateria está em ' + Math.floor(s.pct) + '%. Você paga só a energia usada até aqui: ' + brl(s.kwh * s.preco) + '.',
          confirmar: 'Encerrar recarga',
          cancelar: 'Continuar carregando',
          icone: 'battery-warning',
          onConfirmar: function () {
            s.status = 'concluida';
            pararTimer();
            location.hash = '#pagamento';
          }
        });
        break;
      case 'pagar':
        if (state.pagamento.metodo === 'pix') {
          state.pagamento.pixAberto = true;
          render();
          view.querySelector('[data-focus]').focus();
        } else {
          state.pagamento.processando = true;
          render();
          setTimeout(finalizarPagamento, 1200);
        }
        break;
      case 'pix-voltar':
        state.pagamento.pixAberto = false;
        render();
        view.querySelector('[data-focus]').focus();
        break;
      case 'copiar-pix':
        var codigo = document.getElementById('pix-code').textContent;
        try {
          navigator.clipboard.writeText(codigo).catch(function () {});
        } catch (err) {
          /* sem área de transferência, só confirma visualmente */
        }
        toast('Código Pix copiado.');
        break;
      case 'pix-pago':
        finalizarPagamento();
        break;
      case 'compartilhar':
        toast('Link do recibo copiado.');
        break;
      case 'rever-intro':
        state.onbStep = 0;
        location.hash = '#onboarding';
        break;
      case 'reiniciar':
        pararTimer();
        try {
          sessionStorage.removeItem('rx-veiculo');
        } catch (err) {
          /* nada a limpar */
        }
        location.hash = '#onboarding';
        location.reload();
        break;
    }
  });

  function rerenderMantendoFoco(el) {
    var acao = el.getAttribute('data-action');
    var chave = el.getAttribute('data-valor') || el.getAttribute('data-id');
    var scroll = view.scrollTop;
    render();
    view.scrollTop = scroll;
    var novo = view.querySelector('[data-action="' + acao + '"][data-' + (el.hasAttribute('data-id') ? 'id' : 'valor') + '="' + chave + '"]');
    if (novo) novo.focus();
  }

  view.addEventListener('input', function (e) {
    if (e.target.id === 'busca') {
      state.busca = e.target.value;
      var pos = e.target.selectionStart;
      render();
      var campo = document.getElementById('busca');
      campo.focus();
      campo.setSelectionRange(pos, pos);
    }
  });

  view.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'modelo') {
      var m = D.veiculos.filter(function (x) { return x.id === t.value; })[0];
      document.getElementById('campo-bateria').hidden = t.value !== 'outro';
      t.removeAttribute('aria-invalid');
      document.getElementById('modelo-erro').hidden = true;
      if (m) {
        view.querySelectorAll('input[name="conector"]').forEach(function (c) {
          c.checked = m.conectores.indexOf(c.value) !== -1;
        });
        limparErroConectores();
      }
      document.getElementById('info-bateria').innerHTML = infoBateria(t.value);
      icones();
    }
    if (t.name === 'conector') limparErroConectores();
    if (t.name === 'ponto') {
      state.reservaForm.ponto = t.value;
      document.getElementById('ponto-erro').hidden = true;
      atualizarTolerancia();
    }
    if (t.name === 'horario') {
      state.reservaForm.horario = t.value;
      var scroll = view.scrollTop;
      render();
      view.scrollTop = scroll;
      var r = view.querySelector('input[name="horario"][value="' + t.value + '"]');
      if (r) r.focus();
    }
    if (t.name === 'metodo') state.pagamento.metodo = t.value;
  });

  function atualizarTolerancia() {
    var el = document.getElementById('texto-tolerancia');
    if (!el) return;
    var f = state.reservaForm;
    el.innerHTML = 'Tolerância de ' + D.reserva.tolerancia + ' min: seguramos o ' + f.ponto + ' até <strong>' + somaMinutos(f.horario, D.reserva.tolerancia) + '</strong>. Depois disso a reserva cai e o conector volta a ficar livre.';
  }

  function limparErroConectores() {
    var g = document.getElementById('grupo-conectores');
    if (g) g.removeAttribute('aria-invalid');
    var e = document.getElementById('conectores-erro');
    if (e) e.hidden = true;
  }

  view.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;

    if (f.getAttribute('data-form') === 'busca') return;

    if (f.id === 'form-veiculo') {
      var sel = f.modelo.value;
      var conectores = Array.prototype.slice.call(f.querySelectorAll('input[name="conector"]:checked')).map(function (c) {
        return c.value;
      });
      var primeiroErro = null;

      if (!sel) {
        f.modelo.setAttribute('aria-invalid', 'true');
        document.getElementById('modelo-erro').hidden = false;
        primeiroErro = primeiroErro || f.modelo;
      }
      var bateria = null;
      if (sel === 'outro') {
        bateria = parseFloat(String(f.bateria.value).replace(',', '.'));
        var ok = bateria >= 10 && bateria <= 150;
        f.bateria.setAttribute('aria-invalid', ok ? 'false' : 'true');
        document.getElementById('bateria-erro').hidden = ok;
        if (!ok) primeiroErro = primeiroErro || f.bateria;
      }
      if (!conectores.length) {
        document.getElementById('grupo-conectores').setAttribute('aria-invalid', 'true');
        document.getElementById('conectores-erro').hidden = false;
        primeiroErro = primeiroErro || f.querySelector('input[name="conector"]');
      }
      if (primeiroErro) {
        primeiroErro.focus();
        return;
      }

      var m = D.veiculos.filter(function (x) { return x.id === sel; })[0];
      var eraNovo = !state.vehicle && !carregarVeiculo();
      state.vehicle = {
        id: sel,
        modelo: m ? m.modelo : 'Meu carro elétrico',
        apelido: f.apelido.value.trim(),
        bateria: m ? m.bateria : bateria,
        conectores: conectores
      };
      state.filtros.tipos = conectores.slice();
      state.filtros.iniciado = true;
      salvarVeiculo();
      toast(eraNovo ? 'Pronto! Mostrando estações compatíveis.' : 'Veículo atualizado.');
      location.hash = '#mapa';
    }

    if (f.id === 'form-reserva') {
      var form = state.reservaForm;
      if (!form.ponto) {
        document.getElementById('ponto-erro').hidden = false;
        var primeiro = f.querySelector('input[name="ponto"]:not(:disabled)');
        if (primeiro) primeiro.focus();
        return;
      }
      state.reserva = {
        estacaoId: form.estacaoId,
        ponto: form.ponto,
        horario: form.horario,
        ate: somaMinutos(form.horario, D.reserva.tolerancia)
      };
      render();
      view.scrollTop = 0;
      view.querySelector('[data-focus]').focus();
      toast('Reserva feita. Taxa de ' + brl(D.reserva.taxa) + ' paga.');
    }
  });

  // Primeira tela
  navegar();
})();
