/* Aprova Hub · editais do dia.
   Tenta a função /api/editais (dados reais do Querido Diário). Se falhar, ou no
   computador local, usa itens de exemplo, sempre marcados como exemplo e sem links. */
(function () {
  const CACHE_MS = 10 * 60 * 1000;
  let cache = null, pendente = null;

  const pad = (n) => String(n).padStart(2, '0');
  const isoDias = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

  function demo() {
    const it = (id, orgao, uf, dias, tipo, resumo, extra = {}) => ({ id, orgao, uf, data: isoDias(dias), tipo, resumo, vagas: null, salario: null, inscricoes_ate: null, banca: null, links: { diario: null, texto: null }, fonte: 'exemplo', ...extra });
    return [
      it('d1', 'Prefeitura Exemplo do Norte', 'SP', 0, 'edital de abertura', 'Abertura de concurso público para Professor de Educação Básica e Auxiliar Administrativo. Inscrições pela internet, com prova objetiva prevista para janeiro.', { vagas: 45, salario: 'R$ 3.850,00', inscricoes_ate: isoDias(-30) }),
      it('d2', 'Prefeitura Exemplo da Serra', 'MG', 0, 'processo seletivo', 'Processo seletivo simplificado para contratação temporária de Técnico de Enfermagem. Seleção por análise de títulos.', { vagas: 12, salario: 'R$ 2.400,00', inscricoes_ate: isoDias(-10) }),
      it('d3', 'Prefeitura Exemplo do Litoral', 'BA', 1, 'retificação', 'Retificação do edital de concurso público: o prazo de inscrições foi prorrogado e o conteúdo de Informática foi alterado.', { inscricoes_ate: isoDias(-21) }),
      it('d4', 'Prefeitura Exemplo do Vale', 'PR', 1, 'homologação', 'Homologação do resultado final do concurso para Agente Comunitário de Saúde. A convocação dos aprovados sai em edital próprio.'),
      it('d5', 'Câmara Municipal Exemplo', 'RS', 2, 'edital de abertura', 'Concurso para Assistente Legislativo e Procurador. Prova objetiva e discursiva para o cargo de nível superior.', { vagas: 6, salario: 'R$ 6.200,00', inscricoes_ate: isoDias(-25) }),
      it('d6', 'Prefeitura Exemplo do Oeste', 'GO', 2, 'resultado', 'Divulgação do resultado preliminar da prova objetiva para Guarda Municipal. Prazo de recurso de dois dias úteis.'),
      it('d7', 'Prefeitura Exemplo das Águas', 'SC', 3, 'edital de abertura', 'Abertura de vagas para Guarda Municipal, com teste de aptidão física após a prova objetiva.', { vagas: 30, salario: 'R$ 3.100,00', inscricoes_ate: isoDias(-28) }),
      it('d8', 'Prefeitura Exemplo do Sul', 'RS', 3, 'processo seletivo', 'Processo seletivo para Professor substituto de Matemática e Língua Portuguesa, com cadastro reserva.', { vagas: 8 }),
      it('d9', 'Prefeitura Exemplo Central', 'SP', 4, 'retificação', 'Retificação do quadro de vagas: inclusão de vagas reservadas a pessoas com deficiência no cargo de Fiscal de Tributos.'),
      it('d10', 'Prefeitura Exemplo do Leste', 'PE', 4, 'edital de abertura', 'Concurso público para Fiscal de Tributos e Analista de Sistemas, com prova objetiva em fevereiro.', { vagas: 14, salario: 'R$ 5.400,00', inscricoes_ate: isoDias(-20) }),
      it('d11', 'Prefeitura Exemplo da Mata', 'PA', 5, 'homologação', 'Homologação do concurso para Assistente Social e Psicólogo.'),
      it('d12', 'Prefeitura Exemplo do Planalto', 'DF', 5, 'edital de abertura', 'Abertura de concurso para Agente de Trânsito, com prova objetiva e curso de formação.', { vagas: 20, salario: 'R$ 4.300,00', inscricoes_ate: isoDias(-26) })
    ];
  }

  function local() {
    const h = location.hostname;
    return location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '' || h.endsWith('.github.io');
  }

  async function buscarVivo() {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      const url = new URL('/api/editais', location.origin);
      url.searchParams.set('dias', '5'); url.searchParams.set('limite', '60');
      const r = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (!j || j.erro || !Array.isArray(j.itens) || !j.itens.length) throw new Error('sem itens');
      return j;
    } finally { clearTimeout(t); }
  }

  async function carregar(forcar) {
    if (!forcar && cache && Date.now() - cache.em < CACHE_MS) return cache.dados;
    if (pendente && !forcar) return pendente;
    pendente = (async () => {
      let dados;
      if (local()) dados = { modo: 'demo', motivo: 'local', atualizado_em: new Date().toISOString(), itens: demo() };
      else {
        try { const j = await buscarVivo(); dados = { modo: 'vivo', atualizado_em: j.atualizado_em, fonte: j.fonte, itens: j.itens }; }
        catch (e) { dados = { modo: 'demo', motivo: 'erro', atualizado_em: new Date().toISOString(), itens: demo() }; }
      }
      cache = { em: Date.now(), dados }; pendente = null;
      return dados;
    })();
    return pendente;
  }

  function haQuanto(isoStr) {
    const min = Math.max(0, Math.round((Date.now() - new Date(isoStr).getTime()) / 60000));
    return min < 1 ? 'agora' : min < 60 ? `há ${min} min` : `há ${Math.round(min / 60)} h`;
  }
  function quandoData(d) {
    const hoje = isoDias(0);
    if (d === hoje) return 'hoje';
    if (d === isoDias(1)) return 'ontem';
    const [y, m, dd] = String(d).split('-'); return `${dd}/${m}/${y}`;
  }
  const fmtData = (d) => { if (!d) return ''; const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };

  window.Editais = { carregar, haQuanto, quandoData, fmtData, demo };
})();
