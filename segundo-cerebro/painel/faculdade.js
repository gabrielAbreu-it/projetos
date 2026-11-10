/* ================= FACULDADE (aba completa) =================
   Carregar depois do app.js. Substitui o vFac antigo; o card da aba Hoje (linhaFac) continua igual.
   Usa: sb, q, esc, $, toast, fmtDH, refresh, modal, TAB. */
const FAC_ST = [['pendente','Pendente'],['estudando','Estudando'],['em_producao','Em produção'],['revisao','Revisão'],['entregue','Entregue']];
const FAC_STL = Object.fromEntries(FAC_ST);
const FAC = {disc:'todas', status:'abertos', aberto:null, ocupado:false, rascunho:{}};
try{ Object.assign(FAC, JSON.parse(localStorage.getItem('sc_fac')||'{}'), {aberto:null, ocupado:false}); }catch(e){}
const facSalva = () => { try{ localStorage.setItem('sc_fac', JSON.stringify({disc:FAC.disc, status:FAC.status})); }catch(e){} };

const H72 = 72*36e5;
function facPrazo(i){
  if(!i.prazo) return {cls:'', txt:'sem prazo'};
  const falta = new Date(i.prazo) - Date.now();
  if(i.status==='entregue') return {cls:'', txt:'prazo '+fmtDH(i.prazo)};
  if(falta < 0) return {cls:'atr', txt:'atrasado · '+fmtDH(i.prazo)};
  if(falta < H72){ const h=Math.floor(falta/36e5); return {cls:'urg', txt:(h<24?`faltam ${h}h`:`faltam ${Math.floor(h/24)}d ${h%24}h`)+' · '+fmtDH(i.prazo)}; }
  return {cls:'', txt:'prazo '+fmtDH(i.prazo)};
}
const facProx = s => FAC_ST[Math.min(FAC_ST.findIndex(x=>x[0]===s)+1, FAC_ST.length-1)][0];

// Markdown mínimo e seguro (escapa tudo antes de formatar).
function facMd(src){
  const blocos = String(src||'').split(/```/);
  return blocos.map((b,k)=>{
    if(k%2) return `<pre class="fac-code"><code>${esc(b.replace(/^[a-z0-9+-]*\n/i,''))}</code></pre>`;
    const inl = s => esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[\s(])\*([^*\n]+)\*/g,'$1<i>$2</i>');
    let out='', lista=null;
    const fecha = () => { if(lista){ out+=`</${lista}>`; lista=null; } };
    for(const l of b.split('\n')){
      let m;
      if((m=l.match(/^#{1,6}\s+(.*)/))){ fecha(); out+=`<h4>${inl(m[1])}</h4>`; }
      else if((m=l.match(/^\s*[-*]\s+\[( |x)\]\s+(.*)/i))){ if(lista!=='ul'){ fecha(); out+='<ul class="fac-ck">'; lista='ul'; } out+=`<li>${m[1].trim()?'☑':'☐'} ${inl(m[2])}</li>`; }
      else if((m=l.match(/^\s*[-*]\s+(.*)/))){ if(lista!=='ul'){ fecha(); out+='<ul>'; lista='ul'; } out+=`<li>${inl(m[1])}</li>`; }
      else if((m=l.match(/^\s*\d+[.)]\s+(.*)/))){ if(lista!=='ol'){ fecha(); out+='<ol>'; lista='ol'; } out+=`<li>${inl(m[1])}</li>`; }
      else if(!l.trim()){ fecha(); }
      else { fecha(); out+=`<p>${inl(l)}</p>`; }
    }
    fecha(); return out;
  }).join('');
}
// Seção "## Checklist" do resumo_ia vira lista marcável (estado salvo no navegador, por item).
function facChecklist(resumo){
  const m = String(resumo||'').match(/#+\s*checklist[^\n]*\n([\s\S]*?)(\n#+\s|$)/i);
  if(!m) return [];
  return m[1].split('\n').map(l=>l.match(/^\s*[-*]\s+(?:\[[ x]\]\s+)?(.*\S)/i)?.[1]).filter(Boolean);
}
const facCkKey = id => 'sc_fac_ck_'+id;
function facCkLer(id){ try{ return JSON.parse(localStorage.getItem(facCkKey(id))||'{}'); }catch(e){ return {}; } }
function facCk(id, n){ const o=facCkLer(id); o[n]=!o[n]; try{ localStorage.setItem(facCkKey(id), JSON.stringify(o)); }catch(e){} refresh(); }

async function facStatus(id, status, ev){
  if(ev) ev.stopPropagation();
  const o = {status, lido:true, concluido: status==='entregue', atualizado_em:new Date().toISOString()};
  if(await q(sb.from('faculdade_itens').update(o).eq('id',id))!==null){ toast(FAC_STL[status]); refresh(); }
}
function facAbrir(id){ FAC.aberto=id; window.scrollTo(0,0); refresh(); }
function facVoltar(){ FAC.aberto=null; refresh(); }

function facSincronizar(ult){
  const s = ult ? `<p class="sm ${ult.status==='erro'?'bad':''}"><b>Última execução:</b> ${fmtDH(ult.executado_em)} · ${ult.status==='ok'?'ok':'ERRO'} · ${ult.itens_novos||0} novos<br><span class="mut">${esc(ult.mensagem||'')}</span></p>` : '<p class="sm mut">O sync ainda não rodou.</p>';
  modal('Sincronizar com o Espaço Aluno', `${s}
    <div class="help">O portal exige o meu login, então a varredura roda no meu computador, não no servidor. No terminal:</div>
    <pre class="fac-code"><code>cd segundo-cerebro
python scripts/faculdade_sync.py</code></pre>
    <div class="help">Abre o navegador, eu faço o login e o script varre sozinho: disciplinas, atividades, avisos, anexos, prioridade e resumo da IA dos itens novos. Depois é só atualizar esta aba.</div>`,
    async()=>{ refresh(); }, '', 'Atualizar aba');
}

async function vFac(){
  if(FAC.aberto) return vFacItem(FAC.aberto);
  const [itens, sync] = await Promise.all([
    q(sb.from('faculdade_itens').select('id,tipo,disciplina,titulo,descricao,prazo,peso,nota,status,prioridade,lido,url').order('prioridade',{ascending:true,nullsFirst:false}).order('prazo',{ascending:true,nullsFirst:false}).limit(500)),
    q(sb.from('faculdade_sync').select('*').order('executado_em',{ascending:false}).limit(1))
  ]);
  if(TAB!=='faculdade' || FAC.aberto) return;
  const T = Array.isArray(itens)?itens:[], ult = sync?.[0];
  const agora = Date.now(), sete = agora+7*864e5;
  const abertos = T.filter(i=>i.status!=='entregue');
  const prox7 = abertos.filter(i=>i.prazo && +new Date(i.prazo)>=agora && +new Date(i.prazo)<=sete);
  const atras = abertos.filter(i=>i.prazo && +new Date(i.prazo)<agora && i.tipo!=='aviso');
  const discs = [...new Set(T.map(i=>i.disciplina).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
  if(FAC.disc!=='todas' && !discs.includes(FAC.disc)) FAC.disc='todas';
  let L = T;
  if(FAC.disc!=='todas') L = L.filter(i=>i.disciplina===FAC.disc);
  if(FAC.status==='abertos') L = L.filter(i=>i.status!=='entregue');
  else if(FAC.status!=='tudo') L = L.filter(i=>i.status===FAC.status);
  window._facUlt = ult;

  $('#view').innerHTML = `<h2>Faculdade · UniCEUB</h2>
  <div class="grid g4 m2 fac-kpis">
    <div class="card kpi"><span>Próximos 7 dias</span><b class="big">${prox7.length}</b></div>
    <div class="card kpi"><span>Atrasados</span><b class="big ${atras.length?'bad':''}">${atras.length}</b></div>
    <div class="card kpi"><span>Em aberto</span><b class="big">${abertos.length}</b></div>
    <div class="card kpi"><span>Último sync</span><b class="mid ${ult?.status==='erro'?'bad':''}">${ult?fmtDH(ult.executado_em):'nunca'}</b>
      <button class="btn g s" style="margin-top:6px;width:fit-content" onclick="facSincronizar(window._facUlt)">Sincronizar</button></div>
  </div>
  <div class="fac-filtros">
    <div class="chips">${[['abertos','Em aberto'],...FAC_ST,['tudo','Tudo']].map(([k,l])=>`<button class="${FAC.status===k?'on':''}" onclick="FAC.status='${k}';facSalva();refresh()">${l}</button>`).join('')}</div>
    <select onchange="FAC.disc=this.value;facSalva();refresh()" aria-label="Disciplina"><option value="todas">Todas as disciplinas</option>${discs.map(d=>`<option ${FAC.disc===d?'selected':''}>${esc(d)}</option>`).join('')}</select>
  </div>
  <div class="card">${L.map(facLinha).join('') || `<p class="empty">${T.length?'Nada com esses filtros.':'Nenhum item ainda. Rode o sync (botão Sincronizar).'}</p>`}</div>`;
}

function facLinha(i){
  const p = facPrazo(i), prox = facProx(i.status);
  return `<div class="row fac-row ${p.cls?'fac-'+p.cls:''}" onclick="facAbrir('${i.id}')">
    <span class="fac-pri mono" title="Prioridade">${i.prioridade??'–'}</span>
    <div class="grow"><span class="tag">${esc(i.tipo)}</span>${!i.lido?'<span class="tag" style="color:var(--acc2)">novo</span>':''}${p.cls==='atr'?'<span class="tag atrasada">atrasado</span>':p.cls==='urg'?'<span class="tag media">&lt; 72h</span>':''}<b class="sm">${esc(i.titulo)}</b>
      <div class="mut xs">${esc(i.disciplina||'')} · <span class="${p.cls==='atr'?'bad':p.cls==='urg'?'warn':''}">${p.txt}</span>${i.peso!=null?` · peso ${i.peso}`:''}${i.nota!=null?` · nota ${i.nota}`:''}</div></div>
    <div class="acts" style="min-width:auto;align-items:flex-end">
      <span class="fac-st fac-st-${i.status}">${FAC_STL[i.status]||i.status}</span>
      ${i.status!=='entregue'?`<button class="btn g s" onclick="facStatus('${i.id}','${prox}',event)" title="Avançar status">→ ${FAC_STL[prox]}</button>`:''}
    </div></div>`;
}

async function vFacItem(id){
  const [it, chat] = await Promise.all([
    q(sb.from('faculdade_itens').select('*').eq('id',id).maybeSingle()),
    q(sb.from('faculdade_chat').select('*').eq('item_id',id).order('criado_em',{ascending:true}))
  ]);
  if(TAB!=='faculdade' || FAC.aberto!==id) return;
  if(!it || it===true){ FAC.aberto=null; return vFac(); }
  if(!it.lido) sb.from('faculdade_itens').update({lido:true}).eq('id',id).then(()=>{});
  const C = Array.isArray(chat)?chat:[], p = facPrazo(it), ck = facChecklist(it.resumo_ia), feitos = facCkLer(id);
  const mats = Array.isArray(it.materiais)?it.materiais:[];
  const url = /^https?:\/\//.test(it.url||'') ? it.url : '';
  const ta = $('#fac-msg'), rs = $('#fac-rasc');   // preserva o que estava digitado num refresh
  const msgAtual = ta && ta.dataset.item===id ? ta.value : '';
  if(rs && rs.dataset.item===id) FAC.rascunho[id] = rs.value;

  $('#view').innerHTML = `<button class="btn link" onclick="facVoltar()">← todas as atividades</button>
  <h2 style="margin-top:8px">${esc(it.titulo)}</h2>
  <p class="sm mut" style="margin:-6px 0 10px">${esc(it.disciplina||'')} · <span class="tag">${esc(it.tipo)}</span> <span class="${p.cls==='atr'?'bad':p.cls==='urg'?'warn':''}">${p.txt}</span>${it.peso!=null?` · peso ${it.peso}`:''}${it.nota!=null?` · nota ${it.nota}`:''}${it.prioridade?` · prioridade ${it.prioridade}`:''}${url?` · <a href="${esc(url)}" target="_blank" rel="noopener">abrir no portal</a>`:''}</p>
  <div class="subtabs fac-steps">${FAC_ST.map(([k,l])=>`<button class="${it.status===k?'on':''}" onclick="facStatus('${id}','${k}')">${l}</button>`).join('')}</div>
  <div class="dash">
    <div class="s7 stack">
      <div class="card"><h3>Enunciado</h3><div class="sm pre fac-texto">${esc(it.enunciado||it.descricao||'Sem enunciado no portal.')}</div></div>
      <div class="card"><h3>Resumo da IA <button class="btn link" id="fac-resumir" onclick="facResumir('${id}')">${it.resumo_ia?'refazer':'gerar'}</button></h3>
        ${it.resumo_ia?`<div class="fac-md sm">${facMd(it.resumo_ia.replace(/#+\s*checklist[\s\S]*?(?=\n#+\s|$)/i,''))}</div>`:'<p class="empty">Ainda não gerado. O sync gera para itens novos; dá para gerar aqui também.</p>'}</div>
      <div class="card"><h3>Checklist de critérios <span class="mono xs mut">${ck.filter((_,n)=>feitos[n]).length}/${ck.length}</span></h3>
        ${ck.length?ck.map((c,n)=>`<div class="row" style="padding:7px 0"><button class="chk ${feitos[n]?'on':''}" onclick="facCk('${id}',${n})">${feitos[n]?'✓':''}</button><div class="grow sm ${feitos[n]?'mut':''}">${esc(c)}</div></div>`).join(''):'<p class="empty">Sai do resumo da IA (seção Checklist).</p>'}</div>
      <div class="card"><h3>Materiais <span class="mono xs mut">${mats.length}</span></h3>
        ${mats.map(m=>`<div class="row"><div class="grow"><b class="sm">${esc(m.nome||m.arquivo||'arquivo')}</b><div class="mut xs">${esc(m.arquivo||'')}${/^https?:\/\//.test(m.url||'')?` · <a href="${esc(m.url)}" target="_blank" rel="noopener">link</a>`:''}</div>
          ${m.texto?`<details><summary>texto extraído (${m.texto.length.toLocaleString('pt-BR')} caracteres)</summary><p class="xs pre fac-texto">${esc(m.texto.slice(0,20000))}${m.texto.length>20000?'\n…':''}</p></details>`:''}</div></div>`).join('') || '<p class="empty">Sem anexos.</p>'}</div>
    </div>
    <div class="s5 stack fac-lado">
      <div class="card fac-chat"><h3>Tutor <span class="mono xs mut">${C.length} msgs</span></h3>
        <div class="fac-msgs" id="fac-msgs">${C.map(m=>`<div class="fac-m ${m.papel}"><div class="fac-md sm">${m.papel==='assistant'?facMd(m.conteudo):`<p class="pre">${esc(m.conteudo.length>1500?m.conteudo.slice(0,1500)+'…':m.conteudo)}</p>`}</div><span class="xs mut mono">${fmtDH(m.criado_em)}</span></div>`).join('') || '<p class="empty">Pergunte sobre o conteúdo, peça um exemplo parecido, um esqueleto do trabalho ou ajuda para depurar seu código.</p>'}
          ${FAC.ocupado?'<div class="fac-m assistant"><p class="sm mut">pensando…</p></div>':''}</div>
        <form class="f" onsubmit="facEnviar(event,'${id}')">
          <textarea id="fac-msg" data-item="${id}" rows="3" placeholder="Pergunte ao tutor…" onkeydown="if(event.key==='Enter'&&(event.ctrlKey||event.metaKey))this.form.requestSubmit()">${esc(msgAtual)}</textarea>
          <button class="btn" ${FAC.ocupado?'disabled':''}>Enviar</button>
        </form></div>
      <div class="card"><h3>Meu rascunho</h3>
        <textarea id="fac-rasc" data-item="${id}" rows="8" placeholder="Cole aqui o que você escreveu (texto ou código) e peça a revisão.">${esc(FAC.rascunho[id]||'')}</textarea>
        <button class="btn g" style="margin-top:8px" ${FAC.ocupado?'disabled':''} onclick="facRevisar('${id}')">Revisar</button>
        <p class="xs mut" style="margin-top:6px">O tutor aponta erros e melhorias e checa critérios e ABNT. Ele não escreve a entrega por você.</p></div>
    </div>
  </div>`;
  const box = $('#fac-msgs'); if(box) box.scrollTop = box.scrollHeight;
}

async function facTutor(corpo){
  FAC.ocupado = true; refresh();
  try{
    const {data, error} = await sb.functions.invoke('faculdade-tutor', {body:corpo});
    if(error){
      let msg = error.message;
      try{ const j = await error.context?.json?.(); if(j?.erro) msg = j.erro; }catch(e){}
      toast('Tutor: '+msg); return null;
    }
    return data;
  } finally { FAC.ocupado = false; refresh(); }
}
async function facEnviar(e, id){
  e.preventDefault();
  const ta = $('#fac-msg'), msg = ta.value.trim();
  if(!msg || FAC.ocupado) return;
  ta.value = '';
  const r = await facTutor({acao:'chat', item_id:id, mensagem:msg});
  if(!r){ const t=$('#fac-msg'); if(t && !t.value) t.value = msg; }
}
async function facRevisar(id){
  const rs = $('#fac-rasc'), txt = rs.value.trim();
  if(!txt){ toast('Cole o rascunho primeiro.'); return; }
  FAC.rascunho[id] = rs.value;
  const extra = $('#fac-msg')?.value.trim() || '';
  const r = await facTutor({acao:'revisar', item_id:id, rascunho:txt, mensagem:extra});
  if(r && extra){ const t=$('#fac-msg'); if(t) t.value=''; }
}
async function facResumir(id){
  const b = $('#fac-resumir'); if(b){ b.disabled = true; b.textContent = 'gerando…'; }
  const r = await facTutor({acao:'resumir', item_id:id});
  if(r) toast('Resumo atualizado');
}
// se o painel já abriu direto nesta aba antes deste arquivo carregar, redesenha com a versão nova
if(TAB==='faculdade' && document.querySelector('#view')) refresh();
