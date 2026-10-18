/* Dossiê Pix · camada de dados
   Tudo o que o app lê e grava passa por aqui. Hoje os dados ficam no localStorage
   deste navegador; na versão com login, basta trocar o corpo destas funções por
   chamadas ao Supabase (ver ../supabase/schema.sql), mantendo os mesmos nomes. */
(function () {
  "use strict";

  var CHAVE = "dossiepix:v1";
  var VERSAO = 1;
  var estado = null;

  function StoreError(codigo, mensagem) {
    var e = new Error(mensagem);
    e.codigo = codigo;
    return e;
  }

  function agoraISO() {
    return new Date().toISOString();
  }

  function novoId(prefixo) {
    return (prefixo || "id") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function clonar(o) {
    return JSON.parse(JSON.stringify(o));
  }

  function lerDisco() {
    try {
      var bruto = window.localStorage.getItem(CHAVE);
      if (!bruto) return null;
      var dados = JSON.parse(bruto);
      if (!dados || dados.versao !== VERSAO || !Array.isArray(dados.vendas)) return null;
      return dados;
    } catch (e) {
      return null;
    }
  }

  /* Grava o estado. Se o navegador recusar (espaço cheio), desfaz a mudança
     e avisa quem chamou com um erro de código "cheio". */
  function gravar(anterior) {
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) {
      if (anterior) estado = anterior;
      var cheio = e && (e.name === "QuotaExceededError" || e.code === 22 || e.code === 1014);
      throw StoreError(
        cheio ? "cheio" : "gravar",
        cheio
          ? "O espaço que este navegador reserva para o app acabou. Remova provas antigas ou baixe uma cópia dos dados e apague vendas já resolvidas."
          : "Não consegui salvar neste navegador. Confira se o modo anônimo ou o bloqueio de dados de sites está ativo."
      );
    }
  }

  /* Executa uma mudança com segurança: se não couber, nada muda. */
  function mudar(fn) {
    var anterior = clonar(estado);
    var r = fn(estado);
    gravar(anterior);
    return r;
  }

  function semear() {
    estado = window.DPData.criarDemonstracao();
    estado.versao = VERSAO;
    try {
      window.localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) {
      /* sem armazenamento: o app funciona só nesta aba */
    }
  }

  function carregar() {
    estado = lerDisco();
    if (!estado) semear();
    return estado;
  }

  function venda(id) {
    for (var i = 0; i < estado.vendas.length; i++) if (estado.vendas[i].id === id) return estado.vendas[i];
    return null;
  }

  function exigirVenda(s, id) {
    var v = null;
    for (var i = 0; i < s.vendas.length; i++) if (s.vendas[i].id === id) v = s.vendas[i];
    if (!v) throw StoreError("nao-encontrada", "Venda não encontrada.");
    return v;
  }

  function registrar(v, texto) {
    v.historico = v.historico || [];
    v.historico.unshift({ em: agoraISO(), texto: texto });
  }

  var API = {
    carregar: carregar,

    /* Loja */
    getLoja: function () {
      return estado.loja;
    },
    salvarLoja: function (dados) {
      return mudar(function (s) {
        Object.assign(s.loja, dados);
        return s.loja;
      });
    },

    /* Vendas */
    listarVendas: function () {
      return estado.vendas.slice().sort(function (a, b) {
        return (b.data + (b.hora || "")).localeCompare(a.data + (a.hora || ""));
      });
    },
    getVenda: venda,
    criarVenda: function (dados) {
      return mudar(function (s) {
        var v = Object.assign(
          {
            id: novoId("v"),
            criadaEm: agoraISO(),
            provas: [],
            eventos: [],
            rastreio: null,
            contestacao: null,
            historico: [],
            dossieGeradoEm: null
          },
          dados
        );
        registrar(v, "Venda registrada");
        s.vendas.push(v);
        return v;
      });
    },
    atualizarVenda: function (id, dados) {
      return mudar(function (s) {
        var v = exigirVenda(s, id);
        Object.assign(v, dados);
        registrar(v, "Dados da venda atualizados");
        return v;
      });
    },
    excluirVenda: function (id) {
      return mudar(function (s) {
        s.vendas = s.vendas.filter(function (v) {
          return v.id !== id;
        });
      });
    },

    /* Provas (arquivos guardados como dataURL) */
    adicionarProva: function (vendaId, prova, rotulo) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        var p = Object.assign({ id: novoId("p"), criadaEm: agoraISO() }, prova);
        v.provas.push(p);
        registrar(v, "Prova anexada: " + (rotulo || p.tipo));
        return p;
      });
    },
    removerProva: function (vendaId, provaId, rotulo) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        v.provas = v.provas.filter(function (p) {
          return p.id !== provaId;
        });
        registrar(v, "Prova removida: " + (rotulo || provaId));
      });
    },
    salvarRastreio: function (vendaId, rastreio) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        v.rastreio = rastreio;
        registrar(v, rastreio ? "Rastreio informado: " + rastreio.codigo : "Rastreio removido");
        return v;
      });
    },

    /* Linha do tempo */
    adicionarEvento: function (vendaId, evento) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        var e = Object.assign({ id: novoId("e") }, evento);
        v.eventos.push(e);
        registrar(v, "Acontecimento adicionado à linha do tempo");
        return e;
      });
    },
    removerEvento: function (vendaId, eventoId) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        v.eventos = v.eventos.filter(function (e) {
          return e.id !== eventoId;
        });
        registrar(v, "Acontecimento removido da linha do tempo");
      });
    },

    /* Contestação pelo MED */
    abrirContestacao: function (vendaId, dados) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        v.contestacao = Object.assign({ status: "aberta", abertaEm: agoraISO(), resolvidaEm: null, resultadoObs: "" }, dados);
        registrar(v, "Contestação aberta: aviso em " + dados.dataAviso.split("-").reverse().join("/"));
        return v.contestacao;
      });
    },
    atualizarContestacao: function (vendaId, dados) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        Object.assign(v.contestacao, dados);
        registrar(v, "Dados da contestação atualizados");
        return v.contestacao;
      });
    },
    resolverContestacao: function (vendaId, resultado, obs) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        v.contestacao.status = resultado; /* "ganha" ou "perdida" */
        v.contestacao.resolvidaEm = agoraISO();
        v.contestacao.resultadoObs = obs || "";
        registrar(v, resultado === "ganha" ? "Contestação marcada como ganha" : "Contestação marcada como perdida");
        return v.contestacao;
      });
    },
    reabrirContestacao: function (vendaId) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        v.contestacao.status = "aberta";
        v.contestacao.resolvidaEm = null;
        v.contestacao.resultadoObs = "";
        registrar(v, "Resultado desfeito: contestação aberta de novo");
        return v.contestacao;
      });
    },
    marcarDossieGerado: function (vendaId) {
      return mudar(function (s) {
        var v = exigirVenda(s, vendaId);
        v.dossieGeradoEm = agoraISO();
        registrar(v, "Dossiê gerado para impressão ou PDF");
      });
    },

    /* Manutenção */
    recomecarDemonstracao: function () {
      try {
        window.localStorage.removeItem(CHAVE);
      } catch (e) {}
      semear();
    },
    apagarTudo: function () {
      var loja = estado.loja;
      estado = { versao: VERSAO, loja: loja, vendas: [] };
      gravar(null);
    },
    exportar: function () {
      return JSON.stringify(estado, null, 2);
    },
    importar: function (texto) {
      var dados;
      try {
        dados = JSON.parse(texto);
      } catch (e) {
        throw StoreError("arquivo", "Esse arquivo não é uma cópia do Dossiê Pix.");
      }
      if (!dados || !dados.loja || !Array.isArray(dados.vendas)) throw StoreError("arquivo", "Esse arquivo não é uma cópia do Dossiê Pix.");
      var anterior = estado;
      estado = dados;
      estado.versao = VERSAO;
      gravar(anterior);
    },
    /* Uso aproximado do espaço (o navegador conta caracteres) */
    usoArmazenamento: function () {
      var usado = 0;
      try {
        usado = (window.localStorage.getItem(CHAVE) || "").length;
      } catch (e) {}
      return { usado: usado, limite: 5 * 1024 * 1024 };
    }
  };

  window.DPStore = API;
})();
