/* Aprova Hub · função serverless (Vercel, Node, sem dependências)
   GET /api/editais?uf=SP&q=professor&dias=3&limite=30
   Busca publicações de concursos nos diários oficiais municipais do Querido Diário
   (Open Knowledge Brasil) e devolve itens resumidos com os links oficiais.
   Os resumos são automáticos: confira sempre o documento original. */

const API = 'https://api.queridodiario.ok.org.br/gazettes';
const TIMEOUT_MS = 8000;

const BANCAS = ['Cebraspe', 'Cespe', 'FGV', 'Fundação Getulio Vargas', 'Vunesp', 'FCC', 'Fundação Carlos Chagas', 'Cesgranrio', 'IBFC', 'Quadrix', 'Instituto AOCP', 'AOCP', 'Consulplan', 'Idecan', 'Ibade', 'Fundatec', 'Fundep', 'Objetiva', 'Instituto Access', 'Avança SP', 'Legalle', 'Iades', 'Fepese', 'Selecon', 'Fafipa', 'Igecs', 'Fundação La Salle', 'Instituto Mais', 'Ibam', 'Amauc', 'Unesc'];

const MESES = { janeiro: 1, fevereiro: 2, 'março': 3, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };

function limpar(txt) {
  return String(txt || '')
    .replace(/<[^>]+>/g, ' ')            // marcações de destaque
    .replace(/(\p{L})-\s*\n\s*(\p{L})/gu, '$1$2') // hifenização de fim de linha
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:])/g, '$1')
    .trim();
}

function tipoDe(t) {
  const s = t.toLowerCase();
  if (/retifica/.test(s)) return 'retificação';
  if (/homolog/.test(s)) return 'homologação';
  if (/processo seletivo|seletivo simplificado|contrata[çc][ãa]o tempor[áa]ria/.test(s)) return 'processo seletivo';
  if (/resultado|classifica[çc][ãa]o final|convoca[çc][ãa]o dos aprovados|aprovados/.test(s)) return 'resultado';
  if (/abertura|inscri[çc]/.test(s)) return 'edital de abertura';
  return 'edital de abertura';
}

function resumir(t, max = 320) {
  const frases = t.split(/(?<=[.;!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9])/).map((f) => f.trim()).filter((f) => f.length > 15);
  let out = '';
  for (const f of frases.length ? frases : [t]) {
    if (out && (out + ' ' + f).length > max) break;
    out = out ? out + ' ' + f : f;
    if (out.split(/[.;!?]\s/).length >= 3) break;
  }
  if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return out;
}

function vagasDe(t) {
  const m = t.match(/(\d{1,3}(?:\.\d{3})+|\d+)\s*(?:\([^)]{1,40}\)\s*)?vagas?\b/i) || t.match(/vagas?\s*[:\-]\s*(\d{1,3}(?:\.\d{3})+|\d+)/i);
  return m ? Number(m[1].replace(/\./g, '')) : null;
}

function salarioDe(t) {
  const vals = [...t.matchAll(/R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/g)]
    .map((m) => ({ txt: 'R$ ' + m[1], n: Number(m[1].replace(/\./g, '').replace(',', '.')) }))
    .filter((v) => v.n >= 300 && v.n <= 100000); // ignora taxa de inscrição baixa e números absurdos
  if (!vals.length) return null;
  return vals.sort((a, b) => b.n - a.n)[0].txt;
}

function dataIso(d, m, y) {
  const yy = y.length === 2 ? '20' + y : y;
  const dd = String(d).padStart(2, '0'), mm = String(m).padStart(2, '0');
  if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31) return null;
  return `${yy}-${mm}-${dd}`;
}

function inscricoesAte(t) {
  const s = t.toLowerCase();
  const i = s.search(/inscri[çc]/);
  if (i < 0) return null;
  const janela = s.slice(i, i + 220);
  const datas = [];
  for (const m of janela.matchAll(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/g)) datas.push({ pos: m.index, v: dataIso(m[1], m[2], m[3]) });
  for (const m of janela.matchAll(/(\d{1,2})º?\s+de\s+([a-zç]+)\s+de\s+(\d{4})/g)) if (MESES[m[2]]) datas.push({ pos: m.index, v: dataIso(m[1], MESES[m[2]], m[3]) });
  const validas = datas.filter((d) => d.v).sort((a, b) => a.pos - b.pos);
  if (!validas.length) return null;
  const ate = janela.indexOf('até');
  const depois = ate >= 0 ? validas.find((d) => d.pos > ate) : null;
  return (depois || validas[validas.length - 1]).v;
}

function bancaDe(t) {
  for (const b of BANCAS) {
    const re = new RegExp('(^|[^\\p{L}])' + b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^\\p{L}]|$)', 'iu');
    if (re.test(t)) return b;
  }
  return null;
}

function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

function normalizar(gazettes) {
  const vistos = new Set();
  const itens = [];
  for (const g of gazettes || []) {
    const excerpts = Array.isArray(g.excerpts) && g.excerpts.length ? g.excerpts : [''];
    for (const ex of excerpts) {
      const t = limpar(ex);
      if (!t) continue;
      const id = hash([g.territory_id, g.date, g.url, t.slice(0, 120)].join('|'));
      if (vistos.has(id)) continue;
      vistos.add(id);
      itens.push({
        id,
        orgao: g.territory_name ? `Prefeitura de ${g.territory_name}` : 'Órgão municipal',
        municipio: g.territory_name || null,
        uf: g.state_code || null,
        data: g.date || null,
        tipo: tipoDe(t),
        resumo: resumir(t),
        vagas: vagasDe(t),
        salario: salarioDe(t),
        inscricoes_ate: inscricoesAte(t),
        banca: bancaDe(t),
        links: { diario: g.url || null, texto: g.txt_url || null },
        fonte: 'Querido Diário'
      });
    }
  }
  return itens.sort((a, b) => String(b.data).localeCompare(String(a.data)));
}

function inteiro(v, padrao, min, max) { const n = parseInt(v, 10); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : padrao; }

function montarUrl({ q, dias, limite }) {
  const desde = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
  const p = new URLSearchParams({
    querystring: q ? `"concurso público" ${q}` : '"concurso público" edital',
    published_since: desde,
    size: String(limite),
    excerpt_size: '500',
    number_of_excerpts: '1',
    sort_by: 'descending_date'
  });
  return `${API}?${p.toString()}`;
}

async function buscar({ uf, q, dias, limite }, fetchImpl) {
  const f = fetchImpl || fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    // pede mais itens quando filtra por UF, porque o filtro é feito aqui
    const r = await f(montarUrl({ q, dias, limite: uf ? Math.min(100, limite * 3) : limite }), { signal: ctrl.signal, headers: { accept: 'application/json', 'user-agent': 'AprovaHub/1.0 (+https://gabriel-abreu-portfolio.vercel.app)' } });
    if (!r.ok) {
      const corpo = await r.text().catch(() => '');
      throw new Error('HTTP ' + r.status + ' ' + corpo.slice(0, 200));
    }
    const j = await r.json();
    let itens = normalizar(j && Array.isArray(j.gazettes) ? j.gazettes : []);
    if (uf) itens = itens.filter((i) => i.uf === uf);
    return { atualizado_em: new Date().toISOString(), fonte: 'Querido Diário (Open Knowledge Brasil)', total_fonte: j && j.total_gazettes, itens: itens.slice(0, limite) };
  } finally { clearTimeout(timer); }
}

async function handler(req, res) {
  const url = new URL(req.url, 'http://local');
  const uf = (url.searchParams.get('uf') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2) || null;
  const q = (url.searchParams.get('q') || '').replace(/["<>]/g, '').trim().slice(0, 60);
  const dias = inteiro(url.searchParams.get('dias'), 3, 1, 15);
  const limite = inteiro(url.searchParams.get('limite'), 30, 1, 60);

  // mesma origem: só devolve o cabeçalho para o próprio site
  const origem = req.headers && req.headers.origin;
  const host = req.headers && req.headers.host;
  if (origem && host && new URL(origem).host === host) res.setHeader('Access-Control-Allow-Origin', origem);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const dados = await buscar({ uf, q, dias, limite }, module.exports._fetch);
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=3600');
    res.statusCode = 200;
    res.end(JSON.stringify(dados));
  } catch (e) {
    console.error('editais: falha na fonte', e && (e.name + ': ' + e.message));
    res.setHeader('Cache-Control', 's-maxage=60');
    res.statusCode = 200;
    res.end(JSON.stringify({ erro: true, mensagem: 'Não foi possível consultar o Querido Diário agora.', detalhe: String((e && (e.name === 'AbortError' ? 'tempo esgotado' : e.message)) || '').slice(0, 240), atualizado_em: new Date().toISOString(), itens: [] }));
  }
}

module.exports = handler;
module.exports.normalizar = normalizar;
module.exports.montarUrl = montarUrl;
module.exports._util = { limpar, tipoDe, resumir, vagasDe, salarioDe, inscricoesAte, bancaDe };
module.exports._fetch = null; // usado só nos testes
