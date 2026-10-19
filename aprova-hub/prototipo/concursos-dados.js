/* Aprova Hub · concursos de demonstração (todos fictícios, "Exemplo").
   Usado pelo app (window.AH_CONCURSOS) e pelo gerador de páginas (tools/gerar-concursos.js). */
(function (raiz) {
  const ETAPAS = [
    ['previsto', 'Previsto'], ['comissao', 'Comissão formada'], ['banca', 'Banca contratada'], ['edital', 'Edital publicado'],
    ['inscricoes', 'Inscrições'], ['prova', 'Prova'], ['gabarito', 'Gabarito'], ['resultado', 'Resultado e homologação']
  ];

  // tópicos genéricos por matéria (conteúdo programático resumido, comum em editais)
  const T = {
    port: ['Interpretação de texto', 'Ortografia', 'Pontuação', 'Concordância', 'Regência', 'Crase', 'Sintaxe'],
    const: ['Direitos fundamentais', 'Direitos sociais', 'Organização do Estado', 'Administração Pública', 'Poder Legislativo', 'Poder Executivo', 'Poder Judiciário', 'Controle de constitucionalidade'],
    adm: ['Princípios', 'Atos administrativos', 'Poderes administrativos', 'Agentes públicos', 'Licitações', 'Responsabilidade civil', 'Improbidade'],
    rl: ['Proposições e conectivos', 'Equivalências e negações', 'Sequências', 'Porcentagem', 'Análise combinatória'],
    info: ['Sistemas operacionais', 'Editores de texto e planilhas', 'Internet e correio eletrônico', 'Segurança da informação'],
    banc: ['Sistema Financeiro Nacional', 'Produtos bancários', 'Mercado de capitais', 'Prevenção à lavagem de dinheiro', 'Atendimento e vendas'],
    penal: ['Aplicação da lei penal', 'Crime e seus elementos', 'Crimes contra a pessoa', 'Crimes contra o patrimônio', 'Crimes contra a administração pública'],
    trib: ['Sistema tributário nacional', 'Competência tributária', 'Obrigação e crédito tributário', 'Impostos municipais e estaduais'],
    contab: ['Patrimônio e escrituração', 'Demonstrações contábeis', 'Análise de balanços', 'Custos'],
    sus: ['Princípios e diretrizes do SUS', 'Lei Orgânica da Saúde', 'Vigilância em saúde', 'Atenção básica'],
    enf: ['Fundamentos de enfermagem', 'Biossegurança', 'Saúde da mulher e da criança', 'Urgência e emergência', 'Ética profissional'],
    pedag: ['Teorias da aprendizagem', 'Planejamento e avaliação', 'Educação inclusiva', 'Base curricular', 'Legislação educacional']
  };
  const NOMES = { port: 'Língua Portuguesa', const: 'Direito Constitucional', adm: 'Direito Administrativo', rl: 'Raciocínio Lógico', info: 'Informática', banc: 'Conhecimentos Bancários', penal: 'Direito Penal', trib: 'Direito Tributário', contab: 'Contabilidade', sus: 'Legislação do SUS', enf: 'Conhecimentos de Enfermagem', pedag: 'Conhecimentos Pedagógicos' };
  const materias = (ids) => ids.map((id) => ({ id, nome: NOMES[id], topicos: T[id] }));

  const CONCURSOS = [
    {
      slug: 'banco-exemplo-escriturario', orgao: 'Banco Exemplo', titulo: 'Banco Exemplo · Escriturário', area: 'bancos', uf: 'BR', abrangencia: 'Nacional', escolaridade: 'Médio',
      banca: 'Banca Exemplo A', cargos: [{ nome: 'Escriturário', vagas: 1200, salario: 4000, escolaridade: 'Médio' }],
      etapas: { previsto: '2026-05-10', comissao: '2026-06-20', banca: '2026-08-14', edital: '2026-10-19', inscricoes: ['2026-10-20', '2026-11-12'], prova: '2027-01-17', gabarito: '2027-01-19', resultado: '2027-03-10' },
      previsao: ['gabarito', 'resultado'], materias: materias(['port', 'rl', 'info', 'banc', 'const'])
    },
    {
      slug: 'policia-civil-exemplo-agente', orgao: 'Polícia Civil Exemplo', titulo: 'Polícia Civil Exemplo · Agente de Polícia', area: 'policia', uf: 'GO', abrangencia: 'Estadual', escolaridade: 'Superior',
      banca: 'Banca Exemplo B', cargos: [{ nome: 'Agente de Polícia', vagas: 300, salario: 5600, escolaridade: 'Superior' }, { nome: 'Escrivão de Polícia', vagas: 50, salario: 5600, escolaridade: 'Superior' }],
      etapas: { previsto: '2026-02-01', comissao: '2026-04-15', banca: '2026-07-01', edital: '2026-10-05', inscricoes: ['2026-10-10', '2026-11-28'], prova: '2027-01-31', gabarito: '2027-02-02', resultado: '2027-05-15' },
      previsao: ['resultado'], materias: materias(['port', 'const', 'penal', 'adm', 'info'])
    },
    {
      slug: 'trt-exemplo-tecnico', orgao: 'TRT Exemplo', titulo: 'TRT Exemplo · Técnico Judiciário', area: 'tribunais', uf: 'PE', abrangencia: 'Regional', escolaridade: 'Médio',
      banca: 'Banca Exemplo A', cargos: [{ nome: 'Técnico Judiciário', vagas: 60, salario: 8500, escolaridade: 'Médio' }, { nome: 'Analista Judiciário', vagas: 20, salario: 13900, escolaridade: 'Superior' }],
      etapas: { previsto: '2026-03-12', comissao: '2026-06-02', banca: '2026-09-30', edital: '2026-12-15', inscricoes: ['2026-12-16', '2027-01-20'], prova: '2027-03-21', gabarito: '2027-03-23', resultado: '2027-06-01' },
      previsao: ['edital', 'inscricoes', 'prova', 'gabarito', 'resultado'], materias: materias(['port', 'const', 'adm', 'rl', 'info'])
    },
    {
      slug: 'sefaz-exemplo-auditor', orgao: 'Secretaria Exemplo da Fazenda', titulo: 'Secretaria Exemplo da Fazenda · Auditor Fiscal', area: 'fiscal', uf: 'SC', abrangencia: 'Estadual', escolaridade: 'Superior',
      banca: 'A definir', cargos: [{ nome: 'Auditor Fiscal', vagas: 60, salario: 21000, escolaridade: 'Superior' }],
      etapas: { previsto: '2026-07-20', comissao: '2026-10-17', banca: '2027-01-15', edital: '2027-04-01', inscricoes: ['2027-04-02', '2027-05-02'], prova: '2027-07-11', gabarito: '2027-07-13', resultado: '2027-10-01' },
      previsao: ['banca', 'edital', 'inscricoes', 'prova', 'gabarito', 'resultado'], materias: materias(['port', 'trib', 'contab', 'const', 'adm'])
    },
    {
      slug: 'prefeitura-exemplo-professor', orgao: 'Prefeitura Exemplo do Norte', titulo: 'Prefeitura Exemplo do Norte · Professor', area: 'educacao', uf: 'SP', abrangencia: 'Municipal', escolaridade: 'Superior',
      banca: 'Banca Exemplo B', cargos: [{ nome: 'Professor de Educação Básica', vagas: 45, salario: 3850, escolaridade: 'Superior' }],
      etapas: { previsto: '2026-01-15', comissao: '2026-03-01', banca: '2026-05-05', edital: '2026-07-01', inscricoes: ['2026-07-02', '2026-08-10'], prova: '2026-09-27', gabarito: '2026-09-29', resultado: '2026-11-20' },
      previsao: ['resultado'], materias: materias(['port', 'pedag', 'info'])
    },
    {
      slug: 'hospital-exemplo-enfermagem', orgao: 'Hospital Universitário Exemplo', titulo: 'Hospital Universitário Exemplo · Enfermagem', area: 'saude', uf: 'BA', abrangencia: 'Municipal', escolaridade: 'Médio',
      banca: 'Banca Exemplo A', cargos: [{ nome: 'Técnico de Enfermagem', vagas: 40, salario: 3200, escolaridade: 'Médio' }, { nome: 'Enfermeiro', vagas: 15, salario: 6100, escolaridade: 'Superior' }],
      etapas: { previsto: '2025-11-10', comissao: '2026-01-12', banca: '2026-02-20', edital: '2026-04-06', inscricoes: ['2026-04-07', '2026-05-07'], prova: '2026-07-05', gabarito: '2026-07-07', resultado: '2026-10-10' },
      previsao: [], materias: materias(['port', 'sus', 'enf', 'info'])
    }
  ];

  /* etapa atual em uma data (AAAA-MM-DD) */
  function etapaAtual(c, hoje) {
    let atual = null;
    ETAPAS.forEach(([id]) => { const v = c.etapas[id]; const ini = Array.isArray(v) ? v[0] : v; if (ini && ini <= hoje) atual = id; });
    return atual || 'previsto';
  }
  const dataProva = (c) => c.etapas.prova;
  const totalVagas = (c) => c.cargos.reduce((t, x) => t + x.vagas, 0);
  const maiorSalario = (c) => Math.max(...c.cargos.map((x) => x.salario));

  const API = { ETAPAS, CONCURSOS, NOMES, etapaAtual, dataProva, totalVagas, maiorSalario };
  if (typeof module !== 'undefined' && module.exports) module.exports = API; else raiz.AH_CONCURSOS = API;
})(typeof window !== 'undefined' ? window : globalThis);
