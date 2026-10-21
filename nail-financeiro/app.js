const sb = SB_URL && SB_KEY ? supabase.createClient(SB_URL, SB_KEY, {db:{schema:SB_SCHEMA||'public'}}) : null;

const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MESES = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
const MESES_L = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl = v => Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const isoLocal = d => d.toLocaleDateString('sv-SE');
const hoje = () => isoLocal(new Date());
const addDias = (d,n) => isoLocal(new Date(new Date(d+'T12:00:00').getTime()+n*864e5));
function toast(m){ document.querySelectorAll('.toast').forEach(t=>t.remove()); const t=document.createElement('div'); t.className='toast'; t.textContent=m; document.body.appendChild(t); setTimeout(()=>t.remove(),2400); }
// sucesso -> dados (ou true quando a operação não devolve linhas); erro -> null
async function q(p){ const {data,error} = await p; if(error){ toast('Erro: '+error.message); console.error(error); return null; } return data ?? true; }
function formData(e){ e.preventDefault(); const o = Object.fromEntries(new FormData(e.target)); for(const k in o){ if(o[k]==='') o[k]=null; } return o; }

/* ----- valores em dinheiro: entende 1.500,00 · 1500 · R$ 2.350,50 · 1.200+350,50 ----- */
function parseMoney(s){
  if(s==null) return NaN; s = String(s).replace(/R\$|\s/g,'');
  if(!s || !/^[-+]?[\d.,]+([+\-][\d.,]+)*$/.test(s)) return NaN;
  let tot = 0;
  for(const t of s.match(/[+\-]?[^+\-]+/g)){
    const sinal = t[0]==='-' ? -1 : 1; let n = t.replace(/^[+\-]/,'');
    if(n.includes(',')) n = n.replace(/\./g,'').replace(',','.');
    else if(/\.\d{3}$/.test(n) || (n.match(/\./g)||[]).length>1) n = n.replace(/\./g,'');
    const v = parseFloat(n); if(isNaN(v)) return NaN; tot += sinal*v;
  }
  return Math.round(tot*100)/100;
}
const fmtNum = v => Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
// valor curto para rótulos discretos: 15,9k · 1,2 mi · 850
const curto = v => { const a=Math.abs(v), s=v<0?'−':''; if(a>=1e6) return s+(a/1e6).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi'; if(a>=1000) return s+(a/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+'k'; return s+Math.round(a); };
const moneyIn = (name, val='', req=true, ph='Valor (R$) — ex.: 1.250,90 ou 1000+250') =>
  `<span class="money-w"><input name="${name}" class="money" inputmode="decimal" autocomplete="off" placeholder="${ph}" value="${val===''||val==null?'':fmtNum(val)}" ${req?'required':''}><span class="mprev"></span></span>`;
// lê um campo de valor; devolve número ou null (e avisa)
function lerValor(txt, {positivo=true, vazio=false}={}){
  if(vazio && (txt==null || String(txt).trim()==='')) return '';
  const v = parseMoney(txt);
  if(isNaN(v)){ toast('Valor inválido. Use por exemplo 1.250,90 ou 1000+250'); return null; }
  if(positivo && v<=0){ toast('O valor precisa ser maior que zero'); return null; }
  return v;
}
document.addEventListener('input', e => {
  if(!e.target.classList?.contains('money')) return;
  const p = e.target.parentElement.querySelector('.mprev'); if(!p) return;
  const s = e.target.value.trim(), v = parseMoney(s);
  p.className = 'mprev' + (s && isNaN(v) ? ' bad' : '');
  p.textContent = !s ? '' : isNaN(v) ? 'valor inválido' : (/[+\-]/.test(s.replace(/^-/,'')) ? 'Soma = ' : '') + brl(v);
});
document.addEventListener('focusout', e => {
  if(!e.target.classList?.contains('money')) return;
  const v = parseMoney(e.target.value);
  if(!isNaN(v)){ e.target.value = fmtNum(v); const p=e.target.parentElement.querySelector('.mprev'); if(p) p.textContent=''; }
});

/* ================= MODAL ================= */
function modal(titulo, corpo, onSalvar, extra='', rotulo='Salvar'){
  const d = $('#dlg');
  d.innerHTML = `<form class="mbox" id="mform"><div class="mhead"><b>${titulo}</b><button type="button" class="ibtn" onclick="fecharModal()">✕</button></div>
    <div class="mbody">${corpo}</div>
    <div class="mfoot">${extra}<span style="flex:1"></span><button type="button" class="btn g" onclick="fecharModal()">Cancelar</button>${onSalvar?`<button class="btn" id="mok">${rotulo}</button>`:''}</div></form>`;
  $('#mform').onsubmit = async e => {
    e.preventDefault();
    const f = e.target, o = Object.fromEntries(new FormData(f));
    for(const k in o){ if(o[k]==='') o[k]=null; }
    const b = $('#mok'); if(b) b.disabled = true;
    const r = await onSalvar(o, f);
    if(b) b.disabled = false;
    if(r !== false) fecharModal();
  };
  d.showModal();
  setTimeout(()=>d.querySelector('input:not([type=hidden]):not([type=checkbox]),select')?.focus(),30);
}
function fecharModal(){ const d=$('#dlg'); if(d.open) d.close(); }
$('#dlg').addEventListener('click', e => { if(e.target.id==='dlg') fecharModal(); });

/* ================= ACESSO ================= */
const LOGO = '<img class="logo" src="icone.svg" alt="">';
async function init(){
  if(!sb){
    $('#app').innerHTML = `<div class="login"><div class="card">${LOGO}<h2>Financeiro</h2><p class="mut sm">Falta configurar o Supabase: preencha <b>SB_URL</b> e <b>SB_KEY</b> em <code>config.js</code>.</p></div></div>`;
    return;
  }
  const {data:{session}} = await sb.auth.getSession();
  if(!session) return renderLogin();
  const dono = await q(sb.from('dona').select('email'));
  if(!Array.isArray(dono) || !dono.length){
    $('#app').innerHTML = `<div class="login"><div class="card">${LOGO}<h2>Acesso negado</h2><p class="mut">Este painel é privado.</p><br><button class="btn g" onclick="sair()">Sair</button></div></div>`;
    return;
  }
  renderShell();
}
function renderLogin(msg=''){
  $('#app').innerHTML = `<div class="login"><div class="card">${LOGO}
    <h2>Financeiro</h2><p class="mut sm">Acesso restrito.</p>
    <form class="f" onsubmit="entrar(event)">
      <input name="email" type="email" placeholder="E-mail" required autocomplete="email">
      <input name="senha" type="password" placeholder="Senha" required minlength="8" autocomplete="current-password">
      <button class="btn">Entrar</button>
    </form><p class="sm warn" id="lmsg" style="margin-top:10px">${esc(msg)}</p>
    <button class="btn link" style="margin-top:6px" onclick="renderCadastro()">Primeiro acesso? Criar senha</button></div></div>`;
}
function renderCadastro(){
  $('#app').innerHTML = `<div class="login"><div class="card">${LOGO}
    <h2>Primeiro acesso</h2><p class="mut sm">Use o e-mail cadastrado como dona do painel e escolha uma senha.</p>
    <form class="f" onsubmit="cadastrar(event)">
      <input name="email" type="email" placeholder="E-mail" required autocomplete="email">
      <input name="senha" type="password" placeholder="Senha (mínimo 8 caracteres)" required minlength="8" autocomplete="new-password">
      <button class="btn">Criar senha</button>
    </form><p class="sm warn" id="lmsg" style="margin-top:10px"></p>
    <button class="btn link" style="margin-top:6px" onclick="renderLogin()">Já tenho senha</button></div></div>`;
}
async function cadastrar(e){
  const o = formData(e);
  const {data, error} = await sb.auth.signUp({email:o.email, password:o.senha, options:{emailRedirectTo: location.origin + location.pathname}});
  if(error) return $('#lmsg').textContent = /não permitido|not allowed|Database error/i.test(error.message) ? 'Este e-mail não tem acesso a este painel.' : /registered|already/i.test(error.message) ? 'Este e-mail já tem senha. Volte e entre.' : 'Não deu certo: '+error.message;
  if(data.session) return init();
  renderLogin('Pronto! Confirme pelo link que chegou no seu e-mail e depois entre aqui.');
}
async function entrar(e){
  const o = formData(e);
  const {error} = await sb.auth.signInWithPassword({email:o.email, password:o.senha});
  if(error) $('#lmsg').textContent = /confirm/i.test(error.message) ? 'Confirme seu e-mail primeiro.' : 'E-mail ou senha inválidos.';
  else init();
}
async function sair(){ await sb.auth.signOut(); renderLogin(); }

/* ================= SHELL ================= */
function renderShell(){
  const now = new Date(); const h = now.getHours();
  const saud = h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
  $('#app').innerHTML = `
  <header><div class="hlogo">${LOGO}<div><h1>${saud}${NOME?`, ${esc(NOME)}`:""}</h1><small>${DIAS[now.getDay()]}, ${now.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'})}</small></div></div>
  <button class="btn g s" onclick="sair()">Sair</button></header>
  <main class="wrap" id="view"><p class="empty">Carregando…</p></main>`;
  vFin();
}
// recarrega os dados sem piscar a tela e sem perder a rolagem
function refresh(){ const y = window.scrollY; Promise.resolve(vFin()).then(()=>window.scrollTo(0,y)); }

if(sb) sb.auth.onAuthStateChange((ev)=>{ if(ev==='SIGNED_OUT') renderLogin(); });
init();
