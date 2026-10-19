/* Aprova Hub · alertas personalizados ("Para você").
   Usado no app e na página pública de editais. As preferências ficam no aparelho. */
(function () {
  const CHAVE_APP = 'aprova-hub:v1';
  const CHAVE_VISTOS = 'aprova-hub:alertas-vistos';
  const AREAS = [
    ['policia', 'Polícia', /pol[ií]cia|guarda|seguran[çc]a p[úu]blica|penitenci|tr[âa]nsito|bombeir|escriv/],
    ['bancos', 'Bancos', /banc[oá]|banc[aá]ri|financ|escritur[áa]ri/],
    ['tribunais', 'Tribunais', /tribunal|judici|\btrt\b|\btre\b|\btj\b|minist[ée]rio p[úu]blico|procurador/],
    ['saude', 'Saúde', /sa[úu]de|enferm|hospital|m[ée]dic|agente comunit|\bsus\b/],
    ['educacao', 'Educação', /professor|educa[çc]|escola|pedag|docente/],
    ['administrativo', 'Administrativo', /administrativ|assistente|auxiliar|secret[áa]ri|legislativ/],
    ['fiscal', 'Fiscal', /fiscal|tribut|fazenda|auditor|receita/]
  ];
  const NIVEL = { fundamental: 1, medio: 2, superior: 3 };
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  function prefs() {
    try { const s = JSON.parse(localStorage.getItem(CHAVE_APP) || 'null'); return (s && s.alertas) || null; } catch (e) { return null; }
  }

  function nivelDe(item) {
    if (item.escolaridade) return NIVEL[norm(item.escolaridade).replace('é', 'e')] || null;
    const t = norm(item.texto);
    if (/nivel superior|ensino superior|graduacao/.test(t)) return 3;
    if (/nivel medio|ensino medio|tecnico/.test(t)) return 2;
    if (/nivel fundamental|ensino fundamental/.test(t)) return 1;
    return null;
  }
  const salarioNum = (s) => (typeof s === 'number' ? s : s ? Number(String(s).replace(/[^\d,]/g, '').replace(',', '.')) || null : null);

  /* item: { id, texto, uf, salario, escolaridade?, area? } */
  function combina(item, p) {
    if (!p) return false;
    const t = norm(item.texto);
    const temInteresse = (p.areas && p.areas.length) || (p.palavras && p.palavras.length);
    if (temInteresse) {
      const porArea = (p.areas || []).some((a) => item.area === a || (AREAS.find((x) => x[0] === a) || [, , /$^/])[2].test(t));
      const porPalavra = (p.palavras || []).some((w) => t.includes(norm(w)));
      if (!porArea && !porPalavra) return false;
    }
    if (p.ufs && p.ufs.length && item.uf && item.uf !== 'BR' && !p.ufs.includes(item.uf)) return false;
    if (p.escolaridade) { const n = nivelDe(item); if (n && n > NIVEL[p.escolaridade]) return false; }
    if (p.salarioMin) { const v = salarioNum(item.salario); if (v && v < p.salarioMin) return false; }
    return true;
  }

  function vistos() { try { return new Set(JSON.parse(localStorage.getItem(CHAVE_VISTOS) || '[]')); } catch (e) { return new Set(); } }
  function novos(itens, p) { const v = vistos(); return itens.filter((i) => combina(i, p) && !v.has(i.id)); }
  function marcarVistos(itens) {
    const v = vistos(); itens.forEach((i) => v.add(i.id));
    try { localStorage.setItem(CHAVE_VISTOS, JSON.stringify([...v].slice(-500))); } catch (e) { /* nada */ }
  }

  window.AHAlertas = { AREAS, prefs, combina, novos, marcarVistos };
})();
