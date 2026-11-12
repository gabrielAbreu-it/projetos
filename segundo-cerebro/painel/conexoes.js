/* ===== Conexões do banco + atualização ao vivo =====
   - Realtime do Supabase: qualquer mudança nas finanças (lançamento, importação do Drive, Meu Pluggy, IA, outro aparelho)
     aparece sozinha na tela, sem recarregar.
   - Aba Finanças > Saldos ganha o quadro "Conexões do banco" (Meu Pluggy e pasta do Drive) e o histórico de importações.
   Carrega depois do financas2.js e do importar.js. */
(function(){
  const st = document.createElement('style');
  st.textContent = `
.cx-grid{display:grid;gap:12px;grid-template-columns:1fr}
@media(min-width:900px){.cx-grid{grid-template-columns:1fr 1fr}}
.cxb{background:var(--card2);padding:14px;display:grid;gap:10px;align-content:start;border-top:2px solid var(--line2)}
.cxb.on{border-top-color:var(--ok)}.cxb.erro{border-top-color:var(--bad)}
.cxb h4{font-family:var(--disp,inherit);font-size:15px;display:flex;justify-content:space-between;align-items:center;gap:8px}
.cx-st{font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;padding:2px 8px;border:1px solid var(--line2);color:var(--mut);white-space:nowrap}
.cx-st.ok{color:var(--ok);border-color:rgba(34,201,138,.45)}.cx-st.bad{color:var(--bad);border-color:rgba(255,59,78,.45)}.cx-st.warn{color:var(--warn);border-color:rgba(255,176,32,.45)}
.cxb ol{margin:0 0 0 18px;display:grid;gap:4px;font-size:12.5px;color:var(--mut);line-height:1.45}
.cxb ol b{color:var(--txt)}
.cx-acts{display:flex;gap:8px;flex-wrap:wrap}
.cx-contas .row{padding:6px 0}
.cx-log td,.cx-log th{text-align:left}
.cx-vivo{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10px;letter-spacing:.8px;text-transform:uppercase;color:var(--mut)}
.cx-vivo i{width:7px;height:7px;border-radius:50%;background:var(--mut)}
.cx-vivo.on i{background:var(--ok);box-shadow:0 0 0 0 rgba(34,201,138,.6);animation:cxPulso 2s infinite}
@keyframes cxPulso{0%{box-shadow:0 0 0 0 rgba(34,201,138,.55)}70%{box-shadow:0 0 0 7px rgba(34,201,138,0)}100%{box-shadow:0 0 0 0 rgba(34,201,138,0)}}
@media (prefers-reduced-motion: reduce){.cx-vivo.on i{animation:none}}`;
  document.head.appendChild(st);
})();

const CX = {dados:null, carregando:false, testando:false, contas:null, vivo:false};

/* ---------- ao vivo ---------- */
(function(){
  let canal = null, timer = null;
  const editando = () => { const a = document.activeElement; return !!(a && a.matches?.('input,textarea,select') && a.closest('#view')) || !!F2.imp || F2.ocupado || $('#dlg')?.open; };
  const recarrega = () => {
    clearTimeout(timer);
    timer = setTimeout(()=>{
      if(editando()){ recarrega(); return; }           // espera eu sair do campo
      if(TAB==='financas' || TAB==='hoje') refresh();
    }, 700);
  };
  const ligar = () => {
    if(canal) return;
    canal = sb.channel('financas-ao-vivo');
    ['fin_lancamentos','fin_contas','fin_recorrentes','fin_ajustes','fin_config'].forEach(t =>
      canal.on('postgres_changes', {event:'*', schema:'public', table:t}, () => { if(t==='fin_config') CX.dados = null; recarrega(); }));
    canal.on('postgres_changes', {event:'INSERT', schema:'public', table:'fin_importacoes'}, ({new:n}) => {
      CX.dados = null;
      if(n.status==='erro') toast(`Importação (${n.origem==='pluggy'?'Meu Pluggy':'Drive'}) falhou: ${n.mensagem||''}`);
      else if(n.origem!=='manual') toast(`${n.origem==='pluggy'?'Inter (Meu Pluggy)':'Extrato do Drive'}: ${n.novas} nova${n.novas===1?'':'s'}${n.saldo_final!=null?' · saldo '+brl(n.saldo_final):''}`);
      recarrega();
    });
    canal.subscribe(s => { CX.vivo = s==='SUBSCRIBED'; document.querySelectorAll('.cx-vivo').forEach(e=>e.classList.toggle('on', CX.vivo)); });
  };
  const desligar = () => { if(canal){ sb.removeChannel(canal); canal = null; CX.vivo = false; } };
  sb.auth.onAuthStateChange((ev, sess) => { if(sess) ligar(); else desligar(); });
  sb.auth.getSession().then(({data}) => { if(data?.session) ligar(); });
})();

/* ---------- quadro de conexões (aba Saldos) ---------- */
async function cxCarregar(forcar){
  if(CX.carregando || (CX.dados && !forcar)) return;
  CX.carregando = true;
  try{
    const {data, error} = await sb.functions.invoke('banco', {body:{acao:'status'}});
    CX.dados = error ? {erro: error.message} : data;
  } finally { CX.carregando = false; if(TAB==='financas' && F2.aba==='saldos') refresh(); }
}
async function cxAcao(corpo, msgOk){
  const {data, error} = await sb.functions.invoke('banco', {body:corpo});
  if(error || data?.ok===false){ let m = data?.erro || error?.message; try{ const j = await error?.context?.json?.(); if(j?.erro) m = j.erro; }catch(e){} toast('Conexão: '+m); return null; }
  if(msgOk) toast(msgOk);
  return data;
}
async function cxSalvarItens(){
  const v = ($('#cx-itens')?.value || '').split(/[\s,;]+/).filter(Boolean);
  if(await cxAcao({acao:'configurar', pluggy_itens:v}, v.length ? 'Conexão salva' : 'Conexões removidas')){ CX.dados = null; CX.contas = null; cxCarregar(true); }
}
async function cxAtivo(on){ if(await cxAcao({acao:'configurar', pluggy_ativo:on}, on?'Sincronização diária ligada':'Sincronização diária desligada')) cxCarregar(true); }
async function cxTestar(){
  CX.testando = true; refresh();
  const r = await cxAcao({acao:'testar_pluggy'});
  CX.testando = false; CX.contas = r?.contas || null; refresh();
}
async function cxSincronizar(btn){
  if(btn){ btn.disabled = true; btn.textContent = 'Sincronizando…'; }
  const r = await cxAcao({acao:'sincronizar'});
  if(r) toast(`Inter: ${r.novas} nova${r.novas===1?'':'s'}, ${r.repetidas} já tinha · saldo ${brl(r.saldo)}`);
  CX.dados = null; cxCarregar(true);
}
function cxQuadro(){
  if(!CX.dados){ cxCarregar(); return `<div class="card" style="margin-top:14px"><h3><span>Conexões do banco</span></h3><p class="empty">Carregando…</p></div>`; }
  if(CX.dados.erro) return `<div class="card" style="margin-top:14px"><h3><span>Conexões do banco</span></h3><p class="empty">Não consegui falar com a função <b>banco</b>: ${esc(CX.dados.erro)}</p></div>`;
  const c = CX.dados.config || {}, log = CX.dados.log || [];
  const itens = c.pluggy_itens || [], chaves = CX.dados.pluggy_chaves;
  const erroPl = /^erro/.test(c.pluggy_status||'');
  const stPl = !chaves ? ['warn','falta chave'] : !itens.length ? ['warn','falta conectar'] : erroPl ? ['bad','com erro'] : c.pluggy_ativo ? ['ok','ligado'] : ['','desligado'];
  const drive = log.find(l=>l.origem==='drive');
  return `<div class="card" style="margin-top:14px">
    <h3><span>Conexões do banco</span><span class="cx-vivo ${CX.vivo?'on':''}"><i></i>ao vivo</span></h3>
    <p class="fin-help">Tudo que entra por aqui aparece na hora na planilha, nos gráficos e no Resumo, em qualquer aparelho aberto. Nada é duplicado: cada transação tem um id de origem.</p>
    <div class="cx-grid">
      <div class="cxb ${stPl[0]==='ok'?'on':stPl[0]==='bad'?'erro':''}">
        <h4>Inter conectado (Meu Pluggy · Open Finance)<span class="cx-st ${stPl[0]}">${stPl[1]}</span></h4>
        <p class="xs mut">Atualiza sozinho 1 vez por dia (de manhã). Só leitura: ninguém movimenta dinheiro por aqui, e você cancela no app do Inter quando quiser.</p>
        ${!chaves || !itens.length ? `<ol>
          <li>Crie conta em <b>meu.pluggy.ai</b>, toque em conectar, escolha <b>Inter</b> e autorize no app do banco.</li>
          <li>Crie conta em <b>dashboard.pluggy.ai</b>, adicione o conector <b>MeuPluggy</b> e crie uma <b>Development Application</b>.</li>
          <li>Na aplicação, abra o <b>Demo</b> e autorize o MeuPluggy. Ele mostra o <b>Item ID</b> da conexão: cole abaixo.</li>
          <li>No Supabase (Edge Functions → Secrets) crie <b>PLUGGY_CLIENT_ID</b> e <b>PLUGGY_CLIENT_SECRET</b> com os valores da aplicação.</li>
        </ol>` : ''}
        <div class="xs ${chaves?'ok':'warn'}">${chaves?'✓ Chaves da Pluggy configuradas no Supabase':'Chaves da Pluggy ainda não estão nos secrets do Supabase'}</div>
        <label>Item ID da conexão (um por linha, se tiver mais de um banco)<textarea id="cx-itens" rows="2" placeholder="ex.: 0f8e0b3a-1c2d-4e5f-9a8b-123456789abc">${esc(itens.join('\n'))}</textarea></label>
        <div class="cx-acts">
          <button class="btn s" onclick="cxSalvarItens()">Salvar conexão</button>
          <button class="btn g s" ${!chaves||!itens.length||CX.testando?'disabled':''} onclick="cxTestar()">${CX.testando?'Testando…':'Testar conexão'}</button>
          <button class="btn g s" ${!chaves||!itens.length?'disabled':''} onclick="cxSincronizar(this)">Sincronizar agora</button>
          <label class="ck" style="margin-left:auto"><input type="checkbox" ${c.pluggy_ativo?'checked':''} ${!chaves||!itens.length?'disabled':''} onchange="cxAtivo(this.checked)"> todo dia</label>
        </div>
        ${CX.contas ? `<div class="cx-contas">${CX.contas.map(a=>`<div class="row"><div class="grow"><b class="sm">${esc(a.banco||'')} · ${esc(a.nome||'')}</b><div class="xs mut">${esc(a.tipo)} ${esc(a.subtipo||'')}${a.atualizado?' · dados de '+fmtDH(a.atualizado):''}${a.tipo!=='BANK'?' · não entra (só conta corrente)':''}</div></div><b class="mono sm">${brl(a.saldo)}</b></div>`).join('') || '<p class="empty">Nenhuma conta nessa conexão.</p>'}</div>` : ''}
        <div class="xs mut">Última sincronização: ${c.pluggy_ultimo_sync ? fmtDH(c.pluggy_ultimo_sync) : 'nunca'}${c.pluggy_status ? ' · '+esc(c.pluggy_status) : ''}</div>
      </div>
      <div class="cxb ${drive && drive.status==='ok' ? 'on' : drive ? 'erro' : ''}">
        <h4>Pasta automática no Google Drive<span class="cx-st ${drive?(drive.status==='ok'?'ok':'bad'):'warn'}">${drive?(drive.status==='ok'?'funcionando':'com erro'):'esperando arquivo'}</span></h4>
        <p class="xs mut">Exportou o extrato no app do Inter? Toque em <b>Compartilhar → Drive → pasta “${esc(c.drive_pasta||'Extratos Inter')}”</b>. Em até 1 minuto o n8n pega o arquivo, importa (OFX, CSV ou PDF) e o painel atualiza sozinho. O arquivo vai para a subpasta “Importados”.</p>
        <ol><li>No n8n, abra o fluxo <b>“Finanças · extrato do Drive”</b>, conecte sua conta Google no nó do Drive (Sign in with Google) e ative.</li></ol>
        <div class="xs mut">Último arquivo: ${drive ? `${esc(drive.arquivo||'')} · ${fmtDH(drive.criado_em)}${drive.status==='ok'?` · ${drive.novas} novas`:' · '+esc(drive.mensagem||'')}` : 'nenhum ainda'}</div>
      </div>
    </div>
    ${log.length ? `<details style="margin-top:12px" ${log.length<6?'open':''}><summary>Histórico de importações (${log.length})</summary><div class="tscroll"><table class="cx-log" style="margin-top:8px"><thead><tr><th>Quando</th><th>Origem</th><th>Arquivo / contas</th><th>Novas</th><th>Já tinha</th><th>Saldo final</th><th>Status</th></tr></thead><tbody>
      ${log.map(l=>`<tr><td>${fmtDH(l.criado_em)}</td><td>${({manual:'Manual',drive:'Drive',pluggy:'Meu Pluggy'})[l.origem]||l.origem}</td><td>${esc(l.arquivo||'—')}</td><td>${l.novas}</td><td>${l.repetidas}</td><td>${l.saldo_final!=null?brl(l.saldo_final):'—'}</td><td class="${l.status==='ok'?'ok':'bad'}">${l.status==='ok'?'ok':esc(l.mensagem||'erro')}</td></tr>`).join('')}
    </tbody></table></div></details>` : ''}
  </div>`;
}
const f2SaldosBase = f2Saldos;
f2Saldos = function(){ return f2SaldosBase() + cxQuadro(); };

// importação manual também entra no histórico
if(typeof f2ImpSalvar === 'function'){
  const f2ImpSalvarBase = f2ImpSalvar;
  f2ImpSalvar = async function(btn){
    const I = F2.imp, n = I ? I.linhas.filter(x=>x.incluir).length : 0, nome = I?.nome, sf = I?.modoSaldo==='extrato' ? I.saldoFinal : null, rep = I ? I.linhas.filter(x=>!x.incluir).length : 0;
    await f2ImpSalvarBase(btn);
    if(!F2.imp && n) sb.from('fin_importacoes').insert({origem:'manual', arquivo:nome, novas:n, repetidas:rep, saldo_final:sf}).then(()=>{ CX.dados = null; });
  };
}
