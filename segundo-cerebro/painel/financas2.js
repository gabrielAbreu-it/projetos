/* ===== Finanças v2 · abas organizadas, planilha editável, planejamento do mês, gráficos e assistente de IA =====
   Carrega depois do app.js, financas.js e faculdade.js (usa projetar, detalheMes, dicas, dadosPizza, facMd, modal, q…). */
const F2_ABAS = [['resumo','Resumo'],['planilha','Lançamentos'],['planejar','Planejar mês'],['fixos','Fixos do mês'],['saldos','Saldos'],['graficos','Gráficos'],['ia','Assistente IA']];
const F2_TIPOS = [['saida','Saída'],['entrada','Entrada'],['aporte','Guardar'],['resgate','Tirar da reserva']];
const F2_GRAFS = [['proj','Projeção 12 meses'],['fluxo','Entradas × saídas'],['cat','Por categoria'],['dia','Gasto por dia']];
const F2_SUG = ['Gastei 45 no mercado hoje','Quanto posso gastar por dia até o fim do mês?','Meu saldo no banco agora é 1.250','Planeje dezembro: 13º de 2.000 e presente de 300','Onde dá para cortar?'];
const F2_COR = {a:'#3987e5', b:'#d95926', c:'#199e70'}; // paleta categórica validada no tema escuro
const F2 = (()=>{ const s = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
  return {aba:s('sc_fin2_aba')||'resumo', mes:hoje().slice(0,7), tipo:'', busca:'', graf:s('sc_fin2_graf')||'proj', gmodo:'real', gmes:hoje().slice(0,7), pm:null,
    chat:null, ocupado:false, sujo:false, lanc:[]}; })();
const f2Salva = () => { try{ localStorage.setItem('sc_fin2_aba',F2.aba); localStorage.setItem('sc_fin2_graf',F2.graf); }catch(e){} };
const f2Tipo = t => (F2_TIPOS.find(x=>x[0]===t)||[t,t])[1];
const f2Opt = (sel, lista=F2_TIPOS) => lista.map(([k,l])=>`<option value="${k}" ${sel===k?'selected':''}>${l}</option>`).join('');
const F2_TIPOS_P = F2_TIPOS.slice(0,3);
const f2Cnt = (v, cls='') => `<b class="${cls}" data-cnt="${(+v||0).toFixed(2)}">${brl(v)}</b>`;
const f2NomeMes = ym => `${MESES_L[+ym.slice(5,7)-1]} de ${ym.slice(0,4)}`;
const f2Ym = (ym, n) => { const [y,m] = ym.split('-').map(Number); return isoLocal(new Date(y, m-1+n, 1)).slice(0,7); };

function f2Aba(a){ F2.aba = a; f2Salva(); window.motionProximo?.(); window.scrollTo(0,0); refresh(); }
finAba = a => f2Aba({mes:'planejar', lancar:'planilha', fixos:'fixos'}[a] || 'resumo');
verMes = ym => { F2.pm = ym; f2Aba('planejar'); };

/* ---------- edição direto na célula (salva ao sair do campo) ---------- */
document.addEventListener('change', async e => {
  const el = e.target; if(!el.classList?.contains('f2c')) return;
  const {t, id, k} = el.dataset;
  let v = el.type==='checkbox' ? el.checked : el.value;
  if(k==='valor' || k==='saldo'){
    v = parseMoney(v);
    if(isNaN(v)){ toast('Valor inválido. Ex.: 1.250,90 ou 100+50'); el.classList.add('erro'); return; }
    if(k==='valor' && v<=0){ toast('O valor precisa ser maior que zero'); el.classList.add('erro'); return; }
  } else if(el.type==='month'){
    if(!v && k!=='fim'){ toast('Escolha o mês'); return; }
    v = v ? v + (k==='fim' ? '-28' : '-01') : null;
  } else if(k==='dia'){ v = Math.min(31, Math.max(1, parseInt(v)||1)); }
  else if(typeof v==='string'){ v = v.trim() || null; if(!v && (k==='descricao' || k==='nome' || k==='data')){ toast('Esse campo não pode ficar vazio'); el.classList.add('erro'); return; } }
  const up = {[k]: v}; if(t==='fin_contas') up.atualizado_em = new Date().toISOString();
  el.classList.remove('erro'); el.classList.add('salvando');
  const r = await q(sb.from(t).update(up).eq('id', id));
  el.classList.remove('salvando');
  if(r===null){ el.classList.add('erro'); return; }
  el.classList.add('salvo'); setTimeout(()=>el.classList.remove('salvo'), 900);
  F2.sujo = true; f2Recarrega();
});
// recarrega quando o foco sai da planilha (assim dá para ir de célula em célula com Tab sem a tela piscar)
function f2Recarrega(){ setTimeout(()=>{ const a = document.activeElement; if(F2.sujo && !(a && (a.classList.contains('f2c') || a.closest?.('.f2-nova')))){ F2.sujo=false; if(TAB==='financas') refresh(); } }, 220); }
document.addEventListener('focusout', e => { if(F2.sujo && (e.target.classList?.contains('f2c'))) f2Recarrega(); });
document.addEventListener('keydown', e => { if(e.key==='Enter' && e.target.classList?.contains('f2c') && e.target.tagName==='INPUT'){ e.preventDefault(); e.target.blur(); } });

/* ---------- carregar ---------- */
vFin = async function(){
  const n = new Date(), iniMes = isoLocal(new Date(n.getFullYear(), n.getMonth(), 1));
  const ha12 = isoLocal(new Date(n.getFullYear(), n.getMonth()-12, 1));
  const desde = [ha12, F2.mes ? F2.mes+'-01' : ha12, F2.gmes+'-01'].sort()[0];
  const [contas, rec, aj, lanc, chat] = await Promise.all([
    q(sb.from('fin_contas').select('*').order('tipo')),
    q(sb.from('fin_recorrentes').select('*').order('tipo').order('valor',{ascending:false})),
    q(sb.from('fin_ajustes').select('*').gte('mes',iniMes).order('mes').order('criado_em')),
    q(sb.from('fin_lancamentos').select('*').gte('data',desde).order('data',{ascending:false}).order('criado_em',{ascending:false})),
    (F2.aba==='ia' && !F2.ocupado) ? q(sb.from('fin_chat').select('*').order('criado_em').limit(200)) : Promise.resolve(F2.chat)
  ]);
  const arr = x => Array.isArray(x) ? x : [];
  F2.lanc = arr(lanc);
  if(Array.isArray(chat)) F2.chat = chat;
  FIN = {...FIN, contas:arr(contas), rec:arr(rec), aj:arr(aj), lanc:F2.lanc.filter(l=>l.data>=iniMes), hist:F2.lanc,
    mesSel: F2.pm || FIN.mesSel || hoje().slice(0,7), pieModo: FIN.pieModo || 'tudo'};
  const p = projetar(FIN);
  if(!F2.pm || F2.pm < p[0].ym || F2.pm > p[p.length-1].ym) F2.pm = p[0].ym;
  FIN.mesSel = F2.pm;
  if(TAB!=='financas') return;
  const corpo = ({resumo:f2Resumo, planilha:f2Planilha, planejar:f2Planejar, fixos:f2Fixos, saldos:f2Saldos, graficos:f2Graficos, ia:f2IA}[F2.aba] || f2Resumo)(p);
  $('#view').innerHTML = `<h2>Finanças</h2>
    <div class="subtabs f2-tabs" role="tablist">${F2_ABAS.map(([k,l])=>`<button role="tab" class="${F2.aba===k?'on':''}" onclick="f2Aba('${k}')">${l}</button>`).join('')}</div>
    <div class="f2-corpo">${corpo}</div>`;
  if(F2.aba==='ia') f2RolarChat();
  const ab = document.querySelector('.f2-tabs button.on'); if(ab){ const t = ab.parentElement; t.scrollLeft = ab.offsetLeft - (t.clientWidth - ab.clientWidth)/2; }
};

/* ================= RESUMO ================= */
function f2Resumo(p){
  const R = resumoDoMes(p), mes = MESES_L[new Date().getMonth()];
  const res = +(FIN.contas.find(c=>c.tipo==='reserva')?.saldo||0);
  const ok = R.media <= R.limiteDia || R.sai===0;
  const hj = new Date().getDate(), ym = hoje().slice(0,7);
  const corr = {}; FIN.aj.filter(a=>a.mes.slice(0,7)===ym).forEach(a=>{ const c=corrDe(a); if(c) corr[c.fixo]=c.pular?0:+a.valor; });
  const prox = [...FIN.rec.filter(r=>r.ativo && r.dia>hj && r.inicio<=hoje() && !(r.fim && r.fim.slice(0,7)<ym)).map(r=>({d:r.dia, desc:r.descricao, tipo:r.tipo, v: r.id in corr ? corr[r.id] : +r.valor, obs:r.observacao}))
    .filter(x=>x.v>0), ...FIN.aj.filter(a=>a.mes.slice(0,7)===ym && !corrDe(a)).map(a=>({d:null, desc:a.descricao, tipo:a.tipo, v:+a.valor, obs:a.observacao}))].sort((a,b)=>(a.d||99)-(b.d||99));
  const pz = dadosPizza(), D = dicas(pz);
  const ult = F2.lanc.slice(0,6);
  return `
  <div class="f2-hero">
    <div class="card"><span>Tem agora</span>${f2Cnt(R.disp, R.disp<0?'bad':'')}<small>disponível na conta · <button class="btn link" onclick="f2Aba('saldos')">corrigir</button></small></div>
    <div class="card"><span>Guardado</span>${f2Cnt(res,'ok')}<small>reserva · total ${brl(R.disp+res)}</small></div>
    <div class="card"><span>Pode gastar por dia</span>${f2Cnt(R.limiteDia, ok?'':'bad')}<small>até o fim de ${mes} · ${R.restam} dia${R.restam>1?'s':''}</small></div>
    <div class="card"><span>Fim do mês (previsto)</span>${f2Cnt(R.fimMes, R.fimMes<0?'bad':'')}<small>já contando os fixos que faltam</small></div>
  </div>

  <div class="card f2-rapido">
    <h3><span>Lançar agora</span><span class="xs mut" style="text-transform:none;letter-spacing:0">ou escreva para a IA: “gastei 30 no almoço”</span></h3>
    <form class="f2-lf" onsubmit="f2NovoLanc(event)">
      <select name="tipo">${f2Opt('saida')}</select>
      ${moneyIn('valor','',true,'Valor')}
      <input name="descricao" placeholder="Descrição (ex.: mercado, Uber)" required>
      <input name="categoria" list="cats" placeholder="Categoria">
      <input name="data" type="date" value="${hoje()}">
      <input name="observacao" placeholder="Observação (opcional)">
      <button class="btn">+ Lançar</button>
    </form>
    <form class="f2-ask" onsubmit="event.preventDefault();f2Perguntar(this.m.value)"><input name="m" placeholder="Pergunte ou peça à IA: “planeje dezembro”, “quanto gastei com Uber?”"><button class="btn g">Perguntar à IA →</button></form>
  </div>

  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3><span>Este mês · ${mes}</span><span class="xs mut" style="text-transform:none;letter-spacing:0">dia ${R.dia} de ${R.diasMes}</span></h3>
      <div class="f2-mini">
        <div><span>Tinha no dia 1</span><b>${brl(R.inicio)}</b></div>
        <div><span>Entrou</span><b>${brl(R.ent+R.res)}</b></div>
        <div><span>Gastou</span><b>${brl(R.sai)}</b></div>
        <div><span>Guardou</span><b>${brl(R.apo)}</b></div>
      </div>
      <div class="meter-l"><span>Gasto do mês</span><span>${brl(R.sai)} de ${brl(R.teveNoMes)}</span></div>
      <div class="prog"><i style="width:${Math.min(100,R.pct)}%"></i></div>
      <div class="veredito ${ok?'':'mal'}">${R.sai===0 ? `Nenhum gasto lançado em ${mes} ainda.` : ok
        ? `Média de <b>${brl(R.media)}/dia</b>, abaixo do limite de <b>${brl(R.limiteDia)}/dia</b>. Nesse ritmo: <b>${brl(R.ritmo)}</b> no mês.`
        : `Média de <b>${brl(R.media)}/dia</b>, acima do limite de <b>${brl(R.limiteDia)}/dia</b>. Segure em até <b>${brl(R.limiteDia)}</b> por dia.`}</div>
    </div>
    <div class="card"><h3><span>Ainda vai acontecer em ${mes}</span><button class="btn link" onclick="f2Aba('planejar')">planejar →</button></h3>
      ${prox.map(x=>`<div class="row"><span class="f2-dia">${x.d?String(x.d).padStart(2,'0'):'—'}</span><div class="grow"><b class="sm">${esc(x.desc)}</b><div class="xs mut">${x.d?'fixo':'planejado só neste mês'}${x.obs?' · '+esc(x.obs):''}</div></div><span class="lanc-v ${x.tipo==='entrada'?'ok':x.tipo==='saida'?'bad':''}">${x.tipo==='entrada'?'+':'−'} ${brl(x.v)}</span></div>`).join('') || '<p class="empty">Nada mais previsto para este mês.</p>'}
    </div>
  </div>

  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3><span>Últimos lançamentos</span><button class="btn link" onclick="f2Aba('planilha')">abrir planilha →</button></h3>
      ${ult.map(l=>`<div class="row"><div class="grow"><b class="sm">${esc(l.descricao)}</b><div class="xs mut">${fmtData(l.data)} · ${f2Tipo(l.tipo)}${l.categoria?' · '+esc(l.categoria):''}${l.observacao?' · '+esc(l.observacao):''}</div></div><span class="lanc-v ${l.tipo==='entrada'?'ok':l.tipo==='saida'?'bad':''}">${l.tipo==='entrada'||l.tipo==='resgate'?'+':'−'} ${brl(l.valor)}</span></div>`).join('') || '<p class="empty">Nada lançado ainda.</p>'}
    </div>
    <div class="card"><h3><span>Dicas para o seu dinheiro</span></h3>
      ${D.map(d=>`<div class="dica d-${d.t}"><div>${d.txt}</div></div>`).join('')}
      <div class="f2-proj">${[3,6,12].map(n=>{ const x=p[n]; return `<button onclick="verMes('${x.ym}')"><span>em ${n} meses · ${x.label}</span><b class="${x.total<0?'bad':''}">${brl(x.total)}</b></button>`; }).join('')}</div>
    </div>
  </div>`;
}

/* ================= LANÇAMENTOS (planilha) ================= */
function f2FiltraLanc(){
  const b = F2.busca.trim().toLowerCase();
  return F2.lanc.filter(l => (!F2.mes || l.data.slice(0,7)===F2.mes) && (!F2.tipo || l.tipo===F2.tipo)
    && (!b || [l.descricao,l.categoria,l.observacao].some(s=>String(s||'').toLowerCase().includes(b))));
}
function f2Planilha(){
  const L = f2FiltraLanc();
  const s = t => L.filter(l=>l.tipo===t).reduce((a,l)=>a+ +l.valor,0);
  const ent=s('entrada'), sai=s('saida'), apo=s('aporte'), rsg=s('resgate');
  const meses = [...new Set([hoje().slice(0,7), ...F2.lanc.map(l=>l.data.slice(0,7))])].sort().reverse();
  return `<div class="card">
    <h3><span>Planilha de lançamentos</span><span style="display:flex;gap:8px"><button class="btn link" onclick="f2Csv()">exportar CSV</button></span></h3>
    <p class="fin-help">Clique em qualquer célula para editar; salva sozinho ao sair do campo e o saldo é recalculado. Use <b>Observação</b> para detalhes (parcela, quem pagou, nota fiscal…).</p>
    <div class="f2-filtros">
      <select onchange="F2.mes=this.value;refresh()"><option value="">Todos os meses</option>${meses.map(m=>`<option value="${m}" ${F2.mes===m?'selected':''}>${f2NomeMes(m)}</option>`).join('')}</select>
      <div class="chips">${[['','Tudo'],...F2_TIPOS].map(([k,l])=>`<button class="${F2.tipo===k?'on':''}" onclick="F2.tipo='${k}';refresh()">${l}</button>`).join('')}</div>
      <input type="search" placeholder="Buscar descrição, categoria, observação" value="${esc(F2.busca)}" oninput="F2.busca=this.value;clearTimeout(F2.tb);F2.tb=setTimeout(()=>{refresh();setTimeout(()=>{const i=document.querySelector('.f2-filtros input[type=search]');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length);}},60)},350)">
    </div>
    <div class="f2-tot">
      <div><span>Entradas</span><b class="ok">${brl(ent+rsg)}</b></div><div><span>Saídas</span><b class="bad">${brl(sai)}</b></div>
      <div><span>Guardado</span><b>${brl(apo)}</b></div><div><span>Resultado</span><b class="${ent+rsg-sai-apo<0?'bad':'ok'}">${brl(ent+rsg-sai-apo)}</b></div>
      <div><span>Linhas</span><b>${L.length}</b></div>
    </div>
    <form id="f2nl" onsubmit="f2NovoLanc(event)"></form>
    <div class="tscroll"><table class="f2-tab">
      <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Observação</th><th></th></tr></thead>
      <tbody>
        <tr class="f2-nova"><td><input form="f2nl" name="data" type="date" value="${F2.mes && F2.mes!==hoje().slice(0,7) ? F2.mes+'-01' : hoje()}"></td>
          <td><input form="f2nl" name="descricao" placeholder="+ novo lançamento" required></td>
          <td><input form="f2nl" name="categoria" list="cats" placeholder="Categoria"></td>
          <td><select form="f2nl" name="tipo">${f2Opt(F2.tipo||'saida')}</select></td>
          <td><input form="f2nl" name="valor" class="money" inputmode="decimal" placeholder="0,00" required></td>
          <td><input form="f2nl" name="observacao" placeholder="Observação"></td>
          <td><button form="f2nl" class="btn s">Lançar</button></td></tr>
        ${L.map(l=>`<tr class="t-${l.tipo}">
          <td><input class="f2c" data-t="fin_lancamentos" data-id="${l.id}" data-k="data" type="date" value="${l.data}"></td>
          <td><input class="f2c" data-t="fin_lancamentos" data-id="${l.id}" data-k="descricao" value="${esc(l.descricao)}"></td>
          <td><input class="f2c" data-t="fin_lancamentos" data-id="${l.id}" data-k="categoria" list="cats" value="${esc(l.categoria||'')}" placeholder="—"></td>
          <td><select class="f2c" data-t="fin_lancamentos" data-id="${l.id}" data-k="tipo">${f2Opt(l.tipo)}</select></td>
          <td><input class="f2c money num" data-t="fin_lancamentos" data-id="${l.id}" data-k="valor" inputmode="decimal" value="${fmtNum(l.valor)}"></td>
          <td><input class="f2c" data-t="fin_lancamentos" data-id="${l.id}" data-k="observacao" value="${esc(l.observacao||'')}" placeholder="—"></td>
          <td><button class="ibtn" title="Excluir (desfaz no saldo)" onclick="del('fin_lancamentos','${l.id}')">✕</button></td></tr>`).join('')}
      </tbody></table></div>
    ${L.length ? '' : '<p class="empty">Nenhum lançamento com esse filtro.</p>'}
  </div>`;
}
async function f2NovoLanc(e){
  e.preventDefault();
  const f = e.target, o = Object.fromEntries(new FormData(f));
  for(const k in o) if(o[k]==='') o[k]=null;
  const v = lerValor(o.valor); if(v===null) return;
  const row = {tipo:o.tipo||'saida', valor:v, descricao:o.descricao, categoria:o.categoria, data:o.data||hoje(), observacao:o.observacao};
  if(await q(sb.from('fin_lancamentos').insert(row))===null) return;
  toast(`${f2Tipo(row.tipo)} de ${brl(v)} lançada — saldo atualizado`);
  refresh();
  setTimeout(()=>document.querySelector('.f2-nova input[name=descricao], .f2-lf input[name=valor]')?.focus(), 120);
}
function f2Csv(){
  const L = f2FiltraLanc(), c = s => `"${String(s??'').replace(/"/g,'""')}"`;
  const linhas = [['Data','Descrição','Categoria','Tipo','Valor','Observação'].join(';'), ...L.map(l=>[l.data, c(l.descricao), c(l.categoria), f2Tipo(l.tipo), fmtNum(l.valor), c(l.observacao)].join(';'))];
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['﻿'+linhas.join('\n')], {type:'text/csv;charset=utf-8'}));
  a.download = `lancamentos-${F2.mes||'todos'}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
}

/* ================= PLANEJAR MÊS ================= */
function f2Planejar(p){
  const ym = F2.pm, i = p.findIndex(x=>x.ym===ym), x = p[i];
  const disp0 = +(FIN.contas.find(c=>c.tipo==='disponivel')?.saldo||0), res0 = +(FIN.contas.find(c=>c.tipo==='reserva')?.saldo||0);
  const iniD = i===0 ? disp0 : p[i-1].disp, iniR = i===0 ? res0 : p[i-1].res;
  const ini = ym+'-01', fimMes = isoLocal(new Date(+ym.slice(0,4), +ym.slice(5,7), 0));
  const doMes = FIN.aj.filter(a=>a.mes.slice(0,7)===ym);
  const corrOf = id => doMes.find(a=>corrDe(a)?.fixo===id);
  const fixos = FIN.rec.filter(r=>r.ativo && r.inicio<=fimMes && !(r.fim && r.fim<ini));
  const extras = doMes.filter(a=>!corrDe(a));
  const atual = i===0, hj = new Date().getDate();
  const fx = fixos.map(r=>{ const c=corrOf(r.id), cd=c&&corrDe(c); return {r, pular:!!cd?.pular, v: c ? (cd.pular?0:+c.valor) : +r.valor, mudou:!!c, passou: atual && r.dia<=hj}; });
  const soma = t => fx.filter(f=>f.r.tipo===t).reduce((s,f)=>s+f.v,0) + extras.filter(a=>a.tipo===t).reduce((s,a)=>s+ +a.valor,0);
  const ent=soma('entrada'), sai=soma('saida'), apo=soma('aporte'), sobra=ent-sai-apo;
  const nav = `<div class="f2-mnav"><button class="btn g s" ${i<=0?'disabled':''} onclick="F2.pm='${f2Ym(ym,-1)}';refresh()">‹</button>
    <select onchange="F2.pm=this.value;refresh()">${p.map(m=>`<option value="${m.ym}" ${m.ym===ym?'selected':''}>${f2NomeMes(m.ym)}</option>`).join('')}</select>
    <button class="btn g s" ${i>=p.length-1?'disabled':''} onclick="F2.pm='${f2Ym(ym,1)}';refresh()">›</button></div>`;
  const tipoCls = t => t==='entrada'?'ok':t==='saida'?'bad':'';
  return `<div class="card">
    <h3><span>Planejar ${f2NomeMes(ym)}</span>${nav}</h3>
    <div class="f2-flow">
      <div><span>Começa com</span><b>${brl(iniD+iniR)}</b><small>disponível ${brl(iniD)} · guardado ${brl(iniR)}${atual?' · hoje':''}</small></div>
      <div><span>Entra</span><b class="ok">+ ${brl(ent)}</b><small>renda e extras</small></div>
      <div><span>Sai</span><b class="bad">− ${brl(sai)}</b><small>contas e gastos</small></div>
      <div><span>Guardar</span><b>${brl(apo)}</b><small>vai para a reserva</small></div>
      <div class="fim"><span>Termina com</span><b class="${x.total<0?'bad':''}">${brl(x.total)}</b><small>disponível ${brl(x.disp)} · guardado ${brl(x.res)}</small></div>
    </div>
    ${atual?'<p class="fin-help" style="margin-top:10px">No mês atual o “começa com” é o saldo de <b>hoje</b>, e só entram na conta os fixos que ainda não passaram.</p>':''}
  </div>

  <div class="grid" style="margin-top:14px">
    <div class="card"><h3><span>Fixos em ${MESES_L[+ym.slice(5,7)-1]}</span><button class="btn link" onclick="f2Aba('fixos')">editar fixos →</button></h3>
      <p class="fin-help">Mude o valor <b>só neste mês</b> (o normal continua igual nos outros) ou marque “pular”.</p>
      <div class="tscroll"><table class="f2-tab f2-tab-s">
        <thead><tr><th>Dia</th><th>Descrição</th><th>Normal</th><th>Neste mês</th><th>Pular</th></tr></thead>
        <tbody>${fx.map(f=>`<tr class="t-${f.r.tipo} ${f.pular?'f2-pulado':''}">
          <td class="mono">${String(f.r.dia).padStart(2,'0')}</td>
          <td><b class="sm">${esc(f.r.descricao)}</b><div class="xs mut">${f2Tipo(f.r.tipo)}${f.r.categoria?' · '+esc(f.r.categoria):''}${f.passou?' · já passou':''}${f.mudou&&!f.pular?' · <span class="warn">mudado neste mês</span>':''}${f.r.observacao?' · '+esc(f.r.observacao):''}</div></td>
          <td class="mono mut">${brl(f.r.valor)}</td>
          <td><input class="f2corr money num" data-fixo="${f.r.id}" data-mes="${ym}" inputmode="decimal" value="${fmtNum(f.pular?f.r.valor:f.v)}" ${f.pular?'disabled':''}></td>
          <td><input type="checkbox" class="f2pular" data-fixo="${f.r.id}" data-mes="${ym}" ${f.pular?'checked':''}></td></tr>`).join('') || '<tr><td colspan="5" class="empty">Nenhum fixo ativo neste mês.</td></tr>'}</tbody>
      </table></div>
    </div>

    <div class="card"><h3><span>Só em ${MESES_L[+ym.slice(5,7)-1]}</span></h3>
      <p class="fin-help">Gastos e ganhos que não se repetem (IPVA, 13º, viagem, venda de algo). Edite direto na tabela.</p>
      <form id="f2na" onsubmit="f2NovoAjuste(event,'${ym}')"></form>
      <div class="tscroll"><table class="f2-tab">
        <thead><tr><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Observação</th><th></th></tr></thead>
        <tbody>
          <tr class="f2-nova"><td><input form="f2na" name="descricao" placeholder="+ item do mês" required></td>
            <td><input form="f2na" name="categoria" list="cats" placeholder="Categoria"></td>
            <td><select form="f2na" name="tipo">${f2Opt('saida',F2_TIPOS_P)}</select></td>
            <td><input form="f2na" name="valor" class="money" inputmode="decimal" placeholder="0,00" required></td>
            <td><input form="f2na" name="observacao" placeholder="Observação"></td>
            <td><button form="f2na" class="btn s">+</button></td></tr>
          <tr class="f2-nova f2-rep"><td colspan="6"><label class="ck">Repetir até <input form="f2na" name="ate" type="month" min="${ym}" style="width:auto"> <span class="xs mut">(vazio = só este mês)</span></label></td></tr>
          ${extras.map(a=>`<tr class="t-${a.tipo}">
            <td><input class="f2c" data-t="fin_ajustes" data-id="${a.id}" data-k="descricao" value="${esc(a.descricao)}"></td>
            <td><input class="f2c" data-t="fin_ajustes" data-id="${a.id}" data-k="categoria" list="cats" value="${esc(a.categoria||'')}" placeholder="—"></td>
            <td><select class="f2c" data-t="fin_ajustes" data-id="${a.id}" data-k="tipo">${f2Opt(a.tipo,F2_TIPOS_P)}</select></td>
            <td><input class="f2c money num" data-t="fin_ajustes" data-id="${a.id}" data-k="valor" inputmode="decimal" value="${fmtNum(a.valor)}"></td>
            <td><input class="f2c" data-t="fin_ajustes" data-id="${a.id}" data-k="observacao" value="${esc(a.observacao||'')}" placeholder="—"></td>
            <td><span class="f2-acts"><button class="ibtn" title="Mudar de mês" onclick="f2MoverAjuste('${a.id}')">⇄</button><button class="ibtn" title="Excluir" onclick="del('fin_ajustes','${a.id}')">✕</button></span></td></tr>`).join('')}
        </tbody></table></div>
    </div>
  </div>

  <div class="card" style="margin-top:14px"><h3><span>Resultado de ${MESES_L[+ym.slice(5,7)-1]}</span></h3>
    <div class="f2-conta">${['entrada','saida','aporte'].map(t=>{ const its=[...fx.filter(f=>f.r.tipo===t&&f.v>0).map(f=>[f.r.descricao,f.v]), ...extras.filter(a=>a.tipo===t).map(a=>[a.descricao,+a.valor])];
      return `<div><span class="${tipoCls(t)}">${{entrada:'Entradas',saida:'Saídas',aporte:'Guardar'}[t]}</span>${its.map(([d,v])=>`<div class="f2-li"><span>${esc(d)}</span><b>${brl(v)}</b></div>`).join('')||'<div class="f2-li mut">—</div>'}<div class="f2-li tot"><span>Total</span><b>${brl(soma(t))}</b></div></div>`; }).join('')}</div>
    <div class="saldo-mes"><span>Sobra do mês (entradas − saídas − guardar)</span><span class="${sobra<0?'bad':'ok'}">${brl(sobra)}</span></div>
  </div>`;
}
document.addEventListener('change', async e => {
  const el = e.target;
  if(!el.classList?.contains('f2corr') && !el.classList?.contains('f2pular')) return;
  const id = el.dataset.fixo, ym = el.dataset.mes, r = FIN.rec.find(x=>x.id===id); if(!r) return;
  const pular = el.classList.contains('f2pular') ? el.checked : false;
  let v = +r.valor;
  if(!pular){ const inp = document.querySelector(`.f2corr[data-fixo="${id}"]`); v = parseMoney(inp?.value); if(isNaN(v) || v<0){ toast('Valor inválido'); return; } }
  const c = FIN.aj.find(a=>a.mes.slice(0,7)===ym && corrDe(a)?.fixo===id);
  const igual = !pular && Math.abs(v - r.valor) < .005;
  let op;
  if(igual) op = c ? sb.from('fin_ajustes').delete().eq('id',c.id) : null;
  else { const row = {mes:ym+'-01', tipo:r.tipo, valor: pular||v===0 ? r.valor : v, descricao:`↺ ${r.descricao} | fixo:${r.id} | ${pular||v===0?'pular':'valor'}`};
    op = c ? sb.from('fin_ajustes').update(row).eq('id',c.id) : sb.from('fin_ajustes').insert(row); }
  if(op && await q(op)===null) return;
  toast(pular ? `${r.descricao}: pulado em ${f2NomeMes(ym)}` : igual ? `${r.descricao}: valor normal` : `${r.descricao} em ${f2NomeMes(ym)}: ${brl(v)}`);
  refresh();
});
async function f2NovoAjuste(e, ym){
  e.preventDefault();
  const o = Object.fromEntries(new FormData(e.target)); for(const k in o) if(o[k]==='') o[k]=null;
  const v = lerValor(o.valor); if(v===null) return;
  const fim = o.ate && o.ate>ym ? o.ate : ym, rows = [];
  let m = ym; while(m<=fim && rows.length<36){ rows.push({mes:m+'-01', tipo:o.tipo, valor:v, descricao:o.descricao, categoria:o.categoria, observacao:o.observacao}); m = f2Ym(m,1); }
  if(await q(sb.from('fin_ajustes').insert(rows))===null) return;
  toast(rows.length>1 ? `Adicionado em ${rows.length} meses` : `Adicionado em ${f2NomeMes(ym)}`); refresh();
}
function f2MoverAjuste(id){
  const a = FIN.aj.find(x=>x.id===id); if(!a) return;
  modal('Mudar de mês', `<label>${esc(a.descricao)} — ${brl(a.valor)}<input name="mes" type="month" required value="${a.mes.slice(0,7)}" min="${hoje().slice(0,7)}"></label>`, async o=>{
    if(await q(sb.from('fin_ajustes').update({mes:o.mes+'-01'}).eq('id',id))===null) return false;
    toast(`Movido para ${f2NomeMes(o.mes)}`); refresh();
  }, '', 'Mover');
}

/* ================= FIXOS ================= */
function f2Fixos(){
  const R = FIN.rec.slice().sort((a,b)=>({entrada:0,saida:1,aporte:2}[a.tipo]-({entrada:0,saida:1,aporte:2}[b.tipo])) || a.dia-b.dia);
  const s = t => FIN.rec.filter(r=>r.ativo && r.tipo===t).reduce((a,r)=>a+ +r.valor,0);
  const ent=s('entrada'), sai=s('saida'), apo=s('aporte');
  return `<div class="card">
    <h3><span>Fixos todo mês</span></h3>
    <p class="fin-help">O que se repete todo mês no mesmo dia: renda, aluguel, internet, assinaturas e quanto você guarda. Mudar aqui vale para <b>todos os meses</b>; para mudar só um mês use <b>Planejar mês</b>. Desmarque “Ativo” para pausar sem apagar.</p>
    <div class="f2-tot">
      <div><span>Renda</span><b class="ok">${brl(ent)}</b></div><div><span>Gastos</span><b class="bad">${brl(sai)}</b></div>
      <div><span>Guardar</span><b>${brl(apo)}</b></div><div><span>Sobra por mês</span><b class="${ent-sai-apo<0?'bad':'ok'}">${brl(ent-sai-apo)}</b></div>
      <div><span>Gastos / renda</span><b>${ent?Math.round(sai/ent*100)+'%':'—'}</b></div>
    </div>
    <form id="f2nf" onsubmit="f2NovoFixo(event)"></form>
    <div class="tscroll"><table class="f2-tab">
      <thead><tr><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Dia</th><th>Começa</th><th>Termina</th><th>Ativo</th><th>Observação</th><th></th></tr></thead>
      <tbody>
        <tr class="f2-nova"><td><input form="f2nf" name="descricao" placeholder="+ novo fixo" required></td>
          <td><input form="f2nf" name="categoria" list="cats" placeholder="Categoria"></td>
          <td><select form="f2nf" name="tipo">${f2Opt('saida',F2_TIPOS_P)}</select></td>
          <td><input form="f2nf" name="valor" class="money" inputmode="decimal" placeholder="0,00" required></td>
          <td><input form="f2nf" name="dia" type="number" min="1" max="31" value="5" class="f2-n"></td>
          <td><input form="f2nf" name="inicio" type="month" value="${hoje().slice(0,7)}"></td>
          <td><input form="f2nf" name="fim" type="month"></td><td></td>
          <td><input form="f2nf" name="observacao" placeholder="Observação"></td>
          <td><button form="f2nf" class="btn s">+</button></td></tr>
        ${R.map(r=>`<tr class="t-${r.tipo} ${r.ativo?'':'f2-pulado'}">
          <td><input class="f2c" data-t="fin_recorrentes" data-id="${r.id}" data-k="descricao" value="${esc(r.descricao)}"></td>
          <td><input class="f2c" data-t="fin_recorrentes" data-id="${r.id}" data-k="categoria" list="cats" value="${esc(r.categoria||'')}" placeholder="—"></td>
          <td><select class="f2c" data-t="fin_recorrentes" data-id="${r.id}" data-k="tipo">${f2Opt(r.tipo,F2_TIPOS_P)}</select></td>
          <td><input class="f2c money num" data-t="fin_recorrentes" data-id="${r.id}" data-k="valor" inputmode="decimal" value="${fmtNum(r.valor)}"></td>
          <td><input class="f2c f2-n" data-t="fin_recorrentes" data-id="${r.id}" data-k="dia" type="number" min="1" max="31" value="${r.dia}"></td>
          <td><input class="f2c" data-t="fin_recorrentes" data-id="${r.id}" data-k="inicio" type="month" value="${r.inicio.slice(0,7)}"></td>
          <td><input class="f2c" data-t="fin_recorrentes" data-id="${r.id}" data-k="fim" type="month" value="${r.fim?r.fim.slice(0,7):''}"></td>
          <td><input class="f2c" data-t="fin_recorrentes" data-id="${r.id}" data-k="ativo" type="checkbox" ${r.ativo?'checked':''}></td>
          <td><input class="f2c" data-t="fin_recorrentes" data-id="${r.id}" data-k="observacao" value="${esc(r.observacao||'')}" placeholder="—"></td>
          <td><button class="ibtn" title="Excluir" onclick="del('fin_recorrentes','${r.id}')">✕</button></td></tr>`).join('')}
      </tbody></table></div>
    ${R.length ? '' : '<p class="empty">Nenhum fixo ainda. Comece pela sua renda.</p>'}
  </div>`;
}
async function f2NovoFixo(e){
  e.preventDefault();
  const o = Object.fromEntries(new FormData(e.target)); for(const k in o) if(o[k]==='') o[k]=null;
  const v = lerValor(o.valor); if(v===null) return;
  const row = {tipo:o.tipo, descricao:o.descricao, categoria:o.categoria, observacao:o.observacao, valor:v, dia:Math.min(31,Math.max(1,+o.dia||5)), inicio:(o.inicio||hoje().slice(0,7))+'-01', fim:o.fim?o.fim+'-28':null, ativo:true};
  if(await q(sb.from('fin_recorrentes').insert(row))===null) return;
  toast('Fixo salvo — projeção recalculada'); refresh();
}

/* ================= SALDOS ================= */
function f2Saldos(){
  const C = FIN.contas, tot = C.reduce((s,c)=>s+ +c.saldo,0);
  return `<div class="card"><h3><span>Quanto eu tenho agora</span></h3>
    <p class="fin-help">Coloque aqui o valor que aparece no app do banco. Isso <b>não</b> cria lançamento: só acerta o ponto de partida. Daqui em diante, cada lançamento mexe no saldo sozinho.</p>
    <div class="f2-contas">${C.map(c=>`<div class="f2-ct ${c.tipo}">
      <label>Nome<input class="f2c" data-t="fin_contas" data-id="${c.id}" data-k="nome" value="${esc(c.nome)}"></label>
      <label>${c.tipo==='reserva'?'Guardado (reserva, investimentos)':'Disponível (conta corrente)'}<input class="f2c money f2-big" data-t="fin_contas" data-id="${c.id}" data-k="saldo" inputmode="decimal" value="${fmtNum(c.saldo)}"></label>
      <label>Observação<input class="f2c" data-t="fin_contas" data-id="${c.id}" data-k="observacao" value="${esc(c.observacao||'')}" placeholder="ex.: Nubank + caixinha, CDB 100% CDI"></label>
      <small class="mut xs">Atualizado ${c.atualizado_em?fmtDH(c.atualizado_em):'—'}</small></div>`).join('')}
    </div>
    <div class="saldo-mes" style="margin-top:14px"><span>Total</span><span data-cnt="${tot.toFixed(2)}">${brl(tot)}</span></div>
  </div>`;
}

/* ================= GRÁFICOS ================= */
// largura real do card: o SVG fica em escala 1:1 e o texto não cresce nem encolhe
const f2Larg = () => Math.max(300, Math.min(1400, (document.querySelector('#view')?.clientWidth || 900) - 36));
function f2Ticks(min, max, n=4){
  const span = Math.max(1, max-min), passo0 = span/n, mag = Math.pow(10, Math.floor(Math.log10(passo0)));
  const passo = [1,2,2.5,5,10].map(k=>k*mag).find(k=>k>=passo0) || 10*mag;
  const lo = Math.floor(min/passo)*passo, hi = Math.ceil(max/passo)*passo, t=[];
  for(let v=lo; v<=hi+passo/2; v+=passo) t.push(+v.toFixed(2));
  return t;
}
function f2Legenda(series){ return series.length>1 ? `<div class="f2-leg">${series.map(s=>`<span><i style="background:${s.cor}"></i>${esc(s.nome)}</span>`).join('')}</div>` : ''; }
function f2Linhas(series, labels, dicas){
  const W=f2Larg(), H=W<600?230:290, L=W<600?44:58, R=14, T=14, B=26, iw=W-L-R, ih=H-T-B, n=labels.length, passoX=Math.ceil(n/Math.max(3,Math.floor(iw/62)));
  const todos = series.flatMap(s=>s.vals); const tk = f2Ticks(Math.min(0,...todos), Math.max(1,...todos));
  const y = v => T + ih - (v-tk[0])/(tk[tk.length-1]-tk[0])*ih, x = i => L + (n<2 ? iw/2 : i*iw/(n-1));
  const grid = tk.map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="${v===0?'f2-zero':'f2-grid'}"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" class="f2-ax">${curto(v)}</text>`).join('');
  const xl = labels.map((l,i)=> (i%passoX===0 || i===n-1&&passoX===1) ? `<text x="${x(i)}" y="${H-8}" text-anchor="middle" class="f2-ax">${esc(l)}</text>` : '').join('');
  const lin = series.map(s=>`<path d="${s.vals.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')}" fill="none" stroke="${s.cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" class="f2-line"/>`
    + s.vals.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${s.cor}" stroke="var(--card)" stroke-width="2"/>`).join('')).join('');
  const hit = labels.map((l,i)=>`<rect x="${x(i)-iw/(2*Math.max(1,n-1))}" y="${T}" width="${iw/Math.max(1,n-1)}" height="${ih}" fill="transparent" data-cx="${x(i)}" data-tip="${esc(dicas[i])}"/>`).join('');
  return `<svg class="f2g" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.map(s=>s.nome).join(' e '))}">${grid}${xl}${lin}<line class="f2-cross" y1="${T}" y2="${T+ih}" x1="-10" x2="-10"/>${hit}</svg>`;
}
function f2Barras(series, labels, dicas, {H=0}={}){
  const W=f2Larg(); H = H || (W<600?230:290); const L=W<600?44:58, R=14, T=14, B=26, iw=W-L-R, ih=H-T-B, n=labels.length, k=series.length;
  const todos = series.flatMap(s=>s.vals); const tk = f2Ticks(Math.min(0,...todos), Math.max(1,...todos));
  const y = v => T + ih - (v-tk[0])/(tk[tk.length-1]-tk[0])*ih, y0 = y(0);
  const gw = iw/n, bw = Math.max(3, Math.min(26, (gw*.72 - 2*(k-1))/k));
  const grid = tk.map(v=>`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" class="${v===0?'f2-zero':'f2-grid'}"/><text x="${L-8}" y="${y(v)+4}" text-anchor="end" class="f2-ax">${curto(v)}</text>`).join('');
  const barra = (bx, v, cor) => { const yt = y(v), h = Math.abs(y0-yt); if(h<.5) return ''; const r = Math.min(4, bw/2, h);
    return v>=0 ? `<path d="M${bx},${y0}V${yt+r}Q${bx},${yt} ${bx+r},${yt}H${bx+bw-r}Q${bx+bw},${yt} ${bx+bw},${yt+r}V${y0}Z" fill="${cor}"/>`
      : `<path d="M${bx},${y0}V${yt-r}Q${bx},${yt} ${bx+r},${yt}H${bx+bw-r}Q${bx+bw},${yt} ${bx+bw},${yt-r}V${y0}Z" fill="${cor}"/>`; };
  const bars = labels.map((l,i)=>{ const gx = L + i*gw + (gw - (k*bw + 2*(k-1)))/2;
    return `<g class="f2-bg" data-tip="${esc(dicas[i])}"><rect x="${L+i*gw}" y="${T}" width="${gw}" height="${ih}" class="f2-hit"/>${series.map((s,j)=>barra(gx + j*(bw+2), s.vals[i]||0, s.cor)).join('')}</g>`; }).join('');
  const xl = labels.map((l,i)=> (i%Math.ceil(n/Math.max(3,Math.floor(iw/46)))===0) ? `<text x="${L+i*gw+gw/2}" y="${H-8}" text-anchor="middle" class="f2-ax">${esc(l)}</text>` : '').join('');
  return `<svg class="f2g" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(series.map(s=>s.nome).join(' e '))}">${grid}${bars}${xl}</svg>`;
}
const f2Tabela = (cab, linhas) => `<details class="f2-tv"><summary>ver em tabela</summary><div class="tscroll"><table><thead><tr>${cab.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${linhas.map(l=>`<tr>${l.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;

function f2Graficos(p){
  const chips = `<div class="chips f2-gchips">${F2_GRAFS.map(([k,l])=>`<button class="${F2.graf===k?'on':''}" onclick="F2.graf='${k}';f2Salva();window.motionProximo?.();refresh()">${l}</button>`).join('')}</div>`;
  let corpo = '';
  if(F2.graf==='proj'){
    const lab = p.map(x=>x.label), sD = {nome:'Disponível', cor:F2_COR.a, vals:p.map(x=>x.disp)}, sR = {nome:'Guardado', cor:F2_COR.b, vals:p.map(x=>x.res)};
    const neg = p.find(x=>x.disp<0);
    corpo = `<div class="card"><h3><span>Projeção dos próximos 12 meses</span><span class="xs mut" style="text-transform:none;letter-spacing:0">saldo no fim de cada mês</span></h3>
      <p class="fin-help">Parte do saldo de hoje e aplica os fixos e o planejamento de cada mês. ${neg?`<b class="bad">O disponível fica negativo em ${neg.label}.</b>`:'O disponível não fica negativo em nenhum mês.'} Clique em um mês na tabela para planejar.</p>
      ${f2Legenda([sD,sR])}
      ${f2Linhas([sD,sR], lab, p.map(x=>`<b>${x.label}</b><br>Disponível: ${brl(x.disp)}<br>Guardado: ${brl(x.res)}<br>Total: ${brl(x.total)}<br><span>entra ${brl(x.ent)} · sai ${brl(x.sai)}</span>`))}
      ${f2Tabela(['Mês','Entra','Sai','Guardar','Disponível','Guardado','Total'], p.map(x=>[`<button class="btn link" onclick="verMes('${x.ym}')">${x.label}</button>`, brl(x.ent), brl(x.sai), brl(x.apo), brl(x.disp), brl(x.res), `<b>${brl(x.total)}</b>`]))}</div>`;
  } else if(F2.graf==='fluxo'){
    let lab, E, S, G;
    if(F2.gmodo==='real'){
      const ms = []; for(let i=5;i>=0;i--) ms.push(f2Ym(hoje().slice(0,7), -i));
      const soma = (m,t) => F2.lanc.filter(l=>l.data.slice(0,7)===m && l.tipo===t).reduce((s,l)=>s+ +l.valor,0);
      lab = ms.map(m=>MESES[+m.slice(5,7)-1]+'/'+m.slice(2,4)); E = ms.map(m=>soma(m,'entrada')+soma(m,'resgate')); S = ms.map(m=>soma(m,'saida')); G = ms.map(m=>soma(m,'aporte'));
    } else { lab = p.map((x,i)=>i===0?x.label+' (resto)':x.label); E = p.map(x=>x.ent); S = p.map(x=>x.sai); G = p.map(x=>x.apo); }
    const sE = {nome:'Entradas', cor:F2_COR.a, vals:E}, sS = {nome:'Saídas', cor:F2_COR.b, vals:S}, sG = {nome:'Guardado', cor:F2_COR.c, vals:G};
    const ser = G.some(v=>v>0) ? [sE,sS,sG] : [sE,sS];
    corpo = `<div class="card"><h3><span>Entradas × saídas por mês</span></h3>
      <div class="chips"><button class="${F2.gmodo==='real'?'on':''}" onclick="F2.gmodo='real';refresh()">Real (últimos 6 meses)</button><button class="${F2.gmodo!=='real'?'on':''}" onclick="F2.gmodo='plan';refresh()">Planejado (próximos 12)</button></div>
      <p class="fin-help">${F2.gmodo==='real'?'O que foi lançado de verdade em cada mês.':'O que está nos fixos e no planejamento. O mês atual mostra só o que ainda falta acontecer.'}</p>
      ${f2Legenda(ser)}
      ${f2Barras(ser, lab, lab.map((l,i)=>`<b>${l}</b><br>Entradas: ${brl(E[i])}<br>Saídas: ${brl(S[i])}${G[i]?`<br>Guardado: ${brl(G[i])}`:''}<br>Sobra: ${brl(E[i]-S[i]-G[i])}`))}
      ${f2Tabela(['Mês','Entradas','Saídas','Guardado','Sobra'], lab.map((l,i)=>[l, brl(E[i]), brl(S[i]), brl(G[i]), `<b class="${E[i]-S[i]-G[i]<0?'bad':''}">${brl(E[i]-S[i]-G[i])}</b>`]))}</div>`;
  } else if(F2.graf==='cat'){
    const m = new Map(), add = (k, v) => { const c = (k||'Sem categoria').trim(), key = c.toLowerCase(); const o = m.get(key)||{nome:c.charAt(0).toUpperCase()+c.slice(1), v:0, n:0}; o.v+=v; o.n++; m.set(key,o); };
    if(F2.gmodo==='real') F2.lanc.filter(l=>l.tipo==='saida' && l.data.slice(0,7)===F2.gmes).forEach(l=>add(l.categoria, +l.valor));
    else { const D = detalheMes(F2.gmes); D.grupos[1].its.filter(i=>!i.pulado && i.valor>0).forEach(i=>{ const src = i.fixo ? FIN.rec.find(r=>r.id===i.id) : FIN.aj.find(a=>a.id===i.id); add(src?.categoria || i.desc, i.valor); }); }
    const arr = [...m.values()].sort((a,b)=>b.v-a.v), tot = arr.reduce((s,x)=>s+x.v,0), max = Math.max(1, ...arr.map(x=>x.v));
    const meses = [...new Set([hoje().slice(0,7), ...F2.lanc.map(l=>l.data.slice(0,7)), ...p.map(x=>x.ym)])].sort().reverse();
    corpo = `<div class="card"><h3><span>Gastos por categoria</span></h3>
      <div class="f2-filtros"><div class="chips"><button class="${F2.gmodo==='real'?'on':''}" onclick="F2.gmodo='real';refresh()">Gasto real</button><button class="${F2.gmodo!=='real'?'on':''}" onclick="F2.gmodo='plan';refresh()">Planejado</button></div>
        <select onchange="F2.gmes=this.value;refresh()">${meses.map(x=>`<option value="${x}" ${x===F2.gmes?'selected':''}>${f2NomeMes(x)}</option>`).join('')}</select></div>
      ${arr.length ? `<div class="f2-hb">${arr.map(x=>`<div class="f2-hr" data-tip="${esc(`<b>${esc(x.nome)}</b><br>${brl(x.v)} · ${(x.v/tot*100).toFixed(0)}% do total<br>${x.n} ${x.n>1?'itens':'item'}`)}"><span class="f2-hn" title="${esc(x.nome)}">${esc(x.nome)}</span><span class="f2-ht"><i style="width:${(x.v/max*100).toFixed(1)}%;background:${F2_COR.a}"></i></span><b>${brl(x.v)}</b><small>${(x.v/tot*100).toFixed(0)}%</small></div>`).join('')}</div>
        <div class="saldo-mes"><span>Total de saídas em ${f2NomeMes(F2.gmes)}</span><span>${brl(tot)}</span></div>`
        : `<p class="empty">${F2.gmodo==='real'?'Nenhum gasto lançado nesse mês. Lance com categoria para ver aqui.':'Nada planejado nesse mês.'}</p>`}
      ${arr.length?f2Tabela(['Categoria','Valor','%','Itens'], arr.map(x=>[esc(x.nome), brl(x.v), (x.v/tot*100).toFixed(1)+'%', x.n])):''}</div>`;
  } else {
    const ym = F2.gmes, nd = new Date(+ym.slice(0,4), +ym.slice(5,7), 0).getDate(), dias = [], vals = [];
    for(let d=1; d<=nd; d++){ const ds = `${ym}-${String(d).padStart(2,'0')}`; dias.push(String(d)); vals.push(F2.lanc.filter(l=>l.tipo==='saida' && l.data===ds).reduce((s,l)=>s+ +l.valor,0)); }
    const tot = vals.reduce((a,b)=>a+b,0), ativos = ym===hoje().slice(0,7) ? new Date().getDate() : nd, media = tot/Math.max(1,ativos);
    const meses = [...new Set([hoje().slice(0,7), ...F2.lanc.map(l=>l.data.slice(0,7))])].sort().reverse();
    const R = resumoDoMes(p);
    corpo = `<div class="card"><h3><span>Gasto por dia</span><select style="width:auto" onchange="F2.gmes=this.value;refresh()">${meses.map(x=>`<option value="${x}" ${x===ym?'selected':''}>${f2NomeMes(x)}</option>`).join('')}</select></h3>
      <p class="fin-help">Total ${brl(tot)} · média ${brl(media)}/dia${ym===hoje().slice(0,7)?` · limite para não passar do zero: <b>${brl(R.limiteDia)}/dia</b>`:''}</p>
      ${f2Barras([{nome:'Gasto', cor:F2_COR.a, vals}], dias, dias.map((d,i)=>{ const ds=`${ym}-${d.padStart(2,'0')}`, its=F2.lanc.filter(l=>l.tipo==='saida'&&l.data===ds); return `<b>${fmtData(ds)}</b><br>${brl(vals[i])}${its.slice(0,5).map(l=>`<br><span>${esc(l.descricao)}: ${brl(l.valor)}</span>`).join('')}`; }), {H:240})}
      ${f2Tabela(['Dia','Gasto'], dias.map((d,i)=>[d, brl(vals[i])]).filter(r=>r[1]!==brl(0)))}</div>`;
  }
  return chips + corpo;
}
// dica flutuante dos gráficos + linha vertical que acompanha o mouse
(function(){
  let tip = null;
  const mostra = (el, ev) => {
    if(!tip){ tip = document.createElement('div'); tip.className='f2-tip'; document.body.appendChild(tip); }
    tip.innerHTML = el.dataset.tip; tip.style.display='block';
    const r = tip.getBoundingClientRect(), x = Math.min(window.innerWidth - r.width - 8, ev.clientX + 14), y = Math.max(8, ev.clientY - r.height - 12);
    tip.style.left = Math.max(8,x)+'px'; tip.style.top = y+'px';
    const svg = el.closest('svg'), cx = el.dataset.cx;
    if(svg && cx){ const l = svg.querySelector('.f2-cross'); if(l){ l.setAttribute('x1',cx); l.setAttribute('x2',cx); } }
  };
  const some = () => { if(tip) tip.style.display='none'; document.querySelectorAll('.f2-cross').forEach(l=>{ l.setAttribute('x1',-10); l.setAttribute('x2',-10); }); };
  document.addEventListener('pointermove', e => { const el = e.target.closest?.('[data-tip]'); if(el && el.closest('.f2-corpo')) mostra(el, e); else if(tip && tip.style.display==='block') some(); });
  document.addEventListener('pointerleave', some);
  window.addEventListener('scroll', some, {passive:true});
})();

/* ================= ASSISTENTE IA ================= */
function f2IA(){
  const C = F2.chat || [];
  return `<div class="grid f2-ia">
    <div class="card fac-chat"><h3><span>Assistente de finanças</span>${C.length?'<button class="btn link" onclick="f2LimparChat()">limpar conversa</button>':''}</h3>
      <div class="fac-msgs f2-msgs" id="f2-msgs">${C.map(m=>`<div class="fac-m ${m.papel}"><div class="fac-md sm">${m.papel==='assistant'?facMd(m.conteudo):`<p class="pre">${esc(m.conteudo)}</p>`}</div>
        ${Array.isArray(m.acoes)&&m.acoes.length?`<ul class="f2-acoes">${m.acoes.map(a=>`<li class="${a.ok?'ok':'bad'}">${a.ok?'✓':'✕'} ${esc(a.resumo)}</li>`).join('')}</ul>`:''}
        <span class="xs mut mono">${fmtDH(m.criado_em)}</span></div>`).join('')
        || `<div class="f2-vazio"><b>Converse com a sua planilha.</b><p class="sm mut">Ela vê tudo: saldos, fixos, planejamento, lançamentos e a projeção de 12 meses. Pode lançar gastos, corrigir saldo, planejar meses, mudar fixos e responder dúvidas. Cada alteração aparece listada embaixo da resposta.</p></div>`}
        ${F2.ocupado?'<div class="fac-m assistant f2-pensando"><span></span><span></span><span></span></div>':''}</div>
      <div class="quick">${F2_SUG.map(t=>`<button class="btn g s" ${F2.ocupado?'disabled':''} onclick="f2Enviar(${esc(JSON.stringify(t))})">${esc(t)}</button>`).join('')}</div>
      <form class="f" onsubmit="event.preventDefault();f2Enviar()">
        <textarea id="f2-msg" rows="3" placeholder="Ex.: gastei 120 no mercado ontem · recebi 800 de um cliente · em janeiro vou pagar IPVA de 1.400" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.form.requestSubmit()}">${esc(F2.rasc||'')}</textarea>
        <button class="btn" ${F2.ocupado?'disabled':''}>Enviar</button></form>
      <p class="xs mut" style="margin-top:6px">Enter envia · Shift+Enter quebra linha</p></div>
  </div>`;
}
function f2RolarChat(){ const b = $('#f2-msgs'); if(b) b.scrollTop = b.scrollHeight; }
function f2Perguntar(t){ t = String(t||'').trim(); if(!t) return; F2.aba='ia'; f2Salva(); window.motionProximo?.(); f2Enviar(t); }
async function f2Enviar(texto){
  const ta = $('#f2-msg'), msg = String(texto ?? ta?.value ?? '').trim();
  if(!msg || F2.ocupado) return;
  F2.rasc = '';
  F2.chat = [...(F2.chat||[]), {papel:'user', conteudo:msg, criado_em:new Date().toISOString()}];
  F2.ocupado = true; refresh();
  try{
    const {data, error} = await sb.functions.invoke('financas-ia', {body:{mensagem:msg}});
    if(error){ let m = error.message; try{ const j = await error.context?.json?.(); if(j?.erro) m = j.erro; }catch(e){} toast('Assistente: '+m); F2.rasc = msg; }
    else if(data?.acoes?.length) toast(`${data.acoes.filter(a=>a.ok).length} alteração(ões) feita(s) na planilha`);
  } finally { F2.ocupado = false; F2.chat = null; refresh(); }
}
async function f2LimparChat(){
  if(!confirm('Apagar a conversa com o assistente de finanças? (a planilha não muda)')) return;
  const {error} = await sb.functions.invoke('financas-ia', {body:{acao:'limpar'}});
  if(error){ toast('Erro ao limpar'); return; }
  F2.chat = []; refresh();
}
