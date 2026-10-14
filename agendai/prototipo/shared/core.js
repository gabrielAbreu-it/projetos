/* Agendaí — regras e utilidades usadas pelas duas interfaces.
   Mudanças feitas no protótipo ficam no localStorage, para o painel enxergar
   o que o cliente agendou (e vice-versa) no mesmo navegador. */
(function () {
  'use strict';

  var D = window.AG_DATA;
  var U = D.util;
  var CHAVE = 'agendai-prototipo-v1';

  // ---------- Persistência ----------
  var salvo = { ags: {}, servicos: null, profissionais: null, obs: {} };

  function ler() {
    try {
      var raw = localStorage.getItem(CHAVE);
      if (raw) salvo = Object.assign(salvo, JSON.parse(raw));
    } catch (e) {
      /* sem armazenamento: segue só em memória */
    }
  }

  function gravar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(salvo));
    } catch (e) {
      /* idem */
    }
  }

  function aplicar() {
    Object.keys(salvo.ags).forEach(function (id) {
      var novo = salvo.ags[id];
      var i = indice(id);
      if (i === -1) D.agendamentos.push(novo);
      else D.agendamentos[i] = novo;
    });
    if (salvo.servicos) D.servicos = salvo.servicos;
    if (salvo.profissionais) D.profissionais = salvo.profissionais;
    Object.keys(salvo.obs).forEach(function (id) {
      var c = cliente(id);
      if (c) c.obs = salvo.obs[id];
    });
  }

  function indice(id) {
    for (var i = 0; i < D.agendamentos.length; i++) if (D.agendamentos[i].id === id) return i;
    return -1;
  }

  function salvarAgendamento(a) {
    var i = indice(a.id);
    if (i === -1) D.agendamentos.push(a);
    else D.agendamentos[i] = a;
    salvo.ags[a.id] = a;
    gravar();
  }

  function salvarServicos() {
    salvo.servicos = D.servicos;
    gravar();
  }

  function salvarProfissionais() {
    salvo.profissionais = D.profissionais;
    gravar();
  }

  function salvarObs(id, texto) {
    salvo.obs[id] = texto;
    var c = cliente(id);
    if (c) c.obs = texto;
    gravar();
  }

  function reiniciar() {
    try {
      localStorage.removeItem(CHAVE);
    } catch (e) {
      /* nada */
    }
  }

  // ---------- Consultas ----------
  function servico(id) {
    return D.servicos.filter(function (s) { return s.id === id; })[0];
  }
  function prof(id) {
    return D.profissionais.filter(function (p) { return p.id === id; })[0];
  }
  function cliente(id) {
    return D.clientes.filter(function (c) { return c.id === id; })[0];
  }
  function agendamento(id) {
    return D.agendamentos[indice(id)];
  }

  function fim(a) {
    return U.hora(U.min(a.inicio) + servico(a.servico).duracao);
  }

  function ativo(a) {
    return a.status !== 'cancelado';
  }

  // Existe conflito para o profissional nesse horário? (ignora o próprio agendamento)
  function conflito(profId, data, inicio, duracao, ignorarId) {
    var ini = U.min(inicio), f = ini + duracao;
    return D.agendamentos.some(function (a) {
      if (a.id === ignorarId || !ativo(a) || a.prof !== profId || a.data !== data) return false;
      var ai = U.min(a.inicio), af = ai + servico(a.servico).duracao;
      return ini < af && f > ai;
    });
  }

  function aberto(data) {
    return D.negocio.diasAbertos.indexOf(U.diaSemana(data)) !== -1;
  }

  function dentroDoHorario(inicio, duracao) {
    return U.min(inicio) >= U.min(D.negocio.abre) && U.min(inicio) + duracao <= U.min(D.negocio.fecha);
  }

  function noPassado(data, inicio) {
    return data < D.hoje || (data === D.hoje && U.min(inicio) <= U.min(D.agora));
  }

  // Horários de 30 em 30 minutos em que o serviço cabe
  function horariosLivres(profId, data, servicoId, ignorarId) {
    var s = servico(servicoId);
    var lista = [];
    if (!aberto(data)) return lista;
    for (var t = U.min(D.negocio.abre); t + s.duracao <= U.min(D.negocio.fecha); t += 30) {
      var h = U.hora(t);
      lista.push({
        hora: h,
        livre: !noPassado(data, h) && !conflito(profId, data, h, s.duracao, ignorarId)
      });
    }
    return lista;
  }

  function novoId() {
    return 'n' + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  }

  // ---------- Formatação ----------
  var DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var DIAS_LONGO = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var MESES_LONGO = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function dataCurta(d) {
    var dt = U.parse(d);
    return DIAS[dt.getUTCDay()] + ', ' + dt.getUTCDate() + ' ' + MESES[dt.getUTCMonth()];
  }

  function dataLonga(d) {
    var dt = U.parse(d);
    return DIAS_LONGO[dt.getUTCDay()] + ', ' + dt.getUTCDate() + ' de ' + MESES_LONGO[dt.getUTCMonth()];
  }

  function brl(n) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function duracao(m) {
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
  }

  function iniciais(nome) {
    var p = nome.split(' ');
    return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function ic(nome, extra) {
    return '<i data-lucide="' + nome + '" aria-hidden="true"' + (extra || '') + '></i>';
  }

  var STATUS = {
    confirmado: { txt: 'Confirmado', icone: 'check' },
    pendente: { txt: 'Aguardando confirmação', icone: 'clock' },
    concluido: { txt: 'Concluído', icone: 'check-check' },
    faltou: { txt: 'Faltou', icone: 'user-x' },
    cancelado: { txt: 'Cancelado', icone: 'x' }
  };

  function badge(status, curto) {
    var s = STATUS[status];
    var txt = curto && status === 'pendente' ? 'Pendente' : s.txt;
    return '<span class="ag-badge ag-badge--' + status + '">' + ic(s.icone) + txt + '</span>';
  }

  ler();
  aplicar();

  window.AG = {
    D: D,
    U: U,
    servico: servico,
    prof: prof,
    cliente: cliente,
    agendamento: agendamento,
    fim: fim,
    ativo: ativo,
    conflito: conflito,
    aberto: aberto,
    dentroDoHorario: dentroDoHorario,
    noPassado: noPassado,
    horariosLivres: horariosLivres,
    novoId: novoId,
    salvarAgendamento: salvarAgendamento,
    salvarServicos: salvarServicos,
    salvarProfissionais: salvarProfissionais,
    salvarObs: salvarObs,
    reiniciar: reiniciar,
    dataCurta: dataCurta,
    dataLonga: dataLonga,
    brl: brl,
    duracao: duracao,
    iniciais: iniciais,
    esc: esc,
    ic: ic,
    badge: badge,
    STATUS: STATUS,
    DIAS: DIAS,
    MESES: MESES,
    MESES_LONGO: MESES_LONGO
  };
})();
