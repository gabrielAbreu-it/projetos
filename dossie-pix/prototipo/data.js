/* Dossiê Pix · listas fixas e dados de demonstração
   Todos os nomes, documentos, valores e imagens daqui são FICTÍCIOS. */
(function () {
  "use strict";

  var CANAIS = [
    ["loja", "Loja online"],
    ["instagram", "Instagram"],
    ["whatsapp", "WhatsApp"],
    ["presencial", "Presencial"],
    ["outro", "Outro"]
  ];

  var ENTREGAS = [
    ["envio", "Envio por Correios ou transportadora"],
    ["propria", "Entrega própria ou motoboy"],
    ["retirada", "Retirada pelo cliente"],
    ["digital", "Produto digital ou serviço"]
  ];

  var TIPOS_PROVA = {
    pix: { rotulo: "Comprovante do Pix", icone: "receipt" },
    nf: { rotulo: "Nota fiscal ou recibo", icone: "file-text" },
    rastreio: { rotulo: "Rastreio da entrega", icone: "truck" },
    entrega: { rotulo: "Comprovante de entrega", icone: "package-check" },
    conversa: { rotulo: "Print de conversa", icone: "messages-square" },
    foto: { rotulo: "Foto do produto", icone: "image" },
    outro: { rotulo: "Outro documento", icone: "paperclip" }
  };

  var TIPOS_EVENTO = {
    pedido: { rotulo: "Pedido", icone: "shopping-bag" },
    pagamento: { rotulo: "Pagamento", icone: "badge-dollar-sign" },
    envio: { rotulo: "Envio", icone: "truck" },
    entrega: { rotulo: "Entrega", icone: "package-check" },
    conversa: { rotulo: "Conversa", icone: "messages-square" },
    contestacao: { rotulo: "Contestação", icone: "shield-alert" },
    outro: { rotulo: "Outro", icone: "circle-dot" }
  };

  var MOTIVOS = [
    ["golpe", "Pagador diz que caiu em golpe"],
    ["nao-reconhece", "Pagador não reconhece o Pix"],
    ["nao-recebeu", "Diz que não recebeu o produto"],
    ["outro", "Outro motivo"]
  ];

  var TRANSPORTADORAS = ["Correios", "Jadlog", "Loggi", "Total Express", "Motoboy próprio", "Outra"];

  /* ---------- datas relativas ao dia em que a demonstração é criada ---------- */
  function iso(d) {
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + dia;
  }
  function diasAtras(n) {
    var d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - n);
    return iso(d);
  }
  function br(isoData) {
    return isoData.split("-").reverse().join("/");
  }
  function e2e(isoData, hora, sufixo) {
    return "E12345678" + isoData.replace(/-/g, "") + hora.replace(":", "") + sufixo;
  }
  function reais(c) {
    return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  /* ---------- imagens de exemplo (SVG) ---------- */
  function x(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function svgURL(svg) {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function quebrar(texto, max) {
    var palavras = texto.split(" "), linhas = [], atual = "";
    palavras.forEach(function (p) {
      if ((atual + " " + p).trim().length > max) {
        linhas.push(atual.trim());
        atual = p;
      } else atual += " " + p;
    });
    if (atual.trim()) linhas.push(atual.trim());
    return linhas;
  }
  var MARCA =
    '<text x="300" y="470" text-anchor="middle" transform="rotate(-28 300 470)" font-size="44" font-weight="700" fill="#0b7a5c" fill-opacity=".10" font-family="Arial,sans-serif">EXEMPLO FICTÍCIO</text>';

  function svgComprovante(o) {
    var linhas = [
      ["Valor", reais(o.valor)],
      ["Data e hora", br(o.data) + " às " + o.hora],
      ["Quem pagou", o.pagador],
      ["Quem recebeu", o.recebedor],
      ["Instituição", "Banco Exemplo (fictício)"]
    ];
    var y = 190, corpo = "";
    linhas.forEach(function (l) {
      corpo += '<text x="48" y="' + y + '" font-size="18" fill="#5b6468">' + x(l[0]) + "</text>";
      corpo += '<text x="48" y="' + (y + 30) + '" font-size="24" font-weight="700" fill="#1e2427">' + x(l[1]) + "</text>";
      y += 84;
    });
    corpo += '<text x="48" y="' + y + '" font-size="18" fill="#5b6468">ID da transação</text>';
    corpo += '<text x="48" y="' + (y + 30) + '" font-size="19" font-family="Courier New,monospace" fill="#1e2427">' + x(o.e2e.slice(0, 16)) + "</text>";
    corpo += '<text x="48" y="' + (y + 56) + '" font-size="19" font-family="Courier New,monospace" fill="#1e2427">' + x(o.e2e.slice(16)) + "</text>";
    return svgURL(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="860" viewBox="0 0 600 860" font-family="Arial,sans-serif">' +
        '<rect width="600" height="860" fill="#ffffff"/><rect width="600" height="120" fill="#1e2427"/>' +
        '<circle cx="66" cy="60" r="22" fill="#5fd4a8"/><path d="M56 60l7 7 14-15" stroke="#1e2427" stroke-width="5" fill="none"/>' +
        '<text x="104" y="54" font-size="26" font-weight="700" fill="#ffffff">Pix enviado</text>' +
        '<text x="104" y="84" font-size="17" fill="#c8d2cf">Comprovante de transferência</text>' +
        corpo +
        '<line x1="48" x2="552" y1="790" y2="790" stroke="#d5dad8"/><text x="48" y="822" font-size="15" fill="#5b6468">Imagem de demonstração. Não é um comprovante real.</text>' +
        MARCA +
        "</svg>"
    );
  }

  function svgNota(o) {
    return svgURL(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="860" viewBox="0 0 600 860" font-family="Arial,sans-serif">' +
        '<rect width="600" height="860" fill="#fbfbf8"/><rect x="24" y="24" width="552" height="812" fill="none" stroke="#1e2427" stroke-width="2"/>' +
        '<text x="48" y="78" font-size="26" font-weight="700" fill="#1e2427">NOTA FISCAL</text>' +
        '<text x="48" y="106" font-size="16" fill="#5b6468">Nº ' + x(o.numero) + " · emitida em " + br(o.data) + "</text>" +
        '<line x1="24" x2="576" y1="132" y2="132" stroke="#1e2427"/>' +
        '<text x="48" y="172" font-size="15" fill="#5b6468">EMITENTE</text><text x="48" y="198" font-size="20" fill="#1e2427">Ateliê Flor de Sal (fictício)</text>' +
        '<text x="48" y="246" font-size="15" fill="#5b6468">DESTINATÁRIO</text><text x="48" y="272" font-size="20" fill="#1e2427">' + x(o.cliente) + "</text>" +
        '<line x1="24" x2="576" y1="306" y2="306" stroke="#1e2427"/>' +
        '<text x="48" y="342" font-size="15" fill="#5b6468">DESCRIÇÃO</text><text x="440" y="342" font-size="15" fill="#5b6468">VALOR</text>' +
        '<text x="48" y="376" font-size="19" fill="#1e2427">' + x(o.produto) + '</text><text x="440" y="376" font-size="19" fill="#1e2427">' + reais(o.valor) + "</text>" +
        '<line x1="48" x2="552" y1="404" y2="404" stroke="#d5dad8"/>' +
        '<text x="48" y="450" font-size="20" font-weight="700" fill="#1e2427">TOTAL</text><text x="440" y="450" font-size="20" font-weight="700" fill="#1e2427">' + reais(o.valor) + "</text>" +
        '<text x="48" y="490" font-size="16" fill="#5b6468">Forma de pagamento: Pix</text>' +
        '<text x="48" y="800" font-size="15" fill="#5b6468">Imagem de demonstração. Não é um documento fiscal.</text>' +
        MARCA +
        "</svg>"
    );
  }

  function svgConversa(o) {
    var y = 140, corpo = "";
    o.mensagens.forEach(function (m) {
      var linhas = quebrar(m.texto, 30);
      var h = linhas.length * 26 + 34;
      var loja = m.de === "loja";
      var w = 360, bx = loja ? 600 - 24 - w : 24;
      corpo += '<rect x="' + bx + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="16" fill="' + (loja ? "#d9f5e8" : "#ffffff") + '"/>';
      linhas.forEach(function (l, i) {
        corpo += '<text x="' + (bx + 18) + '" y="' + (y + 30 + i * 26) + '" font-size="19" fill="#1e2427">' + x(l) + "</text>";
      });
      corpo += '<text x="' + (bx + w - 16) + '" y="' + (y + h - 10) + '" font-size="13" text-anchor="end" fill="#5b6468">' + x(m.hora) + "</text>";
      y += h + 16;
    });
    var altura = Math.max(y + 60, 700);
    return svgURL(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="' + altura + '" viewBox="0 0 600 ' + altura + '" font-family="Arial,sans-serif">' +
        '<rect width="600" height="' + altura + '" fill="#ece6dc"/><rect width="600" height="96" fill="#1e2427"/>' +
        '<circle cx="62" cy="48" r="26" fill="#5fd4a8"/><text x="62" y="57" font-size="24" font-weight="700" text-anchor="middle" fill="#1e2427">' + x(o.contato.charAt(0)) + "</text>" +
        '<text x="104" y="44" font-size="22" font-weight="700" fill="#ffffff">' + x(o.contato) + '</text><text x="104" y="70" font-size="15" fill="#c8d2cf">' + x(o.canal) + " · " + br(o.data) + "</text>" +
        '<rect x="214" y="110" width="172" height="26" rx="13" fill="#ffffff" fill-opacity=".8"/><text x="300" y="128" font-size="14" text-anchor="middle" fill="#5b6468">' + br(o.data) + "</text>" +
        corpo +
        '<text x="300" y="' + (altura - 24) + '" font-size="14" text-anchor="middle" fill="#5b6468">Conversa de demonstração (fictícia)</text>' +
        "</svg>"
    );
  }

  function svgEntrega(o) {
    var passos = o.passos, corpo = "", y = 220;
    passos.forEach(function (p, i) {
      var ultimo = i === passos.length - 1;
      corpo += '<circle cx="64" cy="' + y + '" r="12" fill="' + (ultimo ? "#0b7a5c" : "#a9b6b2") + '"/>';
      if (i < passos.length - 1) corpo += '<line x1="64" x2="64" y1="' + (y + 12) + '" y2="' + (y + 88) + '" stroke="#a9b6b2" stroke-width="3"/>';
      corpo += '<text x="96" y="' + (y + 6) + '" font-size="20" font-weight="' + (ultimo ? "700" : "400") + '" fill="#1e2427">' + x(p[0]) + "</text>";
      corpo += '<text x="96" y="' + (y + 32) + '" font-size="16" fill="#5b6468">' + x(p[1]) + "</text>";
      y += 100;
    });
    return svgURL(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760" font-family="Arial,sans-serif">' +
        '<rect width="600" height="760" fill="#ffffff"/><rect width="600" height="150" fill="#f4f5f3"/>' +
        '<text x="40" y="62" font-size="16" fill="#5b6468">' + x(o.transportadora) + " · rastreamento</text>" +
        '<text x="40" y="100" font-size="28" font-weight="700" font-family="Courier New,monospace" fill="#1e2427">' + x(o.codigo) + "</text>" +
        '<text x="40" y="132" font-size="16" fill="#0b7a5c" font-weight="700">Objeto entregue</text>' +
        corpo +
        '<text x="40" y="726" font-size="15" fill="#5b6468">Imagem de demonstração (fictícia).</text>' +
        MARCA +
        "</svg>"
    );
  }

  function svgFoto(o) {
    var formas = {
      bolsa:
        '<path d="M190 330 Q300 170 410 330" fill="none" stroke="' + o.cor2 + '" stroke-width="18"/><rect x="150" y="320" width="300" height="250" rx="34" fill="' + o.cor + '"/>' +
        '<g stroke="' + o.cor2 + '" stroke-opacity=".45" stroke-width="5">' +
        '<line x1="150" y1="370" x2="450" y2="370"/><line x1="150" y1="420" x2="450" y2="420"/><line x1="150" y1="470" x2="450" y2="470"/><line x1="150" y1="520" x2="450" y2="520"/></g>',
      colar:
        '<path d="M170 220 Q300 560 430 220" fill="none" stroke="' + o.cor + '" stroke-width="10"/><path d="M200 220 Q300 480 400 220" fill="none" stroke="' + o.cor + '" stroke-width="8"/>' +
        '<circle cx="300" cy="420" r="26" fill="' + o.cor2 + '"/><circle cx="300" cy="360" r="16" fill="' + o.cor2 + '"/>',
      vestido:
        '<path d="M250 200 L350 200 L370 300 L450 580 L150 580 L230 300 Z" fill="' + o.cor + '"/><path d="M250 200 Q300 250 350 200" fill="none" stroke="' + o.cor2 + '" stroke-width="8"/>',
      caixa:
        '<rect x="160" y="300" width="280" height="240" rx="12" fill="' + o.cor + '"/><rect x="140" y="270" width="320" height="50" rx="10" fill="' + o.cor2 + '"/>'
    };
    return svgURL(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700" font-family="Arial,sans-serif">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f3ee"/><stop offset="1" stop-color="#e4ded3"/></linearGradient></defs>' +
        '<rect width="600" height="700" fill="url(#g)"/><ellipse cx="300" cy="600" rx="200" ry="22" fill="#000" fill-opacity=".08"/>' +
        formas[o.forma] +
        '<text x="300" y="664" font-size="16" text-anchor="middle" fill="#5b6468">' + x(o.legenda) + " · ilustração de demonstração</text>" +
        "</svg>"
    );
  }

  function tamanho(dataUrl) {
    return Math.round(dataUrl.length * 0.75);
  }
  function prova(tipo, nome, dataUrl, dataDoc, obs) {
    return { id: "p_" + Math.random().toString(36).slice(2, 9), tipo: tipo, nome: nome, mime: "image/svg+xml", tamanho: tamanho(dataUrl), dataUrl: dataUrl, dataDoc: dataDoc, obs: obs || "", criadaEm: new Date().toISOString() };
  }
  function evento(tipo, data, hora, descricao) {
    return { id: "e_" + Math.random().toString(36).slice(2, 9), tipo: tipo, data: data, hora: hora, descricao: descricao };
  }
  function hist(texto, diasAntes) {
    var d = new Date();
    d.setDate(d.getDate() - diasAntes);
    return { em: d.toISOString(), texto: texto };
  }

  function criarDemonstracao() {
    var LOJA = "Ateliê Flor de Sal";
    var vendas = [];

    /* v1: bolsa, prova forte, contestação aberta há 2 dias */
    var d1 = diasAtras(16), id1 = e2e(d1, "14:22", "a1B2c3D4e5F");
    vendas.push({
      id: "v1", criadaEm: new Date().toISOString(), valor: 28990, data: d1, hora: "14:22",
      cliente: { nome: "Mariana Lopes", doc: "123.456.789-09", telefone: "(61) 99876-5432" },
      produto: "Bolsa de palha artesanal, cor natural", e2e: id1, canal: "instagram", tipoEntrega: "envio",
      endereco: "Taguatinga - DF",
      rastreio: { codigo: "QB123456789BR", transportadora: "Correios", dataEnvio: diasAtras(15) },
      provas: [
        prova("pix", "comprovante-pix-mariana.png", svgComprovante({ valor: 28990, data: d1, hora: "14:22", pagador: "Mariana Lopes", recebedor: LOJA, e2e: id1 }), d1),
        prova("conversa", "conversa-instagram-1.png", svgConversa({ contato: "Mariana Lopes", canal: "Instagram Direct", data: d1, mensagens: [
          { de: "cliente", texto: "Oi! A bolsa de palha natural ainda tem?", hora: "13:58" },
          { de: "loja", texto: "Tem sim! Fica R$ 289,90 com frete para Taguatinga.", hora: "14:03" },
          { de: "cliente", texto: "Fechado, vou fazer o Pix agora. Manda o endereço de entrega certinho?", hora: "14:15" },
          { de: "cliente", texto: "Pronto, paguei! Segue o comprovante.", hora: "14:23" },
          { de: "loja", texto: "Recebido, obrigada! Envio amanhã cedo e te mando o rastreio.", hora: "14:30" }
        ] }), d1, "Combinação do pedido e confirmação do pagamento"),
        prova("nf", "nota-fiscal-0421.png", svgNota({ numero: "000.421", data: d1, cliente: "Mariana Lopes", produto: "Bolsa de palha artesanal", valor: 28990 }), d1),
        prova("entrega", "rastreio-entregue.png", svgEntrega({ codigo: "QB123456789BR", transportadora: "Correios", passos: [
          ["Objeto postado", br(diasAtras(15)) + " · Brasília - DF"], ["Em trânsito", br(diasAtras(14)) + " · Centro de distribuição"], ["Saiu para entrega", br(diasAtras(12)) + " · Taguatinga - DF"], ["Objeto entregue ao destinatário", br(diasAtras(12)) + " · 15:40"]
        ] }), diasAtras(12)),
        prova("foto", "foto-bolsa-palha.png", svgFoto({ forma: "bolsa", cor: "#d9b77e", cor2: "#8a6a3a", legenda: "Bolsa de palha" }), d1)
      ],
      eventos: [
        evento("pedido", d1, "13:58", "Cliente pediu a bolsa pelo Instagram Direct"),
        evento("entrega", diasAtras(12), "15:40", "Rastreio mostra o objeto entregue ao destinatário"),
        evento("conversa", diasAtras(11), "10:12", "Cliente agradeceu pela entrega no Direct")
      ],
      contestacao: { status: "aberta", dataAviso: diasAtras(2), motivo: "golpe", motivoTexto: "", prazoDias: 7, canalAviso: "App do banco", obs: "Aviso chegou pelo app do banco com bloqueio do valor.", abertaEm: hist("", 2).em, resolvidaEm: null, resultadoObs: "" },
      historico: [hist("Contestação aberta", 2), hist("Prova anexada: Comprovante de entrega", 11), hist("Venda registrada", 16)],
      dossieGeradoEm: null
    });

    /* v2: colares, prova média, contestação aberta há 5 dias (prazo perto) */
    var d2 = diasAtras(9), id2 = e2e(d2, "19:05", "Z9y8X7w6V5u");
    vendas.push({
      id: "v2", criadaEm: new Date().toISOString(), valor: 45900, data: d2, hora: "19:05",
      cliente: { nome: "Rafael Torres", doc: "", telefone: "(61) 98123-4567" },
      produto: "Kit com 3 colares banhados a ouro", e2e: id2, canal: "whatsapp", tipoEntrega: "propria",
      endereco: "Águas Claras - DF", rastreio: null,
      provas: [
        prova("pix", "comprovante-rafael.png", svgComprovante({ valor: 45900, data: d2, hora: "19:05", pagador: "Rafael Torres", recebedor: LOJA, e2e: id2 }), d2),
        prova("conversa", "whatsapp-rafael.png", svgConversa({ contato: "Rafael Torres", canal: "WhatsApp", data: d2, mensagens: [
          { de: "cliente", texto: "Boa noite, quero o kit dos 3 colares para presente.", hora: "18:40" },
          { de: "loja", texto: "Boa noite! R$ 459,00 e entrego amanhã em Águas Claras.", hora: "18:46" },
          { de: "cliente", texto: "Perfeito. Pix feito.", hora: "19:06" }
        ] }), d2)
      ],
      eventos: [evento("pedido", d2, "18:40", "Pedido pelo WhatsApp para presente"), evento("entrega", diasAtras(8), "11:00", "Entregue por motoboy próprio na portaria")],
      contestacao: { status: "aberta", dataAviso: diasAtras(5), motivo: "nao-reconhece", motivoTexto: "", prazoDias: 7, canalAviso: "E-mail do banco", obs: "", abertaEm: hist("", 5).em, resolvidaEm: null, resultadoObs: "" },
      historico: [hist("Contestação aberta", 5), hist("Venda registrada", 9)],
      dossieGeradoEm: null
    });

    /* v3: vestido, prova forte, sem contestação */
    var d3 = diasAtras(6), id3 = e2e(d3, "10:41", "Qw3Er4Ty5Ui");
    vendas.push({
      id: "v3", criadaEm: new Date().toISOString(), valor: 38900, data: d3, hora: "10:41",
      cliente: { nome: "Juliana Prado", doc: "987.654.321-00", telefone: "(11) 97654-3210" },
      produto: "Vestido midi de linho, tamanho M", e2e: id3, canal: "loja", tipoEntrega: "envio", endereco: "São Paulo - SP",
      rastreio: { codigo: "JD987654321BR", transportadora: "Jadlog", dataEnvio: diasAtras(5) },
      provas: [
        prova("pix", "pix-juliana.png", svgComprovante({ valor: 38900, data: d3, hora: "10:41", pagador: "Juliana Prado", recebedor: LOJA, e2e: id3 }), d3),
        prova("nf", "nf-0433.png", svgNota({ numero: "000.433", data: d3, cliente: "Juliana Prado", produto: "Vestido midi de linho", valor: 38900 }), d3),
        prova("entrega", "entrega-jadlog.png", svgEntrega({ codigo: "JD987654321BR", transportadora: "Jadlog", passos: [["Coletado", br(diasAtras(5))], ["Em rota", br(diasAtras(3))], ["Entregue ao destinatário", br(diasAtras(2)) + " · 10:15"]] }), diasAtras(2)),
        prova("conversa", "chat-loja-juliana.png", svgConversa({ contato: "Juliana Prado", canal: "Chat da loja online", data: d3, mensagens: [
          { de: "cliente", texto: "O vestido M serve para 1,65m?", hora: "10:20" },
          { de: "loja", texto: "Serve sim, o comprimento fica abaixo do joelho.", hora: "10:24" }
        ] }), d3),
        prova("foto", "foto-vestido.png", svgFoto({ forma: "vestido", cor: "#7d9a8c", cor2: "#3e5a4d", legenda: "Vestido de linho" }), d3)
      ],
      eventos: [evento("pedido", d3, "10:38", "Pedido na loja online"), evento("entrega", diasAtras(2), "10:15", "Entregue em São Paulo - SP")],
      contestacao: null, historico: [hist("Venda registrada", 6)], dossieGeradoEm: null
    });

    /* v4: brinco, sem prova */
    var d4 = diasAtras(1), id4 = e2e(d4, "16:12", "Mn7Bv6Cx5Za");
    vendas.push({
      id: "v4", criadaEm: new Date().toISOString(), valor: 12990, data: d4, hora: "16:12",
      cliente: { nome: "Bruna Saraiva", doc: "", telefone: "(61) 99111-2233" },
      produto: "Brinco argola dourada média", e2e: id4, canal: "instagram", tipoEntrega: "envio", endereco: "Goiânia - GO",
      rastreio: null, provas: [], eventos: [], contestacao: null, historico: [hist("Venda registrada", 1)], dossieGeradoEm: null
    });

    /* v5: sandália, prova fraca, retirada */
    var d5 = diasAtras(3), id5 = e2e(d5, "11:30", "Lk9Jh8Gf7Ds");
    vendas.push({
      id: "v5", criadaEm: new Date().toISOString(), valor: 24900, data: d5, hora: "11:30",
      cliente: { nome: "Carlos Mendes", doc: "", telefone: "(61) 98444-5566" },
      produto: "Sandália de couro, número 38", e2e: "", canal: "whatsapp", tipoEntrega: "retirada", endereco: "",
      rastreio: null,
      provas: [prova("pix", "pix-carlos.png", svgComprovante({ valor: 24900, data: d5, hora: "11:30", pagador: "Carlos Mendes", recebedor: LOJA, e2e: id5 }), d5)],
      eventos: [], contestacao: null, historico: [hist("Venda registrada", 3)], dossieGeradoEm: null
    });

    /* v6: cesto, contestação ganha */
    var d6 = diasAtras(48), id6 = e2e(d6, "09:15", "Po1Iu2Yt3Re");
    vendas.push({
      id: "v6", criadaEm: new Date().toISOString(), valor: 17800, data: d6, hora: "09:15",
      cliente: { nome: "Patrícia Nogueira", doc: "111.444.777-35", telefone: "(31) 99222-3344" },
      produto: "Cesto organizador de fibra (2 unidades)", e2e: id6, canal: "loja", tipoEntrega: "envio", endereco: "Belo Horizonte - MG",
      rastreio: { codigo: "LG55511122BR", transportadora: "Loggi", dataEnvio: diasAtras(47) },
      provas: [
        prova("pix", "pix-patricia.png", svgComprovante({ valor: 17800, data: d6, hora: "09:15", pagador: "Patrícia Nogueira", recebedor: LOJA, e2e: id6 }), d6),
        prova("nf", "nf-0388.png", svgNota({ numero: "000.388", data: d6, cliente: "Patrícia Nogueira", produto: "Cesto organizador (2 un.)", valor: 17800 }), d6),
        prova("entrega", "entrega-loggi.png", svgEntrega({ codigo: "LG55511122BR", transportadora: "Loggi", passos: [["Coletado", br(diasAtras(47))], ["Entregue", br(diasAtras(45))]] }), diasAtras(45)),
        prova("foto", "foto-cesto.png", svgFoto({ forma: "caixa", cor: "#c9a978", cor2: "#9b7d50", legenda: "Cesto de fibra" }), d6)
      ],
      eventos: [evento("entrega", diasAtras(45), "14:00", "Entregue em Belo Horizonte - MG")],
      contestacao: { status: "ganha", dataAviso: diasAtras(40), motivo: "golpe", motivoTexto: "", prazoDias: 7, canalAviso: "App do banco", obs: "", abertaEm: hist("", 40).em, resolvidaEm: hist("", 30).em, resultadoObs: "Instituição manteve o valor na conta da loja." },
      historico: [hist("Contestação marcada como ganha", 30), hist("Dossiê gerado para impressão ou PDF", 39), hist("Contestação aberta", 40), hist("Venda registrada", 48)],
      dossieGeradoEm: hist("", 39).em
    });

    /* v7: bolsa tiracolo, contestação perdida */
    var d7 = diasAtras(70), id7 = e2e(d7, "20:48", "As4Df5Gh6Jk");
    vendas.push({
      id: "v7", criadaEm: new Date().toISOString(), valor: 52000, data: d7, hora: "20:48",
      cliente: { nome: "Diego Albuquerque", doc: "", telefone: "(21) 98777-6655" },
      produto: "Bolsa tiracolo de couro, caramelo", e2e: id7, canal: "instagram", tipoEntrega: "propria", endereco: "Rio de Janeiro - RJ",
      rastreio: null,
      provas: [prova("pix", "pix-diego.png", svgComprovante({ valor: 52000, data: d7, hora: "20:48", pagador: "Diego Albuquerque", recebedor: LOJA, e2e: id7 }), d7),
        prova("foto", "foto-tiracolo.png", svgFoto({ forma: "bolsa", cor: "#a0643a", cor2: "#5e3a1f", legenda: "Bolsa tiracolo" }), d7)],
      eventos: [],
      contestacao: { status: "perdida", dataAviso: diasAtras(62), motivo: "nao-recebeu", motivoTexto: "", prazoDias: 7, canalAviso: "Ligação do banco", obs: "", abertaEm: hist("", 62).em, resolvidaEm: hist("", 50).em, resultadoObs: "Sem comprovante de entrega. Valor devolvido ao pagador." },
      historico: [hist("Contestação marcada como perdida", 50), hist("Contestação aberta", 62), hist("Venda registrada", 70)],
      dossieGeradoEm: null
    });

    /* v8: lenço, prova média */
    var d8 = diasAtras(12), id8 = e2e(d8, "15:02", "Ui8Op9As0Df");
    vendas.push({
      id: "v8", criadaEm: new Date().toISOString(), valor: 9800, data: d8, hora: "15:02",
      cliente: { nome: "Helena Castro", doc: "", telefone: "" },
      produto: "Lenço de seda estampado", e2e: id8, canal: "loja", tipoEntrega: "envio", endereco: "Curitiba - PR",
      rastreio: { codigo: "QB998877665BR", transportadora: "Correios", dataEnvio: diasAtras(11) },
      provas: [
        prova("pix", "pix-helena.png", svgComprovante({ valor: 9800, data: d8, hora: "15:02", pagador: "Helena Castro", recebedor: LOJA, e2e: id8 }), d8),
        prova("nf", "nf-0425.png", svgNota({ numero: "000.425", data: d8, cliente: "Helena Castro", produto: "Lenço de seda estampado", valor: 9800 }), d8)
      ],
      eventos: [], contestacao: null, historico: [hist("Venda registrada", 12)], dossieGeradoEm: null
    });

    return {
      loja: { nome: LOJA, cnpj: "12.345.678/0001-95", responsavel: "Camila Duarte", cidade: "Brasília - DF", contato: "(61) 3333-0000", logo: null, prazoPadraoDias: 7 },
      vendas: vendas
    };
  }

  window.DPData = {
    CANAIS: CANAIS,
    ENTREGAS: ENTREGAS,
    TIPOS_PROVA: TIPOS_PROVA,
    TIPOS_EVENTO: TIPOS_EVENTO,
    MOTIVOS: MOTIVOS,
    TRANSPORTADORAS: TRANSPORTADORAS,
    criarDemonstracao: criarDemonstracao
  };
})();
