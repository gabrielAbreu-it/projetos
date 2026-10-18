/* Vizinho — estado e utilidades compartilhados pelas duas interfaces.
   O estado fica no localStorage do navegador: o que a portaria registra aparece no app do morador. */
(function () {
  var KEY = 'vizinho-prototipo-v1';
  var base = window.VZ_DATA;

  function clone(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function load() {
    var s = null;
    try {
      s = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
      s = null;
    }
    var d = clone(base);
    if (s && s.v === 1) {
      ['encomendas', 'reservas', 'avisos', 'visitantes'].forEach(function (k) {
        if (Array.isArray(s[k])) d[k] = s[k];
      });
      d.disputaUsada = !!s.disputaUsada;
      d.minhasReservas = s.minhasReservas || [];
    } else {
      d.disputaUsada = false;
      d.minhasReservas = [];
    }
    return d;
  }

  var D = load();
  var startReal = Date.now();
  var agoraBase = new Date(base.agora).getTime();

  function save() {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          v: 1,
          encomendas: D.encomendas,
          reservas: D.reservas,
          avisos: D.avisos,
          visitantes: D.visitantes,
          disputaUsada: D.disputaUsada,
          minhasReservas: D.minhasReservas
        })
      );
    } catch (e) {
      /* sem armazenamento: o protótipo funciona só nesta aba */
    }
  }

  function reset() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      /* nada a apagar */
    }
    var n = load();
    Object.keys(n).forEach(function (k) {
      D[k] = n[k];
    });
  }

  /* ---------- Tempo (relógio do protótipo começa em sexta, 16/10/2026, 18:40) ---------- */
  function now() {
    return new Date(agoraBase + (Date.now() - startReal));
  }
  function iso(d) {
    var p = function (n) {
      return String(n).padStart(2, '0');
    };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':00';
  }
  function hoje() {
    return iso(now()).slice(0, 10);
  }
  var DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  var DIAS_C = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  function toDate(s) {
    return s.length === 10 ? new Date(s + 'T12:00:00') : new Date(s);
  }
  function hora(s) {
    var d = toDate(s);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function dataCurta(s) {
    var d = toDate(s);
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function diaSemana(s) {
    return DIAS[toDate(s).getDay()];
  }
  function dataLonga(s) {
    var d = toDate(s);
    return DIAS[d.getDay()] + ', ' + d.getDate() + ' de ' + MESES[d.getMonth()];
  }
  function quando(s) {
    // "hoje às 14:12", "ontem às 10:05", "terça, 13/10 às 08:45"
    var d = toDate(s);
    var h = hoje();
    var dia = s.slice(0, 10);
    var ontem = iso(new Date(now().getTime() - 864e5)).slice(0, 10);
    if (dia === h) return 'hoje às ' + hora(s);
    if (dia === ontem) return 'ontem às ' + hora(s);
    return DIAS[d.getDay()] + ', ' + dataCurta(s) + ' às ' + hora(s);
  }
  function parado(s) {
    var min = Math.max(0, Math.round((now() - toDate(s)) / 60000));
    var h = min / 60;
    var texto;
    if (min < 60) texto = min + ' min';
    else if (h < 24) texto = Math.floor(h) + ' h';
    else {
      var d = Math.floor(h / 24);
      texto = d + (d === 1 ? ' dia' : ' dias');
    }
    var nivel = h >= 72 ? 'parada' : h >= 24 ? 'atencao' : 'ok';
    return { texto: texto, horas: h, nivel: nivel };
  }

  /* ---------- Consultas ---------- */
  function unidade(id) {
    return D.unidades.find(function (u) {
      return u.id === id;
    });
  }
  function unidadeNome(id) {
    var u = unidade(id);
    return u ? 'Bloco ' + u.bloco + ', apto ' + u.apto : id;
  }
  function unidadeCurta(id) {
    var u = unidade(id);
    return u ? u.bloco + ' ' + u.apto : id;
  }
  function encomenda(id) {
    return D.encomendas.find(function (e) {
      return e.id === id;
    });
  }
  function pendentes(un) {
    return D.encomendas
      .filter(function (e) {
        return e.status === 'pendente' && (!un || e.unidade === un);
      })
      .sort(function (a, b) {
        return a.chegou < b.chegou ? -1 : 1;
      });
  }
  function reservado(area, data, periodo) {
    return D.reservas.find(function (r) {
      return r.area === area && r.data === data && r.periodo === periodo;
    });
  }
  function codigo(n) {
    var s = '';
    for (var i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
    if (s[0] === '0') s = '7' + s.slice(1);
    return s;
  }
  function novoId(p) {
    return p + Date.now().toString(36) + Math.floor(Math.random() * 1000);
  }

  /* ---------- Interface ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function icons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  }
  function toast(msg, opts) {
    opts = opts || {};
    var box = document.getElementById('toasts');
    if (!box) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = '<i data-lucide="' + (opts.icon || 'circle-check') + '"></i><span>' + msg + '</span>';
    if (opts.undo) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Desfazer';
      b.addEventListener('click', function () {
        opts.undo();
        t.remove();
      });
      t.appendChild(b);
    }
    box.appendChild(t);
    icons();
    setTimeout(function () {
      t.remove();
    }, opts.undo ? 7000 : 4500);
  }
  function fmtCodigo(c) {
    return c.length === 6 ? c.slice(0, 3) + ' ' + c.slice(3) : c;
  }
  function moeda(v) {
    return 'R$\u00a0' + v.toFixed(2).replace('.', ',');
  }

  // Outra aba (portaria ou morador) mudou o estado: recarrega e avisa a interface
  var listeners = [];
  window.addEventListener('storage', function (ev) {
    if (ev.key !== KEY) return;
    var n = load();
    Object.keys(n).forEach(function (k) {
      D[k] = n[k];
    });
    listeners.forEach(function (fn) {
      fn();
    });
  });

  window.VZ = {
    D: D,
    save: save,
    reset: reset,
    now: now,
    iso: iso,
    hoje: hoje,
    toDate: toDate,
    hora: hora,
    dataCurta: dataCurta,
    dataLonga: dataLonga,
    diaSemana: diaSemana,
    quando: quando,
    parado: parado,
    DIAS_C: DIAS_C,
    MESES: MESES,
    unidade: unidade,
    unidadeNome: unidadeNome,
    unidadeCurta: unidadeCurta,
    encomenda: encomenda,
    pendentes: pendentes,
    reservado: reservado,
    codigo: codigo,
    novoId: novoId,
    esc: esc,
    icons: icons,
    toast: toast,
    fmtCodigo: fmtCodigo,
    moeda: moeda,
    onExternalChange: function (fn) {
      listeners.push(fn);
    }
  };
})();
