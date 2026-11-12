/* ===== Importar extrato do Inter (OFX, CSV ou PDF) na aba Finanças =====
   Carrega depois do financas2.js: acrescenta o botão na planilha e o atalho no Resumo. */
(function(){ const st = document.createElement('style'); st.textContent = `.f2-imp-cta{display:flex;gap:16px;align-items:center;justify-content:space-between;margin-bottom:14px;border-color:rgba(57,135,229,.45);background:linear-gradient(90deg,rgba(57,135,229,.14),rgba(57,135,229,.02)),var(--card)}
.f2-imp-cta b{display:block;font-family:var(--disp,inherit);font-size:16px;margin-bottom:2px}
@media(max-width:600px){.f2-imp-cta{flex-direction:column;align-items:flex-start}}
.f2-imp-saldo{display:grid;gap:6px;background:var(--card2);padding:12px 14px;margin-bottom:12px}
.f2-imp-saldo label.ck{align-items:flex-start;line-height:1.4}
.f2-imp-saldo label.ck{display:flex;gap:10px;justify-content:flex-start;text-align:left}
.f2-imp-saldo input{width:auto;flex:none;margin-top:3px}
`; document.head.appendChild(st); })();
const f2PlanilhaBase = f2Planilha, f2ResumoBase = f2Resumo;
f2Planilha = function(){
  if(F2.imp || F2.impLendo) return f2ImpTela();
  return f2PlanilhaBase().replace('<button class="btn link" onclick="f2Csv()">exportar CSV</button>',
    '<button class="btn s" onclick="f2ImpEscolher()">⇪ Importar extrato do Inter</button><button class="btn link" onclick="f2Csv()">exportar CSV</button>');
};
f2Resumo = function(p){
  const cta = F2.lanc.some(l=>l.importado_id) ? '' : `<div class="card f2-imp-cta"><div><b>Puxe seu extrato do Inter</b><span class="sm mut">Exporte o extrato (OFX, CSV ou PDF) no app ou no internet banking e solte aqui. Os lançamentos, categorias e o saldo entram de uma vez.</span></div><button class="btn" onclick="F2.aba='planilha';f2Salva();f2ImpEscolher()">⇪ Importar extrato</button></div>`;
  return cta + f2ResumoBase(p);
};
const F2_REGRAS = [
  [/ifood|rappi|restaurante|lanchonete|padaria|burger|pizza|a[cç]a[ií]|sorvet|cafe(teria)?\b|churrasc|bar |boteco|delivery/i,'Alimentação fora'],
  [/\buber\b|99 ?(pop|app|taxi)|99app|cabify|posto|combust|shell|ipiranga|petrobras|br mania|estaciona|metr[oô]|\bbrt\b|[oô]nibus|recarga bilhete|ped[aá]gio|sem parar|conectcar/i,'Transporte'],
  [/mercado|supermerc|atacad|assa[ií]|carrefour|p[aã]o de a[cç]|hortifruti|big box|dona de casa|comper|tatico|t[aá]tico|super adega|sacol[aã]o|feira/i,'Mercado'],
  [/netflix|spotify|prime video|amazon prime|disney|hbo|\bmax\b|youtube|icloud|google one|apple\.com|deezer|globoplay|chatgpt|openai|claude|anthropic|microsoft|adobe|canva/i,'Assinaturas'],
  [/farm[aá]cia|drogaria|droga ?sil|pague menos|raia|unimed|hospital|cl[ií]nica|laborat|odonto|dentista|psic/i,'Saúde'],
  [/\bclaro\b|\bvivo\b|\btim\b|\boi\b|internet|energia|neoenergia|cemig|enel|caesb|sabesp|light|celpe|copel|\bg[aá]s\b|telefonica/i,'Contas (luz, água, internet)'],
  [/aluguel|condom[ií]nio|imobili|quintoandar/i,'Moradia'],
  [/uniceub|faculdade|mensalidade|curso|udemy|alura|escola|livraria/i,'Educação'],
  [/cinema|ingresso|steam|playstation|xbox|nintendo|show|sympla|eventim|academia|smart ?fit|bluefit/i,'Lazer'],
  [/renner|riachuelo|c ?& ?a\b|zara|shein|centauro|nike|adidas|netshoes|hering/i,'Roupas'],
  [/straton/i,'STRATON']];
const f2Norm = s => String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const f2Hash = s => { let h = 5381; for(let i=0;i<s.length;i++) h = ((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36); };
function f2Num(s){ s = String(s??'').replace(/R\$|\s/g,''); if(!s) return NaN; const neg = /^-|-$|^\(.*\)$/.test(s); s = s.replace(/[-()]/g,'');
  if(s.includes(',')) s = s.replace(/\./g,'').replace(',','.'); return (neg?-1:1)*parseFloat(s); }
function f2DataBR(s){ s = String(s||'').trim(); let m;
  if((m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/))) return `${m[3]}-${m[2]}-${m[1]}`;
  if((m = s.match(/^(\d{4})-(\d{2})-(\d{2})/))) return m[0];
  if((m = s.match(/^(\d{4})(\d{2})(\d{2})/))) return `${m[1]}-${m[2]}-${m[3]}`;
  return null; }
function f2LerOFX(txt){
  const tag = (b, t) => { const m = b.match(new RegExp('<'+t+'>([^<\\r\\n]*)','i')); return m ? m[1].trim() : ''; };
  const trs = [...txt.matchAll(/<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|(?=<\/BANKTRANLIST>))/gi)].map(m=>m[1]);
  const lb = txt.match(/<LEDGERBAL>([\s\S]*?)(?:<\/LEDGERBAL>|$)/i);
  return { saldoFinal: lb ? f2Num(tag(lb[1],'BALAMT').replace('.',',')) : null,
    linhas: trs.map(b=>{ const memo = tag(b,'MEMO'), nome = tag(b,'NAME'); const v = tag(b,'TRNAMT');
      return {data: f2DataBR(tag(b,'DTPOSTED')), descricao: (nome && memo && !memo.includes(nome) ? `${memo} ${nome}` : memo || nome || tag(b,'TRNTYPE')).trim(),
        detalhe: tag(b,'TRNTYPE'), valor: v.includes(',') ? f2Num(v) : parseFloat(v), origem: tag(b,'FITID')}; }) };
}
function f2LerCSV(txt){
  const linhas = txt.split(/\r?\n/).filter(l=>l.trim());
  const sep = (linhas.slice(0,15).join('\n').match(/;/g)||[]).length >= (linhas.slice(0,15).join('\n').match(/,/g)||[]).length/2 ? ';' : ',';
  const corta = l => { const out=[]; let cur='', q=false; for(const c of l){ if(c==='"'){ q=!q; continue; } if(c===sep && !q){ out.push(cur); cur=''; } else cur+=c; } out.push(cur); return out.map(x=>x.trim()); };
  const ih = linhas.findIndex(l=>{ const n=f2Norm(l); return n.includes('data') && n.includes('valor'); });
  if(ih<0) throw new Error('Não achei o cabeçalho com "Data" e "Valor" no CSV.');
  const cab = corta(linhas[ih]).map(f2Norm);
  const col = (...ns) => cab.findIndex(c=>ns.some(n=>c.includes(n)));
  const cD = col('data'), cV = cab.findIndex(c=>c==='valor' || c.startsWith('valor')), cS = col('saldo'), cH = [col('historico'), cab.findIndex((c,i)=>i!==cD && /^(tipo|lancamento)/.test(c))].find(i=>i>=0) ?? -1, cDesc = col('descricao','estabelecimento','detalhe');
  let saldoFinal = null;
  const meta = linhas.slice(0,ih).map(corta); const ms = meta.find(r=>f2Norm(r[0]).startsWith('saldo')); if(ms) saldoFinal = f2Num(ms[1]);
  const out = [];
  for(const l of linhas.slice(ih+1)){
    const c = corta(l), data = f2DataBR(c[cD]), valor = f2Num(c[cV]); if(!data || isNaN(valor)) continue;
    const hist = cH>=0 && cH!==cDesc ? c[cH] : '', desc = cDesc>=0 ? c[cDesc] : '';
    out.push({data, descricao: (desc || hist).trim(), detalhe: hist && desc ? hist : '', valor, saldo: cS>=0 ? f2Num(c[cS]) : null});
  }
  // extrato do Inter vem do mais novo para o mais antigo: o saldo mais recente é o da primeira linha
  if(out.length && out.some(x=>!isNaN(x.saldo) && x.saldo!=null)){ const ord = out.slice().sort((a,b)=>a.data<b.data?1:-1); const s0 = ord.find(x=>x.saldo!=null && !isNaN(x.saldo)); if(s0 && saldoFinal==null) saldoFinal = s0.saldo; }
  return {linhas: out, saldoFinal};
}
function f2Categoria(desc, det, tipo){
  const n = f2Norm(desc);
  const igual = F2.lanc.find(l=>l.categoria && f2Norm(l.descricao)===n); if(igual) return igual.categoria;
  if(tipo==='aporte' || tipo==='resgate') return 'Reserva';
  for(const [re,c] of F2_REGRAS) if(re.test(desc) || re.test(det||'')) return c;
  return tipo==='entrada' ? 'Recebimentos' : '';
}
function f2MontaImport(nome, {linhas, saldoFinal}){
  const vistos = {};
  const L = linhas.filter(x=>x.data && !isNaN(x.valor) && x.valor!==0).map(x=>{
    const txt = `${x.descricao} ${x.detalhe||''}`;
    let tipo = x.valor<0 ? 'saida' : 'entrada';
    if(/aplica[cç][aã]o|porquinho|cofrinho|meu porquinho|invest|cdb|tesouro/i.test(txt) && x.valor<0) tipo = 'aporte';
    if(/resgate|porquinho|cofrinho|cdb/i.test(txt) && x.valor>0) tipo = 'resgate';
    const base = x.origem ? 'ofx:'+x.origem : `${x.data}|${f2Norm(x.descricao)}|${x.valor.toFixed(2)}|${x.saldo??''}`;
    vistos[base] = (vistos[base]||0)+1;
    const id = 'inter:' + (x.origem ? f2Hash(base) : f2Hash(base+'#'+vistos[base]));
    const valor = Math.round(Math.abs(x.valor)*100)/100;
    const ja = F2.lanc.find(l=>l.importado_id===id) || F2.lanc.find(l=>l.data===x.data && Math.abs(+l.valor-valor)<.005 && l.tipo===tipo);
    return {id, data:x.data, descricao:x.descricao || x.detalhe || 'Sem descrição', detalhe:x.detalhe||'', valor, tipo, categoria:f2Categoria(x.descricao, x.detalhe, tipo), dup:!!ja, incluir:!ja};
  }).sort((a,b)=>a.data<b.data?1:-1);
  const disp = +(FIN.contas.find(c=>c.tipo==='disponivel')?.saldo||0);
  F2.imp = {nome, linhas:L, saldoFinal: saldoFinal!=null && !isNaN(saldoFinal) ? saldoFinal : null, saldoAntes:disp, modoSaldo: saldoFinal!=null && !isNaN(saldoFinal) ? 'extrato' : 'manter'};
}
function f2ImpEscolher(){
  let i = document.getElementById('f2-imp-arq');
  if(!i){ i = document.createElement('input'); i.type='file'; i.id='f2-imp-arq'; i.accept='.ofx,.csv,.txt,.pdf,application/pdf,text/csv'; i.style.display='none'; i.onchange = () => f2ImpArquivo(i.files[0]); document.body.appendChild(i); }
  i.value=''; i.click();
}
async function f2ImpArquivo(arq){
  if(!arq) return;
  if(arq.size > 8e6){ toast('Arquivo grande demais (máx. 8 MB)'); return; }
  F2.aba='planilha'; f2Salva();
  try{
    if(/\.pdf$/i.test(arq.name) || arq.type==='application/pdf'){
      F2.impLendo = arq.name; refresh();
      const b64 = await new Promise((ok,er)=>{ const r = new FileReader(); r.onload=()=>ok(String(r.result).split(',')[1]); r.onerror=er; r.readAsDataURL(arq); });
      const {data, error} = await sb.functions.invoke('financas-ia', {body:{acao:'extrair', arquivo:{nome:arq.name, base64:b64}}});
      if(error){ let m = error.message; try{ const j = await error.context?.json?.(); if(j?.erro) m = j.erro; }catch(e){} throw new Error(m); }
      f2MontaImport(arq.name, {linhas:(data.transacoes||[]).map(t=>({data:t.data, descricao:t.descricao, detalhe:t.detalhe, valor:+t.valor})), saldoFinal: data.saldo_final==null ? null : +data.saldo_final});
    } else {
      const buf = await arq.arrayBuffer();
      let txt = new TextDecoder('utf-8').decode(buf);
      if(txt.includes('�')) txt = new TextDecoder('windows-1252').decode(buf);
      f2MontaImport(arq.name, /<OFX>|OFXHEADER|<STMTTRN>/i.test(txt) ? f2LerOFX(txt) : f2LerCSV(txt));
    }
    if(!F2.imp.linhas.length){ toast('Não encontrei transações nesse arquivo'); F2.imp = null; }
  } catch(e){ toast('Importar: '+(e.message||e)); F2.imp = null; }
  finally{ F2.impLendo = null; window.motionProximo?.(); refresh(); }
}
function f2ImpTela(){
  if(F2.impLendo) return `<div class="card"><h3><span>Lendo ${esc(F2.impLendo)}</span></h3><div class="f2-pensando"><span></span><span></span><span></span></div><p class="fin-help">A IA está lendo o PDF e separando as transações. Leva uns segundos.</p></div>`;
  const I = F2.imp, sel = I.linhas.filter(x=>x.incluir);
  const s = t => sel.filter(x=>x.tipo===t).reduce((a,x)=>a+x.valor,0);
  const datas = I.linhas.map(x=>x.data).sort();
  const efeito = s('entrada') + s('resgate') - s('saida') - s('aporte');
  const opc = [['extrato', I.saldoFinal!=null ? `Usar o saldo final do extrato: <b>${brl(I.saldoFinal)}</b> (recomendado)` : null],
    ['manter', `Manter o saldo que já está no painel: <b>${brl(I.saldoAntes)}</b> (o extrato é só histórico)`],
    ['somar', `Somar o extrato ao saldo atual: <b>${brl(I.saldoAntes + efeito)}</b>`]].filter(o=>o[1]);
  return `<div class="card">
    <h3><span>Importar ${esc(I.nome)}</span><button class="btn link" onclick="F2.imp=null;refresh()">cancelar</button></h3>
    <p class="fin-help">${I.linhas.length} transações de ${fmtData(datas[0])} a ${fmtData(datas[datas.length-1]).replace(/\.$/,'')}. Confira tipo e categoria (dá para editar aqui), desmarque o que não quiser e importe. ${I.linhas.some(x=>x.dup)?`<b>${I.linhas.filter(x=>x.dup).length}</b> já estavam no painel e vieram desmarcadas.`:''}</p>
    <div class="f2-tot">
      <div><span>Selecionadas</span><b>${sel.length}</b></div><div><span>Entradas</span><b class="ok">${brl(s('entrada')+s('resgate'))}</b></div>
      <div><span>Saídas</span><b class="bad">${brl(s('saida'))}</b></div><div><span>Guardado</span><b>${brl(s('aporte'))}</b></div>
      <div><span>Resultado</span><b class="${efeito<0?'bad':'ok'}">${brl(efeito)}</b></div>
    </div>
    <div class="f2-imp-saldo"><b class="sm">Saldo disponível depois de importar</b>${opc.map(([k,t])=>`<label class="ck"><input type="radio" name="f2ms" ${I.modoSaldo===k?'checked':''} onchange="F2.imp.modoSaldo='${k}'"> <span>${t}</span></label>`).join('')}</div>
    <div class="tscroll"><table class="f2-tab">
      <thead><tr><th><input type="checkbox" ${sel.length===I.linhas.length?'checked':''} onchange="F2.imp.linhas.forEach(x=>x.incluir=this.checked);refresh()"></th><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th>Observação (do banco)</th></tr></thead>
      <tbody>${I.linhas.map((x,i)=>`<tr class="t-${x.tipo} ${x.incluir?'':'f2-pulado'}">
        <td><input type="checkbox" ${x.incluir?'checked':''} onchange="F2.imp.linhas[${i}].incluir=this.checked;refresh()"></td>
        <td class="mono">${x.data.split('-').reverse().join('/')}${x.dup?' <span class="tag">já tem</span>':''}</td>
        <td><input value="${esc(x.descricao)}" onchange="F2.imp.linhas[${i}].descricao=this.value"></td>
        <td><input list="cats" value="${esc(x.categoria)}" placeholder="—" onchange="F2.imp.linhas[${i}].categoria=this.value"></td>
        <td><select onchange="F2.imp.linhas[${i}].tipo=this.value;refresh()">${f2Opt(x.tipo)}</select></td>
        <td class="mono" style="text-align:right">${brl(x.valor)}</td>
        <td class="xs mut">${esc(x.detalhe)}</td></tr>`).join('')}</tbody></table></div>
    <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:14px"><button class="btn g" onclick="F2.imp=null;refresh()">Cancelar</button><button class="btn" ${sel.length?'':'disabled'} onclick="f2ImpSalvar(this)">Importar ${sel.length} transaç${sel.length===1?'ão':'ões'}</button></div>
  </div>`;
}
async function f2ImpSalvar(btn){
  const I = F2.imp, sel = I.linhas.filter(x=>x.incluir); if(!sel.length) return;
  btn.disabled = true; btn.textContent = 'Importando…';
  const efeito = sel.reduce((a,x)=>a + (x.tipo==='entrada'||x.tipo==='resgate' ? x.valor : -x.valor), 0);
  const alvo = I.modoSaldo==='extrato' ? I.saldoFinal : I.modoSaldo==='somar' ? I.saldoAntes + efeito : I.saldoAntes;
  const res0 = +(FIN.contas.find(c=>c.tipo==='reserva')?.saldo||0);
  const rows = sel.map(x=>({data:x.data, descricao:x.descricao.trim()||'Sem descrição', categoria:x.categoria||null, tipo:x.tipo, valor:x.valor, observacao:x.detalhe||null, importado_id:x.id}));
  for(let i=0;i<rows.length;i+=400){
    if(await q(sb.from('fin_lancamentos').upsert(rows.slice(i,i+400), {onConflict:'importado_id', ignoreDuplicates:true}))===null){ btn.disabled=false; btn.textContent='Tentar de novo'; return; }
  }
  // o gatilho mexeu no saldo a cada linha; aqui deixo o disponível no valor escolhido e a reserva como estava
  const cD = FIN.contas.find(c=>c.tipo==='disponivel'), cR = FIN.contas.find(c=>c.tipo==='reserva'), agora = new Date().toISOString();
  if(cD) await q(sb.from('fin_contas').update({saldo:Math.round(alvo*100)/100, atualizado_em:agora}).eq('id',cD.id));
  if(cR && I.modoSaldo!=='somar') await q(sb.from('fin_contas').update({saldo:res0, atualizado_em:agora}).eq('id',cR.id));
  toast(`${rows.length} transações importadas — disponível agora ${brl(alvo)}`);
  F2.imp = null; F2.mes = ''; window.motionProximo?.(); refresh();
}
