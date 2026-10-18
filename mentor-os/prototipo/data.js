/* Mentor OS · conteúdo fixo e gerador dos dados de demonstração.
   Tudo aqui é fictício: nomes, telefones, números e questões. */
(function () {
  const MATERIAS = [
    { id: 'port', nome: 'Português', cor: '#1d5a35' },
    { id: 'rl', nome: 'Raciocínio lógico', cor: '#5b7f1f' },
    { id: 'const', nome: 'Direito constitucional', cor: '#2f6b6b' },
    { id: 'adm', nome: 'Direito administrativo', cor: '#7a5a12' },
    { id: 'info', nome: 'Informática', cor: '#5a4f8a' }
  ];

  /* Simulado relâmpago: 10 questões fictícias criadas para a demonstração. */
  const SIMULADO = [
    {
      id: 'q1', materia: 'port', assunto: 'Crase',
      enunciado: 'Em qual frase o acento grave (crase) está empregado corretamente?',
      opcoes: ['Vou à pé para o cursinho.', 'Entreguei o recurso à ele.', 'Fui à biblioteca depois da aula.', 'Começou à chover durante a prova.'],
      certa: 2,
      explicacao: 'Há crase quando "ir a" encontra o artigo "a" de "a biblioteca". Não há crase antes de palavra masculina (pé), de pronome pessoal (ele) nem de verbo (chover).'
    },
    {
      id: 'q2', materia: 'port', assunto: 'Concordância verbal',
      enunciado: 'Assinale a frase que segue a norma-padrão.',
      opcoes: ['Fazem dois anos que estudo para tribunais.', 'Faz dois anos que estudo para tribunais.', 'Houveram muitas inscrições este ano.', 'Haviam três questões anuladas.'],
      certa: 1,
      explicacao: '"Fazer" indicando tempo decorrido e "haver" no sentido de existir são impessoais: ficam no singular.'
    },
    {
      id: 'q3', materia: 'port', assunto: 'Ortografia',
      enunciado: 'Qual palavra está escrita corretamente?',
      opcoes: ['Excessão', 'Exceção', 'Esseção', 'Excesão'],
      certa: 1,
      explicacao: 'A forma correta é "exceção", com "xc" e "ç".'
    },
    {
      id: 'q4', materia: 'port', assunto: 'Pontuação',
      enunciado: 'Em qual frase a vírgula está usada de forma correta?',
      opcoes: ['Os candidatos, fizeram a prova pela manhã.', 'O edital saiu ontem, e a prova será em março.', 'Ana, e Paulo passaram na primeira fase.', 'A banca, divulgou o gabarito.'],
      certa: 1,
      explicacao: 'Não se separa sujeito do verbo com vírgula. Entre orações com sujeitos diferentes ligadas por "e", a vírgula é aceita.'
    },
    {
      id: 'q5', materia: 'rl', assunto: 'Sequências',
      enunciado: 'Qual número continua a sequência 2, 6, 12, 20, 30, ...?',
      opcoes: ['36', '40', '42', '48'],
      certa: 2,
      explicacao: 'As diferenças crescem de 2 em 2: +4, +6, +8, +10. A próxima é +12, então 30 + 12 = 42.'
    },
    {
      id: 'q6', materia: 'rl', assunto: 'Negação de proposições',
      enunciado: 'Qual é a negação de "Todos os candidatos estudaram"?',
      opcoes: ['Nenhum candidato estudou.', 'Pelo menos um candidato não estudou.', 'Todos os candidatos não estudaram.', 'Alguns candidatos estudaram.'],
      certa: 1,
      explicacao: 'Para negar "todos", basta um caso contrário: "pelo menos um não".'
    },
    {
      id: 'q7', materia: 'rl', assunto: 'Condicional',
      enunciado: '"Se chove, então a rua fica molhada." A rua não está molhada. Logo:',
      opcoes: ['Choveu.', 'Não choveu.', 'Pode ter chovido.', 'Não é possível concluir nada.'],
      certa: 1,
      explicacao: 'Se a consequência é falsa, a condição também é: se tivesse chovido, a rua estaria molhada.'
    },
    {
      id: 'q8', materia: 'const', assunto: 'Fundamentos da República',
      enunciado: 'Segundo o art. 1º da Constituição Federal, é fundamento da República Federativa do Brasil:',
      opcoes: ['A erradicação da pobreza.', 'A independência nacional.', 'A dignidade da pessoa humana.', 'A defesa do consumidor.'],
      certa: 2,
      explicacao: 'Os fundamentos são soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa e pluralismo político. Erradicar a pobreza é objetivo (art. 3º).'
    },
    {
      id: 'q9', materia: 'const', assunto: 'Separação dos Poderes',
      enunciado: 'São Poderes da União, independentes e harmônicos entre si (art. 2º):',
      opcoes: ['Legislativo, Executivo e Judiciário.', 'Executivo, Judiciário e Ministério Público.', 'Legislativo, Executivo e Tribunal de Contas.', 'Federal, Estadual e Municipal.'],
      certa: 0,
      explicacao: 'O art. 2º lista três Poderes: Legislativo, Executivo e Judiciário.'
    },
    {
      id: 'q10', materia: 'const', assunto: 'Direitos fundamentais',
      enunciado: 'Por determinação judicial, a entrada na casa sem consentimento do morador pode ocorrer:',
      opcoes: ['A qualquer hora.', 'Somente durante a noite.', 'Durante o dia.', 'Nunca, em nenhuma hipótese.'],
      certa: 2,
      explicacao: 'O art. 5º, XI, permite a entrada por determinação judicial durante o dia. Flagrante, desastre ou socorro valem a qualquer hora.'
    }
  ];

  const MENTOR = { id: 'm1', nome: 'Henrique Duarte', turma: 'Turma Tribunais 2026', whatsapp: '61980000100' };

  /* Perfis de comportamento usados só para gerar a demonstração. */
  const ALUNOS = [
    { id: 'a1', nome: 'Larissa Monteiro', tel: '61980000101', freq: 0.92, q: [18, 34], ac: 0.71, parou: 0, hoje: false, sim: null },
    { id: 'a2', nome: 'Bruno Teixeira', tel: '61980000102', freq: 0.96, q: [30, 55], ac: 0.78, parou: 0, hoje: true, sim: 9 },
    { id: 'a3', nome: 'Jéssica Almeida', tel: '61980000103', freq: 0.95, q: [22, 40], ac: 0.84, parou: 0, hoje: true, sim: 10 },
    { id: 'a4', nome: 'Rafael Nogueira', tel: '61980000104', freq: 0.8, q: [15, 30], ac: 0.66, parou: 5, hoje: false, sim: null },
    { id: 'a5', nome: 'Patrícia Lima', tel: '61980000105', freq: 0.45, q: [8, 18], ac: 0.62, parou: 1, hoje: false, sim: 5 },
    { id: 'a6', nome: 'Diego Santana', tel: '61980000106', freq: 0.85, q: [20, 36], ac: 0.69, parou: 3, hoje: false, sim: 7 },
    { id: 'a7', nome: 'Aline Ferreira', tel: '61980000107', freq: 0.9, q: [25, 42], ac: 0.75, parou: 0, hoje: false, sim: 8 },
    { id: 'a8', nome: 'Thiago Barros', tel: '61980000108', freq: 0.6, q: [12, 28], ac: 0.55, parou: 0, hoje: false, sim: 4 },
    { id: 'a9', nome: 'Mariana Costa', tel: '61980000109', freq: 0.93, q: [24, 38], ac: 0.8, parou: 0, hoje: true, sim: 8 },
    { id: 'a10', nome: 'Felipe Araújo', tel: '61980000110', freq: 0.75, q: [15, 30], ac: 0.64, parou: 8, hoje: false, sim: null },
    { id: 'a11', nome: 'Renata Oliveira', tel: '61980000111', freq: 0.5, q: [10, 20], ac: 0.7, parou: 0, hoje: false, sim: 6 },
    { id: 'a12', nome: 'Gustavo Pereira', tel: '61980000112', freq: 0.82, q: [18, 30], ac: 0.68, parou: 0, hoje: false, sim: null }
  ];

  const PLANO_BASE = [
    { materia: 'port', questoes: 60, horas: 4 },
    { materia: 'rl', questoes: 40, horas: 3 },
    { materia: 'const', questoes: 50, horas: 4 },
    { materia: 'adm', questoes: 40, horas: 3 },
    { materia: 'info', questoes: 20, horas: 1 }
  ];

  const ERROS_DEMO = [
    { dias: 1, materia: 'port', assunto: 'Crase antes de horas', anotacao: 'Confundi "às 10h" com "a partir das 10h". Antes de hora determinada tem crase.' },
    { dias: 3, materia: 'const', assunto: 'Remédios constitucionais', anotacao: 'Habeas data é para informação sobre a própria pessoa, não habeas corpus.' },
    { dias: 7, materia: 'rl', assunto: 'Equivalência lógica', anotacao: '"Se A então B" equivale a "se não B então não A". Errei trocando a ordem.' },
    { dias: 7, materia: 'adm', assunto: 'Atos administrativos', anotacao: 'Revogação é por conveniência e oportunidade; anulação é por ilegalidade.' },
    { dias: 12, materia: 'info', assunto: 'Atalhos do Windows', anotacao: 'Win + E abre o Explorador de Arquivos. Marquei Win + R.' },
    { dias: 21, materia: 'port', assunto: 'Regência de "assistir"', anotacao: 'No sentido de ver, "assistir a". Assisti ao filme, não assisti o filme.' }
  ];

  /* Gerador previsível (mesma demonstração sempre que recomeça no mesmo dia). */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function iso(d) {
    const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  function addDias(isoStr, n) {
    const [y, m, d] = isoStr.split('-').map(Number);
    return iso(new Date(y, m - 1, d + n));
  }
  function segunda(isoStr) {
    const [y, m, d] = isoStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    const dow = (dt.getDay() + 6) % 7; // segunda = 0
    return addDias(isoStr, -dow);
  }

  function gerarDemo(hojeIso) {
    const r = rng(20261018);
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const between = (a, b) => Math.round(a + r() * (b - a));
    const sessoes = [];
    let n = 0;
    const pesos = ['port', 'port', 'const', 'const', 'rl', 'rl', 'adm', 'adm', 'info'];
    const semana = segunda(hojeIso);
    const semanaPassada = addDias(semana, -7);

    ALUNOS.forEach((al) => {
      for (let d = 27; d >= 0; d--) {
        if (d === 0 && !al.hoje) continue;
        if (al.parou && d < al.parou) continue;
        const forcar = al.id === 'a1' && d >= 1 && d <= 9; // sequência da aluna demo
        const ultimo = al.parou && d === al.parou;
        if (!forcar && !ultimo && r() > al.freq) continue;
        const qtdSessoes = r() < 0.35 ? 2 : 1;
        for (let s = 0; s < qtdSessoes; s++) {
          const questoes = Math.round(between(al.q[0], al.q[1]) / qtdSessoes);
          const ac = Math.min(questoes, Math.round(questoes * Math.min(0.97, Math.max(0.3, al.ac + (r() - 0.5) * 0.16))));
          sessoes.push({
            id: 's' + (++n),
            alunoId: al.id,
            data: addDias(hojeIso, -d),
            materia: pick(pesos),
            minutos: Math.round((questoes * (2.2 + r() * 1.6)) / 5) * 5 + 15,
            questoes,
            acertos: ac,
            criadoEm: Date.now() - d * 86400000
          });
        }
      }
    });

    const tentativas = [];
    ALUNOS.forEach((al) => {
      [[semana, al.sim], [semanaPassada, al.sim == null ? (al.parou > 6 ? null : between(4, 8)) : Math.max(3, al.sim - between(0, 2))]].forEach(([sem, acertos]) => {
        if (acertos == null) return;
        if (sem === semana && al.parou >= 3) return;
        const erradas = SIMULADO.map((q, i) => i).sort(() => r() - 0.5).slice(0, 10 - acertos);
        const respostas = SIMULADO.map((q, i) => (erradas.includes(i) ? (q.certa + 1 + Math.floor(r() * 3)) % 4 : q.certa));
        tentativas.push({ id: 't' + al.id + sem, alunoId: al.id, semana: sem, respostas, acertos, feitoEm: Date.now() - between(1, 4) * 86400000 });
      });
    });

    const erros = [];
    ERROS_DEMO.forEach((e, i) => {
      const criado = addDias(hojeIso, -e.dias);
      erros.push({
        id: 'e' + (i + 1), alunoId: 'a1', materia: e.materia, assunto: e.assunto, anotacao: e.anotacao, origem: 'Questões do dia',
        criadoEm: criado,
        revisoes: [1, 7, 21].map((k) => ({ etapa: k, data: addDias(criado, k), feita: addDias(criado, k) < hojeIso }))
      });
    });
    // Alguns erros dos outros alunos, para o painel do mentor
    ALUNOS.slice(1).forEach((al, i) => {
      const qtd = 1 + (i % 4);
      for (let k = 0; k < qtd; k++) {
        const criado = addDias(hojeIso, -between(1, 20));
        erros.push({
          id: 'e' + al.id + k, alunoId: al.id, materia: pick(pesos), assunto: 'Questão revisada', anotacao: 'Registro de demonstração.', origem: 'Questões do dia',
          criadoEm: criado,
          revisoes: [1, 7, 21].map((x) => ({ etapa: x, data: addDias(criado, x), feita: addDias(criado, x) < hojeIso }))
        });
      }
    });

    return {
      versao: 1,
      criadoEm: hojeIso,
      papel: 'aluno',
      alunoAtual: 'a1',
      mentor: { ...MENTOR },
      alunos: ALUNOS.map((a) => ({ id: a.id, nome: a.nome, telefone: a.tel, entrouEm: addDias(hojeIso, -40) })),
      sessoes,
      cronometro: null,
      planos: [
        { semana, metas: PLANO_BASE.map((m) => ({ ...m })), recado: 'Semana de revisão de base. Priorize Português e Constitucional, e faça o simulado até domingo.', publicadoEm: addDias(semana, 0) },
        { semana: semanaPassada, metas: PLANO_BASE.map((m) => ({ ...m })), recado: '', publicadoEm: semanaPassada }
      ],
      tentativas,
      erros
    };
  }

  window.MOS_DATA = { MATERIAS, SIMULADO, gerarDemo, util: { iso, addDias, segunda } };
})();
