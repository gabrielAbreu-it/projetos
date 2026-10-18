/* Pila — protótipo navegável. Roteamento por hash, estado em memória, dados fictícios. */
(function () {
  'use strict';

  var D = window.PILA_DATA;
  var view = document.getElementById('view');
  var nav = document.getElementById('nav');
  var toasts = document.getElementById('toasts');
  var modal = document.getElementById('modal');

  var S = {
    atividade: 'confeitaria',
    movimentos: D.movimentos.slice(),
    dasPago: false,
    filtro: { escopo: 'todas', tipo: 'todos' },
    ultimo: null,
    lembreteDas: true,
    avisos: { 70: true, 80: true, 90: true },
    nextId: 100
  };

  /* ---------- utilidades ---------- */
  var fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function brl(v) {
    return fmt.format(v).replace(/ /g, ' ');
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ico(name, cls) {
    return '<i data-lucide="' + name + '" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '></i>';
  }
  function exemplo() {
    return '<span class="ex-badge">exemplo</span>';
  }
  function atividade() {
    return D.atividades.filter(function (a) { return a.id === S.atividade; })[0] || D.atividades[2];
  }
  function cat(tipo, id) {
    var c = D.categorias[tipo].filter(function (x) { return x.id === id; })[0];
    if (!c) return { nome: 'Outros', icone: 'circle-help', escopo: 'negocio' };
    var nome = c.nome;
    if (id === 'receita') nome = atividade().receita;
    if (id === 'material') nome = atividade().negocio;
    return { id: c.id, nome: nome, icone: c.icone, escopo: c.escopo };
  }
  function soma(lista) {
    return lista.reduce(function (t, m) { return t + m.valor; }, 0);
  }
  function totais() {
    var ms = S.movimentos;
    var entrou = soma(ms.filter(function (m) { return m.tipo === 'entrada' && m.escopo === 'negocio'; }));
    var saiu = soma(ms.filter(function (m) { return m.tipo === 'saida' && m.escopo === 'negocio'; }));
    var pessoalSaida = soma(ms.filter(function (m) { return m.tipo === 'saida' && m.escopo === 'pessoal'; }));
    var pessoalEntrada = soma(ms.filter(function (m) { return m.tipo === 'entrada' && m.escopo === 'pessoal'; }));
    var das = D.das.valorExemplo;
    var sobra = entrou - saiu - das;
    return {
      entrou: entrou, saiu: saiu, das: das, sobra: sobra,
      pessoal: pessoalSaida, livre: sobra - pessoalSaida + pessoalEntrada
    };
  }
  function anual() {
    var antes = D.limite.meses.reduce(function (t, m) { return t + m[1]; }, 0);
    var total = antes + totais().entrou;
    var ref = D.limite.referencia;
    return { antes: antes, total: total, ref: ref, pct: Math.round((total / ref) * 100), falta: Math.max(ref - total, 0) };
  }
  function diaLabel(d) {
    if (d === D.hoje.dia) return 'Hoje, ' + d + ' de outubro';
    if (d === D.hoje.dia - 1) return 'Ontem, ' + d + ' de outubro';
    return d + ' de outubro';
  }

  /* ---------- toasts e modal ---------- */
  function toast(msg, acao) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = ico('circle-check') + '<span>' + msg + '</span>';
    if (acao) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'toast__action';
      b.textContent = acao.label;
      b.addEventListener('click', function () { acao.fn(); el.remove(); });
      el.appendChild(b);
    }
    toasts.appendChild(el);
    icons();
    setTimeout(function () { el.remove(); }, 6000);
  }

  function confirmar(opts) {
    modal.innerHTML =
      '<div class="modal__body">' +
      '<span class="modal__icon">' + ico(opts.icone || 'circle-help') + '</span>' +
      '<h2 id="modal-title">' + opts.titulo + '</h2>' +
      '<p id="modal-text">' + opts.texto + '</p>' +
      '<div class="modal__actions">' +
      '<button type="button" class="btn btn--ghost" data-m="nao">' + (opts.nao || 'Cancelar') + '</button>' +
      '<button type="button" class="btn btn--ink" data-m="sim">' + opts.sim + '</button>' +
      '</div></div>';
    icons();
    modal.showModal();
    modal.querySelector('[data-m="nao"]').focus();
    modal.querySelector('[data-m="nao"]').addEventListener('click', function () { modal.close(); });
    modal.querySelector('[data-m="sim"]').addEventListener('click', function () { modal.close(); opts.onSim(); });
  }
  modal.addEventListener('click', function (e) { if (e.target === modal) modal.close(); });

  function icons() {
    if (window.lucide) window.lucide.createIcons();
  }

  /* ---------- peças comuns ---------- */
  function topo(titulo, sub, voltar) {
    return (
      '<header class="topbar">' +
      (voltar ? '<a class="icon-btn" href="' + voltar + '" aria-label="Voltar">' + ico('arrow-left') + '</a>' : '') +
      '<div><h1 tabindex="-1">' + titulo + '</h1>' + (sub ? '<p class="topbar__sub">' + sub + '</p>' : '') + '</div>' +
      '</header>'
    );
  }

  function itemMov(m) {
    var c = cat(m.tipo, m.cat);
    var sinal = m.tipo === 'entrada' ? '+ ' : '− ';
    return (
      '<li class="mov">' +
      '<span class="mov__icon mov__icon--' + m.tipo + '">' + ico(c.icone) + '</span>' +
      '<span class="mov__main"><span class="mov__desc">' + esc(m.desc || c.nome) + '</span>' +
      '<span class="mov__meta">' + esc(c.nome) + ' · <span class="tag tag--' + m.escopo + '">' + (m.escopo === 'negocio' ? 'Negócio' : 'Pessoal') + '</span></span></span>' +
      '<span class="mov__valor mov__valor--' + m.tipo + '"><span class="sr-only">' + (m.tipo === 'entrada' ? 'Entrada de' : 'Saída de') + ' </span>' +
      '<span aria-hidden="true">' + sinal + '</span>' + brl(m.valor) + '</span>' +
      '</li>'
    );
  }

  function renderNav(rota) {
    var itens = [
      ['inicio', 'house', 'Início'],
      ['movimentacoes', 'list-ordered', 'Movimentos'],
      ['registrar', 'plus', 'Registrar'],
      ['das', 'receipt', 'DAS'],
      ['relatorio', 'chart-column', 'Relatório']
    ];
    var semNav = ['boas-vindas', 'registrar', 'registrado'];
    if (semNav.indexOf(rota) !== -1) {
      nav.innerHTML = '';
      nav.hidden = true;
      return;
    }
    nav.hidden = false;
    var ativo = rota === 'primeiro-uso' || rota === 'limite' ? 'inicio' : rota;
    nav.innerHTML = itens
      .map(function (i) {
        var cur = ativo === i[0] ? ' aria-current="page"' : '';
        var cls = i[0] === 'registrar' ? 'tab tab--add' : 'tab';
        return '<a class="' + cls + '" href="#' + i[0] + '"' + cur + '><span class="tab__ico">' + ico(i[1]) + '</span><span>' + i[2] + '</span></a>';
      })
      .join('');
  }

  /* ---------- telas ---------- */

  /* 1. Boas-vindas e escolha da atividade */
  function telaBoasVindas() {
    var cards = D.atividades
      .map(function (a) {
        return (
          '<label class="choice">' +
          '<input type="radio" name="atividade" value="' + a.id + '" />' +
          '<span class="choice__box">' + ico(a.icone) + '<span>' + a.nome + '</span></span>' +
          '</label>'
        );
      })
      .join('');
    return (
      '<section class="onb">' +
      '<div class="onb__hero on-ink">' +
      '<span class="logo logo--lg" aria-hidden="true">P</span>' +
      '<h1 tabindex="-1">O dinheiro do trabalho de um lado. O seu, do outro.</h1>' +
      '<p>O Pila separa o que é do negócio e o que é seu, guarda o DAS do mês e avisa quando o limite anual do MEI estiver chegando.</p>' +
      '</div>' +
      '<form class="onb__form" id="form-onb" novalidate>' +
      '<fieldset class="field" aria-describedby="atividade-dica atividade-erro">' +
      '<legend class="field__label">Qual é a sua atividade?</legend>' +
      '<p class="field__hint" id="atividade-dica">Usamos isso para sugerir as categorias certas. Dá para mudar depois.</p>' +
      '<div class="choices">' + cards + '</div>' +
      '<p class="field__error" id="atividade-erro" hidden>' + ico('circle-alert') + '<span>Escolha uma atividade para continuar.</span></p>' +
      '</fieldset>' +
      '<button type="submit" class="btn btn--sun btn--block">Começar</button>' +
      '<p class="onb__note">' + ico('info') + 'Protótipo com dados fictícios. Nenhum dado sai do seu aparelho.</p>' +
      '</form>' +
      '</section>'
    );
  }
  function bindBoasVindas() {
    var form = document.getElementById('form-onb');
    var erro = document.getElementById('atividade-erro');
    var fs = form.querySelector('fieldset');
    form.addEventListener('change', function () {
      erro.hidden = true;
      fs.classList.remove('is-invalid');
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var sel = form.querySelector('input[name="atividade"]:checked');
      if (!sel) {
        erro.hidden = false;
        fs.classList.add('is-invalid');
        form.querySelector('input[name="atividade"]').focus();
        return;
      }
      S.atividade = sel.value;
      location.hash = '#primeiro-uso';
    });
  }

  /* 2. Primeiro uso: estado vazio */
  function telaPrimeiroUso() {
    return (
      '<header class="hello"><div><p class="hello__sub">' + esc(atividade().nome) + ' · MEI</p><h1 tabindex="-1">Tudo pronto para começar</h1></div></header>' +
      '<section class="hero on-ink hero--empty" aria-labelledby="h-vazio">' +
      '<h2 id="h-vazio" class="hero__label">Quanto é seu de verdade em outubro</h2>' +
      '<p class="hero__big">' + brl(0) + '</p>' +
      '<p class="hero__explain">Assim que você registrar, a conta aparece aqui: <strong>o que entrou</strong> no negócio, menos <strong>o que saiu</strong>, menos <strong>o DAS</strong>. O que sobra é seu.</p>' +
      '</section>' +
      '<section class="empty">' +
      '<span class="empty__art">' + ico('piggy-bank') + '</span>' +
      '<h2>Nenhuma movimentação ainda</h2>' +
      '<p>Comece pela última venda ou serviço que você recebeu. Leva menos de um minuto.</p>' +
      '<a class="btn btn--sun btn--block" href="#registrar">' + ico('plus') + 'Registrar primeira entrada</a>' +
      '</section>' +
      '<section class="card">' +
      '<h2 class="card__title">Primeiros passos</h2>' +
      '<ol class="steps">' +
      '<li><span class="steps__n">1</span><span>Registre uma entrada do seu trabalho</span></li>' +
      '<li><span class="steps__n">2</span><span>Confira quando vence o seu DAS (todo dia 20)</span></li>' +
      '<li><span class="steps__n">3</span><span>Veja quanto do limite anual você já usou</span></li>' +
      '</ol>' +
      '</section>' +
      '<p class="center"><a class="link" href="#inicio">Ver o app com dados de exemplo</a></p>'
    );
  }

  /* 3. Início */
  function telaInicio() {
    var t = totais();
    var a = anual();
    var ult = S.movimentos.slice().sort(function (x, y) { return y.dia - x.dia || (y.id > x.id ? 1 : -1); }).slice(0, 3);
    var faltam = D.das.vencimentoDia - D.hoje.dia;
    var dasCard = S.dasPago
      ? '<span class="chip chip--ok">' + ico('check') + 'Pago</span><p class="row-card__text">DAS de outubro já está pago. O próximo vence em 20 de novembro.</p>'
      : '<span class="chip chip--warn">A pagar</span><p class="row-card__text">DAS de outubro vence em <strong>' + faltam + ' dias</strong>, no dia 20. ' + brl(t.das) + ' ' + exemplo() + '</p>';
    var alerta = a.pct >= 80;
    return (
      '<header class="hello"><div><p class="hello__sub">' + esc(atividade().nome) + ' · MEI</p><h1 tabindex="-1">Olá, ' + esc(D.usuaria) + '</h1></div>' +
      '<span class="month">' + ico('calendar') + 'Out 2026</span></header>' +

      '<section class="hero on-ink" aria-labelledby="h-sobra">' +
      '<h2 id="h-sobra" class="hero__label">Quanto é seu de verdade em outubro</h2>' +
      '<p class="hero__big">' + brl(t.sobra) + '</p>' +
      '<dl class="calc">' +
      '<div><dt>' + ico('arrow-down-left') + 'Entrou no negócio</dt><dd>+ ' + brl(t.entrou) + '</dd></div>' +
      '<div><dt>' + ico('arrow-up-right') + 'Saiu do negócio</dt><dd>− ' + brl(t.saiu) + '</dd></div>' +
      '<div><dt>' + ico('receipt') + 'Separado para o DAS ' + exemplo() + '</dt><dd>− ' + brl(t.das) + '</dd></div>' +
      '<div class="calc__total"><dt>Sobra para você</dt><dd>= ' + brl(t.sobra) + '</dd></div>' +
      '</dl>' +
      '<p class="hero__foot">Você já usou <strong>' + brl(t.pessoal) + '</strong> em gastos pessoais. Ainda livre: <strong>' + brl(t.livre) + '</strong>.</p>' +
      '</section>' +

      '<div class="quick">' +
      '<a class="btn btn--sun" href="#registrar">' + ico('arrow-down-left') + 'Entrada</a>' +
      '<a class="btn btn--ghost" href="#registrar/saida">' + ico('arrow-up-right') + 'Saída</a>' +
      '</div>' +

      '<a class="row-card" href="#das"><span class="row-card__icon">' + ico('calendar-clock') + '</span><span class="row-card__body"><span class="row-card__title">DAS do mês</span>' + dasCard + '</span>' + ico('chevron-right', 'row-card__go') + '</a>' +

      '<a class="row-card' + (alerta ? ' row-card--warn' : '') + '" href="#limite"><span class="row-card__icon">' + ico(alerta ? 'triangle-alert' : 'gauge') + '</span><span class="row-card__body">' +
      '<span class="row-card__title">Limite anual do MEI ' + exemplo() + '</span>' +
      '<span class="bar" role="img" aria-label="' + a.pct + '% do limite de referência usado"><span class="bar__fill" style="width:' + Math.min(a.pct, 100) + '%"></span></span>' +
      '<span class="row-card__text">' + brl(a.total) + ' de ' + brl(a.ref) + ' · <strong>' + a.pct + '%</strong>' + (alerta ? '. Está chegando perto.' : '') + '</span>' +
      '</span>' + ico('chevron-right', 'row-card__go') + '</a>' +

      '<section class="card"><div class="card__head"><h2 class="card__title">Últimas movimentações</h2><a class="link" href="#movimentacoes">Ver todas</a></div>' +
      '<ul class="movs">' + ult.map(itemMov).join('') + '</ul></section>'
    );
  }

  /* 4. Registrar */
  function telaRegistrar(tipo) {
    return (
      topo('Nova movimentação', 'Hoje, 16 de outubro', '#inicio') +
      '<form class="form" id="form-mov" novalidate>' +
      '<div class="err-summary" id="err-summary" role="alert" hidden></div>' +
      '<fieldset class="field"><legend class="field__label">O que aconteceu?</legend>' +
      '<div class="seg" id="seg-tipo">' +
      '<label class="seg__opt seg__opt--in"><input type="radio" name="tipo" value="entrada"' + (tipo === 'entrada' ? ' checked' : '') + ' /><span>' + ico('arrow-down-left') + 'Entrou dinheiro</span></label>' +
      '<label class="seg__opt seg__opt--out"><input type="radio" name="tipo" value="saida"' + (tipo === 'saida' ? ' checked' : '') + ' /><span>' + ico('arrow-up-right') + 'Saiu dinheiro</span></label>' +
      '</div></fieldset>' +

      '<div class="field" id="f-valor">' +
      '<label class="field__label" for="valor">Valor <span class="req">(obrigatório)</span></label>' +
      '<div class="money"><span class="money__pre" aria-hidden="true">R$</span><input id="valor" name="valor" inputmode="decimal" autocomplete="off" placeholder="0,00" aria-describedby="valor-erro" /></div>' +
      '<p class="field__error" id="valor-erro" hidden>' + ico('circle-alert') + '<span></span></p>' +
      '</div>' +

      '<div class="field">' +
      '<label class="field__label" for="desc">Descrição <span class="opt">(opcional)</span></label>' +
      '<input class="input" id="desc" name="desc" maxlength="60" placeholder="Ex.: bolo da Júlia" />' +
      '</div>' +

      '<fieldset class="field" id="f-cat" aria-describedby="cat-erro"><legend class="field__label">Categoria <span class="req">(obrigatório)</span></legend>' +
      '<div class="cats" id="cats"></div>' +
      '<p class="field__error" id="cat-erro" hidden>' + ico('circle-alert') + '<span>Escolha uma categoria.</span></p>' +
      '</fieldset>' +

      '<fieldset class="field" aria-describedby="escopo-dica"><legend class="field__label">De quem é esse dinheiro?</legend>' +
      '<div class="seg seg--scope">' +
      '<label class="seg__opt seg__opt--neg"><input type="radio" name="escopo" value="negocio" checked /><span>' + ico('store') + 'Do negócio</span></label>' +
      '<label class="seg__opt seg__opt--pes"><input type="radio" name="escopo" value="pessoal" /><span>' + ico('user') + 'Pessoal</span></label>' +
      '</div>' +
      '<p class="field__hint" id="escopo-dica">Sugerimos pela categoria. Pode trocar se precisar.</p>' +
      '</fieldset>' +

      '<button type="submit" class="btn btn--sun btn--block" id="btn-salvar">Salvar</button>' +
      '</form>'
    );
  }
  function bindRegistrar(mostrarErro) {
    var form = document.getElementById('form-mov');
    var catsEl = document.getElementById('cats');
    var escopoManual = false;

    function tipoAtual() {
      return form.querySelector('input[name="tipo"]:checked').value;
    }
    function desenharCats() {
      var t = tipoAtual();
      catsEl.innerHTML = D.categorias[t]
        .map(function (c) {
          var cc = cat(t, c.id);
          return '<label class="cat"><input type="radio" name="cat" value="' + c.id + '" /><span>' + ico(cc.icone) + cc.nome + '</span></label>';
        })
        .join('');
      document.getElementById('btn-salvar').textContent = t === 'entrada' ? 'Salvar entrada' : 'Salvar saída';
      icons();
    }
    function limparErro(id) {
      var el = document.getElementById(id);
      el.hidden = true;
      el.parentElement.classList.remove('is-invalid');
    }
    desenharCats();

    form.addEventListener('change', function (e) {
      if (e.target.name === 'tipo') { desenharCats(); escopoManual = false; }
      if (e.target.name === 'cat') {
        limparErro('cat-erro');
        if (!escopoManual) {
          var sug = cat(tipoAtual(), e.target.value).escopo;
          form.querySelector('input[name="escopo"][value="' + sug + '"]').checked = true;
          document.getElementById('escopo-dica').textContent = 'Sugerido pela categoria: ' + (sug === 'negocio' ? 'do negócio' : 'pessoal') + '. Pode trocar se precisar.';
        }
      }
      if (e.target.name === 'escopo') escopoManual = true;
    });
    form.valor.addEventListener('input', function () {
      if (!document.getElementById('valor-erro').hidden && parseValor(form.valor.value) > 0) limparErro('valor-erro');
    });

    function validar() {
      var erros = [];
      var v = parseValor(form.valor.value);
      var ev = document.getElementById('valor-erro');
      var msg = '';
      if (form.valor.value.trim() === '') msg = 'Digite o valor. Ex.: 150,00';
      else if (isNaN(v)) msg = 'Use só números, com vírgula para os centavos. Ex.: 150,00';
      else if (v <= 0) msg = 'O valor precisa ser maior que zero.';
      else if (v > 100000) msg = 'Valor muito alto para um registro só. Confira os números.';
      if (msg) {
        ev.querySelector('span').textContent = msg;
        ev.hidden = false;
        ev.parentElement.classList.add('is-invalid');
        form.valor.setAttribute('aria-invalid', 'true');
        erros.push(['valor', msg]);
      } else {
        form.valor.removeAttribute('aria-invalid');
      }
      if (!form.querySelector('input[name="cat"]:checked')) {
        document.getElementById('cat-erro').hidden = false;
        document.getElementById('f-cat').classList.add('is-invalid');
        erros.push(['cats', 'Escolha uma categoria.']);
      }
      var sum = document.getElementById('err-summary');
      if (erros.length) {
        sum.hidden = false;
        sum.innerHTML = '<p><strong>' + (erros.length === 1 ? 'Falta 1 coisa' : 'Faltam ' + erros.length + ' coisas') + ' para salvar:</strong></p><ul>' +
          erros.map(function (e) { return '<li><a href="#" data-go="' + e[0] + '">' + e[1] + '</a></li>'; }).join('') + '</ul>';
        sum.querySelectorAll('[data-go]').forEach(function (a) {
          a.addEventListener('click', function (ev2) {
            ev2.preventDefault();
            var alvo = a.getAttribute('data-go') === 'valor' ? form.valor : catsEl.querySelector('input');
            alvo.focus();
          });
        });
        (erros[0][0] === 'valor' ? form.valor : catsEl.querySelector('input')).focus();
        return null;
      }
      sum.hidden = true;
      return v;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = validar();
      if (v === null) return;
      var m = {
        id: 'n' + S.nextId++,
        dia: D.hoje.dia,
        tipo: tipoAtual(),
        cat: form.querySelector('input[name="cat"]:checked').value,
        escopo: form.querySelector('input[name="escopo"]:checked').value,
        desc: form.desc.value.trim(),
        valor: v
      };
      S.movimentos.push(m);
      S.ultimo = m;
      location.hash = '#registrado';
    });

    if (mostrarErro) validar();
  }
  function parseValor(s) {
    s = String(s).trim().replace(/\s|R\$/g, '');
    if (!s) return NaN;
    if (!/^[0-9.,]+$/.test(s)) return NaN;
    if (s.indexOf(',') !== -1) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    var n = parseFloat(s);
    return isNaN(n) ? NaN : Math.round(n * 100) / 100;
  }

  /* 5. Registro confirmado */
  function telaRegistrado() {
    var m = S.ultimo || { tipo: 'entrada', cat: 'receita', escopo: 'negocio', desc: 'Bolo de aniversário (exemplo)', valor: 180, dia: 16, exemplo: true };
    var c = cat(m.tipo, m.cat);
    var t = totais();
    var impacto;
    if (m.escopo === 'negocio') {
      impacto = 'Com isso, sobram <strong>' + brl(S.ultimo ? t.sobra : t.sobra + m.valor) + '</strong> para você em outubro.';
    } else {
      impacto = 'Como é pessoal, não muda o lucro do negócio. Entra na conta do que você já usou para você.';
    }
    return (
      '<section class="done">' +
      '<span class="done__icon">' + ico('check') + '</span>' +
      '<h1 tabindex="-1">' + (m.tipo === 'entrada' ? 'Entrada registrada' : 'Saída registrada') + '</h1>' +
      '<p class="done__impact">' + impacto + '</p>' +
      '<dl class="receipt">' +
      '<div><dt>Valor</dt><dd class="mov__valor--' + m.tipo + '">' + (m.tipo === 'entrada' ? '+ ' : '− ') + brl(m.valor) + '</dd></div>' +
      '<div><dt>Categoria</dt><dd>' + esc(c.nome) + '</dd></div>' +
      '<div><dt>De quem é</dt><dd><span class="tag tag--' + m.escopo + '">' + (m.escopo === 'negocio' ? 'Negócio' : 'Pessoal') + '</span></dd></div>' +
      (m.desc ? '<div><dt>Descrição</dt><dd>' + esc(m.desc) + '</dd></div>' : '') +
      '<div><dt>Data</dt><dd>' + diaLabel(m.dia) + '</dd></div>' +
      '</dl>' +
      (m.exemplo ? '<p class="note">' + ico('info') + 'Registro de exemplo. Registre algo em "Registrar" para ver o seu.</p>' : '') +
      '<div class="done__actions">' +
      '<a class="btn btn--sun btn--block" href="#registrar">' + ico('plus') + 'Registrar outra</a>' +
      '<a class="btn btn--ghost btn--block" href="#inicio">Voltar ao início</a>' +
      '</div>' +
      '</section>'
    );
  }

  /* 6. Movimentações */
  function telaMovimentacoes() {
    return (
      topo('Movimentações', 'Outubro de 2026') +
      '<div class="filters" aria-label="Filtros">' +
      '<div class="filters__row" role="group" aria-label="De quem é">' + filtroBtns('escopo', [['todas', 'Todas'], ['negocio', 'Negócio'], ['pessoal', 'Pessoal']]) + '</div>' +
      '<div class="filters__row" role="group" aria-label="Tipo">' + filtroBtns('tipo', [['todos', 'Entradas e saídas'], ['entrada', 'Entradas'], ['saida', 'Saídas']]) + '</div>' +
      '</div>' +
      '<div id="lista"></div>'
    );
  }
  function filtroBtns(grupo, ops) {
    return ops
      .map(function (o) {
        return '<button type="button" class="pill" data-f="' + grupo + '" data-v="' + o[0] + '" aria-pressed="' + (S.filtro[grupo] === o[0]) + '">' + o[1] + '</button>';
      })
      .join('');
  }
  function desenharLista() {
    var f = S.filtro;
    var lista = S.movimentos.filter(function (m) {
      return (f.escopo === 'todas' || m.escopo === f.escopo) && (f.tipo === 'todos' || m.tipo === f.tipo);
    });
    var el = document.getElementById('lista');
    var ativo = f.escopo !== 'todas' || f.tipo !== 'todos';
    var ent = soma(lista.filter(function (m) { return m.tipo === 'entrada'; }));
    var sai = soma(lista.filter(function (m) { return m.tipo === 'saida'; }));
    var resumo =
      '<p class="count" aria-live="polite"><strong>' + lista.length + (lista.length === 1 ? ' movimentação' : ' movimentações') + '</strong>' +
      (lista.length ? '<br />Entrou ' + brl(ent) + ' · saiu ' + brl(sai) : '') + '</p>';
    if (!lista.length) {
      el.innerHTML =
        resumo +
        '<div class="empty empty--small"><span class="empty__art">' + ico('inbox') + '</span><h2>Nada com esses filtros</h2>' +
        '<p>Você ainda não registrou ' + (f.tipo === 'entrada' ? 'entradas' : f.tipo === 'saida' ? 'saídas' : 'movimentações') + (f.escopo === 'pessoal' ? ' pessoais' : f.escopo === 'negocio' ? ' do negócio' : '') + ' em outubro.</p>' +
        '<button type="button" class="btn btn--ghost" id="limpar">Limpar filtros</button></div>';
      document.getElementById('limpar').addEventListener('click', function () {
        S.filtro = { escopo: 'todas', tipo: 'todos' };
        render();
      });
      icons();
      return;
    }
    var dias = {};
    lista.forEach(function (m) { (dias[m.dia] = dias[m.dia] || []).push(m); });
    var html = Object.keys(dias)
      .map(Number)
      .sort(function (a, b) { return b - a; })
      .map(function (d) {
        return '<section class="day"><h2 class="day__title">' + diaLabel(d) + '</h2><ul class="movs">' + dias[d].slice().reverse().map(itemMov).join('') + '</ul></section>';
      })
      .join('');
    el.innerHTML = resumo + (ativo ? '<p class="center"><button type="button" class="link" id="limpar">Limpar filtros</button></p>' : '') + html;
    if (ativo) document.getElementById('limpar').addEventListener('click', function () {
      S.filtro = { escopo: 'todas', tipo: 'todos' };
      render();
    });
    icons();
  }
  function bindMovimentacoes() {
    document.querySelectorAll('[data-f]').forEach(function (b) {
      b.addEventListener('click', function () {
        S.filtro[b.getAttribute('data-f')] = b.getAttribute('data-v');
        document.querySelectorAll('[data-f="' + b.getAttribute('data-f') + '"]').forEach(function (x) {
          x.setAttribute('aria-pressed', String(x === b));
        });
        desenharLista();
      });
    });
    desenharLista();
  }

  /* 7. DAS */
  function telaDas(atrasado) {
    var valor = D.das.valorExemplo;
    var status;
    if (S.dasPago) {
      status =
        '<div class="das-status das-status--ok">' +
        '<span class="chip chip--ok">' + ico('check') + 'Pago</span>' +
        '<p class="das-status__big">' + brl(valor) + ' ' + exemplo() + '</p>' +
        '<p>Você marcou o DAS de outubro como pago em ' + (atrasado ? '23/10' : '16/10') + '. O próximo vence em <strong>20 de novembro</strong>.</p>' +
        '<button type="button" class="btn btn--ghost btn--block" id="das-desfazer">Desfazer: ainda não paguei</button>' +
        '</div>';
    } else if (atrasado) {
      status =
        '<div class="das-status das-status--late" role="alert">' +
        '<span class="chip chip--late">' + ico('triangle-alert') + 'Atrasado há 3 dias</span>' +
        '<p class="das-status__big">' + brl(valor) + ' ' + exemplo() + '</p>' +
        '<p>O DAS de outubro venceu no dia 20. Pague o quanto antes: guia em atraso costuma vir com multa e juros, então <strong>gere uma guia nova com a data de hoje</strong> no canal oficial antes de pagar.</p>' +
        '<button type="button" class="btn btn--ink btn--block" id="das-pagar">' + ico('check') + 'Já paguei, marcar como pago</button>' +
        '</div>';
    } else {
      status =
        '<div class="das-status">' +
        '<span class="chip chip--warn">A pagar</span>' +
        '<p class="das-status__big">' + brl(valor) + ' ' + exemplo() + '</p>' +
        '<p>Vence em <strong>4 dias</strong>, na terça, <strong>20 de outubro</strong>. Esse valor já está separado na conta do “quanto é seu”.</p>' +
        '<button type="button" class="btn btn--ink btn--block" id="das-pagar">' + ico('check') + 'Já paguei, marcar como pago</button>' +
        '</div>';
    }
    return (
      topo('DAS de outubro', atrasado ? 'Simulação: hoje é 23 de outubro' : 'Guia mensal do MEI', '#inicio') +
      status +
      '<section class="card"><h2 class="card__title">Como pagar</h2>' +
      '<ol class="steps">' +
      '<li><span class="steps__n">1</span><span>Gere a guia do mês no app oficial do MEI ou no Portal do Empreendedor.</span></li>' +
      '<li><span class="steps__n">2</span><span>Pague por Pix, boleto ou no app do banco.</span></li>' +
      '<li><span class="steps__n">3</span><span>Volte aqui e marque como pago. O Pila tira o aviso.</span></li>' +
      '</ol></section>' +
      '<details class="card faq"><summary>' + ico('circle-help') + 'O que é o DAS?</summary>' +
      '<p>É a guia que o MEI paga todo mês, com vencimento no dia 20. Ela reúne os impostos e a contribuição para o INSS, que conta para a aposentadoria e outros benefícios. O valor muda conforme a atividade e é reajustado de tempos em tempos.</p>' +
      '<p class="note">' + ico('info') + 'O valor mostrado aqui é um exemplo fictício. Confira o valor do seu mês na guia oficial.</p>' +
      '</details>' +
      '<section class="card"><div class="switch-row"><label for="lembrete">Me lembrar 3 dias antes do vencimento</label>' +
      '<input type="checkbox" role="switch" class="switch" id="lembrete"' + (S.lembreteDas ? ' checked' : '') + ' /></div></section>' +
      '<section class="card"><h2 class="card__title">Meses anteriores</h2><ul class="hist">' +
      D.das.historico.map(function (h) {
        return '<li><span>' + h.mes.charAt(0).toUpperCase() + h.mes.slice(1) + '</span><span class="chip chip--ok chip--sm">' + ico('check') + 'Pago em ' + h.pagoEm + '</span></li>';
      }).join('') +
      '</ul></section>'
    );
  }
  function bindDas() {
    var pagar = document.getElementById('das-pagar');
    if (pagar)
      pagar.addEventListener('click', function () {
        confirmar({
          icone: 'receipt',
          titulo: 'Marcar o DAS de outubro como pago?',
          texto: 'Faça isso só depois de pagar a guia. Se errar, dá para desfazer.',
          sim: 'Sim, já paguei',
          onSim: function () {
            S.dasPago = true;
            render();
            toast('DAS de outubro marcado como pago.', { label: 'Desfazer', fn: function () { S.dasPago = false; render(); } });
          }
        });
      });
    var desf = document.getElementById('das-desfazer');
    if (desf)
      desf.addEventListener('click', function () {
        S.dasPago = false;
        render();
        toast('Pronto, o DAS de outubro voltou para “a pagar”.');
      });
    document.getElementById('lembrete').addEventListener('change', function (e) {
      S.lembreteDas = e.target.checked;
      toast(e.target.checked ? 'Lembrete ligado: avisamos no dia 17.' : 'Lembrete desligado.');
    });
  }

  /* 8. Limite anual */
  function telaLimite() {
    var a = anual();
    var media = a.antes / D.limite.meses.length;
    /* projeção simples: outubro e meses seguintes no ritmo médio */
    var acumulado = a.antes + Math.max(media, totais().entrou);
    var nomes = ['outubro', 'novembro', 'dezembro'];
    var mesLimite = null;
    for (var i = 0; i < 3; i++) {
      if (i > 0) acumulado += media;
      if (acumulado >= a.ref) { mesLimite = nomes[i]; break; }
    }
    var max = Math.max.apply(null, D.limite.meses.map(function (m) { return m[1]; }));
    var barras = D.limite.meses
      .concat([['out', totais().entrou, true]])
      .map(function (m) {
        var h = Math.round((m[1] / max) * 100);
        return '<li class="cols__item' + (m[2] ? ' cols__item--now' : '') + '"><span class="cols__bar" style="height:' + h + '%"></span><span class="cols__label">' + m[0] + '</span></li>';
      })
      .join('');
    return (
      topo('Limite anual do MEI', 'Janeiro a outubro de 2026', '#inicio') +
      '<div class="banner banner--warn" role="note">' + ico('triangle-alert') + '<p><strong>Você já usou ' + a.pct + '% do limite de referência.</strong> Ainda dá para planejar com calma.</p></div>' +
      '<section class="card limit">' +
      '<p class="limit__label">Entrou no negócio em 2026</p>' +
      '<p class="limit__big">' + brl(a.total) + '</p>' +
      '<p class="limit__of">de ' + brl(a.ref) + ' ' + exemplo() + '</p>' +
      '<div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + a.pct + '" aria-label="Limite anual usado">' +
      '<span class="meter__fill" style="width:' + Math.min(a.pct, 100) + '%"></span>' +
      D.limite.avisos.map(function (p) { return '<span class="meter__mark" style="left:' + p + '%"></span>'; }).join('') +
      '</div>' +
      '<p class="caption meter__caption">As marcas brancas são os avisos de 70%, 80% e 90%.</p>' +
      '<p class="limit__left">Faltam <strong>' + brl(a.falta) + '</strong> até o limite.</p>' +
      '</section>' +
      '<section class="card"><h2 class="card__title">No ritmo de hoje</h2>' +
      '<p>Sua média de janeiro a setembro foi de <strong>' + brl(Math.round(media)) + ' por mês</strong>. ' +
      (mesLimite ? 'Se continuar assim, você chega ao limite em <strong>' + mesLimite + '</strong>.' : 'Nesse ritmo, você fecha o ano dentro do limite.') + '</p>' +
      '<ol class="cols" aria-label="Entradas do negócio por mês, de janeiro a outubro. Outubro ainda está em andamento.">' + barras + '</ol>' +
      '<p class="caption">Outubro em amarelo: mês em andamento, até o dia 16.</p>' +
      '</section>' +
      '<section class="card"><h2 class="card__title">O que você pode fazer agora</h2>' +
      '<ul class="tips">' +
      '<li>' + ico('calendar-clock') + '<span>Acompanhe esta barra todo mês. O Pila avisa quando passar de cada marca.</span></li>' +
      '<li>' + ico('user') + '<span>Converse com um contador antes de chegar no limite. Passar dele pode exigir mudar o tipo da empresa.</span></li>' +
      '<li>' + ico('landmark') + '<span>Confira o valor oficial do limite no Portal do Empreendedor. Aqui usamos um valor de referência de exemplo.</span></li>' +
      '</ul></section>' +
      '<section class="card"><h2 class="card__title">Me avisar quando chegar em</h2>' +
      D.limite.avisos.map(function (p) {
        return '<div class="switch-row"><label for="aviso-' + p + '">' + p + '% do limite</label><input type="checkbox" role="switch" class="switch" id="aviso-' + p + '" data-aviso="' + p + '"' + (S.avisos[p] ? ' checked' : '') + ' /></div>';
      }).join('') +
      '</section>'
    );
  }
  function bindLimite() {
    document.querySelectorAll('[data-aviso]').forEach(function (s) {
      s.addEventListener('change', function () {
        var p = s.getAttribute('data-aviso');
        S.avisos[p] = s.checked;
        toast(s.checked ? 'Aviso de ' + p + '% ligado.' : 'Aviso de ' + p + '% desligado.');
      });
    });
  }

  /* 9. Relatório do mês */
  function telaRelatorio() {
    var t = totais();
    var lucro = t.entrou - t.saiu;
    var set = D.setembro;
    var maior = Math.max(t.entrou, t.saiu, 1);
    var porCat = {};
    S.movimentos.filter(function (m) { return m.tipo === 'saida' && m.escopo === 'negocio'; }).forEach(function (m) {
      porCat[m.cat] = (porCat[m.cat] || 0) + m.valor;
    });
    var cats = Object.keys(porCat).sort(function (a, b) { return porCat[b] - porCat[a]; });
    var maxCat = cats.length ? porCat[cats[0]] : 1;
    var porDia = {};
    S.movimentos.filter(function (m) { return m.tipo === 'entrada' && m.escopo === 'negocio'; }).forEach(function (m) {
      porDia[m.dia] = (porDia[m.dia] || 0) + m.valor;
    });
    var melhor = Object.keys(porDia).sort(function (a, b) { return porDia[b] - porDia[a]; })[0];
    var mediaDia = t.entrou / D.hoje.dia;
    return (
      topo('Relatório de outubro', 'De 1 a 16 de outubro · dados fictícios') +
      '<section class="card kpi">' +
      '<p class="kpi__label">Lucro do negócio até agora</p>' +
      '<p class="kpi__big">' + brl(lucro) + '</p>' +
      '<p class="kpi__sub">Entrou menos saiu, antes do DAS. Em setembro inteiro foi ' + brl(set.entrou - set.saiu) + '.</p>' +
      '</section>' +
      '<section class="card"><h2 class="card__title">Entrou e saiu do negócio</h2>' +
      '<ul class="hbars">' +
      '<li><span class="hbars__label">Entrou</span><span class="hbars__track"><span class="hbars__fill hbars__fill--in" style="width:' + (t.entrou / maior) * 100 + '%"></span></span><span class="hbars__val">' + brl(t.entrou) + '</span></li>' +
      '<li><span class="hbars__label">Saiu</span><span class="hbars__track"><span class="hbars__fill hbars__fill--out" style="width:' + (t.saiu / maior) * 100 + '%"></span></span><span class="hbars__val">' + brl(t.saiu) + '</span></li>' +
      '</ul>' +
      '<p class="caption">Média de ' + brl(mediaDia) + ' de entrada por dia. Melhor dia: ' + melhor + ' de outubro, com ' + brl(porDia[melhor]) + '.</p>' +
      '</section>' +
      '<section class="card"><h2 class="card__title">Para onde foi o dinheiro do negócio</h2>' +
      '<ul class="hbars">' +
      cats.map(function (k) {
        return '<li><span class="hbars__label">' + esc(cat('saida', k).nome) + '</span><span class="hbars__track"><span class="hbars__fill hbars__fill--ink" style="width:' + (porCat[k] / maxCat) * 100 + '%"></span></span><span class="hbars__val">' + brl(porCat[k]) + '</span></li>';
      }).join('') +
      '</ul></section>' +
      '<section class="card split">' +
      '<div><p class="split__label"><span class="tag tag--negocio">Negócio</span></p><p class="split__val">' + brl(t.saiu) + '</p><p class="caption">gastos do trabalho</p></div>' +
      '<div><p class="split__label"><span class="tag tag--pessoal">Pessoal</span></p><p class="split__val">' + brl(t.pessoal) + '</p><p class="caption">gastos seus, fora do lucro</p></div>' +
      '</section>' +
      '<section class="card"><h2 class="card__title">Resumo</h2>' +
      '<dl class="receipt receipt--flat">' +
      '<div><dt>Entrou no negócio</dt><dd>' + brl(t.entrou) + '</dd></div>' +
      '<div><dt>Saiu do negócio</dt><dd>− ' + brl(t.saiu) + '</dd></div>' +
      '<div><dt>DAS ' + exemplo() + '</dt><dd>− ' + brl(t.das) + '</dd></div>' +
      '<div class="receipt__total"><dt>Sobra para você</dt><dd>' + brl(t.sobra) + '</dd></div>' +
      '</dl></section>'
    );
  }

  function telaNaoEncontrada() {
    return (
      '<section class="empty empty--page"><span class="empty__art">' + ico('circle-help') + '</span>' +
      '<h1 tabindex="-1">Tela não encontrada</h1><p>Esse endereço não existe no protótipo.</p>' +
      '<a class="btn btn--sun" href="#inicio">Ir para o início</a></section>'
    );
  }

  /* ---------- roteador ---------- */
  function rotaAtual() {
    var h = (location.hash || '').replace(/^#/, '');
    return h || 'inicio';
  }

  function render() {
    var r = rotaAtual();
    var partes = r.split('/');
    var base = partes[0];
    var html, bind;
    switch (base) {
      case 'boas-vindas': html = telaBoasVindas(); bind = bindBoasVindas; break;
      case 'primeiro-uso': html = telaPrimeiroUso(); break;
      case 'inicio': html = telaInicio(); break;
      case 'registrar':
        html = telaRegistrar(partes[1] === 'saida' ? 'saida' : 'entrada');
        bind = function () { bindRegistrar(partes[1] === 'erro'); };
        break;
      case 'registrado': html = telaRegistrado(); break;
      case 'movimentacoes': html = telaMovimentacoes(); bind = bindMovimentacoes; break;
      case 'das': html = telaDas(partes[1] === 'atrasado'); bind = bindDas; break;
      case 'limite': html = telaLimite(); bind = bindLimite; break;
      case 'relatorio': html = telaRelatorio(); break;
      default: html = telaNaoEncontrada(); base = '';
    }
    view.className = 'view view--' + (base || 'nf');
    view.innerHTML = html;
    renderNav(base);
    document.querySelectorAll('#side-links a, .side__states a').forEach(function (a) {
      if (a.getAttribute('href') === '#' + r) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    icons();
    if (bind) bind();
    return base;
  }

  var primeiro = true;
  function onRoute() {
    if (modal.open) modal.close();
    render();
    view.scrollTop = 0;
    if (!primeiro) {
      var h1 = view.querySelector('h1');
      if (h1) h1.focus({ preventScroll: true });
    }
    primeiro = false;
  }
  window.addEventListener('hashchange', onRoute);
  onRoute();
})();
