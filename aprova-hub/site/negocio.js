/* Aprova Hub · dados do negócio (demonstração do "piloto automático").
   Tudo fictício e salvo só neste navegador. Na fase de produção, estas funções
   seriam trocadas por chamadas ao banco e aos avisos (webhooks) do provedor de pagamento. */
(function () {
  const CHAVE = 'aprova-hub:negocio:v1';

  const CONFIG_PADRAO = {
    precos: { solo: 29.9, turma: 97, escola: 790 },
    comissao: 30, // % recorrente para afiliados (hipótese)
    diasTeste: 7,
    taxaPct: 3, // taxa estimada do provedor por cobrança (hipótese, conferir no site do provedor)
    custoFixo: 250 // servidor, banco, domínio e e-mail por mês (hipótese)
  };

  const PLANOS = {
    solo: { nome: 'Aprova Premium', curto: 'Premium', alunos: 'para o aluno', desc: 'Análise por cargo, caderno de erros sem limite, quizzes e alertas de edital.' },
    turma: { nome: 'Mentor Pro', curto: 'Mentor Pro', alunos: 'de 16 a 150 alunos', desc: 'Modo mentor acima das 15 vagas grátis, várias turmas.' },
    escola: { nome: 'Escola ou cursinho', curto: 'Escola', alunos: 'até 600 alunos', desc: 'Vários mentores, painel da escola e suporte prioritário.' }
  };

  const ORIGENS = { afiliado: 'Afiliado', indicacao: 'Indicação', google: 'Google', direto: 'Direto' };

  /* ---------- datas ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDias = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const addMeses = (s, n) => { const d = parse(s); const dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const ult = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(dia, ult)); return iso(d); };
  const hoje = () => iso(new Date());
  const mesDe = (s) => s.slice(0, 7);
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const nomeMes = (ym) => MESES[Number(ym.slice(5, 7)) - 1] + '/' + ym.slice(2, 4);

  /* ---------- gerador previsível ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  const NOMES = ['Ana Ribeiro', 'Bruno Lacerda', 'Carla Menezes', 'Daniel Fonseca', 'Elisa Prado', 'Fábio Rezende', 'Gabriela Torres', 'Heitor Campos', 'Isabela Moura', 'João Vasconcelos', 'Karina Duarte', 'Lucas Andrade', 'Márcia Pinheiro', 'Nelson Queiroz', 'Olívia Sampaio', 'Paulo Bezerra', 'Raquel Antunes', 'Sérgio Castilho', 'Tânia Lobo', 'Vinícius Rocha', 'Yara Medeiros', 'Alexandre Paiva', 'Beatriz Godoy', 'César Tavares', 'Débora Lins', 'Eduardo Brito', 'Fernanda Aguiar', 'Gilberto Nunes', 'Helena Pacheco', 'Igor Valente', 'Juliana Freitas', 'Leonardo Siqueira', 'Mônica Barreto', 'Natália Cordeiro', 'Otávio Leme', 'Priscila Salgado', 'Renato Fontes', 'Simone Dantas', 'Tiago Moraes', 'Vanessa Coelho', 'Wagner Peixoto', 'Aline Couto', 'Rodrigo Teles', 'Luana Matos'];
  const AREAS = ['Tribunais', 'Policial', 'Fiscal', 'Bancários', 'INSS', 'Carreiras jurídicas', 'Administrativo', 'Educação'];

  const AFILIADOS = [
    { id: 'af1', nome: 'Marina Couto', codigo: 'marina', pix: 'marina•••@exemplo', cliques: 412, desde: -150 },
    { id: 'af2', nome: 'Rafael Dornelles', codigo: 'rafaeld', pix: '•••.•••.•••-21', cliques: 238, desde: -120 },
    { id: 'af3', nome: 'Canal Rota da Posse', codigo: 'rotadaposse', pix: '•••@exemplo', cliques: 655, desde: -90 },
    { id: 'af4', nome: 'Patrícia Vilela', codigo: 'pvilela', pix: '(61) •••••-0410', cliques: 97, desde: -40 }
  ];

  function gerar() {
    const r = rng(77001);
    const h = hoje();
    const assinantes = [];
    NOMES.forEach((nome, i) => {
      const inicio = addDias(h, -Math.round(8 + r() * 175));
      const x = r();
      const plano = x < 0.7 ? 'solo' : x < 0.95 ? 'turma' : 'escola';
      const o = r();
      const origem = o < 0.38 ? 'afiliado' : o < 0.58 ? 'indicacao' : o < 0.8 ? 'google' : 'direto';
      const afiliadoId = origem === 'afiliado' ? AFILIADOS[Math.floor(r() * (r() < 0.5 ? 2 : 4))].id : null;
      const s = r();
      let status = s < 0.76 ? 'ativo' : s < 0.86 ? 'cancelado' : 'atrasado';
      let cancelEm = null;
      const fimTeste = addDias(inicio, CONFIG_PADRAO.diasTeste);
      if (fimTeste > h) status = 'teste';
      if (status === 'cancelado') cancelEm = addDias(inicio, Math.round(25 + r() * Math.max(10, (parse(h) - parse(inicio)) / 86400000 - 25)));
      if (cancelEm && cancelEm > h) cancelEm = addDias(h, -2);
      const ultimo = nome.split(' ');
      assinantes.push({
        id: 'c' + (i + 1), nome, email: (ultimo[0][0] + ultimo[1]).toLowerCase().normalize('NFD').replace(/[^a-z]/g, '') + '@exemplo.com',
        negocio: 'Mentoria ' + AREAS[i % AREAS.length] + ' ' + ultimo[1],
        plano, preco: CONFIG_PADRAO.precos[plano], origem, afiliadoId, inicio, fimTeste, status, cancelEm, pagamento: r() < 0.6 ? 'pix' : r() < 0.7 ? 'boleto' : 'cartao'
      });
    });
    // alguns testes recentes extras, para o painel ter movimento
    ['Rita Fagundes', 'Marcos Barcellos', 'Camila Arruda'].forEach((nome, k) => {
      const inicio = addDias(h, -(k * 2 + 1));
      assinantes.push({ id: 'ct' + k, nome, email: nome.split(' ')[0].toLowerCase() + '@exemplo.com', negocio: 'Mentoria ' + AREAS[k + 2], plano: k === 1 ? 'turma' : 'solo', preco: CONFIG_PADRAO.precos[k === 1 ? 'turma' : 'solo'], origem: k === 0 ? 'afiliado' : k === 1 ? 'google' : 'indicacao', afiliadoId: k === 0 ? 'af1' : null, inicio, fimTeste: addDias(inicio, CONFIG_PADRAO.diasTeste), status: 'teste', cancelEm: null, pagamento: 'pix' });
    });

    const estado = { versao: 1, criadoEm: h, config: { ...CONFIG_PADRAO, precos: { ...CONFIG_PADRAO.precos } }, afiliados: AFILIADOS.map((a) => ({ ...a, desde: addDias(h, a.desde) })), assinantes, cobrancas: [], retiradas: [], conta: { banco: 'Banco Exemplo', agencia: '0001', conta: '•••••-7', titular: 'Gabriel Abreu (fictício)' }, afiliadoLogado: null, contaAtual: null };
    gerarCobrancas(estado);
    // retiradas passadas: no dia 5 de cada mês, o líquido do mês anterior
    const meses = ultimosMeses(6, h);
    meses.slice(0, -1).forEach((ym, i) => {
      const liquido = estado.cobrancas.filter((c) => c.status === 'paga' && mesDe(c.data) === ym).reduce((t, c) => t + c.valor - c.taxa - c.comissao, 0);
      if (liquido > 50) estado.retiradas.push({ id: 'r' + i, data: addMeses(ym + '-05', 1) > h ? h : addMeses(ym + '-05', 1), valor: Math.floor(liquido * 0.9 / 10) * 10, status: 'concluída' });
    });
    return estado;
  }

  function gerarCobrancas(estado) {
    const h = hoje();
    estado.cobrancas = [];
    estado.assinantes.forEach((a) => {
      if (a.status === 'teste') return;
      let d = a.fimTeste;
      let n = 0;
      while (d <= h && (!a.cancelEm || d < a.cancelEm)) {
        const ultimaAtrasada = a.status === 'atrasado' && addMeses(d, 1) > h;
        const valor = a.preco;
        estado.cobrancas.push(cobranca(estado, a, d, valor, ultimaAtrasada ? 'atrasada' : 'paga', n++));
        d = addMeses(d, 1);
      }
    });
  }

  function cobranca(estado, a, data, valor, status, n) {
    const taxa = Math.round(valor * estado.config.taxaPct) / 100;
    const comissao = a.afiliadoId ? Math.round(valor * estado.config.comissao) / 100 : 0;
    return { id: a.id + '-' + (n ?? Date.now()), assinanteId: a.id, data, valor, taxa, comissao: status === 'paga' ? comissao : 0, afiliadoId: a.afiliadoId, status, metodo: a.pagamento };
  }

  function ultimosMeses(n, h) {
    const out = [];
    for (let i = n - 1; i >= 0; i--) out.push(mesDe(addMeses(mesDe(h) + '-01', -i)));
    return out;
  }

  /* ---------- persistência ---------- */
  let estado = null;
  function carregar() {
    try { const b = localStorage.getItem(CHAVE); if (b) { const d = JSON.parse(b); if (d && d.versao === 1) { estado = d; return estado; } } } catch (e) { /* sem armazenamento */ }
    estado = gerar(); salvar(); return estado;
  }
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* sem armazenamento */ } }
  function E() { return estado || carregar(); }

  /* ---------- cálculos ---------- */
  function resumoMes(ym) {
    const cs = E().cobrancas.filter((c) => mesDe(c.data) === ym);
    const pagas = cs.filter((c) => c.status === 'paga');
    const receita = pagas.reduce((t, c) => t + c.valor, 0);
    const taxas = Math.round(receita * E().config.taxaPct) / 100;
    const comissoes = pagas.reduce((t, c) => t + c.comissao, 0);
    const custo = E().config.custoFixo;
    return { receita, taxas, comissoes, custo, lucro: receita - taxas - comissoes - custo, cobrancas: pagas.length };
  }

  function indicadores() {
    const h = hoje(), ym = mesDe(h), st = E();
    const ativos = st.assinantes.filter((a) => a.status === 'ativo');
    const atrasados = st.assinantes.filter((a) => a.status === 'atrasado');
    const testes = st.assinantes.filter((a) => a.status === 'teste');
    const mrr = ativos.reduce((t, a) => t + a.preco, 0);
    const emAtraso = st.cobrancas.filter((c) => c.status === 'atrasada').reduce((t, c) => t + c.valor, 0);
    const cancelMes = st.assinantes.filter((a) => a.cancelEm && mesDe(a.cancelEm) === ym);
    const novos = st.assinantes.filter((a) => mesDe(a.inicio) === ym);
    const porOrigem = Object.keys(ORIGENS).map((k) => ({ k, nome: ORIGENS[k], n: novos.filter((a) => a.origem === k).length }));
    const liquidoTotal = st.cobrancas.filter((c) => c.status === 'paga').reduce((t, c) => t + c.valor * (1 - st.config.taxaPct / 100) - c.comissao, 0);
    const retirado = st.retiradas.reduce((t, r) => t + r.valor, 0);
    const saldo = Math.max(0, Math.round((liquidoTotal - retirado) * 100) / 100);
    const meses = ultimosMeses(6, h).map((m) => ({ ym: m, nome: nomeMes(m), ...resumoMes(m) }));
    return { mes: resumoMes(ym), mrr, ativos: ativos.length, atrasados, testes, emAtraso, inadPct: mrr ? Math.round((emAtraso / (mrr + emAtraso)) * 1000) / 10 : 0, cancelMes, novos, porOrigem, saldo, meses };
  }

  function painelAfiliado(afId) {
    const st = E(), ym = mesDe(hoje());
    const af = st.afiliados.find((a) => a.id === afId);
    if (!af) return null;
    const clientes = st.assinantes.filter((a) => a.afiliadoId === afId);
    const cs = st.cobrancas.filter((c) => c.afiliadoId === afId && c.status === 'paga');
    const doMes = cs.filter((c) => mesDe(c.data) === ym).reduce((t, c) => t + c.comissao, 0);
    const historico = ultimosMeses(6, hoje()).slice(0, -1).reverse().map((m) => ({ ym: m, nome: nomeMes(m), valor: cs.filter((c) => mesDe(c.data) === m).reduce((t, c) => t + c.comissao, 0), pagoEm: addMeses(m + '-10', 1) })).filter((x) => x.valor > 0);
    return { af, clientes, ativos: clientes.filter((c) => c.status === 'ativo').length, cadastros: clientes.length, doMes, aReceber: doMes, proximoPagamento: addMeses(ym + '-10', 1), historico };
  }

  /* ---------- ações ---------- */
  const N = {
    PLANOS, ORIGENS, hoje, addDias, addMeses, mesDe, nomeMes, parse,
    estado: E,
    config: () => E().config,
    salvar,
    recomecar() { try { localStorage.removeItem(CHAVE); } catch (e) { /* nada */ } estado = gerar(); salvar(); },
    indicadores, resumoMes, painelAfiliado,
    afiliadoPorCodigo: (c) => E().afiliados.find((a) => a.codigo === String(c || '').toLowerCase()) || null,
    registrarClique(codigo) {
      const af = this.afiliadoPorCodigo(codigo); if (!af) return null;
      af.cliques += 1; salvar();
      try { localStorage.setItem('aprova-hub:ref', JSON.stringify({ codigo: af.codigo, ate: addDias(hoje(), 30) })); } catch (e) { /* nada */ }
      return af;
    },
    refAtual() {
      try { const r = JSON.parse(localStorage.getItem('aprova-hub:ref') || 'null'); if (r && r.ate >= hoje()) return this.afiliadoPorCodigo(r.codigo); } catch (e) { /* nada */ }
      return null;
    },
    criarConta({ nome, email, negocio, plano, origem, afiliadoId }) {
      const st = E(), h = hoje();
      const a = { id: 'n' + Date.now().toString(36), nome, email, negocio, plano, preco: st.config.precos[plano], origem, afiliadoId: afiliadoId || null, inicio: h, fimTeste: addDias(h, st.config.diasTeste), status: 'teste', cancelEm: null, pagamento: 'pix' };
      st.assinantes.unshift(a); st.contaAtual = a.id; salvar(); return a;
    },
    pagar(assinanteId, metodo) {
      const st = E(); const a = st.assinantes.find((x) => x.id === assinanteId); if (!a) return null;
      const atrasadas = st.cobrancas.filter((c) => c.assinanteId === a.id && c.status === 'atrasada');
      if (atrasadas.length) atrasadas.forEach((c) => { c.status = 'paga'; c.data = hoje(); c.comissao = a.afiliadoId ? Math.round(c.valor * st.config.comissao) / 100 : 0; });
      else if (!st.cobrancas.some((c) => c.assinanteId === a.id && c.data === hoje())) st.cobrancas.push(cobranca(st, a, hoje(), a.preco, 'paga'));
      a.status = 'ativo'; a.pagamento = metodo; if (a.fimTeste > hoje()) a.fimTeste = hoje();
      salvar(); return a;
    },
    /* Estados de demonstração: teste acabou e pagamento atrasado */
    simularEstado(tipo) {
      const st = E(); let a = this.contaAtual();
      if (!a) a = this.criarConta({ nome: 'Conta de demonstração', email: 'demo@exemplo.com', negocio: 'Mentoria Demonstração', plano: 'solo', origem: 'direto' });
      st.cobrancas = st.cobrancas.filter((c) => c.assinanteId !== a.id);
      if (tipo === 'teste-acabou') { a.status = 'teste-acabou'; a.inicio = addDias(hoje(), -st.config.diasTeste - 1); a.fimTeste = addDias(hoje(), -1); }
      else { a.status = 'atrasado'; a.inicio = addDias(hoje(), -50); a.fimTeste = addDias(hoje(), -43); st.cobrancas.push(cobranca(st, a, a.fimTeste, a.preco, 'paga', 0)); st.cobrancas.push(cobranca(st, a, addDias(hoje(), -12), a.preco, 'atrasada', 1)); }
      salvar(); return a;
    },
    contaAtual: () => { const st = E(); return st.assinantes.find((a) => a.id === st.contaAtual) || null; },
    retirar(valor) {
      const st = E();
      const r = { id: 'r' + Date.now(), data: hoje(), valor, status: 'agendada', previsao: proximoDiaUtil(hoje()) };
      st.retiradas.unshift(r); salvar(); return r;
    },
    salvarConfig(cfg) { Object.assign(E().config, cfg); salvar(); },
    entrarAfiliado(id) { E().afiliadoLogado = id; salvar(); },
    sairAfiliado() { E().afiliadoLogado = null; salvar(); },
    cadastrarAfiliado({ nome, codigo, pix }) {
      const st = E();
      const af = { id: 'af' + Date.now().toString(36), nome, codigo: codigo.toLowerCase(), pix, cliques: 0, desde: hoje() };
      st.afiliados.push(af); st.afiliadoLogado = af.id; salvar(); return af;
    }
  };

  function proximoDiaUtil(s) {
    let d = addDias(s, 1);
    while ([0, 6].includes(parse(d).getDay())) d = addDias(d, 1);
    return d;
  }

  /* ---------- utilidades de tela compartilhadas ---------- */
  N.brl = (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  N.brl0 = (v) => (Number.isInteger(v) ? 'R$ ' + v.toLocaleString('pt-BR') : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
  N.data = (s) => { const d = parse(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  N.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  N.toast = function (msg, acao) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    while (box.children.length >= 2) box.firstElementChild.remove();
    const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = `<span>${msg}</span>`;
    if (acao) { const b = document.createElement('button'); b.type = 'button'; b.className = 'toast__btn'; b.textContent = acao.rotulo; b.onclick = () => { acao.fn(); el.remove(); }; el.appendChild(b); }
    box.appendChild(el); setTimeout(() => el.remove(), 4500);
  };
  N.icones = () => { if (window.lucide) window.lucide.createIcons(); };
  N.copiar = async function (texto, campo) {
    try { await navigator.clipboard.writeText(texto); return true; }
    catch (e) { if (campo) { campo.focus(); campo.select(); } return false; }
  };
  N.erros = function (form, erros) {
    form.querySelectorAll('.field__erro').forEach((p) => { p.hidden = true; p.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach((i) => i.removeAttribute('aria-invalid'));
    const ks = Object.keys(erros);
    ks.forEach((id) => { const i = form.querySelector('#' + id), p = form.querySelector('#' + id + '-e'); if (i) i.setAttribute('aria-invalid', 'true'); if (p) { p.hidden = false; p.textContent = erros[id]; } });
    if (ks.length) { const f = form.querySelector('#' + ks[0]); if (f) f.focus(); return false; }
    return true;
  };

  window.Negocio = N;
})();
