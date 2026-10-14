/* Agendaí — dados fictícios compartilhados pelo app do cliente e pelo painel do dono.
   A agenda de outubro é gerada com uma semente fixa, então os números são sempre os mesmos. */
(function () {
  'use strict';

  var negocio = {
    nome: 'Studio Lume',
    tipo: 'Salão e barbearia',
    endereco: 'CLS 308, Bloco B, loja 12 · Asa Sul, Brasília',
    whatsapp: '(61) 99999-0000',
    nota: 4.8,
    avaliacoes: 312,
    dona: 'Sandra Melo',
    abre: '09:00',
    fecha: '19:00',
    // 0 = domingo ... 6 = sábado
    diasAbertos: [1, 2, 3, 4, 5, 6],
    politica: 'Cancele ou remarque sem custo até 2 horas antes.'
  };

  // Relógio fixo do protótipo
  var hoje = '2026-10-14';
  var agora = '10:20';

  var profissionais = [
    { id: 'bruno', nome: 'Bruno Alves', curto: 'Bruno', funcao: 'Barbeiro', cor: 1, servicos: ['s1', 's2', 's3'] },
    { id: 'diego', nome: 'Diego Lima', curto: 'Diego', funcao: 'Barbeiro', cor: 4, servicos: ['s1', 's2', 's3'] },
    { id: 'camila', nome: 'Camila Rocha', curto: 'Camila', funcao: 'Cabeleireira', cor: 2, servicos: ['s4', 's5', 's6'] },
    { id: 'julia', nome: 'Júlia Martins', curto: 'Júlia', funcao: 'Manicure e sobrancelha', cor: 3, servicos: ['s7', 's8', 's9'] }
  ];

  var servicos = [
    { id: 's1', nome: 'Corte masculino', categoria: 'Barbearia', duracao: 30, preco: 45, ativo: true },
    { id: 's2', nome: 'Barba', categoria: 'Barbearia', duracao: 30, preco: 35, ativo: true },
    { id: 's3', nome: 'Corte + barba', categoria: 'Barbearia', duracao: 60, preco: 75, ativo: true },
    { id: 's4', nome: 'Corte feminino', categoria: 'Cabelo', duracao: 60, preco: 90, ativo: true },
    { id: 's5', nome: 'Escova', categoria: 'Cabelo', duracao: 30, preco: 55, ativo: true },
    { id: 's6', nome: 'Coloração', categoria: 'Cabelo', duracao: 120, preco: 220, ativo: true },
    { id: 's7', nome: 'Manicure', categoria: 'Unhas e sobrancelha', duracao: 30, preco: 35, ativo: true },
    { id: 's8', nome: 'Manicure e pedicure', categoria: 'Unhas e sobrancelha', duracao: 60, preco: 70, ativo: true },
    { id: 's9', nome: 'Design de sobrancelha', categoria: 'Unhas e sobrancelha', duracao: 30, preco: 40, ativo: true }
  ];

  var nomes = ['Ana', 'Beatriz', 'Carla', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Joana',
    'Larissa', 'Marina', 'Natália', 'Olívia', 'Paula', 'Renata', 'Sofia', 'Tatiane', 'Vanessa', 'Yasmin',
    'André', 'Bernardo', 'Caio', 'Davi', 'Eduardo', 'Felipe', 'Gustavo', 'Henrique', 'Igor', 'João',
    'Leonardo', 'Mateus', 'Nicolas', 'Otávio', 'Pedro', 'Rafael', 'Samuel', 'Thiago', 'Vinícius', 'Wagner'];
  var sobrenomes = ['Almeida', 'Barbosa', 'Cardoso', 'Dias', 'Farias', 'Gomes', 'Lopes', 'Macedo', 'Nogueira', 'Oliveira',
    'Pinto', 'Queiroz', 'Ribeiro', 'Santos', 'Teixeira', 'Vieira'];

  // Gerador pseudoaleatório com semente fixa (mulberry32)
  function rng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = rng(20261014);

  // Clientes: mulheres (0–19) e homens (20–39), para combinar com os serviços mais comuns
  var clientes = nomes.map(function (n, i) {
    var sob = sobrenomes[Math.floor(rand() * sobrenomes.length)];
    var ddd = '(61) 9' + String(8000 + Math.floor(rand() * 1999)) + '-' + String(1000 + Math.floor(rand() * 8999));
    return { id: 'c' + (i + 1), nome: n + ' ' + sob, telefone: ddd, obs: '' };
  });
  // Cliente que usa o app no protótipo
  clientes.push({ id: 'eu', nome: 'Lucas Pereira', telefone: '(61) 98123-4567', obs: 'Prefere máquina 2 nas laterais.' });
  clientes[0].obs = 'Alergia a amônia. Usar coloração sem amônia.';
  clientes[22].obs = 'Sempre pede café sem açúcar.';

  // ---------- Datas ----------
  function parse(d) {
    var p = d.split('-');
    return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  }
  function fmt(dt) {
    return dt.toISOString().slice(0, 10);
  }
  function somaDias(d, n) {
    var dt = parse(d);
    dt.setUTCDate(dt.getUTCDate() + n);
    return fmt(dt);
  }
  function diaSemana(d) {
    return parse(d).getUTCDay();
  }
  function min(h) {
    var p = h.split(':');
    return +p[0] * 60 + +p[1];
  }
  function hora(m) {
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  // ---------- Agenda de outubro gerada ----------
  var agendamentos = [];
  var seq = 1;
  var abre = min(negocio.abre), fecha = min(negocio.fecha);

  for (var dia = 1; dia <= 31; dia++) {
    var data = '2026-10-' + String(dia).padStart(2, '0');
    var dow = diaSemana(data);
    if (negocio.diasAbertos.indexOf(dow) === -1) continue;
    profissionais.forEach(function (p) {
      var t = abre;
      while (t < fecha) {
        // Mais movimento no fim da tarde e no sábado
        var h = t / 60;
        var base = h < 11 ? 0.32 : h < 14 ? 0.45 : h < 17 ? 0.5 : 0.78;
        if (dow === 6) base += 0.18;
        if (dow === 1) base -= 0.12;
        // Quanto mais longe de hoje, menos horários já marcados
        var adiante = Math.round((parse(data) - parse(hoje)) / 86400000);
        if (adiante > 1) base *= Math.max(0.3, 1 - adiante / 14);
        if (rand() < base) {
          var opcoes = p.servicos.map(function (id) {
            return servicos.filter(function (s) { return s.id === id; })[0];
          });
          var s = opcoes[Math.floor(rand() * opcoes.length)];
          if (s.duracao === 120 && rand() < 0.6) s = opcoes[0];
          if (t + s.duracao > fecha) { t += 30; continue; }
          var faixa = p.id === 'bruno' || p.id === 'diego' ? 20 : 0;
          var cli = clientes[faixa + Math.floor(rand() * 20)];
          agendamentos.push({
            id: 'a' + seq++,
            cliente: cli.id,
            servico: s.id,
            prof: p.id,
            data: data,
            inicio: hora(t),
            status: 'confirmado',
            origem: rand() < 0.7 ? 'app' : 'whatsapp'
          });
          t += s.duracao;
        } else {
          t += 30;
        }
      }
    });
  }

  // Status conforme o relógio do protótipo
  // Passado = já terminou. Quem está sendo atendido agora continua "confirmado".
  // "Pendente" = recebeu o lembrete e ainda não respondeu; só existe para os próximos 2 dias.
  agendamentos.forEach(function (a) {
    var dur = servicos.filter(function (s) { return s.id === a.servico; })[0].duracao;
    var passado = a.data < hoje || (a.data === hoje && min(a.inicio) + dur <= min(agora));
    var r = rand();
    if (passado) a.status = r < 0.08 ? 'faltou' : r < 0.12 ? 'cancelado' : 'concluido';
    else if (a.data <= somaDias(hoje, 2)) a.status = r < 0.22 ? 'pendente' : r < 0.25 ? 'cancelado' : 'confirmado';
    else a.status = r < 0.03 ? 'cancelado' : 'confirmado';
  });

  // Agendamento do Lucas, usado na tela "Meus agendamentos"
  (function () {
    var conflito = function (a) {
      return a.prof === 'bruno' && a.data === '2026-10-16' && min(a.inicio) < min('19:00') && min(a.inicio) + 60 > min('18:00');
    };
    agendamentos = agendamentos.filter(function (a) { return !conflito(a); });
    agendamentos.push({ id: 'a-lucas', cliente: 'eu', servico: 's3', prof: 'bruno', data: '2026-10-16', inicio: '18:00', status: 'confirmado', origem: 'app' });
    agendamentos.push({ id: 'a-lucas-old', cliente: 'eu', servico: 's1', prof: 'bruno', data: '2026-09-18', inicio: '18:30', status: 'concluido', origem: 'app' });
  })();

  window.AG_DATA = {
    negocio: negocio,
    hoje: hoje,
    agora: agora,
    profissionais: profissionais,
    servicos: servicos,
    clientes: clientes,
    agendamentos: agendamentos,
    util: { parse: parse, fmt: fmt, somaDias: somaDias, diaSemana: diaSemana, min: min, hora: hora }
  };
})();
