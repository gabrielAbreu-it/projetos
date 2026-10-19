/* Aprova Hub · conteúdo fixo e gerador da demonstração.
   Tudo aqui é fictício: órgãos "Exemplo", bancas "Exemplo", pessoas, números e percentuais. */
(function () {
  const MATERIAS = [
    { id: 'const', nome: 'Direito Constitucional' },
    { id: 'port', nome: 'Língua Portuguesa' },
    { id: 'rl', nome: 'Raciocínio Lógico' },
    { id: 'adm', nome: 'Direito Administrativo' },
    { id: 'banc', nome: 'Conhecimentos Bancários' },
    { id: 'info', nome: 'Informática' },
    { id: 'penal', nome: 'Direito Penal' },
    { id: 'trib', nome: 'Direito Tributário' },
    { id: 'contab', nome: 'Contabilidade' },
    { id: 'sus', nome: 'Legislação do SUS' },
    { id: 'enf', nome: 'Conhecimentos de Enfermagem' },
    { id: 'pedag', nome: 'Conhecimentos Pedagógicos' }
  ];

  /* ---------- Radar de editais (fictício) ---------- */
  const DESTAQUES = {
    bancos: { tipo: 'NOVO EDITAL', quando: 'publicado hoje', orgao: 'Banco Exemplo', cargo: 'Escriturário', banca: 'Banca Exemplo A', inscricoes: '12/11', vagas: '1.200', salario: 'R$ 4.000', nivel: 'Médio', analise: { banca: 'a', materia: 'const' } },
    policia: { tipo: 'NOVO EDITAL', quando: 'publicado ontem', orgao: 'Polícia Civil Exemplo', cargo: 'Agente de Polícia', banca: 'Banca Exemplo B', inscricoes: '28/11', vagas: '350', salario: 'R$ 5.600', nivel: 'Superior', analise: { banca: 'b', materia: 'const' } },
    tribunais: { tipo: 'NOVO EDITAL', quando: 'há 3 dias', orgao: 'TRT Exemplo', cargo: 'Técnico Judiciário', banca: 'Banca Exemplo A', inscricoes: '05/12', vagas: '80', salario: 'R$ 8.500', nivel: 'Médio', analise: { banca: 'a', materia: 'port' } }
  };
  const RADAR = [
    { id: 'n1', tipo: 'RETIFICAÇÃO', quando: 'há 2 h', cat: 'policia', texto: 'Prefeitura Exemplo prorroga inscrições da Guarda Municipal' },
    { id: 'n2', tipo: 'GABARITO', quando: 'há 5 h', cat: 'tribunais', texto: 'TRT Exemplo divulga gabarito preliminar de Analista' },
    { id: 'n3', tipo: 'PREVISTO', quando: 'ontem', cat: 'bancos', texto: 'Secretaria Exemplo da Fazenda forma comissão para novo concurso' },
    { id: 'n4', tipo: 'RESULTADO', quando: 'ontem', cat: 'bancos', texto: 'Banco Exemplo do Nordeste publica resultado final de Técnico Bancário' },
    { id: 'n5', tipo: 'PREVISTO', quando: 'há 2 dias', cat: 'policia', texto: 'Polícia Rodoviária Exemplo pede autorização para 500 vagas' },
    { id: 'n6', tipo: 'RETIFICAÇÃO', quando: 'há 3 dias', cat: 'tribunais', texto: 'Tribunal de Justiça Exemplo altera data da prova objetiva' }
  ];
  const CATEGORIAS = [['todos', 'Todos'], ['policia', 'Polícia'], ['bancos', 'Bancos'], ['tribunais', 'Tribunais']];

  /* ---------- Análises de incidência (dados de exemplo) ---------- */
  const BANCAS = [{ id: 'a', nome: 'Banca Exemplo A', curto: 'Exemplo A', estilo: 'Certo/Errado' }, { id: 'b', nome: 'Banca Exemplo B', curto: 'Exemplo B', estilo: 'Múltipla escolha' }];
  const MAT_ANALISE = [{ id: 'const', nome: 'Constitucional' }, { id: 'port', nome: 'Português' }, { id: 'adm', nome: 'Administrativo' }];
  const CARGOS = [{ id: 'todos', nome: 'Todos' }, { id: 'escriturario', nome: 'Escriturário', premium: true }, { id: 'tecnico', nome: 'Técnico Judiciário', premium: true }, { id: 'agente', nome: 'Agente de Polícia', premium: true }];
  const INCIDENCIA = {
    'a-const': { temas: [['Direitos fundamentais', 24], ['Organização do Estado', 18], ['Poder Executivo', 14], ['Controle de constitucionalidade', 11], ['Poder Legislativo', 9]], alta: 'Direitos sociais subiu nas duas últimas provas.', questoes: [['2023', 'Direitos fundamentais', 'Remédios constitucionais'], ['2022', 'Organização do Estado', 'Federação'], ['2022', 'Poder Executivo', 'Atribuições do Presidente']] },
    'b-const': { temas: [['Direitos fundamentais', 27], ['Administração Pública', 16], ['Organização do Estado', 13], ['Poder Judiciário', 10], ['Segurança pública', 8]], alta: 'Segurança pública aparece mais em provas de carreira policial.', questoes: [['2024', 'Direitos fundamentais', 'Inviolabilidade do domicílio'], ['2023', 'Segurança pública', 'Órgãos de segurança'], ['2022', 'Administração Pública', 'Princípios']] },
    'a-port': { temas: [['Interpretação de texto', 31], ['Sintaxe', 17], ['Pontuação', 12], ['Concordância', 10], ['Crase', 7]], alta: 'Reescrita de frases cresceu nas provas recentes.', questoes: [['2023', 'Interpretação de texto', 'Inferência'], ['2023', 'Pontuação', 'Vírgula entre orações'], ['2021', 'Concordância', 'Verbos impessoais']] },
    'b-port': { temas: [['Interpretação de texto', 28], ['Concordância', 14], ['Regência', 12], ['Crase', 11], ['Ortografia', 8]], alta: 'Crase voltou a aparecer com frequência.', questoes: [['2024', 'Crase', 'Antes de horas'], ['2023', 'Regência', 'Verbos transitivos'], ['2022', 'Ortografia', 'Uso do hífen']] },
    'a-adm': { temas: [['Atos administrativos', 22], ['Licitações', 19], ['Agentes públicos', 15], ['Princípios', 12], ['Responsabilidade civil', 9]], alta: 'Licitações ganhou peso desde a lei nova.', questoes: [['2023', 'Licitações', 'Modalidades'], ['2022', 'Atos administrativos', 'Anulação e revogação'], ['2022', 'Princípios', 'Eficiência']] },
    'b-adm': { temas: [['Princípios', 21], ['Atos administrativos', 20], ['Poderes administrativos', 14], ['Licitações', 13], ['Improbidade', 10]], alta: 'Poder de polícia é tema recorrente.', questoes: [['2024', 'Poderes administrativos', 'Poder de polícia'], ['2023', 'Improbidade', 'Sanções'], ['2021', 'Atos administrativos', 'Atributos']] }
  };

  /* ---------- Quiz relâmpago: 10 questões de demonstração, escritas para este protótipo ---------- */
  const QUIZ = [
    { artigo: 'CF/88, art. 1º, III', enunciado: 'Qual destes é um fundamento da República Federativa do Brasil?', opcoes: ['Erradicar a pobreza', 'A dignidade da pessoa humana', 'A independência nacional', 'A defesa do consumidor'], certa: 1, explicacao: 'O art. 1º lista soberania, cidadania, dignidade da pessoa humana, valores sociais do trabalho e da livre iniciativa e pluralismo político. Erradicar a pobreza é objetivo (art. 3º).' },
    { artigo: 'CF/88, art. 2º', enunciado: 'São Poderes da União, independentes e harmônicos entre si:', opcoes: ['Legislativo, Executivo e Judiciário', 'Executivo, Judiciário e Ministério Público', 'Legislativo, Executivo e Tribunal de Contas', 'Federal, Estadual e Municipal'], certa: 0, explicacao: 'O art. 2º cita apenas três Poderes: Legislativo, Executivo e Judiciário.' },
    { artigo: 'CF/88, art. 3º, III', enunciado: 'Qual destes é um objetivo fundamental da República?', opcoes: ['A soberania', 'O pluralismo político', 'Erradicar a pobreza e a marginalização', 'A independência nacional'], certa: 2, explicacao: 'Objetivos ficam no art. 3º. Soberania e pluralismo são fundamentos (art. 1º); independência nacional é princípio das relações internacionais (art. 4º).' },
    { artigo: 'CF/88, art. 5º, XI', enunciado: 'Por determinação judicial, a entrada na casa sem consentimento do morador pode ocorrer:', opcoes: ['A qualquer hora', 'Somente à noite', 'Durante o dia', 'Nunca'], certa: 2, explicacao: 'Determinação judicial só durante o dia. Flagrante delito, desastre ou socorro valem a qualquer hora.' },
    { artigo: 'CF/88, art. 5º, LXVIII', enunciado: 'Qual remédio protege a liberdade de locomoção contra ilegalidade ou abuso de poder?', opcoes: ['Habeas data', 'Mandado de injunção', 'Ação popular', 'Habeas corpus'], certa: 3, explicacao: 'O habeas corpus protege quem sofre ou está ameaçado de sofrer violência ou coação na liberdade de locomoção.' },
    { artigo: 'CF/88, art. 5º, LXXII', enunciado: 'O habeas data serve para:', opcoes: ['Conhecer informações sobre a própria pessoa em registros públicos', 'Proteger a liberdade de ir e vir', 'Anular ato lesivo ao patrimônio público', 'Suprir falta de norma regulamentadora'], certa: 0, explicacao: 'Habeas data garante acesso e retificação de informações relativas ao próprio impetrante em bancos de dados de entidades governamentais ou de caráter público.' },
    { artigo: 'CF/88, art. 6º', enunciado: 'Qual destes está na lista de direitos sociais do art. 6º?', opcoes: ['A propriedade privada', 'A moradia', 'A nacionalidade', 'A inviolabilidade do domicílio'], certa: 1, explicacao: 'O art. 6º cita educação, saúde, alimentação, trabalho, moradia, transporte, lazer, segurança, previdência, proteção à maternidade e à infância e assistência aos desamparados.' },
    { artigo: 'CF/88, art. 14, § 1º, II', enunciado: 'Para quem o voto é facultativo?', opcoes: ['Maiores de 18 anos alfabetizados', 'Servidores públicos', 'Maiores de 70 anos', 'Maiores de 60 anos'], certa: 2, explicacao: 'O voto é facultativo para analfabetos, maiores de 70 anos e quem tem entre 16 e 18 anos.' },
    { artigo: 'CF/88, art. 18', enunciado: 'A organização político-administrativa do Brasil compreende, todos autônomos:', opcoes: ['União, Estados e Territórios', 'União, Estados, Distrito Federal e Municípios', 'União e Estados apenas', 'Estados, Municípios e Territórios'], certa: 1, explicacao: 'O art. 18 lista União, Estados, Distrito Federal e Municípios, todos autônomos. Territórios integram a União.' },
    { artigo: 'CF/88, art. 37, caput', enunciado: 'Qual destes é um princípio expresso da administração pública?', opcoes: ['Lucratividade', 'Sigilo', 'Eficiência', 'Pessoalidade'], certa: 2, explicacao: 'O caput do art. 37 cita legalidade, impessoalidade, moralidade, publicidade e eficiência.' }
  ];

  /* ---------- Grupo (outros membros, fictícios) ---------- */
  const GRUPO = {
    nome: 'Turma Escriturário', metaHoras: 200,
    membros: [['Marina', 860, 7], ['Rafael', 765, 6], ['Bia', 550, 6], ['Thiago', 475, 5], ['Juliana', 430, 5], ['Caio', 410, 4], ['Letícia', 380, 5], ['André', 350, 4], ['Sofia', 330, 4], ['Gustavo', 300, 3], ['Helena', 280, 4], ['Otávio', 250, 3], ['Renata', 220, 3], ['Diego', 190, 2], ['Paula', 160, 2], ['Lucas', 130, 2], ['Nina', 100, 1]],
    anterior: { voce: 590 }
  };

  /* ---------- Modo mentor (alunos fictícios) ---------- */
  const MENTOR = {
    turma: 'Turma Escriturário', limiteGratis: 15, metaHoras: 12, metaQuestoes: 150,
    alunos: [
      ['Carla Souza', 4, 5.5, 52, 64, 66, 61001], ['Pedro Lima', 0, 7.2, 70, 58, 71, 61002], ['Ana Rocha', 0, 10.5, 128, 76, 74, 61003],
      ['Bruno Dias', 0, 9.0, 96, 69, 70, 61004], ['Júlia Prado', 0, 8.2, 88, 72, 70, 61005], ['Rafael Melo', 0, 6.8, 74, 68, 67, 61006],
      ['Sara Nunes', 0, 7.5, 90, 81, 79, 61007], ['Igor Teles', 0, 5.0, 60, 63, 62, 61008], ['Lia Campos', 1, 6.0, 72, 70, 69, 61009],
      ['Tiago Reis', 0, 9.5, 102, 74, 73, 61010], ['Vera Lopes', 0, 3.5, 40, 66, 64, 61011]
    ]
  };

  /* ---------- gerador da demonstração ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDias = (s, n) => { const [y, m, d] = s.split('-').map(Number); return iso(new Date(y, m - 1, d + n)); };

  function gerarDemo(hoje) {
    const sessoes = [];
    let k = 0;
    const s = (d, materia, assunto, min, q, a) => sessoes.push({ id: 's' + (++k), data: addDias(hoje, -d), materia, assunto, minutos: min, questoes: q, acertos: a, criadoEm: Date.now() - d * 86400000 - k * 1000 });
    // últimos 6 dias: 560 minutos no total
    s(1, 'const', 'Organização do Estado', 95, 30, 22); s(2, 'port', 'Crase', 80, 25, 19); s(3, 'banc', 'Sistema Financeiro Nacional', 100, 20, 13);
    s(4, 'rl', 'Proposições', 90, 28, 19); s(5, 'const', 'Direitos sociais', 105, 32, 23); s(6, 'adm', 'Atos administrativos', 90, 26, 18);
    // semana anterior (para "sua evolução")
    [7, 8, 9, 10, 11, 12].forEach((d, i) => s(d, ['port', 'const', 'rl', 'adm', 'banc', 'info'][i], 'Revisão', 95, 24, 16));
    // hoje: 88 minutos, 38 questões, 28 acertos
    s(0, 'const', 'Direitos fundamentais', 50, 22, 17); s(0, 'port', 'Concordância', 38, 16, 11);
    const checkins = Array.from({ length: 12 }, (_, i) => addDias(hoje, -(i + 1)));
    const erro = (id, dias, materia, assunto, anotacao, feitas) => ({ id, materia, assunto, anotacao, foto: null, criadoEm: addDias(hoje, -dias), revisoes: [1, 7, 21].map((e) => ({ etapa: e, data: addDias(hoje, -dias + e), feita: feitas.includes(e) })) });
    const erros = [
      erro('e1', 1, 'const', 'Habeas data x habeas corpus', 'Habeas data é sobre informação da própria pessoa. Locomoção é habeas corpus.', []),
      erro('e2', 1, 'port', 'Crase antes de horas', '"Às 10h" tem crase; "a partir das 10h" também, pela contração.', []),
      erro('e3', 1, 'rl', 'Negação de "todo"', 'Negar "todo" é "pelo menos um não".', []),
      erro('e4', 7, 'adm', 'Revogação x anulação', 'Revogação: conveniência. Anulação: ilegalidade.', [1]),
      erro('e5', 7, 'banc', 'Copom', 'O Copom define a meta da taxa Selic.', [1]),
      erro('e6', 21, 'const', 'Voto facultativo', 'Analfabetos, maiores de 70 e de 16 a 18 anos.', [1, 7]),
      erro('e7', 3, 'info', 'Atalhos de teclado', 'Ctrl+Z desfaz; Ctrl+Y refaz.', [1])
    ];
    return {
      versao: 1, criadoEm: hoje,
      usuario: { nome: 'Você', iniciais: 'VC' },
      sessoes, checkins,
      cronometro: { materia: 'const', assunto: 'Direitos fundamentais', acumuladoMs: 0, inicioMs: Date.now() - (42 * 60 + 15) * 1000 },
      erros,
      quiz: { naFila: false, tentativas: [], reportes: [] },
      radarFiltro: 'todos',
      analise: { banca: 'a', materia: 'const', cargo: 'todos' },
      indicacao: { codigo: 'VOCE-7K2', indicados: 3, assinaram: 1, mesesGanhos: 1 },
      mentor: { turma: MENTOR.turma, metaHoras: MENTOR.metaHoras, metaQuestoes: MENTOR.metaQuestoes, turmas: [MENTOR.turma], alunos: MENTOR.alunos.map(([nome, semDias, horas, questoes, acerto, acertoAntes, tel], i) => ({ id: 'm' + i, nome, semDias, horas, questoes, acerto, acertoAntes, tel: '619800' + tel })) }
    };
  }

  window.AH_DATA = { MATERIAS, DESTAQUES, RADAR, CATEGORIAS, BANCAS, MAT_ANALISE, CARGOS, INCIDENCIA, QUIZ, GRUPO, MENTOR, gerarDemo, util: { iso, addDias } };
})();
