/* ================= AGENTE DE PROSPECÇÃO =================
   Carregar depois do app.js (e dos outros módulos). Acrescenta a aba "Agente" sem mexer nas outras.
   Fluxo: busca no Maps → analisa site/redes/decisor → gera mockup → escreve abordagem → eu aprovo → envio.
   Nenhuma mensagem sai sem aprovação (regra mensagem_externa do cb_config). */
(function(){
  const ICO = '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/>';
  if(!TABS.some(t=>t[0]==='agente')) TABS.splice(Math.max(0, TABS.findIndex(t=>t[0]==='straton')), 0, ['agente', ICO, 'Agente']);
  const irOrig = ir;
  ir = function(t){
    if(t!=='agente') return irOrig(t);
    const trocou = TAB!=='agente' || !$('#view').innerHTML;
    TAB='agente'; try{ localStorage.setItem('sc_tab','agente'); }catch(e){}
    document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on', b.dataset.t==='agente'));
    if(trocou){ $('#view').innerHTML = '<p class="empty">Carregando…</p>'; window.scrollTo(0,0); }
    return vAgente();
  };
  const refreshOrig = refresh;
  refresh = function(){ if(TAB==='agente'){ const y=window.scrollY; return Promise.resolve(vAgente()).then(()=>window.scrollTo(0,y)); } return refreshOrig(); };
  // o menu já foi desenhado antes deste arquivo? redesenha o shell para a aba aparecer
  if(document.querySelector('nav') && !document.querySelector('nav button[data-t="agente"]')) renderShell();
})();

const AGT_ST = [['novo','Novo'],['abordado','Abordado'],['respondeu','Respondeu'],['negociando','Negociando'],['reuniao','Reunião'],['fechado','Fechado'],['perdido','Perdido']];
const AGT_STL = Object.fromEntries(AGT_ST);
const AGT = {filtro:'abertos', aberto:null, ocupado:{}, fila:false, log:[]};
const agtTel = t => String(t||'').replace(/\D/g,'');
const agtEtapa = l => l.status!=='novo' ? AGT_STL[l.status] : l.mensagem ? 'Abordagem pronta' : l.mockup_html ? 'Mockup pronto' : l.analise ? 'Analisado' : 'Encontrado';

async function agtChamar(corpo, rotulo){
  const {data, error} = await sb.functions.invoke('prospector', {body:corpo});
  if(error){
    let msg = error.message;
    try{ const j = await error.context?.json?.(); if(j?.erro) msg = j.erro; }catch(e){}
    toast((rotulo?rotulo+': ':'')+msg); return null;
  }
  return data;
}
async function agtBuscar(e){
  e.preventDefault();
  const f = e.target, termo = f.termo.value.trim(), localizacao = f.local.value.trim(), max = +f.max.value||20;
  try{ localStorage.setItem('sc_ag_busca', JSON.stringify({termo, localizacao, max})); }catch(_){}
  const b = f.querySelector('button'); b.disabled = true; b.textContent = 'Buscando no Maps…';
  const r = await agtChamar({acao:'buscar', termo, localizacao, max}, 'Busca');
  b.disabled = false; b.textContent = 'Buscar no Maps';
  if(r){ toast(`${r.total} lojas encontradas · ${r.novos} novas`); refresh(); }
}
async function agtPasso(id, acao){
  if(AGT.ocupado[id]) return;
  AGT.ocupado[id] = acao; refresh();
  const nomes = {analisar:'Análise', mockup:'Mockup', abordagem:'Abordagem'};
  const r = await agtChamar({acao, lead_id:id}, nomes[acao]);
  delete AGT.ocupado[id]; refresh();
  return r;
}
async function agtRodarTudo(id){
  for(const acao of ['analisar','mockup','abordagem']){
    const l = (window._agLeads||[]).find(x=>x.id===id);
    if(acao==='analisar' && l?.analise) continue;
    if(acao==='mockup' && l?.mockup_html) continue;
    const r = await agtPasso(id, acao); if(!r) return false;
    await vAgente(true);
  }
  return true;
}
async function agtLote(){
  if(AGT.fila) { AGT.fila=false; toast('Parando depois do lead atual…'); return; }
  const n = +($('#ag-lote')?.value)||5;
  const alvo = (window._agLeads||[]).filter(l=>l.status==='novo' && !l.mensagem).sort((a,b)=>(!!b.analise-!!a.analise)||(!a.site-!b.site)).slice(0,n);
  if(!alvo.length){ toast('Nenhum lead novo sem abordagem.'); return; }
  AGT.fila = true; refresh();
  for(const l of alvo){ if(!AGT.fila) break; await agtRodarTudo(l.id); }
  AGT.fila = false; refresh(); toast('Lote terminado. As abordagens estão esperando sua aprovação.');
}
async function agtStatus(id, status){
  const o = {status, atualizado_em:new Date().toISOString()};
  if(await q(sb.from('cb_leads').update(o).eq('id',id))!==null) refresh();
}
async function agtAprovar(id, canal){
  const l = (window._agLeads||[]).find(x=>x.id===id); if(!l) return;
  const m = {...(l.mensagem||{})};
  const ta = $('#ag-msg-'+canal); if(ta) m[canal==='email'?'email_corpo':'whatsapp'] = ta.value;
  const as = $('#ag-assunto'); if(as) m.email_assunto = as.value;
  let url = '';
  if(canal==='whatsapp'){ const tel = agtTel(l.telefone); if(!tel){ toast('Lead sem telefone.'); return; } url = `https://wa.me/${tel}?text=${encodeURIComponent(m.whatsapp||'')}`; }
  else { if(!l.email){ toast('Lead sem e-mail. Copie a mensagem e use outro canal.'); return; } url = `mailto:${encodeURIComponent(l.email)}?subject=${encodeURIComponent(m.email_assunto||'')}&body=${encodeURIComponent(m.email_corpo||'')}`; }
  const agora = new Date().toISOString();
  await q(sb.from('cb_aprovacoes').update({status:'aprovado', resposta:'aprovado no painel ('+canal+')', decidido_em:agora}).eq('tipo','mensagem_externa').eq('status','pendente').contains('pedido',{lead_id:id}));
  await q(sb.from('cb_leads').update({mensagem:m, status:'abordado', contatado_em:agora, proxima_acao:'aguardar resposta (retomar em 3 dias)', atualizado_em:agora}).eq('id',id));
  window.open(url, '_blank', 'noopener');
  toast('Aprovado. Envie na janela que abriu.'); refresh();
}
async function agtRejeitar(id){
  await q(sb.from('cb_aprovacoes').update({status:'rejeitado', resposta:'rejeitado no painel', decidido_em:new Date().toISOString()}).eq('tipo','mensagem_externa').eq('status','pendente').contains('pedido',{lead_id:id}));
  await q(sb.from('cb_leads').update({mensagem:null, proxima_acao:null}).eq('id',id)); refresh();
}
function agtCopiar(sel){ const t=$(sel); if(!t) return; navigator.clipboard?.writeText(t.value).then(()=>toast('Copiado'),()=>{ t.select(); document.execCommand('copy'); toast('Copiado'); }); }
function agtReuniao(id){
  const l = (window._agLeads||[]).find(x=>x.id===id); if(!l) return;
  modal('Marcar reunião', `<label>Quando<input name="inicio" type="datetime-local" required></label><label>Duração (min)<input name="dur" type="number" value="30" min="10"></label><label>Observação<input name="obs" placeholder="ex.: chamada de vídeo, levar proposta"></label>`, async o=>{
    const ini = new Date(o.inicio), fim = new Date(ini.getTime()+(+o.dur||30)*6e4);
    if(await q(sb.from('agenda_eventos').insert({titulo:`Reunião · ${l.nome}`, inicio:ini.toISOString(), fim:fim.toISOString(), contexto:'pessoal', origem:'manual', notas:[o.obs, l.telefone, l.mensagem?.link_mockup].filter(Boolean).join(' · ')}))===null) return false;
    await q(sb.from('cb_leads').update({status:'reuniao', reuniao_em:ini.toISOString(), proxima_acao:'reunião marcada', atualizado_em:new Date().toISOString()}).eq('id',id));
    toast('Reunião na agenda'); refresh();
  }, '', 'Marcar');
}

async function vAgente(silencioso){
  const [leads, aprov] = await Promise.all([
    q(sb.from('cb_leads').select('id,nome,nicho,telefone,endereco,site,maps_url,avaliacao,total_avaliacoes,email,redes,decisor,analise,status,proxima_acao,mensagem,mockup_token,contatado_em,reuniao_em,atualizado_em,criado_em,mockup_html').eq('origem','maps').order('criado_em',{ascending:false}).limit(500)),
    q(sb.from('cb_aprovacoes').select('id,pedido,status').eq('tipo','mensagem_externa').eq('status','pendente'))
  ]);
  if(TAB!=='agente') return;
  const L = Array.isArray(leads)?leads:[]; window._agLeads = L;
  const pend = new Set((Array.isArray(aprov)?aprov:[]).map(a=>a.pedido?.lead_id));
  if(AGT.aberto) return agtDetalhe(L.find(l=>l.id===AGT.aberto), pend);
  let V = L;
  if(AGT.filtro==='abertos') V = L.filter(l=>!['fechado','perdido'].includes(l.status));
  else if(AGT.filtro==='aprovar') V = L.filter(l=>pend.has(l.id));
  else if(AGT.filtro!=='todos') V = L.filter(l=>l.status===AGT.filtro);
  let busca = {termo:'', localizacao:'Brasília, DF', max:20}; try{ Object.assign(busca, JSON.parse(localStorage.getItem('sc_ag_busca')||'{}')); }catch(e){}
  const c = s => L.filter(s).length;
  $('#view').innerHTML = `<h2>Agente · Prospecção</h2>
  <div class="grid g4 m2" style="margin-bottom:14px">
    <div class="card kpi"><span>Leads</span><b class="big">${L.length}</b></div>
    <div class="card kpi"><span>Para aprovar</span><b class="big ${pend.size?'warn':''}">${pend.size}</b></div>
    <div class="card kpi"><span>Abordados</span><b class="big">${c(l=>l.status!=='novo')}</b></div>
    <div class="card kpi"><span>Reuniões</span><b class="big ${c(l=>l.status==='reuniao')?'ok':''}">${c(l=>l.status==='reuniao'||l.reuniao_em)}</b></div>
  </div>
  <div class="dash" style="margin-bottom:14px">
    <div class="card s7"><h3>Buscar lojas no Maps</h3>
      <form class="f" onsubmit="agtBuscar(event)" style="grid-template-columns:2fr 2fr 1fr auto;align-items:end">
        <label>Nicho<input name="termo" required placeholder="ex.: barbearia, pet shop, clínica odontológica" value="${esc(busca.termo)}"></label>
        <label>Cidade / bairro<input name="local" required value="${esc(busca.localizacao)}"></label>
        <label>Qtd.<input name="max" type="number" min="1" max="60" value="${+busca.max||20}"></label>
        <button class="btn">Buscar no Maps</button>
      </form></div>
    <div class="card s5"><h3>Rodar o agente</h3>
      <p class="sm mut">Para cada lead novo: lê o site e as redes, procura o dono/gerente, gera o mockup e escreve a abordagem. Tudo fica esperando sua aprovação.</p>
      <div style="display:flex;gap:8px;margin-top:10px;align-items:center"><input id="ag-lote" type="number" min="1" max="20" value="5" style="width:80px" aria-label="Quantidade">
        <button class="btn ${AGT.fila?'d':''}" onclick="agtLote()">${AGT.fila?'Parar':'Rodar em lote'}</button></div></div>
  </div>
  <div class="chips">${[['abertos','Em aberto'],['aprovar','Para aprovar'],...AGT_ST,['todos','Todos']].map(([k,l])=>`<button class="${AGT.filtro===k?'on':''}" onclick="AGT.filtro='${k}';refresh()">${l}${k==='aprovar'&&pend.size?` (${pend.size})`:''}</button>`).join('')}</div>
  <div class="card">${V.map(l=>agtLinha(l,pend)).join('') || `<p class="empty">${L.length?'Nada com esse filtro.':'Busque um nicho e uma cidade para começar.'}</p>`}</div>`;
}
function agtLinha(l, pend){
  const oc = AGT.ocupado[l.id];
  return `<div class="row ag-row" onclick="AGT.aberto='${l.id}';refresh()">
    <div class="grow"><span class="tag">${esc(agtEtapa(l))}</span>${pend.has(l.id)?'<span class="tag media">aprovar</span>':''}${!l.site?'<span class="tag atrasada">sem site</span>':''}<b class="sm">${esc(l.nome)}</b>
      <div class="mut xs">${esc(l.nicho||'')}${l.avaliacao?` · ★ ${l.avaliacao} (${l.total_avaliacoes||0})`:''}${l.decisor?` · ${esc(l.decisor)}`:''}${l.telefone?` · ${esc(l.telefone)}`:''}${l.analise?.nota_oportunidade!=null?` · oportunidade ${l.analise.nota_oportunidade}/10`:''}</div></div>
    <div class="acts" style="min-width:auto;align-items:flex-end" onclick="event.stopPropagation()">
      ${oc?`<span class="xs mut">${oc==='analisar'?'analisando…':oc==='mockup'?'criando mockup…':'escrevendo…'}</span>`
        : l.status==='novo' && !l.mensagem ? `<button class="btn g s" onclick="agtRodarTudo('${l.id}')">Rodar agente</button>` : `<span class="fac-st">${AGT_STL[l.status]}</span>`}
    </div></div>`;
}
function agtDetalhe(l, pend){
  if(!l){ AGT.aberto=null; return vAgente(); }
  const a = l.analise||{}, m = l.mensagem||{}, oc = AGT.ocupado[l.id], redes = l.redes||{};
  const lista = x => (Array.isArray(x)&&x.length) ? `<ul class="ag-ul">${x.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>` : '<p class="empty">—</p>';
  const link = l.mockup_token ? `/m.html?t=${l.mockup_token}` : '';
  $('#view').innerHTML = `<button class="btn link" onclick="AGT.aberto=null;refresh()">← todos os leads</button>
  <h2 style="margin-top:8px">${esc(l.nome)}</h2>
  <p class="sm mut" style="margin:-6px 0 10px">${esc(l.nicho||'')} · ${esc(l.endereco||'')}${l.avaliacao?` · ★ ${l.avaliacao} (${l.total_avaliacoes||0})`:''}${l.maps_url?` · <a href="${esc(l.maps_url)}" target="_blank" rel="noopener">Maps</a>`:''}${/^https?:/.test(l.site||'')?` · <a href="${esc(l.site)}" target="_blank" rel="noopener">site atual</a>`:' · sem site'}</p>
  <div class="subtabs" style="margin-bottom:14px">${AGT_ST.map(([k,t])=>`<button class="${l.status===k?'on':''}" onclick="agtStatus('${l.id}','${k}')">${t}</button>`).join('')}</div>
  <div class="dash">
    <div class="s7 stack">
      <div class="card"><h3>Análise <button class="btn link" ${oc?'disabled':''} onclick="agtPasso('${l.id}','analisar')">${oc==='analisar'?'analisando…':l.analise?'refazer':'analisar'}</button></h3>
        ${l.analise?`<p class="sm">${esc(a.resumo||'')}</p>
        <div class="grid g2" style="margin-top:10px"><div><b class="xs mut">PROBLEMAS DO SITE</b>${lista(a.problemas_site)}</div><div><b class="xs mut">OPORTUNIDADES</b>${lista(a.oportunidades)}</div></div>
        <p class="sm" style="margin-top:8px"><b>Argumento:</b> ${esc(a.argumento_venda||'')}</p>
        <p class="xs mut" style="margin-top:6px">Decisor: ${esc(l.decisor||'não encontrado')}${a.decisor?.fonte?` (fonte: ${esc(a.decisor.fonte)})`:''} · contato preferido: ${esc(a.contato_preferido||'—')} · oportunidade ${a.nota_oportunidade??'—'}/10</p>
        <p class="xs mut">${Object.entries(redes).map(([k,v])=>/^https?:/.test(v)?`<a href="${esc(v)}" target="_blank" rel="noopener">${esc(k)}</a>`:'').filter(Boolean).join(' · ')||'sem redes encontradas'}${l.email?` · ${esc(l.email)}`:''}</p>`
        :'<p class="empty">Ainda não analisado.</p>'}</div>
      <div class="card"><h3>Mockup proposto <span>${link?`<a class="btn link" href="${link}" target="_blank" rel="noopener">abrir</a> `:''}<button class="btn link" ${oc?'disabled':''} onclick="agtPasso('${l.id}','mockup')">${oc==='mockup'?'criando…':l.mockup_html?'refazer':'gerar'}</button></span></h3>
        ${l.mockup_html?`<iframe class="ag-mock" sandbox="" title="Mockup" srcdoc="${esc(l.mockup_html)}"></iframe>`:'<p class="empty">Ainda não gerado.</p>'}</div>
    </div>
    <div class="s5 stack">
      <div class="card"><h3>Abordagem ${pend.has(l.id)?'<span class="tag media">aguardando aprovação</span>':''} <button class="btn link" ${oc?'disabled':''} onclick="agtPasso('${l.id}','abordagem')">${oc==='abordagem'?'escrevendo…':l.mensagem?'refazer':'escrever'}</button></h3>
        ${l.mensagem?`<p class="xs mut">Para: ${esc(m.para||'')} · canal sugerido: ${esc(m.canal||'')}${(m.horarios||[]).length?` · horários: ${esc(m.horarios.join(' | '))}`:''}</p>
        <label style="margin-top:8px">WhatsApp<textarea id="ag-msg-whatsapp" rows="7">${esc(m.whatsapp||'')}</textarea></label>
        <div class="quick"><button class="btn s" onclick="agtAprovar('${l.id}','whatsapp')">Aprovar e abrir WhatsApp</button><button class="btn g s" onclick="agtCopiar('#ag-msg-whatsapp')">Copiar</button></div>
        <label style="margin-top:12px">Assunto do e-mail<input id="ag-assunto" value="${esc(m.email_assunto||'')}"></label>
        <label>E-mail<textarea id="ag-msg-email" rows="7">${esc(m.email_corpo||'')}</textarea></label>
        <div class="quick"><button class="btn s" onclick="agtAprovar('${l.id}','email')">Aprovar e abrir e-mail</button><button class="btn g s" onclick="agtCopiar('#ag-msg-email')">Copiar</button>${pend.has(l.id)?`<button class="btn d s" onclick="agtRejeitar('${l.id}')">Rejeitar</button>`:''}</div>
        ${m.roteiro_ligacao?`<details><summary>roteiro para ligar</summary><p class="sm pre">${esc(m.roteiro_ligacao)}</p></details>`:''}`
        :'<p class="empty">Gere a abordagem (ela usa a análise e o mockup).</p>'}</div>
      <div class="card"><h3>Andamento</h3>
        <p class="sm">${esc(l.proxima_acao||'—')}</p>
        <p class="xs mut">${l.contatado_em?`contatado ${fmtDH(l.contatado_em)}`:'ainda não contatado'}${l.reuniao_em?` · reunião ${fmtDH(l.reuniao_em)}`:''}</p>
        <div class="quick"><button class="btn g s" onclick="agtReuniao('${l.id}')">Marcar reunião</button>${l.telefone?`<a class="btn g s" href="tel:+${agtTel(l.telefone)}">Ligar</a>`:''}</div></div>
    </div>
  </div>`;
}
if(TAB==='agente' && document.querySelector('#view')) refresh();
