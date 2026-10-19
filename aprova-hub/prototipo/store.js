/* Aprova Hub · camada de dados.
   Hoje grava no localStorage deste aparelho. Na versão com login, cada função
   passa a chamar o banco (ver ../supabase/schema.sql) mantendo o mesmo nome. */
(function () {
  const CHAVE = 'aprova-hub:v1';
  const D = window.AH_DATA;
  const { iso, addDias } = D.util;
  let estado = null;

  const hoje = () => iso(new Date());
  const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(estado)); return true; } catch (e) { return false; } }
  function carregar() {
    try { const b = localStorage.getItem(CHAVE); if (b) { const d = JSON.parse(b); if (d && d.versao === 1) { estado = d; return estado; } } } catch (e) { /* sem armazenamento */ }
    estado = D.gerarDemo(hoje()); salvar(); return estado;
  }
  const E = () => estado || carregar();
  const diasEntre = (a, b) => { const p = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }; return Math.round((p(b) - p(a)) / 86400000); };

  const Store = {
    hoje, addDias, diasEntre,
    estado: E,
    salvar,
    recomecar() { try { localStorage.removeItem(CHAVE); } catch (e) { /* nada */ } estado = D.gerarDemo(hoje()); salvar(); },
    exportar() { return JSON.stringify({ exportadoEm: new Date().toISOString(), aviso: 'Dados de demonstração do Aprova Hub', dados: E() }, null, 2); },

    /* Premium (lido do cadastro simulado da página de vendas) */
    premium() { try { return JSON.parse(localStorage.getItem('aprova-hub:premium') || 'null'); } catch (e) { return null; } },
    precoPremium() {
      try { const n = JSON.parse(localStorage.getItem('aprova-hub:negocio:v1') || 'null'); if (n && n.config && n.config.precos && n.config.precos.solo) return n.config.precos.solo; } catch (e) { /* nada */ }
      return 29.9;
    },

    /* Sessões de estudo */
    sessoes(de, ate) { return E().sessoes.filter((s) => (!de || s.data >= de) && (!ate || s.data <= ate)); },
    registrarSessao({ materia, assunto, minutos, questoes, acertos }) {
      const s = { id: uid('s'), data: hoje(), materia, assunto, minutos, questoes, acertos, criadoEm: Date.now() };
      E().sessoes.push(s); salvar(); return s;
    },
    excluirSessao(id) { E().sessoes = E().sessoes.filter((s) => s.id !== id); salvar(); },
    restaurarSessao(s) { if (!E().sessoes.some((x) => x.id === s.id)) { E().sessoes.push(s); salvar(); } },

    /* Cronômetro */
    cronometro: () => E().cronometro,
    iniciar(materia, assunto) { E().cronometro = { materia, assunto, acumuladoMs: 0, inicioMs: Date.now() }; salvar(); },
    pausar() { const c = E().cronometro; if (c && c.inicioMs) { c.acumuladoMs += Date.now() - c.inicioMs; c.inicioMs = null; salvar(); } },
    continuar() { const c = E().cronometro; if (c && !c.inicioMs) { c.inicioMs = Date.now(); salvar(); } },
    tempoMs() { const c = E().cronometro; return c ? c.acumuladoMs + (c.inicioMs ? Date.now() - c.inicioMs : 0) : 0; },
    descartar() { E().cronometro = null; salvar(); },

    /* Check-in do dia e sequência */
    fezCheckin: (d) => E().checkins.includes(d || hoje()),
    registrarCheckin() { if (!this.fezCheckin()) { E().checkins.push(hoje()); salvar(); } },
    sequencia() {
      const set = new Set(E().checkins); let d = set.has(hoje()) ? hoje() : addDias(hoje(), -1), n = 0;
      while (set.has(d)) { n++; d = addDias(d, -1); }
      return n;
    },
    resumoDia(d) {
      const ss = this.sessoes(d || hoje(), d || hoje());
      const extra = !d || d === hoje() ? Math.floor(this.tempoMs() / 60000) : 0;
      const q = ss.reduce((t, s) => t + s.questoes, 0), a = ss.reduce((t, s) => t + s.acertos, 0);
      return { minutos: ss.reduce((t, s) => t + s.minutos, 0) + extra, questoes: q, acertos: a, pct: q ? Math.round((a / q) * 100) : null, sessoes: ss.length };
    },
    minutosPeriodo(de, ate, comCronometro) {
      return this.sessoes(de, ate).reduce((t, s) => t + s.minutos, 0) + (comCronometro ? Math.floor(this.tempoMs() / 60000) : 0);
    },

    /* Caderno de erros (revisão em 1, 7 e 21 dias) */
    erros: () => E().erros,
    registrarErro({ materia, assunto, anotacao, foto }) {
      const c = hoje();
      const e = { id: uid('e'), materia, assunto, anotacao, foto: foto || null, criadoEm: c, revisoes: [1, 7, 21].map((k) => ({ etapa: k, data: addDias(c, k), feita: false })) };
      E().erros.unshift(e); salvar(); return e;
    },
    revisoesHoje() {
      const out = [];
      E().erros.forEach((e) => { const r = e.revisoes.find((x) => !x.feita); if (r && r.data <= hoje()) out.push({ erro: e, revisao: r }); });
      return out;
    },
    concluirRevisao(id, etapa, acertou) {
      const e = E().erros.find((x) => x.id === id); if (!e) return null;
      const r = e.revisoes.find((x) => x.etapa === etapa); const antes = { ...r };
      if (acertou) r.feita = true; else r.data = addDias(hoje(), 1);
      salvar(); return antes;
    },
    restaurarRevisao(id, etapa, copia) { const e = E().erros.find((x) => x.id === id); if (!e) return; const i = e.revisoes.findIndex((x) => x.etapa === etapa); e.revisoes[i] = copia; salvar(); },

    /* Quiz relâmpago */
    quiz: () => E().quiz,
    entrarFila() { E().quiz.naFila = true; salvar(); },
    registrarQuiz(respostas, acertos) { E().quiz.tentativas.push({ data: hoje(), respostas, acertos }); salvar(); },
    reportar(questao, motivo, texto) { E().quiz.reportes.push({ questao, motivo, texto, data: hoje() }); salvar(); },

    /* Filtros e escolhas */
    set(campo, valor) { E()[campo] = valor; salvar(); },
    setAnalise(parcial) { Object.assign(E().analise, parcial); salvar(); },

    /* Modo mentor */
    mentor: () => E().mentor,
    adicionarAluno(nome, tel) { const a = { id: uid('m'), nome, semDias: null, horas: 0, questoes: 0, acerto: null, acertoAntes: null, tel }; E().mentor.alunos.push(a); salvar(); return a; },
    salvarPlanoMentor(metaHoras, metaQuestoes) { Object.assign(E().mentor, { metaHoras, metaQuestoes }); salvar(); },
    criarTurma(nome) { E().mentor.turmas.push(nome); salvar(); }
  };
  window.Store = Store;
})();
