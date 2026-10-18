/* Dossiê Pix · telas e interações
   Lê e grava tudo por window.DPStore (store.js). Listas fixas em window.DPData (data.js). */
(function () {
  "use strict";

  var D = window.DPData;
  var S = window.DPStore;
  var view = document.getElementById("view");

  /* ================= utilidades ================= */
  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function $$(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function ic(nome, extra) {
    return '<i data-lucide="' + nome + '" aria-hidden="true"' + (extra ? ' class="' + extra + '"' : "") + "></i>";
  }
  function brl(c) {
    return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function isoLocal(d) {
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function hoje() {
    return isoLocal(new Date());
  }
  function fmtData(iso) {
    return iso ? iso.split("-").reverse().join("/") : "—";
  }
  function fmtDataHora(ts) {
    var d = new Date(ts);
    return fmtData(isoLocal(d)) + " às " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function dataExtenso() {
    return new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  }
  function meioDia(iso) {
    var p = iso.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2], 12);
  }
  function somarDias(iso, n) {
    var d = meioDia(iso);
    d.setDate(d.getDate() + Number(n));
    return isoLocal(d);
  }
  function diasEntre(a, b) {
    return Math.round((meioDia(b) - meioDia(a)) / 86400000);
  }
  function rotulo(lista, chave) {
    for (var i = 0; i < lista.length; i++) if (lista[i][0] === chave) return lista[i][1];
    return chave || "—";
  }
  function soDigitos(s) {
    return String(s || "").replace(/\D/g, "");
  }
  function tamanhoFmt(b) {
    if (b < 1024) return b + " B";
    if (b < 1024 * 1024) return Math.round(b / 1024) + " KB";
    return (b / 1024 / 1024).toFixed(1).replace(".", ",") + " MB";
  }
  function minusc(t) {
    return /^[A-Z][a-z]/.test(t) || /^[ÁÉÍÓÚÇ][a-z]/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t;
  }
  function plural(n, um, varios) {
    return n + " " + (n === 1 ? um : varios);
  }

  /* Valor em reais digitado ("1.234,56", "89,9", "120") para centavos */
  function lerValor(txt) {
    var s = String(txt || "").replace(/[R$\s]/g, "");
    if (!s) return NaN;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if (!/^\d+\.\d{1,2}$/.test(s)) s = s.replace(/\./g, "");
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
    return Math.round(parseFloat(s) * 100);
  }
  function valorInput(c) {
    return (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* CPF/CNPJ e telefone */
  function mascaraDoc(v) {
    var d = soDigitos(v).slice(0, 14);
    if (d.length <= 11) {
      return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
    }
    return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }
  function cpfValido(c) {
    c = soDigitos(c);
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    for (var t = 9; t < 11; t++) {
      var s = 0;
      for (var i = 0; i < t; i++) s += +c[i] * (t + 1 - i);
      var dv = ((s * 10) % 11) % 10;
      if (dv !== +c[t]) return false;
    }
    return true;
  }
  function cnpjValido(c) {
    c = soDigitos(c);
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    function dv(base) {
      var pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      var s = 0;
      for (var i = 0; i < pesos.length; i++) s += +base[i] * pesos[i];
      var r = s % 11;
      return r < 2 ? 0 : 11 - r;
    }
    return dv(c.slice(0, 12)) === +c[12] && dv(c.slice(0, 13)) === +c[13];
  }
  function docOculto(doc) {
    var d = soDigitos(doc);
    if (d.length === 11) return "***." + d.slice(3, 6) + "." + d.slice(6, 9) + "-**";
    return doc || "";
  }
  function mascaraTel(v) {
    var d = soDigitos(v).slice(0, 11);
    if (d.length <= 2) return d.length ? "(" + d : "";
    if (d.length <= 6) return "(" + d.slice(0, 2) + ") " + d.slice(2);
    if (d.length <= 10) return "(" + d.slice(0, 2) + ") " + d.slice(2, 6) + "-" + d.slice(6);
    return "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
  }

  /* ================= regras do produto ================= */
  var NIVEIS = {
    sem: { rotulo: "Sem prova", icone: "circle-dashed" },
    fraca: { rotulo: "Prova fraca", icone: "shield-x" },
    media: { rotulo: "Prova média", icone: "shield-half" },
    forte: { rotulo: "Prova forte", icone: "shield-check" }
  };

  function forca(v) {
    var ent = v.tipoEntrega;
    function tem(t) {
      return v.provas.some(function (p) {
        return p.tipo === t;
      });
    }
    var itens = [
      { chave: "pix", rotulo: "Comprovante do Pix", peso: 20, ok: tem("pix"), porque: "Mostra que o pagamento saiu da conta do cliente para a sua, com valor, data e horário.", acao: "upload" },
      { chave: "e2e", rotulo: "ID da transação Pix (E2E)", peso: 10, ok: !!v.e2e, porque: "É o código único deste Pix. Ajuda a instituição a achar exatamente esta transação.", acao: "editar" },
      { chave: "nf", rotulo: "Nota fiscal ou recibo", peso: 15, ok: tem("nf"), porque: "Liga o pagamento a um produto vendido, com descrição e valor.", acao: "upload" },
      { chave: "rastreio", rotulo: "Código de rastreio e transportadora", peso: 15, na: ent !== "envio", ok: !!v.rastreio || tem("rastreio"), porque: "Mostra que o pedido foi postado para o endereço do cliente.", acao: "rastreio" },
      {
        chave: "entrega",
        rotulo: ent === "retirada" ? "Comprovante de retirada" : ent === "digital" ? "Comprovante de envio ou acesso" : "Comprovante de entrega",
        peso: 20,
        ok: tem("entrega"),
        porque:
          ent === "retirada"
            ? "Recibo assinado, foto ou registro de que o cliente retirou o produto."
            : ent === "digital"
            ? "Print do e-mail com o arquivo, do acesso liberado ou do serviço prestado."
            : "Mostra que o produto chegou. Costuma ser o que mais pesa quando o cliente diz que não recebeu.",
        acao: "upload"
      },
      { chave: "conversa", rotulo: "Prints da conversa com o cliente", peso: 15, ok: tem("conversa"), porque: "Mostra que o cliente combinou a compra e sabia o que estava pagando.", acao: "upload" },
      { chave: "foto", rotulo: "Foto do produto", peso: 5, ok: tem("foto"), porque: "Ajuda quem analisa a entender o que foi vendido.", acao: "upload" }
    ];
    var validos = itens.filter(function (i) {
      return !i.na;
    });
    var total = 0, feito = 0;
    validos.forEach(function (i) {
      total += i.peso;
      if (i.ok) feito += i.peso;
    });
    var pct = Math.round((feito / total) * 100);
    var okPix = itens[0].ok, okEntrega = itens[4].ok;
    var nivel;
    if (!v.provas.length && !v.rastreio) nivel = "sem";
    else if (pct >= 75 && okPix && okEntrega) nivel = "forte";
    else if (pct >= 40) nivel = "media";
    else nivel = "fraca";
    var faltam = validos.filter(function (i) {
      return !i.ok;
    });
    return { nivel: nivel, pct: pct, itens: itens, validos: validos, faltam: faltam, feitos: validos.length - faltam.length };
  }

  function prazo(c) {
    var limite = somarDias(c.dataAviso, c.prazoDias);
    var r = diasEntre(hoje(), limite);
    var estado = r < 0 ? "vencido" : r === 0 ? "hoje" : r <= 2 ? "perto" : "ok";
    var texto =
      r < 0 ? "Prazo passou há " + plural(-r, "dia", "dias") : r === 0 ? "Vence hoje" : r === 1 ? "Falta 1 dia" : "Faltam " + r + " dias";
    return { limite: limite, restantes: r, estado: estado, texto: texto };
  }

  function linhaDoTempo(v) {
    var itens = v.eventos.map(function (e) {
      return Object.assign({ manual: true }, e);
    });
    itens.push({
      tipo: "pagamento",
      data: v.data,
      hora: v.hora,
      descricao: "Pix de " + brl(v.valor) + " recebido de " + v.cliente.nome + (v.e2e ? " (ID " + v.e2e + ")" : "")
    });
    if (v.rastreio && v.rastreio.dataEnvio) {
      itens.push({ tipo: "envio", data: v.rastreio.dataEnvio, hora: "", descricao: "Pedido postado: " + v.rastreio.transportadora + ", rastreio " + v.rastreio.codigo });
    }
    if (v.contestacao) {
      itens.push({ tipo: "contestacao", data: v.contestacao.dataAviso, hora: "", descricao: "Aviso de pedido de devolução pelo MED: " + motivoTexto(v.contestacao) });
      if (v.contestacao.resolvidaEm) {
        itens.push({
          tipo: "contestacao",
          data: isoLocal(new Date(v.contestacao.resolvidaEm)),
          hora: "",
          descricao: v.contestacao.status === "ganha" ? "Contestação resolvida a favor da loja" : "Contestação resolvida contra a loja"
        });
      }
    }
    return itens.sort(function (a, b) {
      return (a.data + (a.hora || "00:00")).localeCompare(b.data + (b.hora || "00:00"));
    });
  }

  function motivoTexto(c) {
    return c.motivo === "outro" && c.motivoTexto ? c.motivoTexto : rotulo(D.MOTIVOS, c.motivo);
  }

  function filtrar(lista, filtro) {
    return lista.filter(function (v) {
      var n = forca(v).nivel;
      var st = v.contestacao && v.contestacao.status;
      if (filtro === "sem-prova") return n === "sem";
      if (filtro === "fraca") return n === "fraca";
      if (filtro === "contestadas") return st === "aberta";
      if (filtro === "resolvidas") return st === "ganha" || st === "perdida";
      return true;
    });
  }

  /* ================= pedaços de interface ================= */
  function badgeForca(v, f) {
    f = f || forca(v);
    return '<span class="badge badge--' + f.nivel + '">' + ic(NIVEIS[f.nivel].icone) + NIVEIS[f.nivel].rotulo + "</span>";
  }
  function badgeContestacao(v) {
    var c = v.contestacao;
    if (!c) return "";
    if (c.status === "aberta") {
      var p = prazo(c);
      return '<span class="badge badge--prazo-' + p.estado + '">' + ic("timer") + "Contestada · " + p.texto.toLowerCase() + "</span>";
    }
    if (c.status === "ganha") return '<span class="badge badge--ganha">' + ic("trophy") + "Contestação ganha</span>";
    return '<span class="badge badge--perdida">' + ic("x-circle") + "Contestação perdida</span>";
  }
  function seloExemplo() {
    return '<span class="selo-exemplo" title="Valor configurado por você. Confira o prazo real com sua instituição.">' + ic("info") + "prazo configurado</span>";
  }
  function vazio(icone, titulo, texto, acoes) {
    return '<div class="empty">' + '<span class="empty__icon">' + ic(icone) + "</span><h2>" + titulo + "</h2><p>" + texto + "</p>" + (acoes ? '<div class="empty__actions">' + acoes + "</div>" : "") + "</div>";
  }
  function linhaVenda(v) {
    var f = forca(v);
    return (
      '<li><a class="vrow" href="#venda/' + v.id + '">' +
      '<span class="vrow__main"><strong>' + esc(v.produto) + "</strong>" +
      '<span class="vrow__meta">' + esc(v.cliente.nome) + " · " + esc(rotulo(D.CANAIS, v.canal)) + " · " + fmtData(v.data) + "</span></span>" +
      '<span class="vrow__side"><span class="vrow__valor">' + brl(v.valor) + "</span>" +
      '<span class="vrow__badges">' + badgeForca(v, f) + badgeContestacao(v) + "</span></span>" +
      ic("chevron-right", "vrow__chev") +
      "</a></li>"
    );
  }
  function linhaContestacao(v) {
    var p = prazo(v.contestacao);
    return (
      '<li class="crow crow--' + p.estado + '">' +
      '<div class="countdown countdown--' + p.estado + '" aria-hidden="true"><strong>' + Math.abs(p.restantes) + "</strong><span>" + (p.restantes < 0 ? "dias atrás" : p.restantes === 1 ? "dia" : "dias") + "</span></div>" +
      '<div class="crow__main"><a href="#venda/' + v.id + '"><strong>' + esc(v.cliente.nome) + "</strong> · " + esc(v.produto) + "</a>" +
      '<span class="crow__meta"><span class="crow__prazo">' + p.texto + "</span> · até " + fmtData(p.limite) + " " + seloExemplo() + "</span>" +
      '<span class="crow__meta">' + esc(motivoTexto(v.contestacao)) + "</span></div>" +
      '<div class="crow__side"><span class="vrow__valor">' + brl(v.valor) + "</span>" + badgeForca(v) +
      '<a class="btn btn--secondary btn--sm" href="#dossie/' + v.id + '">' + ic("file-down") + "Dossiê</a></div>" +
      "</li>"
    );
  }

  /* ================= toasts e diálogos ================= */
  function toast(msg, opts) {
    opts = opts || {};
    var box = document.getElementById("toasts");
    var t = document.createElement("div");
    t.className = "toast" + (opts.tipo ? " toast--" + opts.tipo : "");
    t.innerHTML = ic(opts.tipo === "erro" ? "alert-triangle" : "check-circle-2") + '<span class="toast__msg">' + esc(msg) + "</span>";
    if (opts.acao) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "toast__btn";
      b.textContent = opts.acao.rotulo;
      b.addEventListener("click", function () {
        t.remove();
        opts.acao.fn();
      });
      t.appendChild(b);
    }
    var fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "toast__close";
    fechar.setAttribute("aria-label", "Fechar aviso");
    fechar.innerHTML = ic("x");
    fechar.addEventListener("click", function () {
      t.remove();
    });
    t.appendChild(fechar);
    box.appendChild(t);
    icones(t);
    setTimeout(function () {
      t.remove();
    }, opts.acao ? 8000 : 5000);
  }

  function dialogo(o) {
    var dlg = document.getElementById("modal");
    return new Promise(function (resolver) {
      dlg.innerHTML =
        '<form method="dialog" class="modal__box">' +
        '<h2 id="modal-title">' + o.titulo + "</h2>" +
        (o.texto ? '<p class="modal__text">' + o.texto + "</p>" : "") +
        (o.corpo || "") +
        '<div class="modal__actions">' +
        '<button class="btn btn--ghost" value="cancelar" type="submit">' + (o.cancelar || "Cancelar") + "</button>" +
        (o.botoes || '<button class="btn ' + (o.perigo ? "btn--danger" : "btn--primary") + '" value="ok" type="submit">' + (o.ok || "Confirmar") + "</button>") +
        "</div></form>";
      icones(dlg);
      function fechou() {
        dlg.removeEventListener("close", fechou);
        var extra = {};
        $$("[name]", dlg).forEach(function (el) {
          extra[el.name] = el.value;
        });
        resolver(dlg.returnValue && dlg.returnValue !== "cancelar" ? { valor: dlg.returnValue, campos: extra } : null);
      }
      dlg.returnValue = "";
      dlg.addEventListener("close", fechou);
      dlg.showModal();
      var foco = $("[autofocus]", dlg) || $(".modal__actions .btn:last-child", dlg);
      if (foco) foco.focus();
    });
  }

  function salvarComSeguranca(fn, sucesso) {
    try {
      var r = fn();
      if (sucesso) toast(sucesso);
      return r === undefined ? true : r;
    } catch (e) {
      toast(e.message || "Não foi possível salvar.", { tipo: "erro" });
      return false;
    }
  }

  /* ================= formulários: erros ================= */
  function mostrarErros(form, erros, titulo) {
    $$(".field--erro", form).forEach(function (f) {
      f.classList.remove("field--erro");
    });
    $$("[aria-invalid]", form).forEach(function (el) {
      el.removeAttribute("aria-invalid");
    });
    $$(".field__erro", form).forEach(function (el) {
      el.textContent = "";
    });
    var resumo = $(".form-summary", form);
    var chaves = Object.keys(erros);
    if (!chaves.length) {
      if (resumo) resumo.hidden = true;
      return true;
    }
    chaves.forEach(function (k) {
      var el = form.elements[k];
      var campo = $('[data-field="' + k + '"]', form);
      if (campo) campo.classList.add("field--erro");
      if (el && el.setAttribute) el.setAttribute("aria-invalid", "true");
      if (el && el.length && !el.tagName) el[0].closest("fieldset").setAttribute("aria-invalid", "true");
      var msg = $("#" + k + "-erro", form);
      if (msg) msg.textContent = erros[k];
    });
    if (resumo) {
      resumo.hidden = false;
      resumo.innerHTML =
        "<h2>" + ic("alert-triangle") + (titulo || "Confira " + plural(chaves.length, "campo", "campos") + " antes de salvar") + "</h2><ul>" +
        chaves.map(function (k) {
          return '<li><a href="#f-' + k + '" data-foco="' + k + '">' + erros[k] + "</a></li>";
        }).join("") + "</ul>";
      icones(resumo);
      resumo.focus();
    }
    return false;
  }

  /* ================= arquivos ================= */
  var LIM_IMG = 1.5 * 1024 * 1024;
  var LIM_PDF = 1024 * 1024;
  var LIM_BRUTO = 25 * 1024 * 1024;

  function lerDataURL(file) {
    return new Promise(function (ok, falha) {
      var r = new FileReader();
      r.onload = function () {
        ok(r.result);
      };
      r.onerror = function () {
        falha(new Error("Não consegui ler esse arquivo. Tente de novo."));
      };
      r.readAsDataURL(file);
    });
  }
  function carregarImagem(src) {
    return new Promise(function (ok, falha) {
      var img = new Image();
      img.onload = function () {
        ok(img);
      };
      img.onerror = function () {
        falha(new Error("Não consegui abrir essa imagem. Tente salvar de novo como JPG ou PNG."));
      };
      img.src = src;
    });
  }
  function bytesDe(dataUrl) {
    return Math.round((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
  }
  function compactar(img, lado, qualidade) {
    var w = img.naturalWidth, h = img.naturalHeight;
    var esc = Math.min(1, lado / Math.max(w, h));
    var c = document.createElement("canvas");
    c.width = Math.round(w * esc);
    c.height = Math.round(h * esc);
    var ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", qualidade);
  }
  /* Prepara um arquivo para guardar: imagens grandes são compactadas; PDFs têm limite. */
  function prepararArquivo(file, opts) {
    opts = opts || {};
    var maxLado = opts.maxLado || 1600, limite = opts.limite || LIM_IMG;
    if (file.type === "application/pdf") {
      if (opts.soImagem) return Promise.reject(new Error("Para o logo, envie uma imagem (JPG, PNG ou WEBP)."));
      if (file.size > LIM_PDF) {
        return Promise.reject(
          new Error("Esse PDF tem " + tamanhoFmt(file.size) + ". Nesta versão o limite é 1 MB por PDF, porque os arquivos ficam guardados no próprio navegador. Tente enviar um print da página principal.")
        );
      }
      return lerDataURL(file).then(function (u) {
        return { dataUrl: u, mime: file.type, tamanho: file.size, compactada: false };
      });
    }
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      return Promise.reject(new Error("Esse formato não é aceito. Envie uma imagem (JPG, PNG ou WEBP) ou um PDF."));
    }
    if (file.size > LIM_BRUTO) {
      return Promise.reject(new Error("Essa imagem tem " + tamanhoFmt(file.size) + ", grande demais para abrir aqui. Tire um print da tela ou envie uma foto menor."));
    }
    return lerDataURL(file)
      .then(function (u) {
        return carregarImagem(u).then(function (img) {
          return { u: u, img: img };
        });
      })
      .then(function (r) {
        var grande = file.size > 500 * 1024 || Math.max(r.img.naturalWidth, r.img.naturalHeight) > maxLado;
        if (!grande) return { dataUrl: r.u, mime: file.type, tamanho: file.size, compactada: false };
        var tentativas = [[maxLado, 0.82], [Math.round(maxLado * 0.8), 0.72], [Math.round(maxLado * 0.64), 0.6]];
        for (var i = 0; i < tentativas.length; i++) {
          var out = compactar(r.img, tentativas[i][0], tentativas[i][1]);
          if (bytesDe(out) <= limite) return { dataUrl: out, mime: "image/jpeg", tamanho: bytesDe(out), compactada: true, original: file.size };
        }
        throw new Error("Mesmo compactada, essa imagem passou do limite de " + tamanhoFmt(limite) + ". Tente um print só da parte importante.");
      });
  }
  function baixarDataURL(dataUrl, nome) {
    var partes = dataUrl.split(","), mime = partes[0].match(/:(.*?)[;,]/)[1];
    var bin = partes[0].indexOf("base64") >= 0 ? atob(partes[1]) : decodeURIComponent(partes[1]);
    var arr = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    var url = URL.createObjectURL(new Blob([arr], { type: mime }));
    var a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 2000);
  }

  /* ================= navegação ================= */
  var NAV = [
    ["painel", "layout-dashboard", "Painel"],
    ["vendas", "list", "Vendas"],
    ["nova-venda", "circle-plus", "Nova venda"],
    ["contestacoes", "shield-alert", "Contestações"],
    ["ajustes", "settings", "Ajustes"]
  ];
  var ATIVO = { venda: "vendas", "venda-salva": "nova-venda", editar: "vendas", dossie: "vendas", contestar: "contestacoes" };
  var ATALHOS = [
    ["painel", "Painel"],
    ["vendas", "Lista de vendas"],
    ["vendas/sem-prova", "Vendas sem prova"],
    ["nova-venda", "Registrar venda"],
    ["venda-salva/v4", "Venda registrada"],
    ["venda/v5", "Venda e provas"],
    ["contestar/v3", "Abrir contestação"],
    ["dossie/v1", "Dossiê para PDF"],
    ["contestacoes", "Contestações e histórico"],
    ["ajustes", "Ajustes da loja"],
    ["venda/nao-existe", "Erro: venda não encontrada"]
  ];

  function desenharNav(rota) {
    var abertas = S.listarVendas().filter(function (v) {
      return v.contestacao && v.contestacao.status === "aberta";
    }).length;
    var atual = ATIVO[rota] || rota;
    var html = NAV.map(function (n) {
      var cont = n[0] === "contestacoes" && abertas ? '<span class="nav__count" aria-label="' + abertas + ' abertas">' + abertas + "</span>" : "";
      return '<a href="#' + n[0] + '"' + (atual === n[0] ? ' aria-current="page"' : "") + ">" + ic(n[1]) + "<span>" + n[2] + "</span>" + cont + "</a>";
    }).join("");
    document.getElementById("side-nav").innerHTML = html;
    document.getElementById("bottom-nav").innerHTML = html;
    document.getElementById("side-links").innerHTML = ATALHOS.map(function (a) {
      return '<li><a href="#' + a[0] + '">' + a[1] + "</a></li>";
    }).join("");
  }

  function icones(raiz) {
    if (window.lucide && window.lucide.createIcons) {
      window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    }
  }

  var buscaVendas = "";

  function render() {
    var h = decodeURIComponent(location.hash.replace(/^#/, "")) || "painel";
    var partes = h.split("/");
    var rota = partes[0], param = partes[1], extra = partes[2];
    var tela = TELAS[rota] || telaNaoEncontrada;
    var r;
    try {
      r = tela(param, extra);
    } catch (e) {
      r = telaNaoEncontrada();
      if (window.console) console.warn(e);
    }
    document.body.dataset.rota = rota;
    desenharNav(rota);
    view.innerHTML = r.html;
    document.title = r.titulo + " · Dossiê Pix";
    if (r.montar) r.montar(view);
    icones();
    if (!r.semFoco) {
      var h1 = $("h1", view);
      if (h1) {
        h1.setAttribute("tabindex", "-1");
        if (render.jaRodou) h1.focus({ preventScroll: true });
      }
      window.scrollTo(0, 0);
    }
    render.jaRodou = true;
  }

  function ir(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  /* ================= telas ================= */
  var TELAS = {};

  /* ---------- Painel ---------- */
  TELAS.painel = function () {
    var loja = S.getLoja();
    var vendas = S.listarVendas();
    var head =
      '<header class="page-head"><div><p class="eyebrow">' + esc(dataExtenso()) + "</p><h1>Olá, " + esc(loja.nome || "lojista") + '</h1><p class="lead">O que precisa da sua atenção hoje.</p></div>' +
      '<a class="btn btn--primary" href="#nova-venda">' + ic("plus") + "Registrar venda</a></header>";
    if (!vendas.length) {
      return {
        titulo: "Painel",
        html: head + vazio("inbox", "Nenhuma venda registrada ainda", "Registre uma venda por Pix e anexe as provas no mesmo dia, enquanto o comprovante e a conversa estão à mão.", '<a class="btn btn--primary" href="#nova-venda">' + ic("plus") + "Registrar primeira venda</a>")
      };
    }
    var fs = vendas.map(function (v) {
      return { v: v, f: forca(v) };
    });
    var fortes = fs.filter(function (x) {
      return x.f.nivel === "forte";
    }).length;
    var abertas = vendas.filter(function (v) {
      return v.contestacao && v.contestacao.status === "aberta";
    }).sort(function (a, b) {
      return prazo(a.contestacao).restantes - prazo(b.contestacao).restantes;
    });
    var contestadas = fs.filter(function (x) {
      return x.v.contestacao;
    });
    var completas = contestadas.filter(function (x) {
      return x.f.nivel === "forte";
    }).length;
    var risco = abertas.reduce(function (s, v) {
      return s + v.valor;
    }, 0);
    var urgente = abertas[0] ? prazo(abertas[0].contestacao) : null;
    var precisam = fs.filter(function (x) {
      return (x.f.nivel === "sem" || x.f.nivel === "fraca") && !(x.v.contestacao && x.v.contestacao.status !== "aberta");
    }).slice(0, 5);

    var kpis =
      '<section class="kpis" aria-label="Resumo da loja">' +
      kpi("shield-check", "Vendas protegidas", fortes + '<small> de ' + vendas.length + "</small>", "com prova forte", "forte") +
      kpi("timer", "Contestações abertas", String(abertas.length), urgente ? "a mais urgente: " + urgente.texto.toLowerCase() : "nenhuma agora", urgente && urgente.estado !== "ok" ? "urgente" : "") +
      kpi("wallet", "Valor em risco", brl(risco), "em contestações abertas", risco ? "risco" : "") +
      kpi("folder-check", "Dossiês completos", contestadas.length ? Math.round((completas / contestadas.length) * 100) + "%" : "—", contestadas.length ? completas + " de " + plural(contestadas.length, "contestação", "contestações") + " com prova forte" : "nenhuma contestação ainda", "") +
      "</section>";

    var listaAbertas = abertas.length
      ? '<ul class="clist">' + abertas.map(linhaContestacao).join("") + "</ul>"
      : '<p class="muted-box">' + ic("shield-check") + "Nenhuma contestação aberta. Quando o banco avisar de um pedido de devolução, abra a contestação na própria venda.</p>";
    var listaPrecisam = precisam.length
      ? '<ul class="vlist vlist--compact">' + precisam.map(function (x) {
          return linhaVenda(x.v);
        }).join("") + "</ul>"
      : '<p class="muted-box">' + ic("sparkles") + "Todas as vendas têm pelo menos prova média. Bom trabalho.</p>";

    return {
      titulo: "Painel",
      html:
        head + kpis +
        '<div class="grid-2">' +
        '<section class="card" aria-labelledby="h-abertas"><div class="card__head"><h2 id="h-abertas">Contestações abertas</h2><a class="link" href="#contestacoes">Ver todas</a></div>' + listaAbertas + "</section>" +
        '<section class="card" aria-labelledby="h-precisam"><div class="card__head"><h2 id="h-precisam">Vendas que precisam de prova</h2><a class="link" href="#vendas/sem-prova">Ver todas</a></div>' + listaPrecisam + "</section>" +
        "</div>" +
        '<aside class="notice">' + ic("info") + "<p>Os prazos aparecem conforme o que você configurou. <strong>O prazo real depende das regras vigentes do Banco Central e da sua instituição; confira sempre no seu banco.</strong> O dossiê ajuda a organizar a defesa, mas não garante o resultado.</p></aside>"
    };
  };
  function kpi(icone, titulo, valor, sub, tom) {
    return '<div class="kpi' + (tom ? " kpi--" + tom : "") + '"><span class="kpi__icon">' + ic(icone) + '</span><p class="kpi__label">' + titulo + '</p><p class="kpi__value">' + valor + '</p><p class="kpi__sub">' + sub + "</p></div>";
  }

  /* ---------- Lista de vendas ---------- */
  var FILTROS = [
    ["todas", "Todas"],
    ["sem-prova", "Sem prova"],
    ["fraca", "Prova fraca"],
    ["contestadas", "Contestadas"],
    ["resolvidas", "Resolvidas"]
  ];
  TELAS.vendas = function (filtro) {
    filtro = filtro || "todas";
    var vendas = S.listarVendas();
    var head =
      '<header class="page-head"><div><h1>Vendas</h1><p class="lead">' + plural(vendas.length, "venda registrada", "vendas registradas") + ".</p></div>" +
      '<a class="btn btn--primary" href="#nova-venda">' + ic("plus") + "Registrar venda</a></header>";
    if (!vendas.length) {
      return {
        titulo: "Vendas",
        html: head + vazio("inbox", "Nenhuma venda registrada ainda", "Cada venda por Pix vira uma pasta de provas. Comece registrando a última venda que você fez.", '<a class="btn btn--primary" href="#nova-venda">' + ic("plus") + "Registrar venda</a>")
      };
    }
    var chips = FILTROS.map(function (f) {
      var n = f[0] === "todas" ? vendas.length : filtrar(vendas, f[0]).length;
      return '<button type="button" class="chip" data-filtro="' + f[0] + '" aria-pressed="' + (f[0] === filtro) + '">' + f[1] + ' <span class="chip__n">' + n + "</span></button>";
    }).join("");
    return {
      titulo: "Vendas",
      html:
        head +
        '<div class="toolbar">' +
        '<div class="search"><label for="busca" class="sr-only">Buscar venda</label>' + ic("search") +
        '<input id="busca" type="search" placeholder="Buscar por cliente, produto, ID do Pix ou valor" value="' + esc(buscaVendas) + '" autocomplete="off"></div>' +
        '<div class="chips" role="group" aria-label="Filtrar vendas">' + chips + "</div></div>" +
        '<p class="count" id="contagem" aria-live="polite"></p>' +
        '<div id="lista-vendas"></div>',
      montar: function (raiz) {
        var atual = filtro;
        function desenhar() {
          var termo = buscaVendas.trim().toLowerCase();
          var termoNum = soDigitos(termo);
          var lista = filtrar(vendas, atual).filter(function (v) {
            if (!termo) return true;
            var alvo = [v.produto, v.cliente.nome, v.e2e, v.cliente.telefone, rotulo(D.CANAIS, v.canal), brl(v.valor)].join(" ").toLowerCase();
            return alvo.indexOf(termo) >= 0 || (termoNum.length >= 2 && (soDigitos(brl(v.valor)).indexOf(termoNum) >= 0 || soDigitos(v.cliente.telefone).indexOf(termoNum) >= 0));
          });
          $("#contagem", raiz).textContent = lista.length === 1 ? "1 venda encontrada" : lista.length + " vendas encontradas";
          $("#lista-vendas", raiz).innerHTML = lista.length
            ? '<ul class="vlist">' + lista.map(linhaVenda).join("") + "</ul>"
            : vazio("search-x", "Nenhuma venda encontrada", "Nada bate com essa busca e esse filtro. Tente outro termo ou veja todas as vendas.", '<button type="button" class="btn btn--secondary" data-limpar>' + ic("eraser") + "Limpar busca e filtros</button>");
          icones();
        }
        $("#busca", raiz).addEventListener("input", function (e) {
          buscaVendas = e.target.value;
          desenhar();
        });
        raiz.addEventListener("click", function (e) {
          var c = e.target.closest("[data-filtro]");
          if (c) {
            atual = c.dataset.filtro;
            $$("[data-filtro]", raiz).forEach(function (b) {
              b.setAttribute("aria-pressed", String(b === c));
            });
            history.replaceState(null, "", atual === "todas" ? "#vendas" : "#vendas/" + atual);
            desenhar();
          }
          if (e.target.closest("[data-limpar]")) {
            buscaVendas = "";
            $("#busca", raiz).value = "";
            atual = "todas";
            $$("[data-filtro]", raiz).forEach(function (b) {
              b.setAttribute("aria-pressed", String(b.dataset.filtro === "todas"));
            });
            history.replaceState(null, "", "#vendas");
            desenhar();
            $("#busca", raiz).focus();
          }
        });
        desenhar();
      }
    };
  };

  /* ---------- Registrar / editar venda ---------- */
  function campo(o) {
    var id = "f-" + o.nome;
    var desc = [o.dica ? id + "-dica" : "", o.nome + "-erro"].filter(Boolean).join(" ");
    var input;
    if (o.tipo === "select") {
      input =
        '<select id="' + id + '" name="' + o.nome + '" aria-describedby="' + desc + '"' + (o.obrig ? " required" : "") + ">" +
        '<option value="">Escolha</option>' +
        o.opcoes.map(function (op) {
          return '<option value="' + op[0] + '"' + (op[0] === o.valor ? " selected" : "") + ">" + esc(op[1]) + "</option>";
        }).join("") + "</select>";
    } else if (o.tipo === "textarea") {
      input = '<textarea id="' + id + '" name="' + o.nome + '" rows="3" aria-describedby="' + desc + '">' + esc(o.valor || "") + "</textarea>";
    } else {
      input =
        (o.prefixo ? '<div class="input-pre"><span aria-hidden="true">' + o.prefixo + "</span>" : "") +
        '<input id="' + id + '" name="' + o.nome + '" type="' + (o.tipo || "text") + '" value="' + esc(o.valor == null ? "" : o.valor) + '" aria-describedby="' + desc + '"' +
        (o.attrs || "") + (o.obrig ? " required" : "") + ">" +
        (o.prefixo ? "</div>" : "");
    }
    return (
      '<div class="field' + (o.classe ? " " + o.classe : "") + '" data-field="' + o.nome + '">' +
      '<label for="' + id + '">' + o.rotulo + (o.obrig ? ' <span class="req" aria-hidden="true">*</span>' : ' <span class="opt">(opcional)</span>') + "</label>" +
      (o.dica ? '<p class="field__dica" id="' + id + '-dica">' + o.dica + "</p>" : "") +
      input +
      '<p class="field__erro" id="' + o.nome + '-erro"></p>' +
      (o.depois || "") +
      "</div>"
    );
  }

  function formVenda(v) {
    var edit = !!v;
    v = v || { valor: null, data: hoje(), hora: "", cliente: { nome: "", doc: "", telefone: "" }, produto: "", e2e: "", canal: "", tipoEntrega: "", endereco: "" };
    var titulo = edit ? "Editar venda" : "Registrar venda";
    return {
      titulo: titulo,
      html:
        (edit ? '<nav class="crumbs" aria-label="Caminho"><a href="#vendas">Vendas</a> ' + ic("chevron-right") + ' <a href="#venda/' + v.id + '">' + esc(v.produto) + "</a></nav>" : "") +
        '<header class="page-head"><div><h1>' + titulo + '</h1><p class="lead">' + (edit ? "Corrija o que for preciso. O histórico da venda registra a alteração." : "Leva menos de um minuto. Depois você anexa as provas.") + "</p></div></header>" +
        '<form class="form card" id="form-venda" novalidate>' +
        '<div class="form-summary" tabindex="-1" role="alert" hidden></div>' +
        '<p class="form__req">Campos com <span class="req">*</span> são obrigatórios.</p>' +
        '<fieldset><legend>' + ic("badge-dollar-sign") + "Pagamento</legend><div class=\"form-grid\">" +
        campo({ nome: "valor", rotulo: "Valor recebido", prefixo: "R$", obrig: true, valor: v.valor != null ? valorInput(v.valor) : "", attrs: ' inputmode="decimal" autocomplete="off" placeholder="0,00"', dica: "Use vírgula para os centavos. Ex.: 289,90" }) +
        campo({ nome: "data", rotulo: "Data do pagamento", tipo: "date", obrig: true, valor: v.data, attrs: ' max="' + hoje() + '"' }) +
        campo({ nome: "hora", rotulo: "Horário", tipo: "time", valor: v.hora }) +
        campo({ nome: "canal", rotulo: "Canal da venda", tipo: "select", obrig: true, opcoes: D.CANAIS, valor: v.canal }) +
        campo({
          nome: "e2e", rotulo: "ID da transação Pix (E2E)", valor: v.e2e, classe: "field--full", attrs: ' autocomplete="off" spellcheck="false" autocapitalize="characters" class="mono"',
          dica: "Fortalece o dossiê: é o código único deste Pix.",
          depois: '<p class="field__aviso" id="e2e-aviso" hidden></p><details class="help"><summary>Onde encontro esse ID?</summary><p>No comprovante do Pix, procure por "ID da transação", "Identificador" ou "E2E". Costuma ter 32 letras e números e começar com a letra E. Copie e cole aqui.</p></details>'
        }) +
        "</div></fieldset>" +
        '<fieldset><legend>' + ic("user") + "Cliente</legend><div class=\"form-grid\">" +
        campo({ nome: "nome", rotulo: "Nome do cliente", obrig: true, valor: v.cliente.nome, attrs: ' autocomplete="off"', classe: "field--full" }) +
        campo({ nome: "doc", rotulo: "CPF ou CNPJ", valor: v.cliente.doc, attrs: ' inputmode="numeric" autocomplete="off" placeholder="000.000.000-00"', dica: "Na lista aparece escondido; vai completo só no dossiê." }) +
        campo({ nome: "telefone", rotulo: "Telefone ou WhatsApp", tipo: "tel", valor: v.cliente.telefone, attrs: ' inputmode="tel" autocomplete="off" placeholder="(61) 99999-0000"' }) +
        "</div></fieldset>" +
        '<fieldset><legend>' + ic("package") + "Produto e entrega</legend><div class=\"form-grid\">" +
        campo({ nome: "produto", rotulo: "O que foi vendido", obrig: true, valor: v.produto, classe: "field--full", attrs: ' autocomplete="off" placeholder="Ex.: Bolsa de palha, cor natural"' }) +
        campo({ nome: "tipoEntrega", rotulo: "Como o produto chegou ao cliente", tipo: "select", obrig: true, opcoes: D.ENTREGAS, valor: v.tipoEntrega }) +
        campo({ nome: "endereco", rotulo: "Cidade de entrega", valor: v.endereco, attrs: ' autocomplete="off" placeholder="Ex.: Taguatinga - DF"' }) +
        "</div></fieldset>" +
        '<div class="form__actions"><a class="btn btn--ghost" href="' + (edit ? "#venda/" + v.id : "#vendas") + '">Cancelar</a>' +
        '<button class="btn btn--primary" type="submit">' + ic("check") + (edit ? "Salvar alterações" : "Salvar venda") + "</button></div>" +
        "</form>",
      montar: function (raiz) {
        var form = $("#form-venda", raiz);
        var el = form.elements;
        el.doc.addEventListener("input", function () {
          el.doc.value = mascaraDoc(el.doc.value);
        });
        el.telefone.addEventListener("input", function () {
          el.telefone.value = mascaraTel(el.telefone.value);
        });
        el.valor.addEventListener("blur", function () {
          var c = lerValor(el.valor.value);
          if (!isNaN(c) && c > 0) el.valor.value = valorInput(c);
        });
        function avisoE2E() {
          var s = el.e2e.value.trim().replace(/\s/g, "");
          var aviso = $("#e2e-aviso", form);
          if (s && !/^E[0-9A-Za-z]{31}$/.test(s)) {
            aviso.hidden = false;
            aviso.innerHTML = ic("alert-circle") + "Esse ID não parece completo (tem " + s.length + " caracteres). Confira no comprovante. Você pode salvar assim mesmo.";
            icones();
          } else aviso.hidden = true;
        }
        el.e2e.addEventListener("blur", avisoE2E);
        form.addEventListener("click", function (e) {
          var a = e.target.closest("[data-foco]");
          if (a) {
            e.preventDefault();
            var alvo = el[a.dataset.foco];
            if (alvo) alvo.focus();
          }
        });
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var erros = {};
          var valor = lerValor(el.valor.value);
          if (!el.valor.value.trim()) erros.valor = "Digite o valor recebido. Ex.: 289,90";
          else if (isNaN(valor)) erros.valor = "Valor inválido. Use só números e vírgula. Ex.: 1.250,00";
          else if (valor <= 0) erros.valor = "O valor precisa ser maior que zero.";
          if (!el.data.value) erros.data = "Informe a data em que o Pix caiu.";
          else if (el.data.value > hoje()) erros.data = "A data não pode ser no futuro.";
          if (!el.canal.value) erros.canal = "Escolha por onde a venda aconteceu.";
          if (el.nome.value.trim().length < 2) erros.nome = "Digite o nome do cliente, como aparece no comprovante.";
          var d = soDigitos(el.doc.value);
          if (d && !(d.length === 11 ? cpfValido(d) : d.length === 14 ? cnpjValido(d) : false)) erros.doc = "CPF ou CNPJ inválido. Confira os números ou deixe em branco.";
          var t = soDigitos(el.telefone.value);
          if (t && (t.length < 10 || t.length > 11)) erros.telefone = "Telefone incompleto. Use DDD + número. Ex.: (61) 99999-0000";
          if (el.produto.value.trim().length < 2) erros.produto = "Descreva o que foi vendido.";
          if (!el.tipoEntrega.value) erros.tipoEntrega = "Escolha como o produto chegou ao cliente.";
          if (!mostrarErros(form, erros)) return;
          var dados = {
            valor: valor, data: el.data.value, hora: el.hora.value, canal: el.canal.value,
            e2e: el.e2e.value.trim().replace(/\s/g, ""),
            cliente: { nome: el.nome.value.trim(), doc: el.doc.value.trim(), telefone: el.telefone.value.trim() },
            produto: el.produto.value.trim(), tipoEntrega: el.tipoEntrega.value, endereco: el.endereco.value.trim()
          };
          if (edit) {
            if (salvarComSeguranca(function () {
              S.atualizarVenda(v.id, dados);
            }, "Venda atualizada.")) ir("#venda/" + v.id);
          } else {
            var nova = salvarComSeguranca(function () {
              return S.criarVenda(dados);
            });
            if (nova) ir("#venda-salva/" + nova.id);
          }
        });
      }
    };
  }
  TELAS["nova-venda"] = function () {
    return formVenda(null);
  };
  TELAS.editar = function (id) {
    var v = S.getVenda(id);
    return v ? formVenda(v) : telaVendaSumiu();
  };

  /* ---------- Confirmação: venda registrada ---------- */
  TELAS["venda-salva"] = function (id) {
    var v = S.getVenda(id);
    if (!v) return telaVendaSumiu();
    var f = forca(v);
    return {
      titulo: "Venda registrada",
      html:
        '<section class="confirm card">' +
        '<span class="confirm__icon">' + ic("check") + "</span>" +
        "<h1>Venda registrada</h1>" +
        '<p class="confirm__resumo"><strong>' + brl(v.valor) + "</strong> · " + esc(v.produto) + " · " + esc(v.cliente.nome) + " · " + fmtData(v.data) + "</p>" +
        '<div class="confirm__next"><h2>Próximo passo: anexar as provas</h2>' +
        "<p>Faça isso agora, enquanto o comprovante e a conversa estão à mão. Hoje esta venda está assim: " + badgeForca(v, f) + "</p>" +
        '<ul class="mini-check">' + f.faltam.slice(0, 4).map(function (i) {
          return "<li>" + ic("circle") + esc(i.rotulo) + "</li>";
        }).join("") + "</ul></div>" +
        '<div class="confirm__actions"><a class="btn btn--primary" href="#venda/' + v.id + '/anexar">' + ic("paperclip") + "Anexar provas agora</a>" +
        '<a class="btn btn--secondary" href="#nova-venda">' + ic("plus") + "Registrar outra venda</a>" +
        '<a class="btn btn--ghost" href="#painel">Ir para o painel</a></div>' +
        "</section>"
    };
  };

  /* ---------- Detalhe da venda: provas, linha do tempo, contestação ---------- */
  TELAS.venda = function (id, extra) {
    var v = S.getVenda(id);
    if (!v) return telaVendaSumiu();
    var f = forca(v);
    var c = v.contestacao;
    var loja = S.getLoja();

    var acoes =
      '<a class="btn btn--primary" href="#dossie/' + v.id + '">' + ic("file-down") + "Gerar dossiê</a>" +
      (!c ? '<a class="btn btn--secondary" href="#contestar/' + v.id + '">' + ic("shield-alert") + "Abrir contestação</a>" : "") +
      '<a class="btn btn--ghost" href="#editar/' + v.id + '">' + ic("pencil") + "Editar</a>";

    var blocoContestacao = "";
    if (c && c.status === "aberta") {
      var p = prazo(c);
      blocoContestacao =
        '<section class="contest contest--' + p.estado + '" aria-labelledby="h-contest">' +
        '<div class="countdown countdown--' + p.estado + ' countdown--lg" aria-hidden="true"><strong>' + Math.abs(p.restantes) + "</strong><span>" + (p.restantes < 0 ? "dias atrás" : p.restantes === 1 ? "dia" : "dias") + "</span></div>" +
        '<div class="contest__body"><h2 id="h-contest">Contestação aberta · ' + p.texto.toLowerCase() + "</h2>" +
        "<p>Aviso em " + fmtData(c.dataAviso) + " (" + esc(c.canalAviso || "—") + "). Motivo alegado: " + esc(motivoTexto(c)) + ".</p>" +
        "<p>Prazo que você configurou: " + plural(Number(c.prazoDias), "dia", "dias") + ", até <strong>" + fmtData(p.limite) + "</strong> " + seloExemplo() + "</p>" +
        '<p class="contest__nota">Confira o prazo real com sua instituição: ele depende das regras vigentes do Banco Central e do seu banco.</p>' +
        '<div class="contest__actions">' +
        '<button type="button" class="btn btn--secondary btn--sm" data-resolver="ganha">' + ic("trophy") + "Marcar como ganha</button>" +
        '<button type="button" class="btn btn--secondary btn--sm" data-resolver="perdida">' + ic("x-circle") + "Marcar como perdida</button>" +
        '<a class="btn btn--ghost btn--sm" href="#contestar/' + v.id + '">' + ic("pencil") + "Editar dados</a></div></div></section>";
    } else if (c) {
      var ganhou = c.status === "ganha";
      blocoContestacao =
        '<section class="contest contest--' + c.status + '" aria-labelledby="h-contest">' +
        '<span class="contest__res">' + ic(ganhou ? "trophy" : "x-circle") + "</span>" +
        '<div class="contest__body"><h2 id="h-contest">Contestação ' + (ganhou ? "ganha" : "perdida") + "</h2>" +
        "<p>Aviso em " + fmtData(c.dataAviso) + ", resolvida em " + fmtDataHora(c.resolvidaEm) + ". Motivo alegado: " + esc(motivoTexto(c)) + ".</p>" +
        (c.resultadoObs ? "<p>Anotação: " + esc(c.resultadoObs) + "</p>" : "") +
        '<div class="contest__actions"><button type="button" class="btn btn--ghost btn--sm" data-action="reabrir">' + ic("undo-2") + "Desfazer resultado</button></div></div></section>";
    }

    var checklist =
      '<ul class="checklist">' +
      f.itens.map(function (i) {
        var estado = i.na ? "na" : i.ok ? "ok" : "falta";
        var botao = "";
        if (estado === "falta") {
          if (i.acao === "upload") botao = '<button type="button" class="btn btn--secondary btn--sm" data-anexar="' + i.chave + '">' + ic("paperclip") + "Anexar</button>";
          if (i.acao === "rastreio") botao = '<button type="button" class="btn btn--secondary btn--sm" data-ir-rastreio>' + ic("truck") + "Informar</button>";
          if (i.acao === "editar") botao = '<a class="btn btn--secondary btn--sm" href="#editar/' + v.id + '">' + ic("pencil") + "Adicionar</a>";
        }
        return (
          '<li class="check check--' + estado + '">' +
          ic(estado === "ok" ? "check-circle-2" : estado === "na" ? "minus-circle" : "circle-alert") +
          '<div class="check__txt"><strong>' + esc(i.rotulo) + '</strong><span class="sr-only">: ' + (estado === "ok" ? "feito" : estado === "na" ? "não se aplica" : "falta") + "</span>" +
          "<span>" + (estado === "na" ? "Não se aplica a este tipo de entrega." : esc(i.porque)) + "</span></div>" + botao + "</li>"
        );
      }).join("") + "</ul>";

    var explica =
      f.nivel === "forte"
        ? "Esta venda tem as provas principais. Revise o dossiê antes de enviar."
        : f.nivel === "sem"
        ? "Nada anexado ainda. Comece pelo comprovante do Pix e pelos prints da conversa."
        : "Falta" + (f.faltam.length > 1 ? "m" : "") + " " + f.faltam.map(function (i) {
            return minusc(i.rotulo);
          }).join(", ") + ".";

    var thumbs = v.provas.length
      ? '<ul class="thumbs">' + v.provas.map(function (pv) {
          var tp = D.TIPOS_PROVA[pv.tipo] || D.TIPOS_PROVA.outro;
          var pdf = pv.mime === "application/pdf";
          return (
            '<li class="thumb"><button type="button" class="thumb__img" data-ver="' + pv.id + '" aria-label="Ver ' + esc(tp.rotulo) + " em tamanho maior\">" +
            (pdf ? '<span class="thumb__pdf">' + ic("file-text") + "PDF</span>" : '<img src="' + pv.dataUrl + '" alt="" loading="lazy">') +
            "</button>" +
            '<div class="thumb__info"><strong>' + ic(tp.icone) + esc(tp.rotulo) + "</strong>" +
            '<span class="thumb__nome">' + esc(pv.nome) + "</span>" +
            "<span>" + tamanhoFmt(pv.tamanho) + (pv.dataDoc ? " · " + fmtData(pv.dataDoc) : "") + "</span>" +
            (pv.obs ? '<span class="thumb__obs">' + esc(pv.obs) + "</span>" : "") +
            '<button type="button" class="link link--danger" data-remover-prova="' + pv.id + '">' + ic("trash-2") + "Remover</button></div></li>"
          );
        }).join("") + "</ul>"
      : '<p class="muted-box">' + ic("folder-open") + "Nenhum arquivo anexado ainda.</p>";

    var opcoesProva = Object.keys(D.TIPOS_PROVA).map(function (k) {
      return [k, D.TIPOS_PROVA[k].rotulo];
    });

    var formProva =
      '<form class="upload" id="form-prova" novalidate>' +
      '<h3 id="anexar">' + ic("upload") + "Anexar prova</h3>" +
      '<div class="form-summary" tabindex="-1" role="alert" hidden></div>' +
      '<div class="form-grid">' +
      campo({ nome: "tipo", rotulo: "Tipo de prova", tipo: "select", obrig: true, opcoes: opcoesProva }) +
      campo({ nome: "dataDoc", rotulo: "Data do documento", tipo: "date", valor: "", attrs: ' max="' + hoje() + '"' }) +
      '<div class="field field--full" data-field="arquivo"><label for="f-arquivo">Arquivo <span class="req" aria-hidden="true">*</span></label>' +
      '<p class="field__dica" id="f-arquivo-dica">Imagem (JPG, PNG, WEBP) ou PDF. Fotos grandes são compactadas automaticamente. Limite: 1,5 MB por imagem depois de compactar e 1 MB por PDF.</p>' +
      '<label class="drop" for="f-arquivo">' + ic("image-up") + '<span id="drop-txt">Escolher arquivo ou tirar foto</span></label>' +
      '<input class="drop__input" id="f-arquivo" name="arquivo" type="file" accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" aria-describedby="f-arquivo-dica arquivo-erro" required>' +
      '<p class="field__erro" id="arquivo-erro"></p></div>' +
      campo({ nome: "obs", rotulo: "Descrição", classe: "field--full", attrs: ' autocomplete="off" placeholder="Ex.: cliente confirma o endereço e o pagamento"' }) +
      "</div>" +
      '<div class="form__actions"><button class="btn btn--primary" type="submit" id="btn-anexar">' + ic("paperclip") + "Anexar prova</button></div></form>";

    var blocoRastreio = "";
    if (v.tipoEntrega === "envio") {
      blocoRastreio = v.rastreio
        ? '<div class="rastreio-box">' + ic("truck") + "<div><strong>" + esc(v.rastreio.transportadora) + ' · <span class="mono">' + esc(v.rastreio.codigo) + "</span></strong><span>" + (v.rastreio.dataEnvio ? "Postado em " + fmtData(v.rastreio.dataEnvio) : "Data de envio não informada") + "</span></div>" +
          '<button type="button" class="link link--danger" data-action="remover-rastreio">' + ic("trash-2") + "Remover</button></div>"
        : '<form class="upload upload--inline" id="form-rastreio" novalidate><h3 id="rastreio">' + ic("truck") + "Rastreio da entrega</h3>" +
          '<div class="form-summary" tabindex="-1" role="alert" hidden></div><div class="form-grid form-grid--3">' +
          campo({ nome: "codigo", rotulo: "Código de rastreio", obrig: true, attrs: ' autocomplete="off" spellcheck="false" class="mono" placeholder="Ex.: QB123456789BR"' }) +
          campo({ nome: "transportadora", rotulo: "Transportadora", tipo: "select", obrig: true, opcoes: D.TRANSPORTADORAS.map(function (t) {
            return [t, t];
          }) }) +
          campo({ nome: "dataEnvio", rotulo: "Data de envio", tipo: "date", attrs: ' max="' + hoje() + '"' }) +
          '</div><div class="form__actions"><button class="btn btn--secondary" type="submit">' + ic("check") + "Salvar rastreio</button></div></form>";
    }

    var tl = linhaDoTempo(v);
    var timeline =
      '<ol class="timeline">' +
      tl.map(function (e) {
        var te = D.TIPOS_EVENTO[e.tipo] || D.TIPOS_EVENTO.outro;
        return (
          '<li class="tl tl--' + e.tipo + '"><span class="tl__dot">' + ic(te.icone) + "</span>" +
          '<div class="tl__body"><span class="tl__when">' + fmtData(e.data) + (e.hora ? " · " + e.hora : "") + " · " + te.rotulo + "</span>" +
          "<p>" + esc(e.descricao) + "</p>" +
          (e.manual ? '<button type="button" class="link link--danger" data-remover-evento="' + e.id + '">' + ic("trash-2") + "Remover</button>" : '<span class="tl__auto">gerado pelos dados da venda</span>') +
          "</div></li>"
        );
      }).join("") + "</ol>" +
      '<details class="add-evento"><summary>' + ic("plus") + "Adicionar acontecimento</summary>" +
      '<form id="form-evento" novalidate><div class="form-summary" tabindex="-1" role="alert" hidden></div><div class="form-grid">' +
      campo({ nome: "etipo", rotulo: "Tipo", tipo: "select", obrig: true, opcoes: [["pedido", "Pedido"], ["envio", "Envio"], ["entrega", "Entrega"], ["conversa", "Conversa"], ["outro", "Outro"]] }) +
      campo({ nome: "edata", rotulo: "Data", tipo: "date", obrig: true, valor: hoje(), attrs: ' max="' + hoje() + '"' }) +
      campo({ nome: "ehora", rotulo: "Horário", tipo: "time" }) +
      campo({ nome: "edesc", rotulo: "O que aconteceu", obrig: true, classe: "field--full", attrs: ' autocomplete="off" placeholder="Ex.: Cliente confirmou que recebeu pelo WhatsApp"' }) +
      '</div><div class="form__actions"><button class="btn btn--secondary" type="submit">' + ic("check") + "Adicionar à linha do tempo</button></div></form></details>";

    var dados =
      '<dl class="dl">' +
      "<dt>Valor</dt><dd>" + brl(v.valor) + "</dd>" +
      "<dt>Pagamento</dt><dd>" + fmtData(v.data) + (v.hora ? " às " + v.hora : "") + "</dd>" +
      "<dt>ID do Pix (E2E)</dt><dd class=\"mono break\">" + (v.e2e ? esc(v.e2e) : '<span class="faltando">não informado</span>') + "</dd>" +
      "<dt>Canal</dt><dd>" + esc(rotulo(D.CANAIS, v.canal)) + "</dd>" +
      "<dt>Cliente</dt><dd>" + esc(v.cliente.nome) + "</dd>" +
      "<dt>CPF/CNPJ</dt><dd>" + (v.cliente.doc ? esc(docOculto(v.cliente.doc)) : "—") + "</dd>" +
      "<dt>Telefone</dt><dd>" + esc(v.cliente.telefone || "—") + "</dd>" +
      "<dt>Entrega</dt><dd>" + esc(rotulo(D.ENTREGAS, v.tipoEntrega)) + (v.endereco ? " · " + esc(v.endereco) : "") + "</dd>" +
      "</dl>";

    var historico =
      '<ol class="hist">' + (v.historico || []).map(function (h) {
        return "<li><span>" + fmtDataHora(h.em) + "</span>" + esc(h.texto) + "</li>";
      }).join("") + "</ol>";

    return {
      titulo: v.produto,
      html:
        '<nav class="crumbs" aria-label="Caminho"><a href="#vendas">Vendas</a> ' + ic("chevron-right") + ' <span aria-current="page">' + esc(v.cliente.nome) + "</span></nav>" +
        '<header class="page-head page-head--venda"><div><h1>' + esc(v.produto) + '</h1><p class="lead"><strong>' + brl(v.valor) + "</strong> · " + esc(v.cliente.nome) + " · " + fmtData(v.data) + " · " + esc(rotulo(D.CANAIS, v.canal)) + "</p>" +
        '<div class="badges">' + badgeForca(v, f) + badgeContestacao(v) + "</div></div>" +
        '<div class="page-head__actions">' + acoes + "</div></header>" +
        blocoContestacao +
        '<div class="layout-venda"><div class="col-main">' +
        '<section class="card" aria-labelledby="h-forca"><div class="card__head"><h2 id="h-forca">Força da prova</h2>' + badgeForca(v, f) + "</div>" +
        '<div class="meter meter--' + f.nivel + '" role="img" aria-label="' + f.feitos + " de " + f.validos.length + ' itens"><span style="width:' + Math.max(f.pct, 3) + '%"></span></div>' +
        '<p class="meter__txt"><strong>' + f.feitos + " de " + f.validos.length + " itens</strong> · " + esc(explica) + "</p>" +
        checklist + "</section>" +
        '<section class="card" aria-labelledby="h-provas"><div class="card__head"><h2 id="h-provas">Provas anexadas</h2><span class="muted">' + plural(v.provas.length, "arquivo", "arquivos") + "</span></div>" +
        thumbs + blocoRastreio + formProva + "</section>" +
        '<section class="card" aria-labelledby="h-tl"><div class="card__head"><h2 id="h-tl">Linha do tempo</h2></div>' + timeline + "</section>" +
        "</div>" +
        '<aside class="col-side">' +
        '<section class="card" aria-labelledby="h-dados"><div class="card__head"><h2 id="h-dados">Dados da venda</h2><a class="link" href="#editar/' + v.id + '">Editar</a></div>' + dados + "</section>" +
        '<section class="card" aria-labelledby="h-hist"><div class="card__head"><h2 id="h-hist">Histórico</h2></div>' + historico + "</section>" +
        '<button type="button" class="btn btn--ghost btn--danger-text" data-action="excluir-venda">' + ic("trash-2") + "Excluir venda</button>" +
        "</aside></div>",
      montar: function (raiz) {
        montarVenda(raiz, v);
        if (extra === "anexar") {
          var alvo = $("#form-prova", raiz);
          setTimeout(function () {
            alvo.scrollIntoView({ block: "start" });
            $("#f-tipo", raiz).focus({ preventScroll: true });
          }, 30);
        }
      },
      semFoco: extra === "anexar"
    };
  };

  function montarVenda(raiz, v) {
    var formP = $("#form-prova", raiz);
    var inputArq = $("#f-arquivo", raiz);
    inputArq.addEventListener("change", function () {
      var f = inputArq.files[0];
      $("#drop-txt", raiz).textContent = f ? f.name + " (" + tamanhoFmt(f.size) + ")" : "Escolher arquivo ou tirar foto";
    });
    formP.addEventListener("submit", function (e) {
      e.preventDefault();
      var el = formP.elements, erros = {};
      if (!el.tipo.value) erros.tipo = "Escolha o tipo de prova.";
      var file = inputArq.files[0];
      if (!file) erros.arquivo = "Escolha um arquivo para anexar.";
      if (el.dataDoc.value && el.dataDoc.value > hoje()) erros.dataDoc = "A data não pode ser no futuro.";
      if (!mostrarErros(formP, erros)) return;
      var btn = $("#btn-anexar", raiz);
      btn.disabled = true;
      btn.innerHTML = ic("loader-circle", "spin") + "Preparando arquivo…";
      icones();
      prepararArquivo(file)
        .then(function (arq) {
          var tp = D.TIPOS_PROVA[el.tipo.value];
          var ok = salvarComSeguranca(function () {
            S.adicionarProva(v.id, { tipo: el.tipo.value, nome: file.name, mime: arq.mime, tamanho: arq.tamanho, dataUrl: arq.dataUrl, dataDoc: el.dataDoc.value || hoje(), obs: el.obs.value.trim() }, tp.rotulo);
          });
          if (ok) {
            render();
            toast("Prova anexada: " + tp.rotulo + (arq.compactada ? ". A imagem foi compactada de " + tamanhoFmt(arq.original) + " para " + tamanhoFmt(arq.tamanho) + "." : "."));
          } else {
            btn.disabled = false;
            btn.innerHTML = ic("paperclip") + "Anexar prova";
            icones();
          }
        })
        .catch(function (err) {
          btn.disabled = false;
          btn.innerHTML = ic("paperclip") + "Anexar prova";
          mostrarErros(formP, { arquivo: err.message }, "Não deu para anexar esse arquivo");
          icones();
        });
    });

    var formR = $("#form-rastreio", raiz);
    if (formR) {
      formR.addEventListener("submit", function (e) {
        e.preventDefault();
        var el = formR.elements, erros = {};
        var cod = el.codigo.value.trim().toUpperCase();
        if (cod.length < 6) erros.codigo = "Digite o código de rastreio completo.";
        if (!el.transportadora.value) erros.transportadora = "Escolha a transportadora.";
        if (el.dataEnvio.value && el.dataEnvio.value < v.data) erros.dataEnvio = "O envio não pode ser antes do pagamento (" + fmtData(v.data) + ").";
        if (!mostrarErros(formR, erros)) return;
        if (salvarComSeguranca(function () {
          S.salvarRastreio(v.id, { codigo: cod, transportadora: el.transportadora.value, dataEnvio: el.dataEnvio.value });
        }, "Rastreio salvo.")) render();
      });
    }

    var formE = $("#form-evento", raiz);
    formE.addEventListener("submit", function (e) {
      e.preventDefault();
      var el = formE.elements, erros = {};
      if (!el.etipo.value) erros.etipo = "Escolha o tipo.";
      if (!el.edata.value) erros.edata = "Informe a data.";
      else if (el.edata.value > hoje()) erros.edata = "A data não pode ser no futuro.";
      if (el.edesc.value.trim().length < 3) erros.edesc = "Escreva em poucas palavras o que aconteceu.";
      if (!mostrarErros(formE, erros)) return;
      if (salvarComSeguranca(function () {
        S.adicionarEvento(v.id, { tipo: el.etipo.value, data: el.edata.value, hora: el.ehora.value, descricao: el.edesc.value.trim() });
      }, "Acontecimento adicionado à linha do tempo.")) render();
    });

    raiz.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-foco]"))) {
        e.preventDefault();
        var form = t.closest("form");
        var alvo = form && form.elements[t.dataset.foco];
        if (alvo) alvo.focus();
        return;
      }
      if ((t = e.target.closest("[data-anexar]"))) {
        $("#f-tipo", raiz).value = t.dataset.anexar;
        formP.scrollIntoView({ behavior: "smooth", block: "start" });
        inputArq.focus({ preventScroll: true });
        return;
      }
      if (e.target.closest("[data-ir-rastreio]")) {
        var fr = $("#form-rastreio", raiz);
        if (fr) {
          fr.scrollIntoView({ behavior: "smooth", block: "start" });
          $("#f-codigo", raiz).focus({ preventScroll: true });
        }
        return;
      }
      if ((t = e.target.closest("[data-ver]"))) {
        var pv = v.provas.filter(function (p) {
          return p.id === t.dataset.ver;
        })[0];
        verProva(pv);
        return;
      }
      if ((t = e.target.closest("[data-remover-prova]"))) {
        var prova = v.provas.filter(function (p) {
          return p.id === t.dataset.removerProva;
        })[0];
        var rot = (D.TIPOS_PROVA[prova.tipo] || D.TIPOS_PROVA.outro).rotulo;
        dialogo({ titulo: "Remover esta prova?", texto: "O arquivo " + esc(prova.nome) + " (" + rot + ") sai desta venda e do dossiê. Não dá para desfazer.", ok: "Remover prova", perigo: true }).then(function (r) {
          if (r && salvarComSeguranca(function () {
            S.removerProva(v.id, prova.id, rot);
          }, "Prova removida.")) render();
        });
        return;
      }
      if ((t = e.target.closest("[data-remover-evento]"))) {
        var idE = t.dataset.removerEvento;
        if (salvarComSeguranca(function () {
          S.removerEvento(v.id, idE);
        }, "Acontecimento removido.")) render();
        return;
      }
      if ((t = e.target.closest("[data-resolver]"))) {
        resolver(v, t.dataset.resolver);
        return;
      }
      if (e.target.closest('[data-action="reabrir"]')) {
        dialogo({ titulo: "Desfazer o resultado?", texto: "A contestação volta a ficar aberta, com o mesmo prazo de antes.", ok: "Desfazer resultado" }).then(function (r) {
          if (r && salvarComSeguranca(function () {
            S.reabrirContestacao(v.id);
          }, "Contestação aberta de novo.")) render();
        });
        return;
      }
      if (e.target.closest('[data-action="remover-rastreio"]')) {
        if (salvarComSeguranca(function () {
          S.salvarRastreio(v.id, null);
        }, "Rastreio removido.")) render();
        return;
      }
      if (e.target.closest('[data-action="excluir-venda"]')) {
        dialogo({ titulo: "Excluir esta venda?", texto: "A venda de " + esc(v.cliente.nome) + ", as provas anexadas e o histórico serão apagados deste aparelho. Não dá para desfazer.", ok: "Excluir venda", perigo: true }).then(function (r) {
          if (r && salvarComSeguranca(function () {
            S.excluirVenda(v.id);
          }, "Venda excluída.")) ir("#vendas");
        });
      }
    });
  }

  function resolver(v, resultado) {
    var ganhou = resultado === "ganha";
    dialogo({
      titulo: ganhou ? "Marcar contestação como ganha?" : "Marcar contestação como perdida?",
      texto: ganhou ? "Use quando a instituição confirmar que o valor fica com a sua loja." : "Use quando a instituição confirmar a devolução do valor ao pagador.",
      corpo: '<div class="field"><label for="m-obs">Anotação <span class="opt">(opcional)</span></label><textarea id="m-obs" name="obs" rows="2" placeholder="Ex.: protocolo do banco, data da resposta"></textarea></div>',
      ok: ganhou ? "Marcar como ganha" : "Marcar como perdida"
    }).then(function (r) {
      if (!r) return;
      try {
        S.resolverContestacao(v.id, resultado, r.campos.obs);
      } catch (e) {
        toast(e.message, { tipo: "erro" });
        return;
      }
      render();
      toast(ganhou ? "Contestação marcada como ganha." : "Contestação marcada como perdida.", {
        acao: {
          rotulo: "Desfazer",
          fn: function () {
            if (salvarComSeguranca(function () {
              S.reabrirContestacao(v.id);
            }, "Resultado desfeito.")) render();
          }
        }
      });
    });
  }

  function verProva(pv) {
    var tp = D.TIPOS_PROVA[pv.tipo] || D.TIPOS_PROVA.outro;
    var pdf = pv.mime === "application/pdf";
    dialogo({
      titulo: tp.rotulo,
      texto: esc(pv.nome) + " · " + tamanhoFmt(pv.tamanho),
      corpo: pdf ? '<p class="muted-box">' + ic("file-text") + "Arquivo PDF. Baixe para abrir no seu leitor de PDF.</p>" : '<img class="modal__img" src="' + pv.dataUrl + '" alt="' + esc(tp.rotulo + ": " + (pv.obs || pv.nome)) + '">',
      cancelar: "Fechar",
      botoes: '<button class="btn btn--secondary" value="baixar" type="submit">' + ic("download") + "Baixar arquivo</button>"
    }).then(function (r) {
      if (r && r.valor === "baixar") baixarDataURL(pv.dataUrl, pv.nome);
    });
  }

  /* ---------- Abrir contestação ---------- */
  TELAS.contestar = function (id) {
    var v = S.getVenda(id);
    if (!v) return telaVendaSumiu();
    var loja = S.getLoja();
    var c = v.contestacao;
    var crumbs = '<nav class="crumbs" aria-label="Caminho"><a href="#vendas">Vendas</a> ' + ic("chevron-right") + ' <a href="#venda/' + v.id + '">' + esc(v.produto) + "</a></nav>";
    if (c && c.status !== "aberta") {
      return {
        titulo: "Contestação",
        html: crumbs + vazio("info", "Esta contestação já foi resolvida", "Ela foi marcada como " + c.status + ". Para mudar, desfaça o resultado na página da venda.", '<a class="btn btn--primary" href="#venda/' + v.id + '">Ver venda</a>')
      };
    }
    var edit = !!c;
    c = c || { dataAviso: hoje(), canalAviso: "", motivo: "", motivoTexto: "", prazoDias: loja.prazoPadraoDias, obs: "" };
    var f = forca(v);
    var canais = [["App do banco", "App do banco"], ["E-mail do banco", "E-mail do banco"], ["Ligação do banco", "Ligação do banco"], ["Outro", "Outro"]];
    return {
      titulo: edit ? "Editar contestação" : "Abrir contestação",
      html:
        crumbs +
        '<header class="page-head"><div><h1>' + (edit ? "Editar contestação" : "Abrir contestação") + '</h1><p class="lead">Marque aqui quando o banco avisar que o pagador pediu a devolução deste Pix pelo MED.</p></div></header>' +
        '<div class="layout-venda"><form class="form card col-main" id="form-contestar" novalidate>' +
        '<div class="form-summary" tabindex="-1" role="alert" hidden></div>' +
        '<div class="form-grid">' +
        campo({ nome: "dataAviso", rotulo: "Data do aviso", tipo: "date", obrig: true, valor: c.dataAviso, attrs: ' max="' + hoje() + '" min="' + v.data + '"', dica: "Dia em que o banco avisou sobre o pedido de devolução." }) +
        campo({ nome: "canalAviso", rotulo: "Como o aviso chegou", tipo: "select", opcoes: canais, valor: c.canalAviso }) +
        "</div>" +
        '<fieldset class="field" data-field="motivo" aria-describedby="motivo-erro"><legend>Motivo alegado pelo pagador <span class="req" aria-hidden="true">*</span></legend><div class="radios">' +
        D.MOTIVOS.map(function (m, i) {
          return '<label class="radio"><input type="radio" name="motivo" value="' + m[0] + '"' + (i === 0 ? ' id="f-motivo"' : "") + (c.motivo === m[0] ? " checked" : "") + "><span>" + m[1] + "</span></label>";
        }).join("") + '</div><p class="field__erro" id="motivo-erro"></p></fieldset>' +
        '<div id="motivo-outro"' + (c.motivo === "outro" ? "" : " hidden") + ">" + campo({ nome: "motivoTexto", rotulo: "Qual motivo?", obrig: true, valor: c.motivoTexto, attrs: ' autocomplete="off"' }) + "</div>" +
        '<div class="prazo-box">' +
        campo({
          nome: "prazoDias", rotulo: "Prazo para responder (em dias)", tipo: "number", obrig: true, valor: c.prazoDias, attrs: ' inputmode="numeric" min="1" max="90" step="1"',
          dica: "Use o prazo que sua instituição informou. O valor inicial (" + plural(Number(loja.prazoPadraoDias), "dia", "dias") + ") é <strong>só um exemplo</strong> que você define em Ajustes."
        }) +
        '<p class="prazo-preview" id="prazo-preview" aria-live="polite"></p>' +
        '<p class="prazo-aviso">' + ic("info") + "O prazo real depende das regras vigentes do Banco Central e da sua instituição. Confira sempre no seu banco.</p></div>" +
        campo({ nome: "obs", rotulo: "Anotações", tipo: "textarea", valor: c.obs, dica: "Protocolo, nome do atendente, o que o banco pediu." }) +
        '<div class="form__actions"><a class="btn btn--ghost" href="#venda/' + v.id + '">Cancelar</a><button class="btn btn--primary" type="submit">' + ic("shield-alert") + (edit ? "Salvar contestação" : "Abrir contestação") + "</button></div>" +
        "</form>" +
        '<aside class="col-side"><section class="card"><div class="card__head"><h2>Venda contestada</h2></div>' +
        '<p class="side-sum"><strong>' + brl(v.valor) + "</strong><br>" + esc(v.produto) + "<br>" + esc(v.cliente.nome) + " · " + fmtData(v.data) + "</p>" +
        '<div class="card__head"><h3>Suas provas hoje</h3>' + badgeForca(v, f) + "</div>" +
        (f.faltam.length ? '<ul class="mini-check">' + f.faltam.map(function (i) {
          return "<li>" + ic("circle") + esc(i.rotulo) + "</li>";
        }).join("") + "</ul>" : "<p>Todas as provas principais estão anexadas.</p>") +
        '<a class="btn btn--secondary btn--sm" href="#venda/' + v.id + '/anexar">' + ic("paperclip") + "Completar provas</a></section></aside></div>",
      montar: function (raiz) {
        var form = $("#form-contestar", raiz), el = form.elements;
        function preview() {
          var n = parseInt(el.prazoDias.value, 10);
          var out = $("#prazo-preview", raiz);
          if (el.dataAviso.value && n > 0 && n <= 90) {
            var p = prazo({ dataAviso: el.dataAviso.value, prazoDias: n });
            out.innerHTML = ic("calendar-clock") + "<span>Pelo prazo que você colocou, vence em <strong>" + fmtData(p.limite) + "</strong> (" + p.texto.toLowerCase() + ").</span>";
          } else out.textContent = "";
          icones();
        }
        el.prazoDias.addEventListener("input", preview);
        el.dataAviso.addEventListener("input", preview);
        preview();
        form.addEventListener("change", function (e) {
          if (e.target.name === "motivo") $("#motivo-outro", raiz).hidden = e.target.value !== "outro";
        });
        form.addEventListener("click", function (e) {
          var a = e.target.closest("[data-foco]");
          if (a) {
            e.preventDefault();
            var alvo = a.dataset.foco === "motivo" ? $("#f-motivo", raiz) : el[a.dataset.foco];
            if (alvo) alvo.focus();
          }
        });
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var erros = {};
          var motivo = (form.querySelector('input[name="motivo"]:checked') || {}).value;
          if (!el.dataAviso.value) erros.dataAviso = "Informe a data do aviso.";
          else if (el.dataAviso.value > hoje()) erros.dataAviso = "A data do aviso não pode ser no futuro.";
          else if (el.dataAviso.value < v.data) erros.dataAviso = "O aviso não pode ser antes do pagamento (" + fmtData(v.data) + ").";
          if (!motivo) erros.motivo = "Escolha o motivo que o pagador alegou.";
          if (motivo === "outro" && el.motivoTexto.value.trim().length < 3) erros.motivoTexto = "Escreva o motivo alegado.";
          var n = Number(el.prazoDias.value);
          if (!el.prazoDias.value || !Number.isInteger(n) || n < 1 || n > 90) erros.prazoDias = "Digite um número de dias entre 1 e 90.";
          if (!mostrarErros(form, erros)) return;
          var dados = { dataAviso: el.dataAviso.value, canalAviso: el.canalAviso.value, motivo: motivo, motivoTexto: motivo === "outro" ? el.motivoTexto.value.trim() : "", prazoDias: n, obs: el.obs.value.trim() };
          var limite = somarDias(dados.dataAviso, n);
          var ok = salvarComSeguranca(function () {
            if (edit) S.atualizarContestacao(v.id, dados);
            else S.abrirContestacao(v.id, dados);
          }, (edit ? "Contestação atualizada." : "Contestação aberta.") + " Prazo configurado até " + fmtData(limite) + ".");
          if (ok) ir("#venda/" + v.id);
        });
      }
    };
  };

  /* ---------- Dossiê para imprimir ou salvar em PDF ---------- */
  TELAS.dossie = function (id) {
    var v = S.getVenda(id);
    if (!v) return telaVendaSumiu();
    var loja = S.getLoja();
    var f = forca(v);
    var c = v.contestacao;
    var tl = linhaDoTempo(v);
    var agora = new Date().toISOString();
    var secoes = ["Resumo da venda"];
    if (c) secoes.push("Contestação");
    secoes.push("Linha do tempo", "Checklist de provas", "Provas anexadas", "Declaração do lojista");
    if (v.provas.length) secoes.push("Anexos");
    function n(nome) {
      return secoes.indexOf(nome) + 1;
    }
    var entregaFrase = {
      envio: "o produto foi enviado ao endereço informado pelo cliente" + (v.rastreio ? ", com rastreio " + v.rastreio.codigo + " (" + v.rastreio.transportadora + ")" : ""),
      propria: "o produto foi entregue pela própria loja no endereço combinado com o cliente",
      retirada: "o produto foi retirado pelo cliente",
      digital: "o produto ou serviço foi entregue ao cliente pelo meio combinado"
    }[v.tipoEntrega] || "o produto foi entregue ao cliente";

    var logo = loja.logo ? '<img class="doc-logo" src="' + loja.logo + '" alt="Logo de ' + esc(loja.nome) + '">' : '<span class="doc-logo doc-logo--txt" aria-hidden="true">' + esc((loja.nome || "L").charAt(0)) + "</span>";

    var aviso =
      f.nivel !== "forte"
        ? '<div class="notice notice--warn">' + ic("alert-triangle") + "<p><strong>" + NIVEIS[f.nivel].rotulo + ".</strong> " + (f.faltam.length ? "Falta" + (f.faltam.length > 1 ? "m" : "") + ": " + f.faltam.map(function (i) {
            return minusc(i.rotulo);
          }).join(", ") + ". " : "") + 'Você pode gerar assim mesmo, mas vale completar antes de enviar. <a href="#venda/' + v.id + '/anexar">Completar provas</a></p></div>'
        : "";

    var toolbar =
      '<div class="doc-toolbar">' +
      '<a class="btn btn--ghost" href="#venda/' + v.id + '">' + ic("arrow-left") + "Voltar para a venda</a>" +
      '<div class="doc-toolbar__main"><h1>Dossiê da venda</h1><p>Revise as páginas abaixo. Ao tocar em <strong>Baixar PDF</strong>, escolha "Salvar como PDF" como destino na janela de impressão.</p></div>' +
      '<button type="button" class="btn btn--primary" data-action="imprimir">' + ic("file-down") + "Baixar PDF</button></div>" + aviso;

    var capa =
      '<section class="sheet doc-capa" aria-label="Capa do dossiê">' +
      '<div class="doc-capa__top">' + logo + '<div><p class="doc-loja">' + esc(loja.nome || "Loja") + "</p><p>" + (loja.cnpj ? "CNPJ " + esc(loja.cnpj) : "CNPJ não informado") + (loja.cidade ? " · " + esc(loja.cidade) : "") + "</p></div></div>" +
      '<div class="doc-capa__mid"><p class="doc-kicker">Dossiê de defesa de venda via Pix</p>' +
      '<h2 class="doc-title">' + brl(v.valor) + " pagos por " + esc(v.cliente.nome) + "</h2>" +
      '<p class="doc-sub">' + esc(v.produto) + " · pago em " + fmtData(v.data) + (v.hora ? " às " + v.hora : "") + "</p>" +
      (c ? '<p class="doc-flag">Referente ao pedido de devolução pelo MED (Mecanismo Especial de Devolução) avisado em ' + fmtData(c.dataAviso) + "</p>" : "") +
      '<dl class="doc-facts"><div><dt>ID da transação (E2E)</dt><dd class="mono break">' + (v.e2e ? esc(v.e2e) : "não informado") + "</dd></div>" +
      "<div><dt>Provas</dt><dd>" + NIVEIS[f.nivel].rotulo + " · " + f.feitos + " de " + f.validos.length + " itens</dd></div>" +
      "<div><dt>Arquivos anexados</dt><dd>" + v.provas.length + "</dd></div>" +
      "<div><dt>Gerado em</dt><dd>" + fmtDataHora(agora) + "</dd></div></dl></div>" +
      '<div class="doc-capa__sum"><h3>Conteúdo</h3><ol>' + secoes.map(function (s) {
        return "<li>" + s + "</li>";
      }).join("") + "</ol></div>" +
      '<p class="doc-nota">Documento organizado pelo próprio lojista com as informações e arquivos que ele reuniu. Não é aconselhamento jurídico e não garante o resultado da contestação. Prazos e regras do MED dependem do Banco Central e da instituição.</p>' +
      "</section>";

    var resumo =
      '<section class="doc-sec"><h2><span>' + n("Resumo da venda") + "</span>Resumo da venda</h2>" +
      '<table class="doc-table"><tbody>' +
      "<tr><th>Valor</th><td>" + brl(v.valor) + "</td></tr>" +
      "<tr><th>Data e hora do Pix</th><td>" + fmtData(v.data) + (v.hora ? " às " + v.hora : "") + "</td></tr>" +
      '<tr><th>ID da transação (E2E)</th><td class="mono break">' + (v.e2e ? esc(v.e2e) : "não informado") + "</td></tr>" +
      "<tr><th>Recebedor</th><td>" + esc(loja.nome) + (loja.cnpj ? " · CNPJ " + esc(loja.cnpj) : "") + "</td></tr>" +
      "<tr><th>Cliente (pagador)</th><td>" + esc(v.cliente.nome) + (v.cliente.doc ? " · " + esc(v.cliente.doc) : "") + (v.cliente.telefone ? " · " + esc(v.cliente.telefone) : "") + "</td></tr>" +
      "<tr><th>Produto</th><td>" + esc(v.produto) + "</td></tr>" +
      "<tr><th>Canal da venda</th><td>" + esc(rotulo(D.CANAIS, v.canal)) + "</td></tr>" +
      "<tr><th>Entrega</th><td>" + esc(rotulo(D.ENTREGAS, v.tipoEntrega)) + (v.endereco ? " · " + esc(v.endereco) : "") + (v.rastreio ? " · " + esc(v.rastreio.transportadora) + " " + esc(v.rastreio.codigo) : "") + "</td></tr>" +
      "</tbody></table></section>";

    var contest = c
      ? '<section class="doc-sec"><h2><span>' + n("Contestação") + "</span>Contestação</h2>" +
        '<table class="doc-table"><tbody>' +
        "<tr><th>Aviso recebido em</th><td>" + fmtData(c.dataAviso) + (c.canalAviso ? " · " + esc(c.canalAviso) : "") + "</td></tr>" +
        "<tr><th>Motivo alegado</th><td>" + esc(motivoTexto(c)) + "</td></tr>" +
        "<tr><th>Situação</th><td>" + (c.status === "aberta" ? "Aberta" : c.status === "ganha" ? "Resolvida a favor da loja" : "Resolvida contra a loja") + "</td></tr>" +
        (c.obs ? "<tr><th>Anotações</th><td>" + esc(c.obs) + "</td></tr>" : "") +
        "</tbody></table></section>"
      : "";

    var linha =
      '<section class="doc-sec"><h2><span>' + n("Linha do tempo") + "</span>Linha do tempo</h2><ol class=\"doc-tl\">" +
      tl.map(function (e) {
        var te = D.TIPOS_EVENTO[e.tipo] || D.TIPOS_EVENTO.outro;
        return '<li><span class="doc-tl__when">' + fmtData(e.data) + (e.hora ? "<br>" + e.hora : "") + '</span><span class="doc-tl__what"><strong>' + te.rotulo + "</strong> " + esc(e.descricao) + "</span></li>";
      }).join("") + "</ol></section>";

    var check =
      '<section class="doc-sec"><h2><span>' + n("Checklist de provas") + "</span>Checklist de provas</h2>" +
      '<table class="doc-table doc-check"><thead><tr><th>Item</th><th>Situação</th></tr></thead><tbody>' +
      f.itens.map(function (i) {
        var st = i.na ? "Não se aplica" : i.ok ? "Anexado" : "Não anexado";
        return '<tr><td>' + esc(i.rotulo) + '</td><td class="st st--' + (i.na ? "na" : i.ok ? "ok" : "falta") + '">' + (i.ok && !i.na ? "&#10003; " : "") + st + "</td></tr>";
      }).join("") + "</tbody></table></section>";

    var miniaturas =
      '<section class="doc-sec"><h2><span>' + n("Provas anexadas") + "</span>Provas anexadas</h2>" +
      (v.provas.length
        ? '<ul class="doc-thumbs">' + v.provas.map(function (pv, i) {
            var tp = D.TIPOS_PROVA[pv.tipo] || D.TIPOS_PROVA.outro;
            return (
              '<li class="doc-thumb">' + (pv.mime === "application/pdf" ? '<span class="doc-thumb__pdf">PDF</span>' : '<img src="' + pv.dataUrl + '" alt="' + esc(tp.rotulo) + '">') +
              "<p><strong>Anexo " + (i + 1) + "</strong> · " + esc(tp.rotulo) + "<br>" + esc(pv.nome) + (pv.dataDoc ? " · " + fmtData(pv.dataDoc) : "") + "</p></li>"
            );
          }).join("") + "</ul>"
        : "<p>Nenhum arquivo anexado.</p>") +
      "</section>";

    var declaracao =
      '<section class="doc-sec doc-decl"><h2><span>' + n("Declaração do lojista") + "</span>Declaração do lojista</h2>" +
      "<p>Eu, " + (loja.responsavel ? "<strong>" + esc(loja.responsavel) + "</strong>" : "______________________________") + ", responsável pela loja <strong>" + esc(loja.nome) + "</strong>" + (loja.cnpj ? ", CNPJ " + esc(loja.cnpj) : "") +
      ", declaro que vendi <strong>" + esc(v.produto) + "</strong> para <strong>" + esc(v.cliente.nome) + "</strong>, que pagou " + brl(v.valor) + " via Pix em " + fmtData(v.data) + (v.hora ? " às " + v.hora : "") + ", e que " + esc(entregaFrase) + ".</p>" +
      "<p>Declaro também que as informações e os arquivos reunidos neste dossiê são verdadeiros e não foram alterados, e me coloco à disposição da instituição para enviar os arquivos originais e prestar outros esclarecimentos.</p>" +
      '<div class="doc-sign"><div><span></span><p>' + esc(loja.cidade || "Local") + ", ____/____/________</p></div><div><span></span><p>Assinatura" + (loja.responsavel ? " · " + esc(loja.responsavel) : "") + "</p></div></div></section>";

    var anexos = v.provas.length
      ? '<section class="doc-sec doc-anexos"><h2><span>' + n("Anexos") + "</span>Anexos</h2>" +
        v.provas.map(function (pv, i) {
          var tp = D.TIPOS_PROVA[pv.tipo] || D.TIPOS_PROVA.outro;
          var leg = "<strong>Anexo " + (i + 1) + "</strong> · " + esc(tp.rotulo) + " · " + esc(pv.nome) + (pv.dataDoc ? " · " + fmtData(pv.dataDoc) : "") + (pv.obs ? "<br>" + esc(pv.obs) : "");
          return pv.mime === "application/pdf"
            ? '<figure class="doc-anexo doc-anexo--pdf"><p>Arquivo PDF: ' + esc(pv.nome) + " (" + tamanhoFmt(pv.tamanho) + "). Envie este arquivo junto com o dossiê.</p><figcaption>" + leg + "</figcaption></figure>"
            : '<figure class="doc-anexo"><img src="' + pv.dataUrl + '" alt="' + esc(tp.rotulo + ", anexo " + (i + 1)) + '"><figcaption>' + leg + "</figcaption></figure>";
        }).join("") + "</section>"
      : "";

    return {
      titulo: "Dossiê · " + v.cliente.nome,
      html:
        toolbar + '<div class="doc">' + capa +
        '<div class="sheet doc-corpo">' + resumo + contest + linha + check + miniaturas + declaracao + anexos +
        '<p class="doc-rodape">Dossiê gerado em ' + fmtDataHora(agora) + " por " + esc(loja.nome) + ". Este documento organiza informações fornecidas pelo lojista; não é aconselhamento jurídico e não garante o resultado da contestação. Prazos e regras do MED dependem do Banco Central e da instituição.</p>" +
        "</div></div>",
      montar: function (raiz) {
        $('[data-action="imprimir"]', raiz).addEventListener("click", function () {
          try {
            S.marcarDossieGerado(v.id);
          } catch (e) {}
          desenharNav("dossie");
          icones();
          window.print();
        });
      }
    };
  };

  /* ---------- Contestações e histórico ---------- */
  TELAS.contestacoes = function (aba) {
    aba = aba === "historico" ? "historico" : "abertas";
    var vendas = S.listarVendas().filter(function (v) {
      return v.contestacao;
    });
    var abertas = vendas.filter(function (v) {
      return v.contestacao.status === "aberta";
    }).sort(function (a, b) {
      return prazo(a.contestacao).restantes - prazo(b.contestacao).restantes;
    });
    var resolvidas = vendas.filter(function (v) {
      return v.contestacao.status !== "aberta";
    }).sort(function (a, b) {
      return (b.contestacao.resolvidaEm || "").localeCompare(a.contestacao.resolvidaEm || "");
    });
    var ganhas = resolvidas.filter(function (v) {
      return v.contestacao.status === "ganha";
    });
    var perdidas = resolvidas.filter(function (v) {
      return v.contestacao.status === "perdida";
    });
    function soma(l) {
      return l.reduce(function (s, v) {
        return s + v.valor;
      }, 0);
    }
    var painelAbertas = abertas.length
      ? '<ul class="clist">' + abertas.map(linhaContestacao).join("") + "</ul>"
      : vazio("shield-check", "Nenhuma contestação aberta", "Quando o banco avisar de um pedido de devolução pelo MED, abra a contestação na página da venda para acompanhar o prazo.", '<a class="btn btn--secondary" href="#vendas">Ir para as vendas</a>');
    var painelHist = resolvidas.length
      ? '<div class="hist-sum"><div class="hist-sum__item hist-sum__item--ganha">' + ic("trophy") + "<p><strong>" + plural(ganhas.length, "ganha", "ganhas") + "</strong>" + brl(soma(ganhas)) + " ficaram com a loja</p></div>" +
        '<div class="hist-sum__item hist-sum__item--perdida">' + ic("x-circle") + "<p><strong>" + plural(perdidas.length, "perdida", "perdidas") + "</strong>" + brl(soma(perdidas)) + " devolvidos</p></div></div>" +
        '<ul class="vlist">' + resolvidas.map(function (v) {
          var c = v.contestacao, f = forca(v);
          return (
            '<li><a class="vrow" href="#venda/' + v.id + '"><span class="vrow__main"><strong>' + esc(v.cliente.nome) + " · " + esc(v.produto) + "</strong>" +
            '<span class="vrow__meta">Aviso em ' + fmtData(c.dataAviso) + " · resolvida em " + fmtData(isoLocal(new Date(c.resolvidaEm))) + " · " + esc(motivoTexto(c)) + "</span>" +
            (c.resultadoObs ? '<span class="vrow__meta">' + esc(c.resultadoObs) + "</span>" : "") + "</span>" +
            '<span class="vrow__side"><span class="vrow__valor">' + brl(v.valor) + '</span><span class="vrow__badges">' + badgeContestacao(v) + badgeForca(v, f) + "</span></span>" + ic("chevron-right", "vrow__chev") + "</a></li>"
          );
        }).join("") + "</ul>"
      : vazio("history", "Nenhuma contestação resolvida ainda", "Quando você marcar uma contestação como ganha ou perdida, ela aparece aqui com o resultado.", "");
    return {
      titulo: "Contestações",
      html:
        '<header class="page-head"><div><h1>Contestações</h1><p class="lead">Pedidos de devolução pelo MED que chegaram às suas vendas.</p></div></header>' +
        '<div class="tabs" role="tablist" aria-label="Contestações">' +
        '<button type="button" role="tab" id="tab-abertas" aria-controls="painel-abertas" aria-selected="' + (aba === "abertas") + '" tabindex="' + (aba === "abertas" ? 0 : -1) + '">Abertas <span class="chip__n">' + abertas.length + "</span></button>" +
        '<button type="button" role="tab" id="tab-historico" aria-controls="painel-historico" aria-selected="' + (aba === "historico") + '" tabindex="' + (aba === "historico" ? 0 : -1) + '">Histórico <span class="chip__n">' + resolvidas.length + "</span></button></div>" +
        '<section role="tabpanel" id="painel-abertas" aria-labelledby="tab-abertas"' + (aba === "abertas" ? "" : " hidden") + ">" + painelAbertas + "</section>" +
        '<section role="tabpanel" id="painel-historico" aria-labelledby="tab-historico"' + (aba === "historico" ? "" : " hidden") + ">" + painelHist + "</section>" +
        '<aside class="notice">' + ic("info") + "<p>Os prazos seguem o que você configurou em cada contestação. Confira sempre o prazo real com sua instituição.</p></aside>",
      montar: function (raiz) {
        var tabs = $$('[role="tab"]', raiz);
        function ativar(t, focar) {
          tabs.forEach(function (x) {
            var sel = x === t;
            x.setAttribute("aria-selected", String(sel));
            x.tabIndex = sel ? 0 : -1;
            $("#" + x.getAttribute("aria-controls"), raiz).hidden = !sel;
          });
          history.replaceState(null, "", t.id === "tab-historico" ? "#contestacoes/historico" : "#contestacoes");
          if (focar) t.focus();
        }
        tabs.forEach(function (t, i) {
          t.addEventListener("click", function () {
            ativar(t);
          });
          t.addEventListener("keydown", function (e) {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              ativar(tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length], true);
            }
          });
        });
      }
    };
  };

  /* ---------- Ajustes ---------- */
  TELAS.ajustes = function () {
    var loja = S.getLoja();
    var uso = S.usoArmazenamento();
    var pct = Math.min(100, Math.round((uso.usado / uso.limite) * 100));
    return {
      titulo: "Ajustes",
      html:
        '<header class="page-head"><div><h1>Ajustes</h1><p class="lead">Os dados da loja aparecem na capa e na declaração do dossiê.</p></div></header>' +
        '<div class="layout-venda"><div class="col-main">' +
        '<form class="form card" id="form-loja" novalidate><h2>Dados da loja</h2>' +
        '<div class="form-summary" tabindex="-1" role="alert" hidden></div>' +
        '<div class="form-grid">' +
        campo({ nome: "lnome", rotulo: "Nome da loja", obrig: true, valor: loja.nome, classe: "field--full", attrs: ' autocomplete="organization"' }) +
        campo({ nome: "lcnpj", rotulo: "CNPJ", valor: loja.cnpj, attrs: ' inputmode="numeric" autocomplete="off" placeholder="00.000.000/0000-00"' }) +
        campo({ nome: "lresp", rotulo: "Responsável", valor: loja.responsavel, attrs: ' autocomplete="name"', dica: "Nome que assina a declaração." }) +
        campo({ nome: "lcidade", rotulo: "Cidade", valor: loja.cidade, attrs: ' autocomplete="off" placeholder="Ex.: Brasília - DF"' }) +
        campo({ nome: "lcontato", rotulo: "Telefone de contato", valor: loja.contato, attrs: ' inputmode="tel" autocomplete="off"' }) +
        "</div>" +
        '<div class="field" data-field="llogo"><span class="label">Logo <span class="opt">(opcional)</span></span>' +
        '<div class="logo-row"><span class="logo-prev" id="logo-prev">' + (loja.logo ? '<img src="' + loja.logo + '" alt="Logo atual da loja">' : ic("image")) + "</span>" +
        '<div><label class="btn btn--secondary btn--sm" for="f-llogo">' + ic("upload") + "Escolher imagem</label>" +
        '<input class="drop__input" id="f-llogo" name="llogo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="llogo-dica llogo-erro">' +
        (loja.logo ? ' <button type="button" class="btn btn--ghost btn--sm" data-action="tirar-logo">' + ic("trash-2") + "Remover logo</button>" : "") +
        '<p class="field__dica" id="llogo-dica">JPG, PNG ou WEBP. A imagem é reduzida para caber no dossiê.</p><p class="field__erro" id="llogo-erro"></p></div></div></div>' +
        '<div class="prazo-box">' +
        campo({
          nome: "lprazo", rotulo: "Prazo padrão para novas contestações (dias)", tipo: "number", obrig: true, valor: loja.prazoPadraoDias, attrs: ' inputmode="numeric" min="1" max="90" step="1"',
          dica: "Vem preenchido com <strong>7 dias como exemplo</strong>. Troque pelo prazo que sua instituição informar."
        }) +
        '<p class="prazo-aviso">' + ic("info") + "O prazo de resposta depende das regras vigentes do Banco Central e da sua instituição; confira. Você ainda pode ajustar o prazo em cada contestação.</p></div>" +
        '<div class="form__actions"><button class="btn btn--primary" type="submit">' + ic("check") + "Salvar ajustes</button></div></form>" +
        "</div>" +
        '<aside class="col-side">' +
        '<section class="card"><h2>Seus dados</h2><p>Versão de demonstração: os dados ficam salvos só neste aparelho. Se limpar o navegador, eles somem.</p>' +
        '<div class="uso"><div class="meter meter--uso" role="img" aria-label="Espaço usado: cerca de ' + pct + '%"><span style="width:' + Math.max(pct, 2) + '%"></span></div>' +
        '<p class="muted">' + tamanhoFmt(uso.usado) + " usados de cerca de " + tamanhoFmt(uso.limite) + " disponíveis neste navegador</p></div>" +
        '<div class="stack">' +
        '<button type="button" class="btn btn--secondary" data-action="exportar">' + ic("download") + "Baixar cópia dos dados</button>" +
        '<label class="btn btn--secondary" for="f-importar">' + ic("upload") + "Restaurar uma cópia</label>" +
        '<input class="drop__input" id="f-importar" type="file" accept="application/json,.json">' +
        '<button type="button" class="btn btn--ghost" data-action="recomecar">' + ic("rotate-ccw") + "Recomeçar demonstração</button>" +
        '<button type="button" class="btn btn--ghost btn--danger-text" data-action="apagar-tudo">' + ic("trash-2") + "Apagar todas as vendas</button>" +
        "</div></section>" +
        '<section class="card about-mobile"><h2>Sobre esta versão</h2><p>Os dados que vêm prontos são fictícios. O Dossiê Pix organiza provas; não é aconselhamento jurídico.</p>' +
        '<h3>Ir direto para a tela</h3><ul class="jump">' + ATALHOS.map(function (a) {
          return '<li><a href="#' + a[0] + '">' + a[1] + "</a></li>";
        }).join("") + "</ul>" +
        '<p class="links-row"><a href="../../projetos/dossie-pix.html">' + ic("file-text") + 'Página do projeto</a><a href="https://github.com/gabrielAbreu-it/projetos/tree/main/dossie-pix/docs">' + ic("book-open") + "Documentação</a></p></section>" +
        "</aside></div>",
      montar: function (raiz) {
        var form = $("#form-loja", raiz), el = form.elements;
        var novoLogo;
        el.lcnpj.addEventListener("input", function () {
          el.lcnpj.value = mascaraDoc(el.lcnpj.value);
        });
        el.lcontato.addEventListener("input", function () {
          el.lcontato.value = mascaraTel(el.lcontato.value);
        });
        el.llogo.addEventListener("change", function () {
          var file = el.llogo.files[0];
          if (!file) return;
          prepararArquivo(file, { maxLado: 400, limite: 300 * 1024, soImagem: true })
            .then(function (arq) {
              novoLogo = arq.dataUrl;
              $("#logo-prev", raiz).innerHTML = '<img src="' + arq.dataUrl + '" alt="Prévia do novo logo">';
              mostrarErros(form, {});
              toast("Logo carregado. Toque em Salvar ajustes para usar no dossiê.");
            })
            .catch(function (err) {
              mostrarErros(form, { llogo: err.message }, "Não deu para usar essa imagem");
            });
        });
        form.addEventListener("click", function (e) {
          var a = e.target.closest("[data-foco]");
          if (a) {
            e.preventDefault();
            if (el[a.dataset.foco]) el[a.dataset.foco].focus();
          }
        });
        form.addEventListener("submit", function (e) {
          e.preventDefault();
          var erros = {};
          if (el.lnome.value.trim().length < 2) erros.lnome = "Digite o nome da loja. Ele aparece na capa do dossiê.";
          if (el.lcnpj.value.trim() && !cnpjValido(el.lcnpj.value)) erros.lcnpj = "CNPJ inválido. Confira os 14 números ou deixe em branco.";
          var t = soDigitos(el.lcontato.value);
          if (t && (t.length < 10 || t.length > 11)) erros.lcontato = "Telefone incompleto. Use DDD + número.";
          var n = Number(el.lprazo.value);
          if (!el.lprazo.value || !Number.isInteger(n) || n < 1 || n > 90) erros.lprazo = "Digite um número de dias entre 1 e 90.";
          if (!mostrarErros(form, erros)) return;
          var dados = { nome: el.lnome.value.trim(), cnpj: el.lcnpj.value.trim(), responsavel: el.lresp.value.trim(), cidade: el.lcidade.value.trim(), contato: el.lcontato.value.trim(), prazoPadraoDias: n };
          if (novoLogo) dados.logo = novoLogo;
          if (salvarComSeguranca(function () {
            S.salvarLoja(dados);
          }, "Ajustes salvos.")) render();
        });
        raiz.addEventListener("click", function (e) {
          if (e.target.closest('[data-action="tirar-logo"]')) {
            if (salvarComSeguranca(function () {
              S.salvarLoja({ logo: null });
            }, "Logo removido.")) render();
          }
          if (e.target.closest('[data-action="exportar"]')) {
            var url = URL.createObjectURL(new Blob([S.exportar()], { type: "application/json" }));
            var a = document.createElement("a");
            a.href = url;
            a.download = "dossie-pix-copia-" + hoje() + ".json";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(function () {
              URL.revokeObjectURL(url);
            }, 2000);
            toast("Cópia baixada. Guarde o arquivo em um lugar seguro.");
          }
          if (e.target.closest('[data-action="apagar-tudo"]')) {
            dialogo({ titulo: "Apagar todas as vendas?", texto: "Todas as vendas, provas e contestações saem deste aparelho. Os dados da loja ficam. Se quiser, baixe uma cópia antes.", ok: "Apagar tudo", perigo: true }).then(function (r) {
              if (r && salvarComSeguranca(function () {
                S.apagarTudo();
              }, "Vendas apagadas.")) ir("#vendas");
            });
          }
        });
        $("#f-importar", raiz).addEventListener("change", function (e) {
          var file = e.target.files[0];
          if (!file) return;
          file.text().then(function (txt) {
            dialogo({ titulo: "Restaurar esta cópia?", texto: "Os dados atuais deste aparelho serão trocados pelos do arquivo " + esc(file.name) + ".", ok: "Restaurar cópia" }).then(function (r) {
              if (r && salvarComSeguranca(function () {
                S.importar(txt);
              }, "Cópia restaurada.")) ir("#painel");
              e.target.value = "";
            });
          });
        });
      }
    };
  };

  /* ---------- Estados de erro ---------- */
  function telaVendaSumiu() {
    return {
      titulo: "Venda não encontrada",
      html: vazio("file-question", "Venda não encontrada", "Ela pode ter sido excluída ou o link está incompleto. Os dados desta versão ficam só neste aparelho, então um link aberto em outro celular não mostra a venda.", '<a class="btn btn--primary" href="#vendas">Ver vendas</a><a class="btn btn--ghost" href="#painel">Ir para o painel</a>')
    };
  }
  function telaNaoEncontrada() {
    return { titulo: "Página não encontrada", html: vazio("compass", "Página não encontrada", "Esse endereço não existe no app.", '<a class="btn btn--primary" href="#painel">Ir para o painel</a>') };
  }

  /* ================= ações globais ================= */
  document.addEventListener("click", function (e) {
    if (e.target.closest('[data-action="recomecar"]')) {
      dialogo({ titulo: "Recomeçar a demonstração?", texto: "Tudo o que você criou neste aparelho será trocado pelos dados fictícios de exemplo.", ok: "Recomeçar" }).then(function (r) {
        if (!r) return;
        S.recomecarDemonstracao();
        buscaVendas = "";
        ir("#painel");
        toast("Demonstração recomeçada com dados fictícios.");
      });
    }
  });

  window.addEventListener("hashchange", render);
  S.carregar();
  render();
})();
