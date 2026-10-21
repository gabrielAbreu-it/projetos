/* ================= FINANÇAS ================= */
let FIN = {};
const CATS_RAPIDAS = ['Atendimento','Materiais','Aluguel do espaço','Contas','Divulgação','Cursos','Transporte','Pessoal','Outros'];

function aplicar(st, tipo, v){ v=Number(v); if(tipo==='entrada') st.disp+=v; else if(tipo==='saida') st.disp-=v; else if(tipo==='aporte'){ st.disp-=v; st.res+=v; } }
// correção de um fixo num mês específico fica salva como planejamento marcado "| fixo:<id> | valor|pular"
const RE_CORR = /\|\s*fixo:([\w-]+)\s*\|\s*(valor|pular)\s*$/;
const corrDe = a => { const m = (a.descricao||'').match(RE_CORR); return m ? {fixo:m[1], pular:m[2]==='pular'} : null; };
function projetar({contas, rec, aj}, meses=12, now=new Date()){
  const diaHoje = now.getDate();
  const st = {disp:Number(contas.find(c=>c.tipo==='disponivel')?.saldo||0), res:Number(contas.find(c=>c.tipo==='reserva')?.saldo||0)};
  const out = [];
  for(let i=0;i<=meses;i++){
    const m = new Date(now.getFullYear(), now.getMonth()+i, 1);
    const ini = isoLocal(m), fimMes = isoLocal(new Date(m.getFullYear(), m.getMonth()+1, 0));
    let ent=0, sai=0, apo=0;
    const soma = (tipo,v)=>{ aplicar(st,tipo,v); if(tipo==='entrada') ent+=+v; else if(tipo==='saida') sai+=+v; else apo+=+v; };
    const doMes = aj.filter(a=>a.mes.slice(0,7) === ini.slice(0,7));
    const corr = {}; doMes.forEach(a=>{ const c=corrDe(a); if(c) corr[c.fixo] = c.pular ? 0 : +a.valor; });
    for(const r of rec){
      if(!r.ativo || r.inicio > fimMes || (r.fim && r.fim < ini)) continue;
      if(i===0 && r.dia <= diaHoje) continue;
      const v = r.id in corr ? corr[r.id] : r.valor;
      if(v>0) soma(r.tipo, v);
    }
    for(const a of doMes){ if(!corrDe(a)) soma(a.tipo, a.valor); }
    out.push({i, ym:ini.slice(0,7), label: MESES[m.getMonth()]+'/'+String(m.getFullYear()).slice(2), ent, sai, apo, disp:st.disp, res:st.res, total:st.disp+st.res, mexido:doMes.length});
  }
  return out;
}
const AJUDA_TIPO = {
  entrada:'<b>Entrada</b>: dinheiro que entrou (atendimento, Pix de cliente, curso que você deu). Soma no <b>Disponível</b>.',
  saida:'<b>Saída</b>: dinheiro que saiu (materiais, aluguel do espaço, conta paga). Subtrai do <b>Disponível</b>.',
  aporte:'<b>Guardar</b>: você tirou do Disponível e colocou na reserva/investimento. O total não muda, só troca de lugar.',
  resgate:'<b>Tirar da reserva</b>: você pegou dinheiro guardado e trouxe para o Disponível. O total não muda.'
};
function ajudaTipo(sel, alvo){ $(alvo).innerHTML = AJUDA_TIPO[sel.value]||''; }
const rotTipo = t => ({entrada:'Entrada',saida:'Saída',aporte:'Guardar',resgate:'Resgate'})[t]||t;
const fmtMes = s => { const [y,m]=s.split('-'); return MESES[+m-1]+'/'+y.slice(2); };
const somaRecT = t => FIN.rec.filter(r=>r.ativo&&r.tipo===t).reduce((s,r)=>s+ +r.valor,0);
const optTipos = (sel, comResgate=false) => [['entrada','Entrada — recebi'],['saida','Saída — paguei/gastei'],['aporte','Guardar — mandei pra reserva'],...(comResgate?[['resgate','Tirar da reserva']]:[])].map(([k,l])=>`<option value="${k}" ${sel===k?'selected':''}>${l}</option>`).join('');

/* ----- resumo do mês: quanto tinha, quanto gastou, média e limite por dia ----- */
function resumoDoMes(p){
  const n = new Date(), dia = n.getDate(), diasMes = new Date(n.getFullYear(), n.getMonth()+1, 0).getDate(), restam = diasMes - dia + 1;
  const disp = +(FIN.contas.find(c=>c.tipo==='disponivel')?.saldo||0);
  const soma = t => FIN.lanc.filter(l=>l.tipo===t).reduce((s,l)=>s+ +l.valor,0);
  const ent = soma('entrada'), sai = soma('saida'), apo = soma('aporte'), res = soma('resgate');
  const inicio = disp - ent + sai + apo - res;          // quanto tinha no dia 1 (saldo de hoje desfazendo os lançamentos do mês)
  const teveNoMes = inicio + ent + res;                  // tudo que passou pela sua mão no mês
  const pct = teveNoMes>0 ? sai/teveNoMes*100 : 0;
  const media = sai / dia;                               // média gasta por dia até hoje
  const ritmo = media * diasMes;                         // quanto vai gastar no mês se continuar assim
  const fimMes = p && p[0] ? p[0].disp : disp;           // disponível previsto no fim do mês (já contando fixos que faltam)
  const limiteDia = Math.max(0, fimMes) / restam;        // quanto pode gastar por dia sem passar do zero
  return {dia, diasMes, restam, disp, ent, sai, apo, res, inicio, teveNoMes, pct, media, ritmo, fimMes, limiteDia};
}

/* ----- detalhamento de um mês: fixos (com correção do mês) + itens só daquele mês, agrupados e somados ----- */
function detalheMes(ym){
  const ini = ym+'-01', fimMes = isoLocal(new Date(+ym.slice(0,4), +ym.slice(5,7), 0));
  const doMes = FIN.aj.filter(a=>a.mes.slice(0,7)===ym);
  const corr = {}; doMes.forEach(a=>{ const c=corrDe(a); if(c) corr[c.fixo] = {v:c.pular?0:+a.valor, pular:c.pular}; });
  const atual = ym===hoje().slice(0,7), diaHoje = new Date().getDate();
  const itens = [];
  for(const r of FIN.rec){
    if(!r.ativo || r.inicio > fimMes || (r.fim && r.fim < ini)) continue;
    const c = corr[r.id];
    itens.push({fixo:true, id:r.id, tipo:r.tipo, desc:r.descricao, valor:c?c.v:+r.valor, pulado:c?.pular, corrigido:!!c&&!c.pular, passou:atual&&r.dia<=diaHoje, dia:r.dia});
  }
  for(const a of doMes) if(!corrDe(a)) itens.push({fixo:false, id:a.id, tipo:a.tipo, desc:a.descricao, valor:+a.valor});
  const grupos = ['entrada','saida','aporte'].map(t=>{
    const its = itens.filter(i=>i.tipo===t);
    const validos = its.filter(i=>!i.pulado && i.valor>0);
    return {tipo:t, its, total:validos.reduce((s,i)=>s+i.valor,0), formula:validos.map(i=>fmtNum(i.valor)).join(' + ')};
  });
  return {grupos, saldo: grupos[0].total - grupos[1].total - grupos[2].total};
}
const NOME_GRP = {entrada:'Entradas', saida:'Saídas', aporte:'Guardar'};
function cardMes(){
  const ym = FIN.mesSel, D = detalheMes(ym);
  const titulo = `${MESES_L[+ym.slice(5,7)-1]} de ${ym.slice(0,4)}`;
  return `<div class="card" id="cardMes"><h3><span>Planejar · ${titulo}</span></h3>
    <div class="mes-h"><button class="btn g s" onclick="trocaMes(-1)">‹</button><input type="month" value="${ym}" onchange="FIN.mesSel=this.value;refresh()"><button class="btn g s" onclick="trocaMes(1)">›</button>
      <button class="btn g s" onclick="corrigirMes('${ym}')">✎ Mudar fixos só neste mês</button></div>
    <p class="xs mut">Tudo que entra e sai em ${titulo}: os fixos e os itens que acontecem <b>só neste mês</b>, cada um descrito e somado.</p>
    ${D.grupos.map(g=>`<div class="grp"><div class="grp-h"><span>${NOME_GRP[g.tipo]}</span><span class="${g.tipo==='entrada'?'ok':g.tipo==='saida'?'bad':''}">${brl(g.total)}</span></div>
      ${g.its.map(i=>`<div class="grp-it"><div class="grow"><b>${esc(i.desc)}</b> <span class="xs mut">${i.fixo?'fixo · dia '+i.dia:'só neste mês'}${i.corrigido?' · valor mudado neste mês':''}${i.passou?' · já aconteceu':''}</span></div>
        <span class="${i.pulado?'mut':''}">${i.pulado?'pulado':brl(i.valor)}</span>
        ${i.fixo?`<button class="ibtn" title="Mudar só neste mês" onclick="corrigirMes('${ym}')">✎</button>`:`<button class="ibtn" title="Editar ou mudar de mês" onclick="editarAjuste('${i.id}')">✎</button><button class="ibtn" onclick="del('fin_ajustes','${i.id}')">✕</button>`}</div>`).join('') || '<div class="grp-it mut">Nada.</div>'}
      ${g.formula.includes('+')?`<div class="grp-f">${g.formula} = <b>${brl(g.total)}</b></div>`:''}</div>`).join('')}
    <div class="saldo-mes"><span>Sobra do mês (entradas − saídas − guardar)</span><span class="${D.saldo<0?'bad':'ok'}">${brl(D.saldo)}</span></div>
    <form class="add-mes" onsubmit="addAjuste(event)">
      <div class="help"><b>Gasto ou ganho só de ${MESES_L[+ym.slice(5,7)-1]}</b> — ex.: curso de especialização, compra grande de materiais, mês de noivas mais cheio. Se for durar alguns meses, escolha até quando.</div>
      <select name="tipo">${optTipos('saida')}</select>
      ${moneyIn('valor')}
      <input name="descricao" placeholder="Descrição (ex.: curso de fibra, cabine nova)" required>
      <label>Repetir até (opcional — vazio = só este mês)<input name="ate" type="month" min="${ym}"></label>
      <button class="btn">+ Adicionar</button>
    </form></div>`;
}
function trocaMes(n){ const [y,m]=FIN.mesSel.split('-').map(Number); const d=new Date(y,m-1+n,1); FIN.mesSel=isoLocal(d).slice(0,7); refresh(); }
function verMes(ym){ FIN.mesSel = ym; abrirPlanejar(true); }

/* ----- gráfico de pizza: para onde vai o dinheiro ----- */
const PAL = ['#d4708f','#d9a441','#9a7bd8','#5fb3c4','#e08a6a','#b98a6a','#8fa9d9','#c27bb0'];
const COR_GUARDAR = '#2bb784', COR_SOBRA = '#6b6470';
const capital = s => { s=String(s||'').trim(); return s ? s.charAt(0).toUpperCase()+s.slice(1) : 'Sem categoria'; };
function dadosPizza(){
  const m = new Map(); // chave minúscula -> {nome, v}
  const add = (nome, v) => { const k=nome.toLowerCase(); const o=m.get(k)||{nome:capital(nome), v:0}; o.v+=v; m.set(k,o); };
  let guardar=0, sobra=0, entradas=0;
  if(FIN.pieModo==='real'){
    FIN.lanc.forEach(l=>{ if(l.tipo==='saida') add(l.categoria||l.descricao||'Outros', +l.valor); else if(l.tipo==='aporte') guardar += +l.valor; });
  } else {
    const D = detalheMes(FIN.mesSel);
    D.grupos[1].its.filter(i=>!i.pulado&&i.valor>0).forEach(i=>add(i.desc, i.valor));
    guardar = D.grupos[2].total; entradas = D.grupos[0].total; sobra = Math.max(0, D.saldo);
  }
  let arr = [...m.values()].filter(x=>x.v>0).sort((a,b)=>b.v-a.v);
  if(arr.length>6){ const resto = arr.slice(5).reduce((s,x)=>s+x.v,0); arr = [...arr.slice(0,5), {nome:`Outros (${arr.length-5})`, v:resto}]; }
  arr = arr.map((x,i)=>({...x, cor:PAL[i%PAL.length]}));
  if(guardar>0) arr.push({nome: FIN.pieModo==='real'?'Guardado':'Guardar', v:guardar, cor:COR_GUARDAR});
  if(sobra>0) arr.push({nome:'Sobra livre', v:sobra, cor:COR_SOBRA});
  const total = arr.reduce((s,x)=>s+x.v,0);
  return {arr: arr.map(x=>({...x, pct: total? x.v/total*100 : 0})), total, entradas, gastos: arr.filter(x=>x.cor!==COR_GUARDAR&&x.cor!==COR_SOBRA).reduce((s,x)=>s+x.v,0)};
}
function svgPizza({arr,total}, centro){
  const r=62, C=2*Math.PI*r; let acc=0;
  const fatias = arr.map(x=>{ const len = x.v/total*C; const gap = arr.length>1 ? Math.min(2,len*.3) : 0;
    const el = `<circle class="sl" r="${r}" cx="85" cy="85" fill="none" stroke="${x.cor}" stroke-width="26" stroke-dasharray="${Math.max(0,len-gap)} ${C}" stroke-dashoffset="${-acc}" transform="rotate(-90 85 85)"><title>${esc(x.nome)}: ${brl(x.v)} (${x.pct.toFixed(0)}%)</title></circle>`;
    acc += len; return el; }).join('');
  return `<svg viewBox="0 0 170 170" role="img" aria-label="Distribuição do dinheiro"><circle r="${r}" cx="85" cy="85" fill="none" stroke="var(--card2)" stroke-width="26"/>${fatias}
    <text x="85" y="80" text-anchor="middle" fill="var(--mut)" font-size="10">${centro}</text>
    <text x="85" y="97" text-anchor="middle" fill="var(--txt)" font-size="14" font-weight="700">${esc(curto(total))}</text></svg>`;
}
// barras simples reutilizáveis: [{l:rótulo, v:valor, t:dica, cor, sel}]
function barras(items, fmt, h=120){
  const max = Math.max(1, ...items.map(x=>Math.abs(x.v||0)));
  return `<div class="bars" style="height:${h}px">${items.map(x=>`<div class="bc ${x.sel?'sel':''}" title="${esc(x.t||'')}" ${x.on?`onclick="${x.on}"`:''}><span>${x.v==null||x.v===0?'':fmt(x.v)}</span><i style="height:calc((100% - 16px) * ${Math.max(.015,Math.abs(x.v||0)/max).toFixed(4)});${x.cor?`background:${x.cor};`:''}"></i></div>`).join('')}</div>
    <div class="blbl">${items.map(x=>`<span>${x.l}</span>`).join('')}</div>`;
}

/* ----- dicas automáticas ----- */
function dicas(pz){
  const D = detalheMes(hoje().slice(0,7));
  const renda = somaRecT('entrada') || D.grupos[0].total;
  const gastos = somaRecT('saida') || D.grupos[1].total;
  const guardar = somaRecT('aporte') || D.grupos[2].total;
  const reserva = +(FIN.contas.find(c=>c.tipo==='reserva')?.saldo||0);
  const L = [];
  if(!renda){
    L.push({t:'info',txt:'Cadastre em <b>Planejar meses → Fixos</b> quanto costuma entrar por mês com os atendimentos e seus gastos fixos (aluguel do espaço, materiais, contas). Com isso eu calculo quanto guardar e quanto da renda vai para custos.'});
  } else {
    const pg = gastos/renda*100, pp = guardar/renda*100;
    if(pg>70) L.push({t:'bad',txt:`Seus gastos fixos levam <b>${pg.toFixed(0)}%</b> do que entra. Uma referência saudável é até <b>50–60%</b>. Corte primeiro o que não é essencial.`});
    else if(pg>50) L.push({t:'warn',txt:`Gastos fixos em <b>${pg.toFixed(0)}%</b> do que entra. Está ok, mas tente trazer para perto de 50% (regra 50/30/20: 50% essenciais, 30% estilo de vida, 20% futuro).`});
    else if(gastos) L.push({t:'ok',txt:`Gastos fixos em <b>${pg.toFixed(0)}%</b> do que entra — dentro da faixa saudável (até 50%).`});
    if(pp<10) L.push({t:'warn',txt:`Você guarda <b>${pp.toFixed(0)}%</b> do que entra. Meta mínima: <b>10–20%</b> — algo como <b>${brl(renda*.15)}/mês</b>. Cadastre um fixo “Guardar” no dia em que o dinheiro costuma entrar.`});
    else if(pp<20) L.push({t:'ok',txt:`Você guarda <b>${pp.toFixed(0)}%</b> do que entra. Bom! Chegar a 20% (${brl(renda*.2)}/mês) acelera bastante a reserva.`});
    else L.push({t:'ok',txt:`Você guarda <b>${pp.toFixed(0)}%</b> do que entra — excelente. Mantenha a constância.`});
  }
  if(gastos>0){
    const meses = reserva/gastos, meta = gastos*6;
    if(meses<6) L.push({t: meses<3?'bad':'warn', txt:`Sua reserva cobre <b>${meses.toLocaleString('pt-BR',{maximumFractionDigits:1})} ${meses>=1&&meses<2?'mês':'meses'}</b> de gastos. Meta: <b>6 meses</b> (${brl(meta)}) — faltam <b>${brl(meta-reserva)}</b>.${guardar>0?` No ritmo atual, ~${Math.ceil((meta-reserva)/guardar)} meses.`:''} Ela segura os meses mais fracos de agenda.`});
    else L.push({t:'ok',txt:`Reserva de emergência cobre <b>${meses.toLocaleString('pt-BR',{maximumFractionDigits:1})} meses</b> de gastos — meta de 6 meses atingida. O excedente pode ir para objetivos de médio/longo prazo.`});
  }
  const proxNeg = projetar(FIN).find(x=>x.disp<0);
  if(proxNeg) L.push({t:'bad',txt:`Pela projeção, seu <b>disponível fica negativo em ${proxNeg.label}</b>. Reveja os gastos ou o que está planejado para esse mês.`});
  if(pz.total && pz.arr[0] && !/^guard/i.test(pz.arr[0].nome) && pz.arr[0].pct>=35) L.push({t:'info',txt:`<b>${esc(pz.arr[0].nome)}</b> é ${pz.arr[0].pct.toFixed(0)}% do que sai. É o primeiro lugar para olhar se precisar cortar.`});
  if(!FIN.lanc.length) L.push({t:'info',txt:'Lance cada atendimento e cada gasto em <b>+ Lançar</b>, com categoria. Assim o gráfico “Gasto real” mostra exatamente para onde o dinheiro foi.'});
  L.push({t:'info',txt:'<b>Separe o dinheiro do estúdio do pessoal:</b> defina quanto você tira por mês para você e lance as compras pessoais na categoria “Pessoal”.'});
  return L;
}

/* ----- formulário de lançamento em passos ----- */
function escolheCat(btn, nome){
  const f = btn.closest('form'); f.categoria.value = nome;
  f.querySelectorAll('.catq button').forEach(b=>b.classList.toggle('on', b===btn));
}
function formLancHTML(){
  return `<div class="passo"><i>1</i>O que aconteceu?</div>
    <div class="tiles">${[['saida','Gastei','comprei ou paguei algo'],['entrada','Recebi','atendimento ou outro ganho'],['aporte','Guardei','mandei para a reserva'],['resgate','Tirei da reserva','peguei do dinheiro guardado']].map(([k,t,s],i)=>`<label class="tile ${k}"><input type="radio" name="tipo" value="${k}" ${i===0?'checked':''}><div><b>${t}</b><small>${s}</small></div></label>`).join('')}</div>
    <div class="passo"><i>2</i>Quanto?</div>${moneyIn('valor','',true,'ex.: 30 ou 1.250,90')}
    <div class="passo"><i>3</i>Com o quê?</div>
    <input name="descricao" placeholder="ex.: alongamento Ana, gel, aluguel" required>
    <input name="categoria" list="cats" placeholder="Categoria (opcional)">
    <div class="catq">${CATS_RAPIDAS.map(c=>`<button type="button" onclick="escolheCat(this,'${c}')">${c}</button>`).join('')}</div>
    <div class="passo"><i>4</i>Quando?</div><input name="data" type="date" value="${hoje()}">`;
}
function abrirLancar(){
  modal('Lançar', formLancHTML(), async o=>{
    const v = lerValor(o.valor); if(v===null) return false;
    if(await q(sb.from('fin_lancamentos').insert({tipo:o.tipo||'saida', valor:v, descricao:o.descricao, categoria:o.categoria, data:o.data||hoje()}))===null) return false;
    toast('Lançado — saldo atualizado'); refresh();
  }, '', 'Lançar');
}
function listaLanc(L){
  const porDia = {}; L.forEach(l=>{ (porDia[l.data] ||= []).push(l); });
  const sinal = t => t==='entrada'||t==='resgate' ? '+' : '−', cor = t => t==='entrada' ? 'ok' : t==='saida' ? 'bad' : '';
  return Object.keys(porDia).sort().reverse().map(d=>{
    const g = porDia[d].filter(l=>l.tipo==='saida').reduce((s,l)=>s+ +l.valor,0);
    const rot = d===hoje() ? 'Hoje' : d===addDias(hoje(),-1) ? 'Ontem' : new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'short'});
    return `<div class="dia-h"><span>${rot}</span><span>${g?'gastou '+brl(g):''}</span></div>` + porDia[d].map(l=>`<div class="row"><div class="grow"><b class="sm">${esc(l.descricao)}</b><div class="mut xs">${rotTipo(l.tipo)}${l.categoria?' · '+esc(l.categoria):''}</div></div><span class="lanc-v ${cor(l.tipo)}">${sinal(l.tipo)} ${brl(l.valor)}</span><button class="ibtn" title="Editar" onclick="editarLanc('${l.id}')">✎</button><button class="ibtn" title="Excluir (desfaz no saldo)" onclick="del('fin_lancamentos','${l.id}')">✕</button></div>`).join('');
  }).join('');
}

/* ----- tela única: "Meu dinheiro" + "Planejar meses" ----- */
function finTela(p){
  const R = resumoDoMes(p), mes = MESES_L[new Date().getMonth()];
  const ok = R.media <= R.limiteDia || R.sai===0;
  const cDisp = FIN.contas.find(c=>c.tipo==='disponivel'), cRes = FIN.contas.find(c=>c.tipo==='reserva');
  const guardado = +(cRes?.saldo||0);
  const blocos = [['Tinha no dia 1', R.inicio, 'começo do mês'], ...(R.ent>0?[['Entrou', R.ent, 'recebimentos','ok']]:[]), ['Gastou', R.sai, `${R.pct.toFixed(0)}% do que teve`,'bad'], ...(R.apo>0?[['Guardou', R.apo, 'para a reserva']]:[]), ['Tem agora', R.disp, 'disponível','','atual']];
  const pz = dadosPizza(), modo = FIN.pieModo, mesPie = MESES_L[+FIN.mesSel.slice(5,7)-1];
  const L = FIN.verTudo ? FIN.lanc : FIN.lanc.slice(0,6);
  const D = dicas(pz);
  return `
  <div class="card"><div class="hero">
    <div><span>Tem agora</span><b>${brl(R.disp)}</b><small>guardado <b class="ok" style="display:inline;font-size:inherit">${brl(guardado)}</b> · ${cDisp?`<button class="btn link" onclick="editarSaldo('${cDisp.id}','disponivel',${cDisp.saldo})">corrigir</button>`:''}${cRes?` <button class="btn link" onclick="editarSaldo('${cRes.id}','reserva',${cRes.saldo})">corrigir guardado</button>`:''}</small></div>
    <div><span>Pode gastar por dia</span><b class="${ok?'ok':'bad'}">${brl(R.limiteDia)}</b><small>até o fim de ${mes} · ${R.restam} dia${R.restam>1?'s':''}</small></div>
    <div><span>Fim do mês (previsto)</span><b class="${R.fimMes<0?'bad':''}">${brl(R.fimMes)}</b><small>com os fixos que faltam</small></div>
    <div class="acao"><button class="btn" onclick="abrirLancar()">+ Lançar</button><button class="btn g" onclick="abrirPlanejar()">${FIN.plan?'Fechar planejamento':'Planejar meses'}</button></div>
  </div>
  </div>

  <div class="grid g4 m4" style="margin-top:14px">
    ${[3,6,9,12].map(n=>{const x=p[n]; return `<div class="card" style="cursor:pointer" onclick="verMes('${x.ym}')" title="Clique para planejar ${x.label}"><span class="mut sm">Em ${n} meses (fim de ${x.label})</span><div class="big ${x.total<0?'bad':''}">${brl(x.total)}</div><div class="xs mut">disponível ${brl(x.disp)} · guardado <span class="ok">${brl(x.res)}</span></div></div>`;}).join('')}
  </div>

  ${FIN.plan ? `<div id="planBox" style="margin-top:14px">${finPlanejar(p)}</div>` : ''}

  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3><span>Este mês · ${mes}</span><span class="xs mut" style="text-transform:none;letter-spacing:0">dia ${R.dia} de ${R.diasMes}</span></h3>
      <div class="fluxo" style="--n:${blocos.length}">${blocos.map(([t,v,s,c,x])=>`<div class="flx ${x||''}"><span>${t}</span><b class="${c||''}">${brl(v)}</b><small>${s}</small></div>`).join('')}</div>
      <div class="meter-l"><span>Gasto do mês</span><span>${brl(R.sai)} de ${brl(R.teveNoMes)}</span></div>
      <div class="prog"><i style="width:${Math.min(100,R.pct)}%"></i></div>
      <div class="veredito ${ok?'':'mal'}">${R.sai===0 ? `Nenhum gasto lançado em ${mes} ainda. Use <b>+ Lançar</b> a cada gasto.` : ok
        ? `Média de <b>${brl(R.media)}/dia</b>, abaixo do limite de <b>${brl(R.limiteDia)}/dia</b>. Nesse ritmo: <b>${brl(R.ritmo)}</b> no mês.`
        : `Média de <b>${brl(R.media)}/dia</b>, acima do limite de <b>${brl(R.limiteDia)}/dia</b>. Segure em até <b>${brl(R.limiteDia)}</b> por dia.`}</div>
    </div>
    <div class="card"><h3><span>Para onde vai o dinheiro</span></h3>
      <div class="chips"><button class="${modo!=='real'?'on':''}" onclick="FIN.pieModo='tudo';refresh()">Planejado · ${mesPie}</button><button class="${modo==='real'?'on':''}" onclick="FIN.pieModo='real';refresh()">Gasto real · ${mes}</button></div>
      ${pz.total ? `<div class="pie-w">${svgPizza(pz, modo==='real'?'gasto':'do mês')}<div class="pie-l">${pz.arr.map(x=>`<div><i style="background:${x.cor}"></i><span title="${esc(x.nome)}">${esc(x.nome)}</span><b>${brl(x.v)}</b><small>${x.pct.toFixed(0)}%</small></div>`).join('')}</div></div>`
        : `<p class="empty">${modo==='real'?'Lance gastos com categoria para ver aqui.':'Cadastre o que entra e os gastos fixos em Planejar meses.'}</p>`}
    </div>
  </div>

  <div class="grid g2" style="margin-top:14px">
    <div class="card"><h3><span>Lançamentos de ${mes}</span>${FIN.lanc.length>6?`<button class="btn link" onclick="FIN.verTudo=!FIN.verTudo;refresh()">${FIN.verTudo?'ver menos':'ver todos ('+FIN.lanc.length+')'}</button>`:''}</h3>
      ${listaLanc(L) || '<p class="empty">Nada lançado este mês.</p>'}</div>
    <div class="card"><h3><span>Próximos 12 meses</span><button class="btn link" onclick="abrirPlanejar(true)">planejar →</button></h3>
      ${barras(p.map(x=>({l:x.label.split('/')[0], v:x.total, t:`${x.label}: ${brl(x.total)} — clique para planejar`, cor:x.total<0?'var(--bad)':'', sel:FIN.plan&&x.ym===FIN.mesSel, on:`verMes('${x.ym}')`})), v=>curto(v), 120)}
      <details style="margin-top:12px"><summary>Dicas para o seu dinheiro (${D.length})</summary><div style="margin-top:8px">${D.map(d=>`<div class="dica d-${d.t}"><div>${d.txt}</div></div>`).join('')}</div>
        <p class="xs mut" style="margin-top:6px">Orientações gerais com base nos seus números — não é consultoria financeira.</p></details></div>
  </div>`;
}
function finPlanejar(){
  const grupo = (t, nome, cls) => { const L = FIN.rec.filter(r=>r.tipo===t); return `<div class="grp"><div class="grp-h"><span>${nome}</span><span class="${cls}">${brl(L.filter(r=>r.ativo).reduce((s,r)=>s+ +r.valor,0))}/mês</span></div>
    ${L.map(r=>`<div class="grp-it"><div class="grow"><b>${esc(r.descricao)}</b> <span class="xs mut">dia ${r.dia}${r.fim?' · até '+fmtMes(r.fim):''}</span></div><span>${brl(r.valor)}</span><button class="ibtn" title="Editar" onclick="editarFixo('${r.id}')">✎</button><button class="ibtn" onclick="del('fin_recorrentes','${r.id}')">✕</button></div>`).join('') || '<div class="grp-it mut">Nada cadastrado.</div>'}</div>`; };
  const sobra = somaRecT('entrada') - somaRecT('saida') - somaRecT('aporte');
  return `<div class="grid g21">
    ${cardMes()}
    <div class="card"><h3><span>Fixos todo mês</span><span style="display:flex;gap:6px"><button class="btn s" onclick="novoFixo()">+ Fixo</button><button class="ibtn" title="Fechar" onclick="abrirPlanejar()">✕</button></span></h3>
      <p class="xs mut" style="margin-bottom:6px"><b style="color:var(--txt)">Fixos</b> se repetem todo mês. Itens só de um mês (curso, compra grande de materiais) vão no quadro ao lado.</p>
      ${grupo('entrada','Entradas','ok')}${grupo('saida','Gastos','bad')}${grupo('aporte','Guardar','')}
      <div class="saldo-mes"><span>Sobra por mês</span><span class="${sobra<0?'bad':'ok'}">${brl(sobra)}</span></div></div>
  </div>`;
}
function abrirPlanejar(forcar){
  FIN.plan = forcar ? true : !FIN.plan;
  refresh();
  if(FIN.plan) setTimeout(()=>$('#planBox')?.scrollIntoView({behavior:'smooth',block:'start'}),150);
}
async function vFin(){
  const m0 = new Date(), iniMes = isoLocal(new Date(m0.getFullYear(), m0.getMonth(), 1));
  const [contas, rec, aj, lanc] = await Promise.all([
    q(sb.from('fin_contas').select('*').order('tipo')),
    q(sb.from('fin_recorrentes').select('*').order('tipo').order('valor',{ascending:false})),
    q(sb.from('fin_ajustes').select('*').gte('mes',iniMes).order('mes')),
    q(sb.from('fin_lancamentos').select('*').gte('data',iniMes).order('data',{ascending:false}).order('criado_em',{ascending:false}))
  ]);
  const arr = x => Array.isArray(x)?x:[];
  FIN = {contas:arr(contas), rec:arr(rec), aj:arr(aj), lanc:arr(lanc), mesSel: FIN.mesSel || hoje().slice(0,7), pieModo: FIN.pieModo || 'tudo', verTudo: FIN.verTudo||false, plan: FIN.plan||false};
  $('#view').innerHTML = `<h2>Finanças</h2>${finTela(projetar(FIN))}`;
}

/* ----- edição: saldo, fixos, lançamentos e planejamentos ----- */
function editarSaldo(id, tipo, atual){
  modal('Ajustar saldo', `<div class="help">Use para deixar igual ao app do banco. Isso <b>não</b> cria lançamento: só corrige o número de ${tipo==='disponivel'?'Disponível':'Guardado'}.</div>
    <label>Saldo correto (R$)${moneyIn('v', atual, true, 'ex.: 2.350,00')}</label>`, async o=>{
    const v = lerValor(o.v,{positivo:false}); if(v===null) return false;
    if(await q(sb.from('fin_contas').update({saldo:v, atualizado_em:new Date().toISOString()}).eq('id',id))===null) return false;
    toast('Saldo atualizado'); refresh();
  });
}
async function addAjuste(e){ const o=formData(e); const v=lerValor(o.valor); if(v===null) return;
  const ini = FIN.mesSel, fim = o.ate && o.ate>ini ? o.ate : ini; const rows=[];
  let [y,m] = ini.split('-').map(Number);
  while(rows.length<36){ const ym=`${y}-${String(m).padStart(2,'0')}`; if(ym>fim) break; rows.push({mes:ym+'-01', tipo:o.tipo, valor:v, descricao:o.descricao}); m++; if(m>12){m=1;y++;} }
  if(await q(sb.from('fin_ajustes').insert(rows))!==null){ toast(rows.length>1?`Adicionado em ${rows.length} meses (${fmtMes(rows[0].mes)} a ${fmtMes(rows[rows.length-1].mes)})`:`Adicionado só em ${fmtMes(rows[0].mes)}`); refresh(); } }
function formFixo(r={}){
  return `<label>Tipo<select name="tipo" onchange="ajudaTipo(this,'#hf')">${[['entrada','Entrada — recebo todo mês'],['saida','Saída — pago todo mês'],['aporte','Guardar — guardo todo mês']].map(([k,l])=>`<option value="${k}" ${r.tipo===k?'selected':''}>${l}</option>`).join('')}</select></label>
    <div class="help" id="hf">${AJUDA_TIPO[r.tipo||'entrada']}</div>
    <label>Descrição<input name="descricao" required value="${esc(r.descricao||'')}" placeholder="Ex.: Atendimentos (média), Aluguel do espaço, Internet"></label>
    <div class="f2"><label>Valor (R$)${moneyIn('valor', r.valor??'')}</label><label>Dia do mês<input name="dia" type="number" min="1" max="31" value="${r.dia||5}"></label></div>
    <div class="f2"><label>Começa em<input name="inicio" type="month" value="${(r.inicio||hoje()).slice(0,7)}"></label><label>Termina em (opcional)<input name="fim" type="month" value="${r.fim?r.fim.slice(0,7):''}"></label></div>
    ${r.id?'<p class="xs mut">Mudar aqui vale para <b>todos os meses</b>. Para mudar só um mês, use <b>Mudar fixos só neste mês</b>.</p>':''}`;
}
function lerFixo(o){ const v=lerValor(o.valor); if(v===null) return null;
  return {tipo:o.tipo, descricao:o.descricao, valor:v, dia:+o.dia||5, inicio:(o.inicio||hoje().slice(0,7))+'-01', fim:o.fim?o.fim+'-28':null}; }
function novoFixo(){
  modal('Novo fixo mensal', formFixo(), async o=>{ const r=lerFixo(o); if(!r) return false;
    if(await q(sb.from('fin_recorrentes').insert(r))===null) return false; toast('Fixo salvo — projeção recalculada'); refresh(); });
}
function editarFixo(id){
  const r = FIN.rec.find(x=>x.id===id); if(!r) return;
  modal('Editar fixo mensal', formFixo(r), async o=>{ const n=lerFixo(o); if(!n) return false;
    if(await q(sb.from('fin_recorrentes').update(n).eq('id',id))===null) return false; toast('Fixo atualizado — projeção recalculada'); refresh(); },
    `<button type="button" class="btn d" onclick="fecharModal();del('fin_recorrentes','${id}')">Excluir</button>`);
}
function editarLanc(id){
  const l = FIN.lanc.find(x=>x.id===id); if(!l) return;
  modal('Editar lançamento', `<div class="help">Ao salvar, o saldo é corrigido automaticamente (desfaz o valor antigo e aplica o novo).</div>
    <label>Tipo<select name="tipo" onchange="ajudaTipo(this,'#hel')">${optTipos(l.tipo,true)}</select></label><div class="help" id="hel">${AJUDA_TIPO[l.tipo]}</div>
    <label>Valor (R$)${moneyIn('valor', l.valor)}</label>
    <label>Descrição<input name="descricao" required value="${esc(l.descricao)}"></label>
    <div class="f2"><label>Categoria<input name="categoria" list="cats" value="${esc(l.categoria||'')}"></label><label>Data<input name="data" type="date" value="${l.data}"></label></div>`,
  async o=>{ const v=lerValor(o.valor); if(v===null) return false;
    const novo = {tipo:o.tipo, valor:v, descricao:o.descricao, categoria:o.categoria, data:o.data||l.data};
    // excluir + inserir: o banco desfaz o antigo e aplica o novo no saldo
    if(await q(sb.from('fin_lancamentos').insert(novo))===null) return false;
    if(await q(sb.from('fin_lancamentos').delete().eq('id',id))===null) return false;
    toast('Lançamento corrigido — saldo atualizado'); refresh(); },
  `<button type="button" class="btn d" onclick="fecharModal();del('fin_lancamentos','${id}')">Excluir</button>`);
}
function editarAjuste(id){
  const a = FIN.aj.find(x=>x.id===id); if(!a) return;
  modal('Editar planejamento', `<label>Mês (pode mudar para outro mês)<input name="mes" type="month" required value="${a.mes.slice(0,7)}"></label>
    <label>Tipo<select name="tipo" onchange="ajudaTipo(this,'#hea')">${optTipos(a.tipo)}</select></label><div class="help" id="hea">${AJUDA_TIPO[a.tipo]}</div>
    <label>Valor (R$)${moneyIn('valor', a.valor)}</label>
    <label>Descrição<input name="descricao" required value="${esc(a.descricao)}"></label>`,
  async o=>{ const v=lerValor(o.valor); if(v===null) return false;
    if(await q(sb.from('fin_ajustes').update({mes:o.mes+'-01', tipo:o.tipo, valor:v, descricao:o.descricao}).eq('id',id))===null) return false;
    toast(o.mes!==a.mes.slice(0,7)?`Movido para ${fmtMes(o.mes+'-01')} — projeção recalculada`:'Planejamento atualizado'); refresh(); },
  `<button type="button" class="btn d" onclick="fecharModal();del('fin_ajustes','${id}')">Excluir</button>`);
}
// Corrigir um mês: muda fixos só naquele mês, edita/move planejamentos e adiciona itens únicos
function corrigirMes(ym){
  const ini = ym+'-01', fimMes = isoLocal(new Date(+ym.slice(0,4), +ym.slice(5,7), 0));
  const doMes = FIN.aj.filter(a=>a.mes.slice(0,7)===ym);
  const fixos = FIN.rec.filter(r=>r.ativo && r.inicio<=fimMes && !(r.fim && r.fim<ini));
  const corrOf = id => doMes.find(a=>corrDe(a)?.fixo===id);
  const planos = doMes.filter(a=>!corrDe(a));
  const atual = ym===hoje().slice(0,7);
  const titulo = `${MESES_L[+ym.slice(5,7)-1]} de ${ym.slice(0,4)}`;
  modal(`Corrigir ${titulo}`, `
    <label>Mês<input type="month" value="${ym}" onchange="fecharModal();corrigirMes(this.value)"></label>
    <div class="help">Os valores mudados aqui valem <b>só para este mês</b>. Os outros meses continuam com o valor normal. A projeção recalcula na hora.</div>
    <b class="sm">Fixos neste mês</b>
    <div>${fixos.map(r=>{ const c=corrOf(r.id), cd=c&&corrDe(c);
      const val = c ? (cd.pular?r.valor:c.valor) : r.valor;
      return `<div class="mrow"><div><b class="sm">${esc(r.descricao)}</b><div class="xs mut">${rotTipo(r.tipo)} · normal ${brl(r.valor)}${atual&&r.dia<=new Date().getDate()?' · já passou neste mês':''}</div></div>
        ${moneyIn('fx_'+r.id, val, false, '0,00')}
        <label class="ck" style="font-size:12px"><input type="checkbox" name="pl_${r.id}" ${cd?.pular?'checked':''}> pular</label></div>`; }).join('') || '<p class="empty">Nenhum fixo ativo neste mês.</p>'}</div>
    <b class="sm">Planejamentos deste mês</b>
    <div>${planos.map(a=>`<div class="row"><div class="grow"><b class="sm">${esc(a.descricao)}</b><div class="xs mut">${rotTipo(a.tipo)}</div></div><span class="sm">${brl(a.valor)}</span><button type="button" class="ibtn" title="Editar ou mudar de mês" onclick="fecharModal();editarAjuste('${a.id}')">✎</button><button type="button" class="ibtn" onclick="fecharModal();del('fin_ajustes','${a.id}')">✕</button></div>`).join('') || '<p class="empty">Nenhum planejamento extra.</p>'}</div>
    <b class="sm">Adicionar algo só neste mês (opcional)</b>
    <div class="f2"><select name="nt">${optTipos('saida')}</select>${moneyIn('nv','',false)}</div>
    <input name="nd" placeholder="Descrição (ex.: curso, compra de materiais, mês de noivas)">`,
  async (o,f)=>{
    const ops = [];
    for(const r of fixos){
      const c = corrOf(r.id), pular = f.querySelector(`[name="pl_${r.id}"]`).checked;
      const v = pular ? 0 : lerValor(o['fx_'+r.id], {positivo:false});
      if(v===null) return false;
      if(v<0){ toast('O valor de um fixo não pode ser negativo'); return false; }
      const igual = !pular && Math.abs(v - r.valor) < 0.005;
      const desc = `↺ ${r.descricao} | fixo:${r.id} | ${pular||v===0?'pular':'valor'}`;
      if(igual){ if(c) ops.push(sb.from('fin_ajustes').delete().eq('id',c.id)); continue; }
      const row = {mes:ini, tipo:r.tipo, valor: pular||v===0 ? r.valor : v, descricao:desc};
      ops.push(c ? sb.from('fin_ajustes').update(row).eq('id',c.id) : sb.from('fin_ajustes').insert(row));
    }
    if(o.nv && String(o.nv).trim()){
      const v = lerValor(o.nv); if(v===null) return false;
      if(!o.nd){ toast('Dê uma descrição para o item novo'); return false; }
      ops.push(sb.from('fin_ajustes').insert({mes:ini, tipo:o.nt, valor:v, descricao:o.nd}));
    }
    for(const op of ops){ if(await q(op)===null) return false; }
    toast(ops.length?`${titulo}: corrigido — projeção recalculada`:'Nada mudou'); refresh();
  }, '', 'Salvar mês');
}
async function del(tab,id){ if(!confirm('Excluir?')) return; if(await q(sb.from(tab).delete().eq('id',id))!==null){ toast('Excluído'); refresh(); } }
