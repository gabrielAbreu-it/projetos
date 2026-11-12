/* ===== Guarda do painel: nenhuma aba quebra a tela, nada fica em loop, erro aparece uma vez e explicado =====
   Carrega depois de todos os módulos (antes do motion.js).
   - Se uma aba der erro ao montar, mostra um cartão com "Tentar de novo" em vez de ficar em "Carregando…" ou em branco.
   - Se uma aba demorar demais (rede caiu), avisa e oferece tentar de novo.
   - refresh() repetido em rajada vira um só (evita a tela piscando sem parar).
   - O mesmo aviso não aparece em sequência; erros conhecidos viram mensagens claras (ex.: IA sem chave configurada).
   - Erros soltos de JavaScript não derrubam o painel: ficam registrados e aparecem uma vez. */
(function(){
  const LIMITE_MS = 25000;
  let geracao = 0;

  /* ---------- avisos sem repetição e com mensagem clara ---------- */
  const toastBase = toast;
  const recentes = new Map();
  const traduz = m => {
    const s = String(m || '');
    if(/ANTHROPIC_API_KEY/i.test(s)) return 'IA desligada: falta o secret ANTHROPIC_API_KEY no Supabase (Edge Functions → Secrets). O resto do painel funciona normal.';
    if(/PLUGGY_CLIENT/i.test(s)) return 'Conexão com o banco: faltam as chaves da Pluggy no Supabase.';
    if(/Failed to fetch|NetworkError|Load failed|ERR_NETWORK|network request failed/i.test(s)) return 'Sem conexão com o servidor. Confira a internet; eu tento de novo quando você voltar para a aba.';
    if(/JWT expired|invalid JWT|not authenticated/i.test(s)) return 'Sessão expirada. Recarregue a página e entre de novo.';
    if(/non-2xx|FunctionsHttpError|Edge Function returned/i.test(s)) return s.replace(/Edge Function returned a non-2xx status code/i, 'a função respondeu com erro');
    return s;
  };
  toast = function(m){
    const t = traduz(m), agora = Date.now();
    if(recentes.has(t) && agora - recentes.get(t) < 8000) return;
    recentes.set(t, agora);
    if(recentes.size > 50) recentes.clear();
    return toastBase(t);
  };

  /* ---------- cartão de erro de aba ---------- */
  const nomeAba = t => (TABS.find(x=>x[0]===t)?.[2]) || t;
  function telaErro(t, e, demorou){
    const v = $('#view'); if(!v || TAB!==t) return;
    console.error('[guarda]', t, e);
    v.innerHTML = `<h2>${esc(nomeAba(t))}</h2><div class="card guarda-erro">
      <b>${demorou ? 'Isso está demorando mais que o normal.' : 'Esta aba encontrou um problema e eu parei antes de quebrar o resto.'}</b>
      <p class="sm mut" style="margin:6px 0 12px">${demorou ? 'Pode ser a internet ou o servidor lento. Os seus dados estão salvos.' : 'Os seus dados estão salvos. Detalhe técnico: <code>'+esc(String(e?.message || e || 'erro desconhecido').slice(0,180))+'</code>'}</p>
      <button class="btn" onclick="guardaTentar()">Tentar de novo</button> <button class="btn g" onclick="ir('hoje')">Ir para Hoje</button></div>`;
  }
  window.guardaTentar = () => { const v = $('#view'); if(v) v.innerHTML = '<p class="empty">Carregando…</p>'; protege(()=>refreshPrev()); };

  // roda uma montagem de tela com proteção: erro vira cartão, demora vira aviso
  function protege(fn){
    const g = ++geracao, t = TAB;
    let terminou = false;
    const relogio = setTimeout(()=>{ if(!terminou && g===geracao && TAB===t && $('#view')?.querySelector(':scope > .empty:only-child')) telaErro(t, null, true); }, LIMITE_MS);
    let p;
    try{ p = Promise.resolve(fn()); } catch(e){ p = Promise.reject(e); }
    return p.then(()=>{ terminou = true; }, e=>{ terminou = true; if(g===geracao) telaErro(TAB, e); }).finally(()=>clearTimeout(relogio));
  }

  /* ---------- navegação protegida (envolve a cadeia que os módulos já montaram) ---------- */
  const irPrev = ir, refreshPrev = refresh;
  ir = function(t){ return protege(()=>irPrev(t)); };

  /* ---------- refresh sem rajada ---------- */
  let rodando = null, pendente = false;
  refresh = function(){
    if(rodando){ pendente = true; return rodando; }    // já está atualizando: junta os pedidos num só
    rodando = protege(()=>refreshPrev()).finally(()=>{
      rodando = null;
      if(pendente){ pendente = false; setTimeout(refresh, 150); }
    });
    return rodando;
  };

  /* ---------- erros soltos ---------- */
  window.addEventListener('error', e => { console.error('[guarda] erro', e.error || e.message); if(e.message && !/ResizeObserver|Script error/i.test(e.message)) toast('Algo falhou nesta tela, mas o painel continua. Se repetir, me avise: '+e.message.slice(0,120)); });
  window.addEventListener('unhandledrejection', e => {
    const m = e.reason?.message || String(e.reason || ''); console.error('[guarda] promessa', e.reason);
    // a montagem da aba falhou sem avisar ninguém (a tela ficou parada em "Carregando…"): mostra o cartão com "Tentar de novo"
    if($('#view')?.querySelector(':scope > .empty:only-child')) telaErro(TAB, e.reason); else if(m) toast(m);
  });

  // voltou para a aba do navegador ou a internet voltou: atualiza uma vez
  let ultimoFoco = Date.now();
  const voltou = () => { if(Date.now() - ultimoFoco > 60000 && $('#view') && !document.activeElement?.matches?.('input,textarea,select')) refresh(); ultimoFoco = Date.now(); };
  document.addEventListener('visibilitychange', () => { if(document.visibilityState==='visible') voltou(); else ultimoFoco = Date.now(); });
  window.addEventListener('online', () => { toast('Conexão de volta'); refresh(); });

  const st = document.createElement('style');
  st.textContent = `.guarda-erro{border-left:3px solid var(--warn)}.guarda-erro b{display:block;font-size:15px}.guarda-erro code{font-family:var(--mono);font-size:11.5px;background:var(--card2);padding:1px 5px}`;
  document.head.appendChild(st);
})();
