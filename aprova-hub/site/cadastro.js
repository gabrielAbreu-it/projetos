/* Aprova Hub · cadastro, plano e checkout simulado */
(function () {
  const N = window.Negocio;
  const $ = (s, el = document) => el.querySelector(s);
  const etapa = $('#etapa'), resumo = $('#resumo');
  const CH = 'aprova-hub:cadastro';
  N.carregarRef();

  let rascunho = {};
  try { rascunho = JSON.parse(localStorage.getItem(CH) || '{}'); } catch (e) { rascunho = {}; }
  const q = new URLSearchParams(location.search);
  const mapa = { premium: 'solo', mentor: 'turma' };
  const qp = mapa[q.get('plano')] || q.get('plano');
  if (qp && N.PLANOS[qp]) rascunho.plano = qp;
  if (qp === 'solo') { try { localStorage.setItem('aprova-hub:premium-pendente', '1'); } catch (e) { /* nada */ } }
  if (!rascunho.plano) rascunho.plano = 'turma';
  if (!rascunho.modo) rascunho.modo = 'teste';
  if (!rascunho.metodo) rascunho.metodo = 'pix';
  const guardar = () => { try { localStorage.setItem(CH, JSON.stringify(rascunho)); } catch (e) { /* nada */ } };

  const icon = (n) => `<i data-lucide="${n}" aria-hidden="true"></i>`;
  const cfg = () => N.config();
  const preco = () => cfg().precos[rascunho.plano];

  function passos(n) {
    const nomes = ['Sua conta', 'Plano', 'Pagamento'];
    return `<ol class="passos-cad" aria-label="Etapas do cadastro">${nomes.map((t, i) => `<li class="${i + 1 === n ? 'is-atual' : i + 1 < n ? 'is-feito' : ''}" ${i + 1 === n ? 'aria-current="step"' : ''}><span>${i + 1 < n ? '✓' : i + 1}</span>${t}</li>`).join('')}</ol>`;
  }

  function campo(id, rotulo, extra = '', hint = '') {
    return `<div class="field"><label class="field__label" for="${id}">${rotulo}</label><input class="field__input" id="${id}" name="${id}" value="${N.esc(rascunho[id] || '')}" aria-describedby="${hint ? id + '-h ' : ''}${id}-e" ${extra} />${hint ? `<p class="field__hint" id="${id}-h">${hint}</p>` : ''}<p class="field__erro" id="${id}-e" hidden></p></div>`;
  }

  function telaConta() {
    return `${passos(1)}<h1>Crie sua conta de mentor</h1>
      <p class="muted">Leva menos de um minuto. Teste grátis por ${cfg().diasTeste} dias, sem cartão.</p>
      <form id="f-conta" class="card form" novalidate>
        <div class="grid2">${campo('nome', 'Seu nome', 'autocomplete="name"')}${campo('negocio', 'Nome da mentoria', 'autocomplete="organization"', 'Ex.: Mentoria Tribunais Henrique')}</div>
        <div class="grid2">${campo('email', 'E-mail', 'type="email" autocomplete="email" inputmode="email"')}${campo('whats', 'WhatsApp com DDD', 'inputmode="tel" autocomplete="tel"', 'Para avisos da conta. Ex.: (61) 98000-0000')}</div>
        ${campo('senha', 'Crie uma senha', 'type="password" autocomplete="new-password"', 'Pelo menos 8 caracteres.')}
        <label class="check"><input type="checkbox" id="aceite" ${rascunho.aceite ? 'checked' : ''} aria-describedby="aceite-e" /><span>Li e aceito os <a href="legal.html#termos">termos de uso</a> e a <a href="legal.html#privacidade">política de privacidade</a>.</span></label>
        <p class="field__erro" id="aceite-e" hidden></p>
        <button class="btn btn--primary btn--lg" type="submit">Continuar ${icon('arrow-right')}</button>
      </form>`;
  }

  function telaPlano() {
    return `${passos(2)}<h1>Escolha o plano</h1>
      <p class="muted">Você pode trocar de plano depois. O teste grátis vale para qualquer um.</p>
      <form id="f-plano" class="form" novalidate>
        <fieldset class="opcoes opcoes--3" style="border:0;padding:0;margin:0"><legend class="sr-only">Plano</legend>
          ${Object.keys(N.PLANOS).map((k) => `<label class="opc"><input type="radio" name="plano" value="${k}" ${rascunho.plano === k ? 'checked' : ''} />
            <span class="opc__t">${N.PLANOS[k].nome}</span><span class="opc__p">${N.brl0(cfg().precos[k])}<small class="muted" style="font-size:.9rem;font-family:var(--font-ui);font-weight:500">/mês</small></span>
            <span class="small muted">${N.PLANOS[k].alunos}. ${N.PLANOS[k].desc}</span></label>`).join('')}
        </fieldset>
        <div class="row"><button class="btn btn--ghost" type="button" data-ir="conta">${icon('arrow-left')} Voltar</button><button class="btn btn--primary btn--lg" type="submit">Continuar ${icon('arrow-right')}</button></div>
      </form>`;
  }

  function qrFake() {
    // desenho de QR apenas ilustrativo, gerado a partir de um número fixo (não é um Pix válido)
    let s = 9137, cells = '';
    for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
      const canto = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      let on = canto ? (x % 6 === 0 || y % 6 === 0 || (x > 17 && (x - 18) % 6 === 0) || (y > 17 && (y - 18) % 6 === 0) || ((x % 18 >= 2 && x % 18 <= 4) && (y % 18 >= 2 && y % 18 <= 4))) : (s >> 8) % 2 === 0;
      if (on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    return `<svg class="qr" viewBox="0 0 25 25" role="img" aria-label="QR Code ilustrativo, não é um Pix de verdade"><g fill="#12301f">${cells}</g></svg>`;
  }

  function telaPagamento(regularizar) {
    const conta = N.contaAtual();
    const valorAberto = regularizar ? N.estado().cobrancas.filter((c) => c.assinanteId === conta.id && c.status === 'atrasada').reduce((t, c) => t + c.valor, 0) : preco();
    const modo = regularizar ? 'pagar' : rascunho.modo;
    const m = rascunho.metodo;
    const codigo = '00020126580014BR.GOV.BCB.PIX0136DEMONSTRACAO-NAO-E-UM-PIX-REAL5204000053039865802BR5909MENTOR OS6008BRASILIA62070503***6304ABCD';
    return `${regularizar ? '' : passos(3)}<h1>${regularizar ? 'Regularizar pagamento' : 'Como você quer começar?'}</h1>
      <p class="aviso-pag" role="note">${icon('shield-alert')}<span><strong>Demonstração: nenhum pagamento é feito.</strong> Os dados de pagamento abaixo não são enviados a lugar nenhum.</span></p>
      ${regularizar ? '' : `<fieldset class="opcoes opcoes--2" style="border:0;padding:0;margin:0"><legend class="sr-only">Forma de começar</legend>
        <label class="opc"><input type="radio" name="modo" value="teste" ${modo === 'teste' ? 'checked' : ''} /><span class="opc__t">${icon('gift')} Teste grátis de ${cfg().diasTeste} dias</span><span class="small muted">Sem cobrança agora. Avisamos 2 dias antes do fim do teste.</span></label>
        <label class="opc"><input type="radio" name="modo" value="pagar" ${modo === 'pagar' ? 'checked' : ''} /><span class="opc__t">${icon('credit-card')} Assinar agora</span><span class="small muted">Primeira mensalidade hoje. Bom para quem já decidiu.</span></label>
      </fieldset>`}
      ${modo === 'teste' ? `<section class="card form" aria-label="Teste grátis"><p>Você terá acesso completo até <strong>${N.data(N.addDias(N.hoje(), cfg().diasTeste))}</strong>. Depois, escolha Pix, boleto ou cartão para continuar.</p>
          <button class="btn btn--primary btn--lg" type="button" id="iniciar-teste">${icon('play')} Começar teste grátis</button></section>`
      : `<section class="card form" aria-label="Pagamento">
          <div class="abas" role="tablist" aria-label="Forma de pagamento">
            ${[['pix', 'Pix', 'qr-code'], ['boleto', 'Boleto', 'barcode'], ['cartao', 'Cartão', 'credit-card']].map(([k, t, i]) => `<button class="aba" role="tab" type="button" id="aba-${k}" aria-controls="painel-pag" aria-selected="${m === k}" tabindex="${m === k ? 0 : -1}" data-metodo="${k}">${icon(i)}${t}</button>`).join('')}
          </div>
          <div id="painel-pag" role="tabpanel" aria-labelledby="aba-${m}">
          ${m === 'pix' ? `<div class="pix">${qrFake()}<div class="form">
              <p>Valor: <strong>${N.brl(valorAberto)}</strong>. Na vida real, o QR Code vem do provedor de pagamento e a confirmação chega sozinha em segundos.</p>
              <label class="field__label" for="pix-cod">Pix copia e cola (ilustrativo)</label><textarea class="field__input codigo" id="pix-cod" rows="3" readonly>${codigo}</textarea>
              <div class="row"><button class="btn btn--ghost" type="button" id="copiar-pix">${icon('copy')} Copiar código</button><button class="btn btn--primary" type="button" data-pagar="pix">${icon('check')} Simular Pix recebido</button></div></div></div>`
          : m === 'boleto' ? `<div class="form"><p>Valor: <strong>${N.brl(valorAberto)}</strong> · vencimento ${N.data(N.addDias(N.hoje(), 3))}. O boleto leva até 3 dias úteis para ser confirmado.</p>
              <label class="field__label" for="linha">Linha digitável (ilustrativa)</label><input class="field__input codigo" id="linha" readonly value="00190.00009 01234.567890 12345.678901 1 00000000000000" />
              <div class="row"><button class="btn btn--ghost" type="button" id="copiar-boleto">${icon('copy')} Copiar linha</button><button class="btn btn--primary" type="button" data-pagar="boleto">${icon('check')} Simular boleto compensado</button></div></div>`
          : `<form id="f-cartao" class="form" novalidate>
              ${campo('cnum', 'Número do cartão', 'inputmode="numeric" autocomplete="off" placeholder="0000 0000 0000 0000"', 'Use qualquer número de 16 dígitos. Nada é enviado.')}
              <div class="grid2">${campo('cval', 'Validade (MM/AA)', 'inputmode="numeric" autocomplete="off" placeholder="12/28"')}${campo('ccvv', 'Código de segurança', 'inputmode="numeric" autocomplete="off" placeholder="123"')}</div>
              ${campo('cnome', 'Nome impresso no cartão', 'autocomplete="off"')}
              <button class="btn btn--primary btn--lg" type="submit" id="pagar-cartao">${icon('lock')} Pagar ${N.brl(valorAberto)} (simulado)</button>
            </form>`}
          </div>
        </section>`}
      ${regularizar ? '' : `<div class="row"><button class="btn btn--ghost" type="button" data-ir="plano">${icon('arrow-left')} Voltar</button></div>`}`;
  }

  function telaPronto() {
    const a = N.contaAtual();
    if (!a) return telaConta();
    const teste = a.status === 'teste';
    return `<section class="card estado" aria-labelledby="ok-t">
      <span class="estado__ico estado__ico--ok">${icon('check')}</span>
      <h1 id="ok-t" tabindex="-1">Acesso liberado</h1>
      <p>${teste ? `Seu teste grátis vai até <strong>${N.data(a.fimTeste)}</strong>. Convide seus alunos e monte o primeiro plano da semana.` : `Pagamento confirmado (simulado). A próxima cobrança será em <strong>${N.data(N.addMeses(N.hoje(), 1))}</strong> e o recibo iria para ${N.esc(a.email)}.`}</p>
      <a class="btn btn--primary btn--lg" href="../prototipo/index.html#${a.plano === 'solo' ? 'perfil' : 'mentor'}">${icon('log-in')} Entrar no app</a>
      <p class="small muted">No app de demonstração você vê uma turma de exemplo já preenchida.</p>
    </section>`;
  }

  function telaBloqueio(tipo) {
    const a = N.simularEstado(tipo);
    const acabou = tipo === 'teste-acabou';
    const aberto = N.estado().cobrancas.filter((c) => c.assinanteId === a.id && c.status === 'atrasada');
    return `<section class="card estado" aria-labelledby="bl-t">
      <span class="estado__ico ${acabou ? 'estado__ico--warn' : 'estado__ico--danger'}">${icon(acabou ? 'hourglass' : 'lock')}</span>
      <h1 id="bl-t" tabindex="-1">${acabou ? 'Seu teste grátis acabou' : 'Pagamento atrasado: acesso pausado'}</h1>
      <p>${acabou ? `Os ${cfg().diasTeste} dias terminaram em ${N.data(a.fimTeste)}. <strong>Nada da sua turma foi apagado.</strong> Escolha um plano para voltar ao painel; seus alunos continuam fazendo check-in normalmente.`
        : `A mensalidade de <strong>${N.brl(aberto.reduce((t, c) => t + c.valor, 0))}</strong> venceu em ${aberto[0] ? N.data(aberto[0].data) : '-'}. Avisamos por e-mail e WhatsApp antes de pausar. <strong>Seus dados e os dos alunos estão guardados.</strong> Assim que o pagamento cair, o acesso volta na hora.`}</p>
      <div class="row" style="justify-content:center">
        <a class="btn btn--primary btn--lg" href="#${acabou ? 'pagamento' : 'regularizar'}">${icon('credit-card')} ${acabou ? 'Escolher plano e pagar' : 'Pagar agora'}</a>
        <a class="btn btn--ghost" href="ajuda.html">Falar com o suporte</a>
      </div>
    </section>`;
  }

  function telaResumo(h) {
    if (['pronto', 'teste-acabou', 'bloqueado'].includes(h)) { resumo.innerHTML = ''; return; }
    const p = N.PLANOS[rascunho.plano];
    const ref = N.refAtual();
    resumo.innerHTML = `<section class="card resumo" aria-labelledby="rs-t"><h2 class="h3" id="rs-t">Resumo</h2>
      <dl><div><dt>Plano</dt><dd>${p.nome}</dd></div><div><dt>Alunos</dt><dd>${p.alunos}</dd></div>
      <div><dt>Teste grátis</dt><dd>${cfg().diasTeste} dias</dd></div>
      <div class="resumo__total"><dt>Depois do teste</dt><dd>${N.brl0(preco())}/mês</dd></div></dl></section>
      ${ref ? `<p class="small muted card">${icon('user-check')} Indicação de <strong>${N.esc(ref.nome)}</strong>. Quem indicou recebe uma parte da mensalidade; o seu preço não muda.</p>` : ''}
      <p class="small muted">Cancele quando quiser, sem multa. Pix, boleto ou cartão.</p>`;
  }

  function rota() {
    const h = location.hash.slice(1) || 'conta';
    const precisaConta = ['plano', 'pagamento'].includes(h) && !rascunho.contaOk && !N.contaAtual();
    let html;
    if (precisaConta) html = telaConta();
    else if (h === 'plano') html = telaPlano();
    else if (h === 'pagamento') html = telaPagamento(false);
    else if (h === 'regularizar') html = N.contaAtual() ? telaPagamento(true) : telaConta();
    else if (h === 'pronto') html = telaPronto();
    else if (h === 'teste-acabou' || h === 'bloqueado') html = telaBloqueio(h);
    else html = telaConta();
    etapa.innerHTML = html;
    telaResumo(h);
    N.icones();
    const t = etapa.querySelector('h1');
    if (t && rota.jaFoi) { t.setAttribute('tabindex', '-1'); t.focus(); }
    rota.jaFoi = true;
    document.title = (t ? t.textContent : 'Cadastro') + ' · Aprova Hub';
  }

  function concluirPagamento(metodo, botao) {
    if (botao) { botao.disabled = true; botao.innerHTML = '<span class="processando"><span class="spin" aria-hidden="true"></span>Processando (simulado)...</span>'; }
    setTimeout(() => {
      let a = N.contaAtual();
      if (!a || location.hash === '#pagamento' && rascunho.contaOk && a.email !== rascunho.email) a = criar();
      if (a.plano !== rascunho.plano && location.hash !== '#regularizar') { a.plano = rascunho.plano; a.preco = preco(); }
      N.pagar(a.id, metodo);
      if (a.plano === 'solo') { try { localStorage.setItem('aprova-hub:premium', JSON.stringify({ desde: N.data(N.hoje()) })); } catch (e) { /* nada */ } }
      rascunho = { plano: rascunho.plano, modo: 'teste', metodo: 'pix' }; guardar();
      N.toast('Pagamento simulado confirmado. Acesso liberado.');
      location.hash = 'pronto';
    }, 900);
  }

  function criar() {
    const ref = N.refAtual();
    const origem = ref ? 'afiliado' : (new URLSearchParams(location.search).get('origem') === 'google' ? 'google' : 'direto');
    return N.criarConta({ nome: rascunho.nome, email: rascunho.email, negocio: rascunho.negocio, plano: rascunho.plano, origem, afiliadoId: ref ? ref.id : null });
  }

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (f.id === 'f-conta') {
      e.preventDefault();
      const v = (id) => f.querySelector('#' + id).value.trim();
      ['nome', 'negocio', 'email', 'whats'].forEach((k) => { rascunho[k] = v(k); });
      rascunho.aceite = f.querySelector('#aceite').checked;
      const er = {};
      if (rascunho.nome.split(' ').filter(Boolean).length < 2) er.nome = 'Escreva nome e sobrenome.';
      if (rascunho.negocio.length < 3) er.negocio = 'Escreva o nome da sua mentoria.';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rascunho.email)) er.email = 'Confira o e-mail. Ex.: nome@gmail.com';
      if (!/^\d{10,11}$/.test(rascunho.whats.replace(/\D/g, ''))) er.whats = 'Use DDD e número. Ex.: (61) 98000-0000';
      if (v('senha').length < 8) er.senha = 'A senha precisa ter pelo menos 8 caracteres.';
      if (!rascunho.aceite) er.aceite = 'Para continuar, aceite os termos e a política de privacidade.';
      guardar();
      if (!N.erros(f, er)) return;
      rascunho.contaOk = true; guardar();
      location.hash = 'plano';
    } else if (f.id === 'f-plano') {
      e.preventDefault();
      rascunho.plano = f.querySelector('input[name=plano]:checked').value; guardar();
      location.hash = 'pagamento';
    } else if (f.id === 'f-cartao') {
      e.preventDefault();
      const d = (id) => f.querySelector('#' + id).value.replace(/\D/g, '');
      const er = {};
      if (d('cnum').length !== 16) er.cnum = 'O número do cartão tem 16 dígitos.';
      const val = f.querySelector('#cval').value.trim(), mm = /^(\d{2})\/(\d{2})$/.exec(val);
      if (!mm || +mm[1] < 1 || +mm[1] > 12) er.cval = 'Use o formato MM/AA. Ex.: 12/28';
      else { const fim = new Date(2000 + +mm[2], +mm[1], 0); if (fim < new Date()) er.cval = 'Este cartão está vencido.'; }
      if (!/^\d{3,4}$/.test(d('ccvv'))) er.ccvv = 'São 3 ou 4 números no verso do cartão.';
      if (f.querySelector('#cnome').value.trim().length < 3) er.cnome = 'Escreva o nome como está no cartão.';
      if (!N.erros(f, er)) return;
      concluirPagamento('cartao', f.querySelector('#pagar-cartao'));
    }
  });

  document.addEventListener('change', (e) => {
    if (e.target.name === 'modo') { rascunho.modo = e.target.value; guardar(); rota(); document.querySelector(`input[name=modo][value=${rascunho.modo}]`).focus(); }
    if (e.target.name === 'plano') { rascunho.plano = e.target.value; guardar(); telaResumo('plano'); N.icones(); }
  });

  document.addEventListener('click', async (e) => {
    const ir = e.target.closest('[data-ir]'); if (ir) { location.hash = ir.dataset.ir; return; }
    const aba = e.target.closest('[data-metodo]');
    if (aba) { rascunho.metodo = aba.dataset.metodo; guardar(); rota(); document.getElementById('aba-' + rascunho.metodo).focus(); return; }
    const pg = e.target.closest('[data-pagar]'); if (pg) { concluirPagamento(pg.dataset.pagar, pg); return; }
    if (e.target.closest('#iniciar-teste')) {
      if (!N.contaAtual() || N.contaAtual().email !== rascunho.email) criar();
      rascunho = { plano: rascunho.plano, modo: 'teste', metodo: 'pix' }; guardar();
      N.toast('Teste grátis iniciado.'); location.hash = 'pronto'; return;
    }
    if (e.target.closest('#copiar-pix')) { const ok = await N.copiar($('#pix-cod').value, $('#pix-cod')); N.toast(ok ? 'Código copiado (é só ilustrativo).' : 'Código selecionado. Use Ctrl+C.'); return; }
    if (e.target.closest('#copiar-boleto')) { const ok = await N.copiar($('#linha').value, $('#linha')); N.toast(ok ? 'Linha copiada (é só ilustrativa).' : 'Linha selecionada. Use Ctrl+C.'); return; }
    if (e.target.closest('#recomecar')) { rascunho = { plano: 'turma', modo: 'teste', metodo: 'pix' }; guardar(); N.estado().contaAtual = null; N.salvar(); location.hash = 'conta'; rota(); N.toast('Cadastro recomeçado.'); }
  });

  // setas entre as abas de pagamento
  document.addEventListener('keydown', (e) => {
    const aba = e.target.closest && e.target.closest('[role=tab]');
    if (!aba || !['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const ordem = ['pix', 'boleto', 'cartao'];
    const i = ordem.indexOf(aba.dataset.metodo) + (e.key === 'ArrowRight' ? 1 : -1);
    rascunho.metodo = ordem[(i + 3) % 3]; guardar(); rota(); document.getElementById('aba-' + rascunho.metodo).focus();
  });

  window.addEventListener('hashchange', rota);
  rota();
})();
