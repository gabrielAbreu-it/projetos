/* Aprova Hub · central de ajuda com busca */
(function () {
  const N = window.Negocio, cfg = N.config();
  const P = [
    ['turma', 'Como convido meus alunos?', 'No painel da turma, toque em "Adicionar aluno" e informe nome e WhatsApp. O aluno recebe um convite com link e cria a conta dele de graça.'],
    ['turma', 'O que quer dizer "sumiu há 3 dias"?', 'É o aluno que não fez nenhum check-in nos últimos 3 dias ou mais. Ele aparece no alerta do painel até registrar um novo estudo.'],
    ['turma', 'Como é calculado o "abaixo da meta"?', 'Pegamos a meta de questões da semana e dividimos pelos dias que já passaram. Se o aluno fez menos de 70% do esperado até hoje, ele entra no alerta.'],
    ['turma', 'Como mando mensagem para um aluno?', 'Abra o aluno no painel e escolha um modelo: "Sentimos sua falta", "Ajustar a meta" ou "Parabéns". O WhatsApp abre com o texto pronto, e você confere antes de enviar.'],
    ['turma', 'Consigo ver o caderno de erros dos alunos?', 'Você vê quantos erros cada aluno registrou e quantas revisões estão atrasadas. O conteúdo das anotações é só do aluno.'],
    ['aluno', 'Por que o check-in pede questões e não horas?', 'Porque questões feitas e acertos mostram estudo de verdade e desempenho. As horas aparecem no histórico, mas não dão pontos sozinhas.'],
    ['aluno', 'Como funcionam os pontos do ranking?', '1 ponto por acerto (até 60 por dia), 15 pontos por dia com check-in e 3 pontos por acerto no simulado da semana. O ranking zera toda segunda.'],
    ['aluno', 'Por que o ranking mostra faixas e não posições?', 'Para ninguém se sentir no fim da fila. A turma é dividida em três faixas e cada aluno vê a própria evolução e quantos pontos faltam para subir.'],
    ['aluno', 'Esqueci de pausar o cronômetro. E agora?', 'Ao finalizar, o campo de tempo pode ser corrigido antes de salvar. Também dá para excluir uma sessão registrada por engano.'],
    ['aluno', 'Quando o caderno de erros me lembra de revisar?', 'Cada erro volta para a fila "Revisar hoje" 1, 7 e 21 dias depois de registrado. Se ainda errar, ele volta no dia seguinte.'],
    ['pagamento', 'Quais formas de pagamento posso usar?', 'Pix, boleto ou cartão. A mensalidade se repete todo mês e o recibo chega por e-mail.'],
    ['pagamento', 'O que acontece quando o teste grátis acaba?', `O teste dura ${cfg.diasTeste} dias. Avisamos 2 dias antes. Se você não escolher um plano, o painel fica pausado, mas nada da turma é apagado.`],
    ['pagamento', 'Meu pagamento atrasou. Perco os dados?', 'Não. Depois de alguns dias de atraso, o acesso ao painel fica pausado até o pagamento. Os dados ficam guardados e o acesso volta assim que o pagamento é confirmado.'],
    ['pagamento', 'Como cancelo?', 'Em Conta, toque em "Cancelar assinatura". Não há multa, e o acesso continua até o fim do período já pago.'],
    ['afiliados', 'Como funciona o programa de afiliados?', `Você recebe ${cfg.comissao}% de cada mensalidade paga pelos mentores que indicou, enquanto eles continuarem assinando. O pagamento sai por Pix no dia 10 do mês seguinte.`]
  ];
  const CATS = { todas: 'Todas', turma: 'Turma e alertas', aluno: 'Alunos e ranking', pagamento: 'Pagamento', afiliados: 'Afiliados' };
  let cat = 'todas', q = '';
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const realce = (txt) => {
    if (!q) return N.esc(txt);
    const t = N.esc(txt), nt = norm(t), nq = norm(N.esc(q));
    const i = nt.indexOf(nq); if (i < 0) return t;
    return t.slice(0, i) + '<mark>' + t.slice(i, i + nq.length) + '</mark>' + t.slice(i + nq.length);
  };
  function render() {
    document.getElementById('cats').innerHTML = Object.keys(CATS).map((k) => `<button class="cat" type="button" data-cat="${k}" aria-pressed="${cat === k}">${CATS[k]}</button>`).join('');
    const palavras = norm(q).split(/\s+/).filter(Boolean);
    const lista = P.filter((p) => (cat === 'todas' || p[0] === cat) && palavras.every((w) => norm(p[1] + ' ' + p[2]).includes(w)));
    document.getElementById('cont').textContent = `${lista.length} ${lista.length === 1 ? 'pergunta' : 'perguntas'}${q ? ` para "${q}"` : ''}`;
    document.getElementById('lista').innerHTML = lista.length ? lista.map((p) => `<details ${q ? 'open' : ''}><summary>${realce(p[1])}<span class="chip">${CATS[p[0]]}</span></summary><div><p>${realce(p[2])}</p></div></details>`).join('')
      : `<div class="vazio card"><i data-lucide="search-x" aria-hidden="true"></i><p><strong>Nada encontrado para "${N.esc(q)}".</strong></p><p class="muted small">Tente outra palavra ou escreva para o suporte logo abaixo.</p><button class="btn btn--ghost" type="button" id="limpar">Limpar busca</button></div>`;
    N.icones();
  }
  document.getElementById('q').addEventListener('input', (e) => { q = e.target.value.trim(); render(); });
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-cat]'); if (c) { cat = c.dataset.cat; render(); document.querySelector(`[data-cat=${cat}]`).focus(); }
    if (e.target.closest('#limpar')) { q = ''; cat = 'todas'; document.getElementById('q').value = ''; render(); document.getElementById('q').focus(); }
  });
  document.getElementById('f-sup').addEventListener('submit', (e) => {
    e.preventDefault(); const f = e.target; const er = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.querySelector('#s-email').value.trim())) er['s-email'] = 'Confira o e-mail. Ex.: nome@gmail.com';
    if (f.querySelector('#s-msg').value.trim().length < 10) er['s-msg'] = 'Conte sua dúvida em pelo menos 10 letras.';
    if (!N.erros(f, er)) return;
    f.reset(); N.toast('Mensagem registrada (simulado). Na versão real, a resposta chega por e-mail.');
  });
  render();
})();
