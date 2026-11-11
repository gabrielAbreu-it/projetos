/* ===== Motion do painel: entrada das telas em cascata, números contando, gráficos desenhando =====
   Só anima quando troco de aba (ou de sub-aba). Atualização de dados (refresh) não anima, para não piscar.
   Respeita "reduzir movimento" do sistema. Carrega por último. */
(function(){
  const reduz = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const semMotion = () => reduz?.matches;
  let proximo = 0;
  window.motionProximo = () => { proximo = Date.now(); };

  // envolve a navegação atual (já com as abas que outros scripts adicionaram)
  const irOriginal = window.ir;
  if(typeof irOriginal === 'function'){
    window.ir = function(t){ if(t !== TAB) window.motionProximo(); return irOriginal.apply(this, arguments); };
  }

  const fmtBRL = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  function contar(el){
    const alvo = parseFloat(el.dataset.cnt); if(!isFinite(alvo)) return;
    const ini = performance.now(), dur = 900;
    const passo = agora => {
      const k = Math.min(1, (agora-ini)/dur), e = 1 - Math.pow(1-k, 3);
      el.textContent = fmtBRL(alvo*e);
      if(k<1 && el.isConnected) requestAnimationFrame(passo); else el.textContent = fmtBRL(alvo);
    };
    requestAnimationFrame(passo);
  }
  function animar(view){
    if(semMotion()) return;
    // blocos de primeiro nível em cascata
    const blocos = [...view.querySelectorAll(':scope > *, :scope > .grid > *, :scope > .dash > *, :scope > .dash .stack > *, .f2-corpo > *, .f2-corpo > .grid > *, .f2-hero > *')]
      .filter((el,i,a)=>a.indexOf(el)===i && !el.matches('h2, script, style, form:empty'));
    blocos.slice(0, 40).forEach((el,i)=>{ el.classList.remove('mv-in'); el.style.setProperty('--mv-d', (Math.min(i,14)*45)+'ms'); void el.offsetWidth; el.classList.add('mv-in'); el.addEventListener('animationend', ev=>{ if(ev.target===el) el.classList.remove('mv-in'); }, {once:true}); });
    view.querySelectorAll('h2').forEach(h=>{ h.classList.remove('mv-h'); void h.offsetWidth; h.classList.add('mv-h'); });
    view.querySelectorAll('[data-cnt]').forEach(contar);
    // linhas dos gráficos se desenhando, barras subindo
    view.querySelectorAll('svg.f2g path.f2-line').forEach(p=>{ try{ const L = p.getTotalLength(); p.style.setProperty('--len', L); p.classList.add('mv-draw'); }catch(e){} });
    view.querySelectorAll('svg.f2g .f2-bg path, .f2-ht i, .prog i, .bars .bc i').forEach((b,i)=>{ b.classList.remove('mv-grow'); b.style.setProperty('--mv-d', Math.min(i,30)*18+'ms'); void b.getBoundingClientRect(); b.classList.add('mv-grow'); });
  }
  function observar(){
    const view = document.getElementById('view');
    if(!view) return false;
    new MutationObserver(()=>{
      if(!proximo || Date.now()-proximo > 4000) return;
      if(view.querySelector(':scope > .empty:only-child')) return;   // ainda "Carregando…"
      proximo = 0; animar(view);
    }).observe(view, {childList:true});
    return true;
  }
  // #view é recriado no login (renderShell); observa o #app para religar
  const app = document.getElementById('app');
  if(app) new MutationObserver(()=>{ const v = document.getElementById('view'); if(v && !v.dataset.mv){ v.dataset.mv='1'; observar(); window.motionProximo(); } }).observe(app, {childList:true});
  const v0 = document.getElementById('view'); if(v0 && !v0.dataset.mv){ v0.dataset.mv='1'; observar(); }

  // clique com "ondinha" nos botões
  document.addEventListener('pointerdown', e => {
    if(semMotion()) return;
    const b = e.target.closest?.('.btn, .subtabs button, .chips button'); if(!b) return;
    const r = b.getBoundingClientRect(), s = document.createElement('span');
    s.className = 'mv-ripple'; s.style.left = (e.clientX-r.left)+'px'; s.style.top = (e.clientY-r.top)+'px';
    if(getComputedStyle(b).position==='static') b.style.position='relative';
    b.appendChild(s); setTimeout(()=>s.remove(), 600);
  });
})();
