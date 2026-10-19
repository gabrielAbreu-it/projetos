/* Dossiê Pix · demonstração do "piloto automático"
   Dados FICTÍCIOS e estado salvo só neste navegador (localStorage).
   Usado pela página de vendas, cadastro, afiliados, ajuda e pelo painel do dono.
   Nada aqui cobra, transfere ou envia dinheiro de verdade. */
(function () {
  "use strict";

  var CHAVE = "dossiepix:piloto:v1";

  var PLANOS = [
    { id: "essencial", nome: "Essencial", para: "Para quem está começando", itens: ["Até 100 vendas por mês", "5 dossiês por mês", "1 usuário"] },
    { id: "profissional", nome: "Profissional", para: "Para a loja que vende todo dia", itens: ["Até 500 vendas por mês", "20 dossiês por mês", "2 usuários", "Cópia automática dos dados"], destaque: true },
    { id: "loja", nome: "Loja", para: "Para quem vende muito por Pix", itens: ["Vendas sem limite", "60 dossiês por mês", "5 usuários", "Suporte prioritário e implantação"] }
  ];

  var AJUSTES_PADRAO = {
    precos: { essencial: 49, profissional: 119, loja: 279 },
    comissaoPct: 30,
    diasTeste: 7,
    taxaFixa: 2.0, /* estimativa por cobrança, só exemplo: conferir no provedor */
    taxaPct: 1.0, /* estimativa em % por cobrança, só exemplo */
    custosFixos: 180
  };

  /* ---------- gerador fictício, sempre igual ---------- */
  function semente(n) {
    return function () {
      n = (n * 9301 + 49297) % 233280;
      return n / 233280;
    };
  }
  var NOMES = ["Ateliê Flor de Sal", "Casa Lume", "Brisa Moda", "Ponto Fino", "Rede Bijus", "Loja Vila Verde", "Toque de Linho", "Sol de Bambu", "Pé de Cereja", "Cia do Couro", "Nó de Palha", "Mar de Prata", "Bazar Aurora", "Galeria Ipê", "Doce Tear", "Tribo Urbana", "Oficina Ruiva", "Cerrado Arte", "Bossa Acessórios", "Luar Cosméticos", "Brechó Quintal", "Fio a Fio", "Raiz Natural", "Vitrine Sul", "Estúdio Grão", "Laço Fino", "Céu de Anil", "Loja Pitanga", "Trama Viva", "Ponto Cego Store", "Ouro Velho", "Ventania Moda", "Folha Seca", "Varanda Shop", "Cacto Azul", "Mimo Ateliê"];
  var ORIGENS = [["afiliado", "Afiliado"], ["indicacao", "Indicação de cliente"], ["google", "Google"], ["direto", "Direto"]];

  function gerarAssinantes() {
    var r = semente(42), lista = [], hoje = new Date();
    for (var i = 0; i < 72; i++) {
      var x = r();
      var plano = x < 0.4 ? "essencial" : x < 0.85 ? "profissional" : "loja";
      var y = r();
      var status = i < 58 ? "ativa" : i < 66 ? "teste" : i < 69 ? "atrasada" : "cancelada";
      var o = r();
      var origem = o < 0.38 ? "afiliado" : o < 0.58 ? "indicacao" : o < 0.82 ? "google" : "direto";
      var dias = status === "teste" ? Math.floor(r() * 7) : status === "cancelada" ? 20 + Math.floor(r() * 150) : Math.floor(y * 180);
      if (i % 7 === 0 && status === "ativa") dias = Math.floor(r() * 16);
      var d = new Date(hoje);
      d.setDate(d.getDate() - dias);
      var nome = NOMES[i % NOMES.length] + (i >= NOMES.length ? " " + (Math.floor(i / NOMES.length) + 1) : "");
      lista.push({ id: "a" + (i + 1), loja: nome, email: "contato" + (i + 1) + "@exemplo.com", plano: plano, status: status, origem: origem, desde: d.toISOString().slice(0, 10), afiliado: origem === "afiliado" ? (i % 3 === 0 ? "CAMILA30" : i % 3 === 1 ? "CONTAJA" : "AGENCIAMAR") : "" });
    }
    return lista;
  }

  var ASSINANTES = gerarAssinantes();

  function padrao() {
    return {
      ajustes: JSON.parse(JSON.stringify(AJUSTES_PADRAO)),
      conta: null,
      afiliado: null,
      ref: null,
      retiradas: [
        { id: "r3", valor: 3200, em: diasAtras(33), status: "concluida", protocolo: "TRF-20381" },
        { id: "r2", valor: 2800, em: diasAtras(63), status: "concluida", protocolo: "TRF-19044" },
        { id: "r1", valor: 2100, em: diasAtras(94), status: "concluida", protocolo: "TRF-17710" }
      ],
      saldoAnterior: 1250
    };
  }
  function diasAtras(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
  }

  var estado;
  function carregar() {
    try {
      var s = JSON.parse(localStorage.getItem(CHAVE));
      if (s && s.ajustes && Array.isArray(s.retiradas)) {
        estado = s;
        return estado;
      }
    } catch (e) {}
    estado = padrao();
    return estado;
  }
  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ---------- números do painel do dono (tudo calculado a partir dos fictícios) ---------- */
  function preco(plano) {
    return estado.ajustes.precos[plano];
  }
  function mesAtual(iso) {
    var d = new Date(iso), h = new Date();
    return d.getMonth() === h.getMonth() && d.getFullYear() === h.getFullYear();
  }
  function numeros() {
    var a = estado.ajustes;
    var ativas = ASSINANTES.filter(function (x) { return x.status === "ativa"; });
    var atrasadas = ASSINANTES.filter(function (x) { return x.status === "atrasada"; });
    var testes = ASSINANTES.filter(function (x) { return x.status === "teste"; });
    var canceladas = ASSINANTES.filter(function (x) { return x.status === "cancelada"; });
    var mrr = ativas.reduce(function (s, x) { return s + preco(x.plano); }, 0);
    var extras = 14 * 9.9; /* 14 dossiês extras fictícios no mês */
    var receita = mrr + extras;
    var cobrancas = ativas.length + 14;
    var taxas = cobrancas * a.taxaFixa + receita * (a.taxaPct / 100);
    var comissoes = ativas.filter(function (x) { return x.origem === "afiliado"; }).reduce(function (s, x) { return s + preco(x.plano) * (a.comissaoPct / 100); }, 0);
    var lucro = receita - taxas - comissoes - a.custosFixos;
    var retiradoMes = estado.retiradas.filter(function (r) { return mesAtual(r.em); }).reduce(function (s, r) { return s + r.valor; }, 0);
    var saldo = Math.max(0, estado.saldoAnterior + lucro - retiradoMes);
    var inadValor = atrasadas.reduce(function (s, x) { return s + preco(x.plano); }, 0);
    var novos = ASSINANTES.filter(function (x) { return x.status !== "cancelada" && x.status !== "teste" && mesAtual(x.desde + "T12:00:00"); });
    var porOrigem = ORIGENS.map(function (o) {
      return { id: o[0], nome: o[1], n: novos.filter(function (x) { return x.origem === o[0]; }).length };
    });
    /* série de 6 meses: 5 meses fictícios + o mês atual calculado */
    var fator = [0.52, 0.61, 0.7, 0.79, 0.9];
    var serie = [];
    for (var i = 5; i >= 0; i--) {
      var d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      var nomeMes = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      serie.push({ mes: nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1), valor: i === 0 ? receita : Math.round(receita * fator[5 - i]) });
    }
    return {
      mrr: mrr, receita: receita, extras: extras, taxas: taxas, comissoes: comissoes, custos: a.custosFixos, lucro: lucro,
      saldo: saldo, ativas: ativas.length, testes: testes.length, canceladas: canceladas.length,
      atrasadas: atrasadas.length, inadValor: inadValor, porOrigem: porOrigem, novos: novos.length, serie: serie
    };
  }

  /* ---------- afiliado (painel de demonstração) ---------- */
  function painelAfiliado() {
    var a = estado.ajustes;
    var meus = [
      { loja: "Brisa Moda", plano: "profissional", desde: diasAtras(120) },
      { loja: "Ponto Fino", plano: "essencial", desde: diasAtras(96) },
      { loja: "Cia do Couro", plano: "loja", desde: diasAtras(70) },
      { loja: "Toque de Linho", plano: "profissional", desde: diasAtras(51) },
      { loja: "Mar de Prata", plano: "profissional", desde: diasAtras(33) },
      { loja: "Galeria Ipê", plano: "essencial", desde: diasAtras(19) },
      { loja: "Luar Cosméticos", plano: "profissional", desde: diasAtras(6) }
    ];
    var mes = meus.reduce(function (s, x) { return s + preco(x.plano) * (a.comissaoPct / 100); }, 0);
    return {
      cliques: 184, cadastros: 12, assinantes: meus.length, comissaoMes: mes, aReceber: mes,
      clientes: meus,
      historico: [
        { mes: "mês passado", valor: Math.round(mes * 0.86 * 100) / 100, status: "Pago" },
        { mes: "há 2 meses", valor: Math.round(mes * 0.68 * 100) / 100, status: "Pago" },
        { mes: "há 3 meses", valor: Math.round(mes * 0.41 * 100) / 100, status: "Pago" }
      ]
    };
  }

  function brl(v) {
    return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* guarda o código de afiliado que veio no link (?ref=CODIGO) */
  function lerRef() {
    var m = location.search.match(/[?&]ref=([A-Za-z0-9_-]{2,30})/);
    if (m) {
      estado.ref = m[1].toUpperCase();
      salvar();
    }
  }

  carregar();
  lerRef();

  window.Piloto = {
    PLANOS: PLANOS,
    ORIGENS: ORIGENS,
    ASSINANTES: ASSINANTES,
    AJUSTES_PADRAO: AJUSTES_PADRAO,
    get estado() { return estado; },
    salvar: salvar,
    recomecar: function () {
      try { localStorage.removeItem(CHAVE); } catch (e) {}
      estado = padrao();
    },
    preco: preco,
    numeros: numeros,
    painelAfiliado: painelAfiliado,
    brl: brl,
    esc: esc,
    icones: function () {
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    }
  };
})();
