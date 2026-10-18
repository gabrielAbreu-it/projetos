/* Mentor OS · regras de negócio (cálculos puros a partir do Store). */
(function () {
  const { util, MATERIAS } = window.MOS_DATA;
  const S = window.Store;

  const REGRA = {
    pontosPorAcerto: 1,
    tetoAcertosDia: 60,
    pontosPorDia: 15,
    pontosPorAcertoSimulado: 3,
    diasSumiu: 3,
    limiteMeta: 0.7
  };

  function diasEntre(a, b) {
    const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
    return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
  }
  const semanaAtual = () => util.segunda(S.hoje());
  const fimSemana = (seg) => util.addDias(seg, 6);
  const diasDaSemana = (seg) => Array.from({ length: 7 }, (_, i) => util.addDias(seg, i));
  const materia = (id) => MATERIAS.find((m) => m.id === id) || { id, nome: id, cor: '#1d5a35' };

  function resumo(alunoId, seg, ate) {
    const fim = ate || fimSemana(seg);
    const ss = S.sessoes(alunoId, seg, fim);
    const porDia = {};
    ss.forEach((s) => {
      const d = (porDia[s.data] = porDia[s.data] || { questoes: 0, acertos: 0, minutos: 0 });
      d.questoes += s.questoes; d.acertos += s.acertos; d.minutos += s.minutos;
    });
    const questoes = ss.reduce((t, s) => t + s.questoes, 0);
    const acertos = ss.reduce((t, s) => t + s.acertos, 0);
    const minutos = ss.reduce((t, s) => t + s.minutos, 0);
    const porMateria = {};
    ss.forEach((s) => {
      const m = (porMateria[s.materia] = porMateria[s.materia] || { questoes: 0, acertos: 0, minutos: 0 });
      m.questoes += s.questoes; m.acertos += s.acertos; m.minutos += s.minutos;
    });
    return { questoes, acertos, minutos, dias: Object.keys(porDia).length, porDia, porMateria, pct: questoes ? Math.round((acertos / questoes) * 100) : null };
  }

  function pontos(alunoId, seg, ate) {
    const r = resumo(alunoId, seg, ate);
    const acertosValidos = Object.values(r.porDia).reduce((t, d) => t + Math.min(d.acertos, REGRA.tetoAcertosDia), 0);
    const t = S.tentativa(alunoId, seg);
    const simulado = t ? t.acertos * REGRA.pontosPorAcertoSimulado : 0;
    const consistencia = r.dias * REGRA.pontosPorDia;
    return { total: acertosValidos + consistencia + simulado, acertos: acertosValidos, consistencia, simulado, dias: r.dias };
  }

  const FAIXAS = [
    { id: 'forte', nome: 'Ritmo forte', desc: 'O terço da turma com mais pontos nesta semana.' },
    { id: 'constante', nome: 'Constante', desc: 'O terço do meio: está no caminho.' },
    { id: 'retomando', nome: 'Retomando', desc: 'Quem está voltando ao ritmo. Um dia de estudo já muda a faixa.' }
  ];

  function ranking(seg) {
    const lista = S.alunos().map((a) => ({ aluno: a, ...pontos(a.id, seg) }))
      .sort((x, y) => y.total - x.total || x.aluno.nome.localeCompare(y.aluno.nome));
    const n = lista.length;
    lista.forEach((l, i) => {
      l.posicao = i + 1;
      l.faixa = i < Math.ceil(n / 3) ? FAIXAS[0] : i < Math.ceil((2 * n) / 3) ? FAIXAS[1] : FAIXAS[2];
    });
    // pontos mínimos para entrar em cada faixa (último colocado da faixa)
    const corte = {};
    FAIXAS.forEach((f) => { const da = lista.filter((l) => l.faixa.id === f.id); corte[f.id] = da.length ? da[da.length - 1].total : 0; });
    return { lista, corte };
  }

  function sequencia(alunoId) {
    const datas = new Set(S.sessoes(alunoId).map((s) => s.data));
    const hoje = S.hoje();
    let d = datas.has(hoje) ? hoje : util.addDias(hoje, -1);
    let n = 0;
    while (datas.has(d)) { n++; d = util.addDias(d, -1); }
    return { dias: n, fezHoje: datas.has(hoje) };
  }

  function ultimaAtividade(alunoId) {
    const ss = S.sessoes(alunoId);
    if (!ss.length) return null;
    return ss.reduce((m, s) => (s.data > m ? s.data : m), ss[0].data);
  }

  function metaTotal(seg) {
    const p = S.plano(seg);
    if (!p) return { questoes: 0, horas: 0 };
    return { questoes: p.metas.reduce((t, m) => t + Number(m.questoes || 0), 0), horas: p.metas.reduce((t, m) => t + Number(m.horas || 0), 0) };
  }

  /* Situação do aluno para o mentor: sumiu, abaixo da meta ou em dia */
  function situacao(alunoId) {
    const hoje = S.hoje();
    const seg = semanaAtual();
    const ult = ultimaAtividade(alunoId);
    const semAtividade = ult ? diasEntre(ult, hoje) : null;
    const r = resumo(alunoId, seg);
    const meta = metaTotal(seg).questoes;
    const diasPassados = diasEntre(seg, hoje) + 1;
    const esperado = Math.round((meta * diasPassados) / 7);
    const sumiu = semAtividade === null || semAtividade >= REGRA.diasSumiu;
    const abaixo = esperado > 0 && r.questoes < esperado * REGRA.limiteMeta;
    return { ult, semAtividade, sumiu, abaixo, esperado, feito: r.questoes, resumo: r, tipo: sumiu ? 'sumiu' : abaixo ? 'abaixo' : 'emdia' };
  }

  function revisoesHoje(alunoId) {
    const hoje = S.hoje();
    const fila = [];
    S.erros(alunoId).forEach((e) => {
      const prox = e.revisoes.find((r) => !r.feita);
      if (prox && prox.data <= hoje) fila.push({ erro: e, revisao: prox, atraso: diasEntre(prox.data, hoje) });
    });
    return fila;
  }

  function proximaRevisao(erro) { return erro.revisoes.find((r) => !r.feita) || null; }

  window.Regras = { REGRA, FAIXAS, diasEntre, semanaAtual, fimSemana, diasDaSemana, materia, resumo, pontos, ranking, sequencia, ultimaAtividade, metaTotal, situacao, revisoesHoje, proximaRevisao };
})();
