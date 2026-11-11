/* ================= VENDAS · vendedor autônomo da STRATON =================
   Carregar depois do app.js. Acrescenta a aba "Vendas" sem mexer nas outras.
   O vendedor roda sozinho no servidor (função vendedor + pg_cron a cada 2 min). Aqui eu acompanho:
   ligado/pausado, meta de calls, conexões, funil, reuniões de fechamento com briefing, conversas e ajustes. */
(function(){
  const ICO = '<path d="M3 17l5-5 4 4 8-8"/><path d="M14 8h6v6"/>';
  if(!TABS.some(t=>t[0]==='agente')) TABS.splice(Math.max(0, TABS.findIndex(t=>t[0]==='straton')), 0, ['agente', ICO, 'Vendas']);
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
  if(document.querySelector('nav') && !document.querySelector('nav button[data-t="agente"]')) renderShell();
  // atualiza sozinho a cada 30 s enquanto a aba está aberta (sem atrapalhar quem está digitando)
  setInterval(()=>{ if(TAB==='agente' && !document.hidden && !document.activeElement?.matches('input,textarea,select') && !$('#dlg')?.open) refresh(); }, 30000);
})();

const AGT_ETAPAS = [['descoberto','Encontrados'],['qualificado','Qualificados'],['analisado','Analisados'],['mockup_pronto','Mockup pronto'],['contatado','Contatados'],['conversando','Conversando'],['interessado','Interessados'],['decidiu_fechar','Decidiram fechar'],['reuniao_marcada','Reunião marcada'],['sem_resposta','Sem resposta'],['perdido','Perdidos'],['nao_contatar','Não contatar'],['descartado','Descartados']];
const AGT_ETL = Object.fromEntries(AGT_ETAPAS);
const AGT = {aberto:null, filtro:'ativos', ocupado:false, conf:false};
const PROPOSTA = 'https://straton-propostas.vercel.app/';
const agtBadge = (ok, t) => `<span class="tag" style="color:${ok?'var(--ok)':'var(--bad)'}">${ok?'●':'○'} ${t}</span>`;

async function agtFn(corpo, rotulo){
  const {data, error} = await sb.functions.invoke('vendedor', {body:corpo});
  let erro = error ? error.message : data?.erro;
  if(error){ try{ const j = await error.context?.json?.(); if(j?.erro) erro = j.erro; }catch(e){} }
  if(erro){ toast((rotulo?rotulo+': ':'')+erro); return null; }
  return data;
}

async function vAgente(){
  if(AGT.aberto) return agtLead(AGT.aberto);
  const [st, leads, reunioes, evs] = await Promise.all([
    agtFn({acao:'status'}),
    q(sb.from('cb_leads').select('id,nome,nicho,regiao,etapa,score,persona,decisor,whatsapp,ultima_resposta_em,ultima_msg_em,atualizado_em,presenca,avaliacao,total_avaliacoes').in('origem',['maps','straton_leads']).order('atualizado_em',{ascending:false}).limit(400)),
    q(sb.from('vd_reunioes').select('id,lead_id,inicio,status,briefing,cb_leads(nome,whatsapp,decisor,nicho)').order('inicio',{ascending:true}).limit(30)),
    q(sb.from('cb_eventos').select('nivel,titulo,detalhe,criado_em').eq('cerebro','prospeccao').order('criado_em',{ascending:false}).limit(25)),
  ]);
  if(TAB!=='agente' || AGT.aberto) return;
  const S = st || {config:{}, etapas:{}, conexoes:{}, personas:[]};
  const c = S.config || {}, e = S.etapas || {}, cx = S.conexoes || {};
  const L = Array.isArray(leads)?leads:[], R = Array.isArray(reunioes)?reunioes:[], E = Array.isArray(evs)?evs:[];
  const futuras = R.filter(r=>r.status==='marcada' && new Date(r.inicio)>new Date());
  const meta = c.meta_calls||5, pronto = cx.ia && (cx.whatsapp||cx.email) && (cx.maps||cx.straton_leads);
  const ativos = ['contatado','conversando','interessado','decidiu_fechar','reuniao_marcada'];
  let V = L;
  if(AGT.filtro==='ativos') V = L.filter(l=>ativos.includes(l.etapa));
  else if(AGT.filtro==='quentes') V = L.filter(l=>['interessado','decidiu_fechar','reuniao_marcada'].includes(l.etapa));
  else if(AGT.filtro!=='todos') V = L.filter(l=>l.etapa===AGT.filtro);
  const funil = ['descoberto','qualificado','mockup_pronto','contatado','conversando','interessado','decidiu_fechar','reuniao_marcada'];
  const maxF = Math.max(1, ...funil.map(k=>e[k]||0));

  $('#view').innerHTML = `<h2>Vendas · STRATON</h2>
  <div class="card agt-topo">
    <div class="agt-liga">
      <button class="agt-switch ${c.ativo?'on':''}" onclick="agtLigar(${!c.ativo})" ${!pronto&&!c.ativo?'title="Faltam conexões"':''}><i></i></button>
      <div><b class="mid">${c.ativo?'Vendedor trabalhando':'Vendedor pausado'}</b>
      <div class="xs mut">${S.config?.ultimo_ciclo?`último ciclo ${fmtDH(S.config.ultimo_ciclo)}`:'ainda não rodou'} · ${S.enviadas_hoje??0} mensagens enviadas e ${S.recebidas_hoje??0} recebidas hoje</div></div>
    </div>
    <div class="agt-meta"><span class="xs mut">Calls de fechamento marcadas</span><b class="big">${futuras.length}<span class="mut">/${meta}</span></b>
      <div class="prog"><i style="width:${Math.min(100,futuras.length/meta*100)}%"></i></div></div>
    <div class="agt-cx">${agtBadge(cx.ia,'IA')}${agtBadge(cx.maps,'Google Maps')}${agtBadge(cx.straton_leads,'STRATON Leads')}${agtBadge(cx.whatsapp,'WhatsApp')}${agtBadge(cx.email,'E-mail')}
      <div class="quick"><button class="btn g s" onclick="agtRodar()" ${AGT.ocupado?'disabled':''}>${AGT.ocupado?'rodando…':'Rodar ciclo agora'}</button><button class="btn g s" onclick="AGT.conf=!AGT.conf;refresh()">${AGT.conf?'Fechar ajustes':'Ajustes e conexões'}</button></div></div>
  </div>
  ${!pronto?`<div class="help" style="margin:10px 0">Para o vendedor trabalhar sozinho faltam: ${[!cx.ia&&'chave da IA (secret ANTHROPIC_API_KEY)',!(cx.maps||cx.straton_leads)&&'fonte de leads (GOOGLE_PLACES_API_KEY ou STRATON Leads)',!(cx.whatsapp||cx.email)&&'WhatsApp ou e-mail da STRATON'].filter(Boolean).join(' · ')}. Abra "Ajustes e conexões".</div>`:''}
  ${AGT.conf?agtAjustes(S):''}
  <div class="dash" style="margin-top:14px">
    <div class="s8 stack">
      <div class="card"><h3>Reuniões de fechamento <span class="mono xs mut">dias e horários diferentes · manhã ou tarde</span></h3>
        ${R.length?R.map(r=>agtReuniao(r)).join(''):'<p class="empty">Nenhuma ainda. Quando um cliente decidir fechar, o vendedor marca aqui com o briefing completo.</p>'}</div>
      <div class="card"><h3>Funil</h3>
        ${funil.map(k=>`<div class="agt-f"><span class="xs">${AGT_ETL[k]}</span><div class="agt-fb"><i style="width:${(e[k]||0)/maxF*100}%"></i></div><b class="mono xs">${e[k]||0}</b></div>`).join('')}
        <p class="xs mut" style="margin-top:8px">Descartados ${e.descartado||0} · sem resposta ${e.sem_resposta||0} · perdidos ${e.perdido||0} · não contatar ${e.nao_contatar||0}</p></div>
      <div class="card"><h3>Leads</h3>
        <div class="chips">${[['ativos','Em conversa'],['quentes','Quentes'],['mockup_pronto','Prontos p/ abordar'],['qualificado','Qualificados'],['descartado','Descartados'],['todos','Todos']].map(([k,t])=>`<button class="${AGT.filtro===k?'on':''}" onclick="AGT.filtro='${k}';refresh()">${t}</button>`).join('')}</div>
        ${V.slice(0,120).map(agtLinha).join('') || '<p class="empty">Nada aqui ainda.</p>'}</div>
    </div>
    <div class="s4 stack">
      <div class="card"><h3>Ao vivo</h3><div class="agt-feed">${E.map(ev=>`<div class="agt-ev ${ev.nivel}"><b class="sm">${esc(ev.titulo)}</b>${ev.detalhe?`<div class="xs mut">${esc(String(ev.detalhe).slice(0,160))}</div>`:''}<span class="xs mut mono">${fmtDH(ev.criado_em)}</span></div>`).join('')||'<p class="empty">Sem atividade ainda.</p>'}</div></div>
      <div class="card"><h3>Atendente que mais converte</h3>${agtPersonas(S)}</div>
      <div class="card"><h3>Próximos horários livres</h3>${(S.horarios_livres||[]).map(h=>`<div class="sm">${esc(h.texto)}</div>`).join('')||'<p class="empty">—</p>'}<p class="xs mut" style="margin-top:6px">O vendedor só oferece estes horários: dias úteis, manhã ou tarde, cada call num dia e horário diferentes.</p></div>
    </div>
  </div>`;
}

function agtLinha(l){
  return `<div class="row ag-row" onclick="AGT.aberto='${l.id}';refresh()"><div class="grow">
    <span class="tag">${esc(AGT_ETL[l.etapa]||l.etapa)}</span>${l.ultima_resposta_em&&(!l.ultima_msg_em||l.ultima_resposta_em>l.ultima_msg_em)?'<span class="tag media">respondeu</span>':''}<b class="sm">${esc(l.nome)}</b>
    <div class="mut xs">${esc(l.nicho||'')}${l.regiao?` · ${esc(l.regiao)}`:''}${l.score!=null?` · score ${l.score}`:''}${l.persona?` · ${esc(l.persona)}`:''}${l.decisor?` · ${esc(l.decisor)}`:''}${l.avaliacao?` · ★ ${l.avaliacao} (${l.total_avaliacoes||0})`:''}</div></div>
    <span class="xs mut mono">${fmtDH(l.atualizado_em)}</span></div>`;
}

function agtReuniao(r){
  const b = r.briefing || {}, l = r.cb_leads || {}, futura = new Date(r.inicio) > new Date();
  const lista = x => Array.isArray(x)&&x.length ? `<ul class="ag-ul">${x.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>` : '';
  return `<div class="agt-reu ${futura?'':'passada'}">
    <div class="row" style="border:0;padding:0"><div class="grow"><b>${esc(l.nome||'Lead')}</b> <span class="tag ${b.temperatura==='quente'?'atrasada':''}">${esc(b.temperatura||'')}</span>
      <div class="sm">${fmtDH(r.inicio)} · com <b>${esc(b.quem||l.decisor||'—')}</b>${b.cargo?` (${esc(b.cargo)})`:''}</div>
      <div class="xs mut">${esc(b.como_contatar||b.contato_reuniao||l.whatsapp||'')}</div></div>
      <div class="acts" style="min-width:auto">${futura?`<button class="btn g s" onclick="agtReuStatus('${r.id}','cancelada')">cancelar</button>`:`<button class="btn s" onclick="agtReuStatus('${r.id}','fechou')">fechou</button><button class="btn g s" onclick="agtReuStatus('${r.id}','nao_fechou')">não fechou</button>`}</div></div>
    ${r.briefing?`<details ${futura?'open':''}><summary>briefing para o fechamento</summary><div class="sm agt-brief">
      ${b.abertura?`<p><b>Abertura:</b> ${esc(b.abertura)}</p>`:''}
      ${b.o_que_quer?.length?`<b class="xs mut">O QUE QUER</b>${lista(b.o_que_quer)}`:''}
      ${b.feedback_mockup?`<p><b>Mockup:</b> ${esc(b.feedback_mockup)}</p>`:''}
      ${b.dores?.length?`<b class="xs mut">DORES</b>${lista(b.dores)}`:''}
      ${b.objecoes?.length?`<b class="xs mut">OBJEÇÕES</b>${lista(b.objecoes)}`:''}
      ${b.escopo_sugerido?.length?`<b class="xs mut">ESCOPO</b>${lista(b.escopo_sugerido)}`:''}
      ${b.ticket_sugerido?`<p><b>Ticket:</b> ${esc(b.ticket_sugerido)}</p>`:''}
      ${b.roteiro?.length?`<b class="xs mut">ROTEIRO</b>${lista(b.roteiro)}`:''}
      ${b.cuidados?.length?`<b class="xs mut">CUIDADOS</b>${lista(b.cuidados)}`:''}
      <button class="btn link" onclick="AGT.aberto='${r.lead_id}';refresh()">ver conversa e mockup →</button></div></details>`:'<p class="xs mut">gerando briefing…</p>'}
  </div>`;
}

function agtPersonas(S){
  const P = (S.config?.personas)||[], st = S.personas||[];
  const tot = id => st.filter(s=>s.persona===id).reduce((a,s)=>({ab:a.ab+s.abordados, re:a.re+s.responderam, in:a.in+s.interessados, ru:a.ru+s.reunioes}), {ab:0,re:0,in:0,ru:0});
  return `<table><tr><th>Atendente</th><th>Abord.</th><th>Resp.</th><th>Inter.</th><th>Calls</th></tr>${P.map(p=>{ const t=tot(p.id); return `<tr><td>${esc(p.nome)} <span class="xs mut">${p.genero==='f'?'(mulher)':'(homem)'}</span></td><td>${t.ab}</td><td>${t.ab?Math.round(t.re/t.ab*100)+'%':'—'}</td><td>${t.in}</td><td>${t.ru}</td></tr>`; }).join('')}</table>
  <p class="xs mut" style="margin-top:6px">A escolha é por nicho e se ajusta sozinha: quem tem mais resposta e interesse recebe mais leads, sem parar de testar o outro.</p>`;
}

function agtAjustes(S){
  const c = S.config||{};
  return `<div class="card" style="margin-top:14px"><h3>Ajustes do vendedor</h3>
  <form class="f" onsubmit="agtSalvarConfig(event)">
    <div class="f2"><label>Meta de calls de fechamento<input name="meta_calls" type="number" min="1" max="30" value="${c.meta_calls||5}"></label>
      <label>Máximo de mensagens por hora<input name="max_por_hora" type="number" min="1" max="200" value="${c.max_por_hora||20}"></label></div>
    <label>Nichos (um por linha; os 3 primeiros têm prioridade)<textarea name="nichos" rows="4">${esc((c.nichos||[]).join('\n'))}</textarea></label>
    <label>Regiões (uma por linha)<textarea name="regioes" rows="4">${esc((c.regioes||[]).join('\n'))}</textarea></label>
    <div class="f2"><label>Atendente mulher<input name="p_f" value="${esc((c.personas||[]).find(p=>p.genero==='f')?.nome||'Ana')}"></label>
      <label>Atendente homem<input name="p_m" value="${esc((c.personas||[]).find(p=>p.genero==='m')?.nome||'Rafael')}"></label></div>
    <div class="f2"><label>Quem fecha<input name="fechamento_com" value="${esc(c.empresa?.fechamento_com||'Gabriel')}"></label>
      <label>Site/Instagram da STRATON (opcional)<input name="site" value="${esc(c.empresa?.site||'')}"></label></div>
    <label>O que a STRATON oferece (o vendedor usa isso)<textarea name="oferta" rows="3">${esc(c.oferta||'')}</textarea></label>
    <label>Tabela de preços (opcional, uma por linha: pacote | faixa de preço | o que inclui)<textarea name="precos" rows="3" placeholder="Site essencial | R$ 1.500 a 2.500 | 5 seções, WhatsApp, Google">${esc((c.precos||[]).map(p=>[p.pacote,p.faixa,p.inclui].join(' | ')).join('\n'))}</textarea></label>
    <button class="btn">Salvar ajustes</button>
  </form></div>
  <div class="card" style="margin-top:14px"><h3>Conexões da STRATON</h3>
  <p class="xs mut">Os campos são só de escrita: ficam guardados no servidor e não voltam para o navegador. Deixe em branco o que não quiser mudar.</p>
  <form class="f" onsubmit="agtSalvarCred(event)">
    <b class="sm">WhatsApp (uazapi)</b>
    <div class="f2"><label>URL da instância<input name="uazapi_url" placeholder="https://suainstancia.uazapi.com"></label><label>Token da instância<input name="uazapi_token" type="password" autocomplete="off"></label></div>
    <label>Webhook para colar na uazapi (mensagens recebidas)<input readonly value="${esc(S.webhook_whatsapp||'')}" onclick="this.select()"></label>
    <b class="sm" style="margin-top:6px">E-mail da STRATON</b>
    <div class="f2"><label>Webhook de envio (n8n)<input name="email_webhook_url" placeholder="https://n8n…/webhook/…"></label><label>Remetente<input name="email_remetente" placeholder="contato@…"></label></div>
    <b class="sm" style="margin-top:6px">STRATON Leads (somente leitura)</b>
    <div class="f2"><label>URL do Supabase<input name="sl_url" placeholder="https://….supabase.co"></label><label>Chave pública (anon)<input name="sl_anon" autocomplete="off"></label></div>
    <div class="f2"><label>E-mail de acesso<input name="sl_email" autocomplete="off"></label><label>Senha<input name="sl_senha" type="password" autocomplete="new-password"></label></div>
    <button class="btn">Salvar conexões</button>
  </form>
  <form class="f" onsubmit="agtTestar(event)" style="margin-top:12px"><b class="sm">Testar WhatsApp</b><div class="f2"><input name="numero" placeholder="seu celular com DDD"><button class="btn g">Enviar teste</button></div></form>
  </div>`;
}

async function agtLigar(on){
  if(on && !confirm('Ligar o vendedor? Ele vai buscar, abordar e conversar com lojas pelo WhatsApp/e-mail da STRATON sozinho, em horário comercial, até marcar as calls da meta.')) return;
  if(await agtFn({acao:'configurar', config:{ativo:on}}, 'Vendedor')) { toast(on?'Vendedor ligado':'Vendedor pausado'); refresh(); }
}
async function agtRodar(){ AGT.ocupado=true; refresh(); const r = await agtFn({acao:'rodar_agora'}, 'Ciclo'); AGT.ocupado=false; if(r) toast(r.feito?.length ? r.feito.join(' · ') : (r.erro || 'ciclo rodou')); refresh(); }
async function agtSalvarConfig(e){
  e.preventDefault(); const f = e.target, linhas = s => s.split('\n').map(x=>x.trim()).filter(Boolean);
  const config = {
    meta_calls:+f.meta_calls.value||5, max_por_hora:+f.max_por_hora.value||20, nichos:linhas(f.nichos.value), regioes:linhas(f.regioes.value),
    personas:[{id:'ana',nome:f.p_f.value.trim()||'Ana',genero:'f'},{id:'rafael',nome:f.p_m.value.trim()||'Rafael',genero:'m'}],
    empresa:{nome:'STRATON', fechamento_com:f.fechamento_com.value.trim()||'Gabriel', site:f.site.value.trim()}, oferta:f.oferta.value.trim(),
    precos:linhas(f.precos.value).map(l=>{ const [pacote,faixa,inclui]=l.split('|').map(x=>x.trim()); return {pacote,faixa,inclui}; }),
  };
  if(await agtFn({acao:'configurar', config}, 'Ajustes')) { toast('Ajustes salvos'); refresh(); }
}
async function agtSalvarCred(e){
  e.preventDefault(); const f = e.target, v = n => f[n].value.trim();
  const credenciais = {uazapi_url:v('uazapi_url'), uazapi_token:v('uazapi_token'), email_webhook_url:v('email_webhook_url'), email_remetente:v('email_remetente')};
  if(v('sl_url') && v('sl_anon') && v('sl_email') && v('sl_senha')) credenciais.straton_leads = {url:v('sl_url').replace(/\/$/,''), anon_key:v('sl_anon'), email:v('sl_email'), senha:v('sl_senha')};
  const r = await agtFn({acao:'credenciais', credenciais}, 'Conexões');
  if(r){ f.reset(); toast(r.salvos?.length ? 'Salvo: '+r.salvos.join(', ') : 'Nada para salvar'); refresh(); }
}
async function agtTestar(e){ e.preventDefault(); if(await agtFn({acao:'testar_whatsapp', numero:e.target.numero.value}, 'Teste')) toast('Mensagem de teste enviada'); }
async function agtReuStatus(id, status){ if(await q(sb.from('vd_reunioes').update({status}).eq('id',id))!==null){ toast('Reunião: '+status.replace('_',' ')); refresh(); } }
async function agtPasso(id, passo, rotulo){ AGT.ocupado=true; refresh(); const r = await agtFn({acao:'lead', lead_id:id, passo}, rotulo); AGT.ocupado=false; if(r) toast(rotulo+' ok'); refresh(); }

async function agtLead(id){
  const [ls, msgs, contatos] = await Promise.all([
    q(sb.from('cb_leads').select('*').eq('id',id).maybeSingle()),
    q(sb.from('vd_mensagens').select('*').eq('lead_id',id).order('criado_em',{ascending:true})),
    q(sb.from('vd_mockup_contatos').select('*').eq('lead_id',id).order('criado_em',{ascending:false})),
  ]);
  if(TAB!=='agente' || AGT.aberto!==id) return;
  const l = ls && ls!==true ? ls : null; if(!l){ AGT.aberto=null; return vAgente(); }
  const a = l.analise||{}, qf = l.qualificacao||{}, reg = qf.registro||{}, b = l.briefing, M = Array.isArray(msgs)?msgs:[], C = Array.isArray(contatos)?contatos:[];
  const lista = x => Array.isArray(x)&&x.length ? `<ul class="ag-ul">${x.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>` : '<p class="empty">—</p>';
  $('#view').innerHTML = `<button class="btn link" onclick="AGT.aberto=null;refresh()">← vendas</button>
  <h2 style="margin-top:8px">${esc(l.nome)}</h2>
  <p class="sm mut" style="margin:-6px 0 10px"><span class="tag">${esc(AGT_ETL[l.etapa]||l.etapa)}</span> ${esc(l.nicho||'')} · ${esc(l.endereco||'')}${l.avaliacao?` · ★ ${l.avaliacao} (${l.total_avaliacoes||0})`:''} · score ${l.score??'—'} · ${esc(l.presenca||'')}${l.maps_url?` · <a href="${esc(l.maps_url)}" target="_blank" rel="noopener">Maps</a>`:''}${/^https?:/.test(l.site||'')?` · <a href="${esc(l.site)}" target="_blank" rel="noopener">site atual</a>`:''}</p>
  <div class="quick" style="margin-bottom:14px">
    ${['descoberto','descartado'].includes(l.etapa)?`<button class="btn g s" onclick="agtPasso('${id}','qualificar','Qualificação')">qualificar</button>`:''}
    <button class="btn g s" ${AGT.ocupado?'disabled':''} onclick="agtPasso('${id}','analisar','Análise')">${l.analise?'refazer análise':'analisar'}</button>
    <button class="btn g s" ${AGT.ocupado?'disabled':''} onclick="agtPasso('${id}','mockup','Mockup')">${l.mockup_html?'refazer mockup':'criar mockup'}</button>
    ${l.etapa==='mockup_pronto'?`<button class="btn s" ${AGT.ocupado?'disabled':''} onclick="agtPasso('${id}','abordar','Abordagem')">abordar agora</button>`:''}
    <button class="btn g s" ${AGT.ocupado?'disabled':''} onclick="agtPasso('${id}','briefing','Briefing')">gerar briefing</button>
    ${!l.opt_out?`<button class="btn d s" onclick="if(confirm('Parar de falar com esta loja?'))agtPasso('${id}','pausar','Lead pausado')">parar contato</button>`:''}
    ${AGT.ocupado?'<span class="xs mut">trabalhando…</span>':''}
  </div>
  <div class="dash">
    <div class="s7 stack">
      <div class="card"><h3>Conversa ${l.persona?`<span class="xs mut">${esc(l.persona)}</span>`:''}</h3>
        <div class="fac-msgs" style="max-height:60vh">${M.map(m=>`<div class="fac-m ${m.direcao==='entrada'?'user':'assistant'}" style="align-self:${m.direcao==='entrada'?'flex-start':'flex-end'}"><p class="sm pre">${esc(m.conteudo)}</p><span class="xs mut mono">${m.canal} · ${fmtDH(m.criado_em)}${m.status==='erro'?` · <b class="bad">erro: ${esc(m.erro||'')}</b>`:''}</span></div>`).join('')||'<p class="empty">Ainda sem mensagens.</p>'}</div></div>
      <div class="card"><h3>Mockup ${l.mockup_token?`<a class="btn link" href="${PROPOSTA}?t=${l.mockup_token}" target="_blank" rel="noopener">abrir link público</a>`:''}</h3>
        ${l.mockup_html?`<iframe class="ag-mock" sandbox="allow-scripts" title="Mockup" srcdoc="${esc(l.mockup_html)}"></iframe>`:'<p class="empty">Ainda não criado.</p>'}
        ${l.mockup_feedback?`<p class="sm" style="margin-top:8px"><b>Feedback do cliente:</b> ${esc(l.mockup_feedback)}</p>`:''}
        ${C.length?`<p class="sm" style="margin-top:8px"><b>Contatos pelo formulário do mockup:</b></p>${C.map(x=>`<div class="xs">${esc(x.nome||'')} · ${esc(x.telefone||'')} · ${esc(x.mensagem||'')} <span class="mut">${fmtDH(x.criado_em)}</span></div>`).join('')}`:''}</div>
    </div>
    <div class="s5 stack">
      ${b?`<div class="card"><h3>Briefing de fechamento</h3><div class="sm agt-brief"><p><b>${esc(b.quem||'')}</b> ${esc(b.cargo||'')} · ${esc(b.como_contatar||'')}</p>${b.abertura?`<p><b>Abertura:</b> ${esc(b.abertura)}</p>`:''}<b class="xs mut">O QUE QUER</b>${lista(b.o_que_quer)}<b class="xs mut">ROTEIRO</b>${lista(b.roteiro)}${b.ticket_sugerido?`<p><b>Ticket:</b> ${esc(b.ticket_sugerido)}</p>`:''}</div></div>`:''}
      <div class="card"><h3>O que o vendedor sabe</h3>
        <p class="sm"><b>Decisor:</b> ${esc(l.decisor||'—')}${(l.socios||[]).length?` · sócios: ${esc(l.socios.map(s=>s.nome).join(', '))}`:''}</p>
        ${reg.necessidades?`<p class="sm"><b>Necessidades:</b> ${esc(reg.necessidades)}</p>`:''}
        ${reg.objecoes?`<p class="sm"><b>Objeções:</b> ${esc(reg.objecoes)}</p>`:''}
        <p class="xs mut">Contato: ${esc(l.whatsapp||'')} ${esc(l.email||'')} · tentativas ${l.tentativas||0}${l.proximo_passo_em?` · próximo passo ${fmtDH(l.proximo_passo_em)}`:''}</p></div>
      <div class="card"><h3>Análise</h3>${l.analise?`<p class="sm">${esc(a.resumo||'')}</p><p class="sm"><b>Vender:</b> ${esc(a.o_que_vender||'')} · <b>Argumento:</b> ${esc(a.argumento_principal||'')}</p><b class="xs mut">MELHORIAS</b>${lista(a.pontos_melhoria)}<b class="xs mut">FUNCIONALIDADES</b>${lista(a.funcionalidades_sugeridas)}<b class="xs mut">OBJEÇÕES PROVÁVEIS</b>${lista(a.objecoes_provaveis)}`:'<p class="empty">Ainda não analisado.</p>'}</div>
      <div class="card"><h3>Qualificação</h3>${lista(qf.motivos)}${qf.descartar?`<p class="sm bad">Descartado: ${esc(qf.descartar)}</p>`:''}</div>
    </div>
  </div>`;
}
if(TAB==='agente' && document.querySelector('#view')) refresh();
