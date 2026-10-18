/* Mentor OS · camada de dados.
   Hoje grava no localStorage deste aparelho. Para a versão com login, troque
   a implementação destas funções por chamadas ao Supabase (ver ../supabase/schema.sql),
   mantendo os mesmos nomes. A interface (app.js) só conversa com o Store. */
(function () {
  const CHAVE = 'mentor-os:v1';
  const { gerarDemo, util } = window.MOS_DATA;
  let estado = null;
  let memoriaApenas = false;

  function hoje() { return util.iso(new Date()); }
  function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (bruto) {
        const dado = JSON.parse(bruto);
        if (dado && dado.versao === 1) { estado = dado; return estado; }
      }
    } catch (e) { memoriaApenas = true; }
    estado = gerarDemo(hoje());
    salvar();
    return estado;
  }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); }
    catch (e) { memoriaApenas = true; }
  }

  function recomecar() {
    try { localStorage.removeItem(CHAVE); } catch (e) { /* sem armazenamento */ }
    estado = gerarDemo(hoje());
    salvar();
    return estado;
  }

  const Store = {
    hoje,
    salvaNoAparelho: () => !memoriaApenas,
    carregar,
    recomecar,
    get estado() { return estado || carregar(); },

    /* Preferências da sessão */
    papel() { return this.estado.papel; },
    definirPapel(p) { this.estado.papel = p; salvar(); },
    alunoAtualId() { return this.estado.alunoAtual; },
    definirAlunoAtual(id) { this.estado.alunoAtual = id; this.estado.cronometro = null; salvar(); },

    /* Turma */
    mentor() { return this.estado.mentor; },
    alunos() { return this.estado.alunos; },
    aluno(id) { return this.estado.alunos.find((a) => a.id === id) || null; },
    adicionarAluno({ nome, telefone }) {
      const a = { id: uid('a'), nome: nome.trim(), telefone: telefone.replace(/\D/g, ''), entrouEm: hoje() };
      this.estado.alunos.push(a); salvar(); return a;
    },

    /* Sessões de estudo (check-in) */
    sessoes(alunoId, de, ate) {
      return this.estado.sessoes.filter((s) => (!alunoId || s.alunoId === alunoId) && (!de || s.data >= de) && (!ate || s.data <= ate));
    },
    registrarSessao({ alunoId, materia, minutos, questoes, acertos, data }) {
      const s = { id: uid('s'), alunoId, materia, minutos, questoes, acertos, data: data || hoje(), criadoEm: Date.now() };
      this.estado.sessoes.push(s); salvar(); return s;
    },
    restaurarSessao(sessao) {
      if (!this.estado.sessoes.some((s) => s.id === sessao.id)) { this.estado.sessoes.push(sessao); salvar(); }
    },
    excluirSessao(id) {
      this.estado.sessoes = this.estado.sessoes.filter((s) => s.id !== id); salvar();
    },

    /* Cronômetro: guarda o início para continuar certo mesmo se a página recarregar */
    cronometro() { return this.estado.cronometro; },
    iniciarCronometro(materia) {
      this.estado.cronometro = { alunoId: this.alunoAtualId(), materia, acumuladoMs: 0, inicioMs: Date.now() }; salvar();
    },
    pausarCronometro() {
      const c = this.estado.cronometro; if (!c || !c.inicioMs) return;
      c.acumuladoMs += Date.now() - c.inicioMs; c.inicioMs = null; salvar();
    },
    continuarCronometro() {
      const c = this.estado.cronometro; if (!c || c.inicioMs) return;
      c.inicioMs = Date.now(); salvar();
    },
    trocarMateriaCronometro(materia) { const c = this.estado.cronometro; if (c) { c.materia = materia; salvar(); } },
    tempoCronometroMs() {
      const c = this.estado.cronometro; if (!c) return 0;
      return c.acumuladoMs + (c.inicioMs ? Date.now() - c.inicioMs : 0);
    },
    descartarCronometro() { this.estado.cronometro = null; salvar(); },

    /* Plano da semana */
    plano(semana) { return this.estado.planos.find((p) => p.semana === semana) || null; },
    salvarPlano(semana, metas, recado) {
      const existente = this.plano(semana);
      const novo = { semana, metas, recado, publicadoEm: hoje() };
      if (existente) Object.assign(existente, novo); else this.estado.planos.push(novo);
      salvar(); return novo;
    },

    /* Simulado relâmpago */
    tentativa(alunoId, semana) { return this.estado.tentativas.find((t) => t.alunoId === alunoId && t.semana === semana) || null; },
    tentativas(semana) { return this.estado.tentativas.filter((t) => t.semana === semana); },
    registrarTentativa(alunoId, semana, respostas, acertos) {
      const t = { id: uid('t'), alunoId, semana, respostas, acertos, feitoEm: Date.now() };
      this.estado.tentativas.push(t); salvar(); return t;
    },

    /* Caderno de erros com revisão em 1, 7 e 21 dias */
    erros(alunoId) { return this.estado.erros.filter((e) => e.alunoId === alunoId); },
    registrarErro({ alunoId, materia, assunto, anotacao, origem, origemId }) {
      const criadoEm = hoje();
      const e = {
        id: uid('e'), alunoId, materia, assunto: assunto.trim(), anotacao: anotacao.trim(), origem: origem || 'Registro manual', origemId: origemId || null, criadoEm,
        revisoes: [1, 7, 21].map((k) => ({ etapa: k, data: util.addDias(criadoEm, k), feita: false }))
      };
      this.estado.erros.unshift(e); salvar(); return e;
    },
    concluirRevisao(erroId, etapa, acertou) {
      const e = this.estado.erros.find((x) => x.id === erroId); if (!e) return null;
      const r = e.revisoes.find((x) => x.etapa === etapa); if (!r) return null;
      if (acertou) { r.feita = true; r.feitaEm = hoje(); }
      else { r.data = util.addDias(hoje(), 1); r.adiada = (r.adiada || 0) + 1; }
      salvar(); return e;
    },
    restaurarRevisao(erroId, etapa, copia) {
      const e = this.estado.erros.find((x) => x.id === erroId); if (!e) return;
      const i = e.revisoes.findIndex((x) => x.etapa === etapa); if (i < 0) return;
      e.revisoes[i] = { ...copia }; salvar();
    },
    excluirErro(id) { this.estado.erros = this.estado.erros.filter((e) => e.id !== id); salvar(); }
  };

  window.Store = Store;
})();
