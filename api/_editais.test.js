/* Teste local da função /api/editais com fetch simulado.
   Rodar: node api/_editais.test.js   (arquivos com "_" na frente não viram rota na Vercel) */
const assert = require('assert');
const handler = require('./editais.js');

const MOCK = {
  total_gazettes: 4,
  gazettes: [
    { territory_id: '3550308', territory_name: 'Cidade A', state_code: 'SP', date: '2026-10-18', url: 'https://exemplo.invalid/a.pdf', txt_url: 'https://exemplo.invalid/a.txt', edition: '100', is_extra_edition: false,
      excerpts: ['EDITAL DE ABERTURA Nº 01/2026 - CONCURSO PÚBLICO. A Prefeitura torna público a abertura de inscri-\nções para o concurso público destinado ao provimento de 45 (quarenta e cinco) vagas de Professor de Educação Básica, com vencimento de R$ 3.850,00. As inscrições ficarão abertas de 20/10/2026 até 19/11/2026, pelo site da Fundação Vunesp. Taxa de inscrição: R$ 85,00.'] },
    { territory_id: '4106902', territory_name: 'Cidade B', state_code: 'PR', date: '2026-10-17', url: 'https://exemplo.invalid/b.pdf', txt_url: 'https://exemplo.invalid/b.txt',
      excerpts: ['RETIFICAÇÃO DO EDITAL DE CONCURSO PÚBLICO Nº 03/2026. Fica retificado o item 4.1, passando o período de inscrições para até 5 de dezembro de 2026. Permanecem inalteradas as demais disposições.'] },
    { territory_id: '2927408', territory_name: 'Cidade C', state_code: 'BA', date: '2026-10-18', url: 'https://exemplo.invalid/c.pdf', txt_url: null,
      excerpts: ['HOMOLOGAÇÃO DO RESULTADO FINAL do Concurso Público nº 02/2025. O Prefeito Municipal homologa o resultado final dos candidatos aprovados para o cargo de Agente Comunitário de Saúde.'] },
    { territory_id: '3304557', territory_name: 'Cidade D', state_code: 'RJ', date: '2026-10-16', url: 'https://exemplo.invalid/d.pdf', txt_url: 'https://exemplo.invalid/d.txt',
      excerpts: ['PROCESSO SELETIVO SIMPLIFICADO para contratação temporária de 12 vagas de Técnico de Enfermagem. Remuneração mensal de R$ 2.400,00. Inscrições até 30/10/2026.'] },
    // duplicado do primeiro (deve ser removido)
    { territory_id: '3550308', territory_name: 'Cidade A', state_code: 'SP', date: '2026-10-18', url: 'https://exemplo.invalid/a.pdf', txt_url: 'https://exemplo.invalid/a.txt',
      excerpts: ['EDITAL DE ABERTURA Nº 01/2026 - CONCURSO PÚBLICO. A Prefeitura torna público a abertura de inscri-\nções para o concurso público destinado ao provimento de 45 (quarenta e cinco) vagas de Professor de Educação Básica, com vencimento de R$ 3.850,00. As inscrições ficarão abertas de 20/10/2026 até 19/11/2026, pelo site da Fundação Vunesp. Taxa de inscrição: R$ 85,00.'] }
  ]
};

function resFake() {
  const h = {};
  return { headers: h, statusCode: 0, body: '', setHeader(k, v) { h[k.toLowerCase()] = v; }, end(b) { this.body = b; } };
}

(async () => {
  let pedido = null;
  handler._fetch = async (url) => { pedido = url; return { ok: true, status: 200, json: async () => MOCK }; };
  const res = resFake();
  await handler({ url: '/api/editais?dias=99&limite=500', headers: { host: 'site.exemplo', origin: 'https://site.exemplo' } }, res);
  const j = JSON.parse(res.body);
  assert.strictEqual(res.statusCode, 200);
  assert.ok(/s-maxage=900/.test(res.headers['cache-control']));
  assert.strictEqual(res.headers['access-control-allow-origin'], 'https://site.exemplo');
  assert.ok(pedido.includes('size=60') && pedido.includes('sort_by=descending_date'), 'limites aplicados: ' + pedido);
  assert.strictEqual(j.itens.length, 4, 'duplicado removido');
  assert.deepStrictEqual(j.itens.map((i) => i.data), ['2026-10-18', '2026-10-18', '2026-10-17', '2026-10-16'], 'mais novo primeiro');
  const a = j.itens.find((i) => i.municipio === 'Cidade A');
  assert.strictEqual(a.orgao, 'Prefeitura de Cidade A');
  assert.strictEqual(a.tipo, 'edital de abertura');
  assert.strictEqual(a.vagas, 45);
  assert.strictEqual(a.salario, 'R$ 3.850,00');
  assert.strictEqual(a.inscricoes_ate, '2026-11-19');
  assert.strictEqual(a.banca, 'Vunesp');
  assert.ok(a.resumo.includes('inscrições') && !a.resumo.includes('\n'), 'hifenização e quebras limpas: ' + a.resumo);
  assert.deepStrictEqual(a.links, { diario: 'https://exemplo.invalid/a.pdf', texto: 'https://exemplo.invalid/a.txt' });
  const b = j.itens.find((i) => i.municipio === 'Cidade B');
  assert.strictEqual(b.tipo, 'retificação'); assert.strictEqual(b.inscricoes_ate, '2026-12-05'); assert.strictEqual(b.banca, null);
  const c = j.itens.find((i) => i.municipio === 'Cidade C');
  assert.strictEqual(c.tipo, 'homologação'); assert.strictEqual(c.links.texto, null);
  const d = j.itens.find((i) => i.municipio === 'Cidade D');
  assert.strictEqual(d.tipo, 'processo seletivo'); assert.strictEqual(d.vagas, 12); assert.strictEqual(d.salario, 'R$ 2.400,00'); assert.strictEqual(d.inscricoes_ate, '2026-10-30');

  // filtro por UF
  const r2 = resFake(); await handler({ url: '/api/editais?uf=sp', headers: {} }, r2);
  assert.deepStrictEqual(JSON.parse(r2.body).itens.map((i) => i.uf), ['SP']);

  // erro da fonte: 200 com erro:true
  handler._fetch = async () => { throw new Error('rede'); };
  const r3 = resFake(); await handler({ url: '/api/editais', headers: {} }, r3);
  const j3 = JSON.parse(r3.body);
  assert.strictEqual(r3.statusCode, 200); assert.strictEqual(j3.erro, true); assert.deepStrictEqual(j3.itens, []);
  console.log('ok: todos os testes passaram');
  console.log(JSON.stringify(a, null, 2));
})().catch((e) => { console.error('FALHOU:', e.message); process.exit(1); });
