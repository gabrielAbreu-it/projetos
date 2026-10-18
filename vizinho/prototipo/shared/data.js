/* Vizinho — dados fictícios do protótipo.
   Condomínio, moradores, encomendas, reservas e avisos são inventados. */
(function () {
  var primeiros = ['Ana', 'Bruno', 'Carla', 'Daniel', 'Eduarda', 'Felipe', 'Gisele', 'Henrique', 'Isabela', 'João', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sílvia', 'Tiago', 'Vanessa', 'Wagner', 'Yara', 'Lucas', 'Beatriz', 'Caio', 'Fernanda', 'Gustavo', 'Helena', 'Igor', 'Júlia', 'Leandro', 'Mônica'];
  var sobrenomes = ['Alves', 'Barbosa', 'Cardoso', 'Dias', 'Esteves', 'Farias', 'Gomes', 'Holanda', 'Lima', 'Machado', 'Nogueira', 'Oliveira', 'Pereira', 'Queiroz', 'Ribeiro', 'Santos', 'Teixeira', 'Vieira', 'Xavier', 'Moura', 'Rocha', 'Campos', 'Freitas'];

  var unidades = [];
  var blocos = ['A', 'B', 'C', 'D'];
  var i = 0;
  blocos.forEach(function (b) {
    for (var andar = 1; andar <= 8; andar++) {
      for (var u = 1; u <= 4; u++) {
        var apto = String(andar) + '0' + u;
        var nome = primeiros[(i * 7 + 3) % primeiros.length] + ' ' + sobrenomes[(i * 5 + 1) % sobrenomes.length];
        unidades.push({ id: b + '-' + apto, bloco: b, apto: apto, morador: nome });
        i++;
      }
    }
  });
  // A moradora do app
  unidades.forEach(function (u) {
    if (u.id === 'B-304') u.morador = 'Mariana Costa';
    if (u.id === 'C-801') u.morador = 'Roberto Siqueira';
    if (u.id === 'A-102') u.morador = 'Lúcia Fernandes';
  });

  window.VZ_DATA = {
    agora: '2026-10-16T18:40:00',
    condominio: 'Residencial Jardim das Acácias',
    cidade: 'Águas Claras, Brasília',
    porteiro: 'José Ribamar',
    eu: { unidade: 'B-304', nome: 'Mariana Costa', primeiroNome: 'Mariana' },
    unidades: unidades,

    tipos: {
      caixa: { nome: 'Caixa', icone: 'package' },
      pacote: { nome: 'Pacote', icone: 'package-open' },
      envelope: { nome: 'Envelope', icone: 'mail' },
      sacola: { nome: 'Sacola', icone: 'shopping-bag' },
      grande: { nome: 'Volume grande', icone: 'box' }
    },

    encomendas: [
      { id: 'e1', unidade: 'B-304', tipo: 'caixa', descricao: 'Caixa média, etiqueta dos Correios', chegou: '2026-10-16T14:12:00', codigo: '482731', recebidoPor: 'José', avisos: ['2026-10-16T14:13:00'], status: 'pendente' },
      { id: 'e2', unidade: 'B-304', tipo: 'envelope', descricao: 'Envelope de banco, parece cartão', chegou: '2026-10-14T10:05:00', codigo: '905164', recebidoPor: 'Cláudio', avisos: ['2026-10-14T10:06:00'], status: 'pendente' },
      { id: 'e3', unidade: 'A-102', tipo: 'sacola', descricao: 'Sacola de farmácia lacrada', chegou: '2026-10-16T17:50:00', codigo: '317402', recebidoPor: 'José', avisos: ['2026-10-16T17:51:00'], status: 'pendente' },
      { id: 'e4', unidade: 'C-801', tipo: 'grande', descricao: 'Caixa grande, ventilador de coluna', chegou: '2026-10-10T09:30:00', codigo: '660913', recebidoPor: 'Cláudio', avisos: ['2026-10-10T09:31:00'], status: 'pendente' },
      { id: 'e5', unidade: 'D-203', tipo: 'pacote', descricao: 'Pacote plástico cinza', chegou: '2026-10-12T16:20:00', codigo: '128845', recebidoPor: 'Cláudio', avisos: ['2026-10-12T16:21:00'], status: 'pendente' },
      { id: 'e6', unidade: 'A-604', tipo: 'caixa', descricao: 'Caixa pequena de livraria', chegou: '2026-10-15T19:02:00', codigo: '774190', recebidoPor: 'José', avisos: ['2026-10-15T19:03:00'], status: 'pendente' },
      { id: 'e7', unidade: 'C-302', tipo: 'envelope', descricao: 'Envelope pardo, documento', chegou: '2026-10-16T11:30:00', codigo: '539026', recebidoPor: 'Cláudio', avisos: ['2026-10-16T11:31:00'], status: 'pendente' },
      { id: 'e8', unidade: 'D-704', tipo: 'grande', descricao: 'Caixa grande, cadeira de escritório', chegou: '2026-10-13T08:45:00', codigo: '201377', recebidoPor: 'Cláudio', avisos: ['2026-10-13T08:46:00'], status: 'pendente' },
      { id: 'e9', unidade: 'B-304', tipo: 'pacote', descricao: 'Pacote de roupa', chegou: '2026-10-09T15:40:00', codigo: '330918', recebidoPor: 'José', avisos: ['2026-10-09T15:41:00'], status: 'entregue', entregue: '2026-10-09T19:12:00', retiradoPor: 'Mariana Costa' },
      { id: 'e10', unidade: 'A-301', tipo: 'caixa', descricao: 'Caixa de mercado on-line', chegou: '2026-10-16T09:10:00', codigo: '845512', recebidoPor: 'Cláudio', avisos: ['2026-10-16T09:11:00'], status: 'entregue', entregue: '2026-10-16T12:05:00', retiradoPor: 'Bruno Ribeiro' },
      { id: 'e11', unidade: 'D-402', tipo: 'envelope', descricao: 'Envelope de cartório', chegou: '2026-10-16T10:40:00', codigo: '410278', recebidoPor: 'Cláudio', avisos: ['2026-10-16T10:41:00'], status: 'entregue', entregue: '2026-10-16T18:02:00', retiradoPor: 'Paula Moura' }
    ],

    areas: [
      {
        id: 'salao',
        nome: 'Salão de festas',
        icone: 'party-popper',
        capacidade: 60,
        taxa: 150,
        regras: [
          'Som baixo a partir das 22h e fim da festa às 23h.',
          'Até 60 pessoas. Os nomes dos convidados vão para a portaria até a véspera.',
          'Devolver limpo até as 10h do dia seguinte. A vistoria é feita com o zelador.',
          'Cancelamento sem custo até 48 horas antes.'
        ]
      },
      {
        id: 'churrasqueira',
        nome: 'Churrasqueira',
        icone: 'flame',
        capacidade: 25,
        taxa: 80,
        regras: [
          'Som baixo a partir das 22h e fim às 23h.',
          'Até 25 pessoas.',
          'Carvão e limpeza da grelha por conta de quem reservou.',
          'Cancelamento sem custo até 48 horas antes.'
        ]
      }
    ],

    periodos: [
      { id: 'almoco', nome: 'Almoço', horario: '10h às 16h' },
      { id: 'noite', nome: 'Noite', horario: '17h às 23h' }
    ],

    // Reservas de outras unidades (só mostramos "reservado", sem dizer quem)
    reservas: [
      { id: 'r1', area: 'salao', data: '2026-10-17', periodo: 'noite', unidade: 'A-503' },
      { id: 'r2', area: 'salao', data: '2026-10-18', periodo: 'almoco', unidade: 'C-204' },
      { id: 'r3', area: 'salao', data: '2026-10-23', periodo: 'noite', unidade: 'D-101' },
      { id: 'r4', area: 'salao', data: '2026-10-31', periodo: 'almoco', unidade: 'B-702' },
      { id: 'r5', area: 'salao', data: '2026-11-07', periodo: 'almoco', unidade: 'A-208' },
      { id: 'r6', area: 'salao', data: '2026-11-07', periodo: 'noite', unidade: 'A-208' },
      { id: 'r7', area: 'salao', data: '2026-11-14', periodo: 'noite', unidade: 'C-603' },
      { id: 'r8', area: 'churrasqueira', data: '2026-10-17', periodo: 'almoco', unidade: 'D-304' },
      { id: 'r9', area: 'churrasqueira', data: '2026-10-24', periodo: 'almoco', unidade: 'B-101' },
      { id: 'r10', area: 'churrasqueira', data: '2026-10-25', periodo: 'almoco', unidade: 'C-702' }
    ],

    // Horário que parece livre mas é reservado por outra unidade enquanto a moradora preenche:
    // é o caso de conflito do protótipo.
    disputa: { area: 'salao', data: '2026-10-24', periodo: 'noite', unidade: 'D-502' },

    avisos: [
      {
        id: 'a1',
        importante: true,
        titulo: 'Falta de água na terça, 20/10, das 8h às 14h',
        resumo: 'Manutenção na rede da rua. A caixa do prédio segura parte da manhã, mas pode faltar água nos andares altos.',
        texto: 'A companhia de água avisou que vai trocar um registro na rede da rua. As caixas do condomínio estarão cheias às 8h e devem durar parte da manhã. Nos andares de 6 a 8 a pressão cai primeiro. Se puder, guarde água para cozinhar.',
        autor: 'Síndica Renata',
        data: '2026-10-16T09:00:00',
        lido: false,
        ciencia: true
      },
      {
        id: 'a2',
        importante: true,
        titulo: 'Elevador social do Bloco B parado na quinta, 22/10, das 9h às 12h',
        resumo: 'Manutenção preventiva. O elevador de serviço segue funcionando.',
        texto: 'A empresa de manutenção vai fazer a revisão anual do elevador social do Bloco B. O elevador de serviço continua funcionando normalmente. Mudanças e entregas grandes nesse horário, só com aviso à portaria.',
        autor: 'Administração',
        data: '2026-10-15T16:30:00',
        lido: false,
        ciencia: true
      },
      {
        id: 'a3',
        importante: false,
        titulo: 'Assembleia ordinária: 29/10, às 19h30, no salão de festas',
        resumo: 'Pauta: prestação de contas, obras da fachada e regras do bicicletário.',
        texto: 'A pauta completa e a procuração estão na administração. Quem não puder ir pode mandar procuração assinada até o dia da assembleia.',
        autor: 'Síndica Renata',
        data: '2026-10-14T11:00:00',
        lido: false
      },
      {
        id: 'a4',
        importante: false,
        titulo: 'Dedetização das áreas comuns no sábado, 17/10',
        resumo: 'Garagem e escadas das 8h às 11h. Evite circular com pets nesse horário.',
        texto: 'A dedetização é feita só nas áreas comuns. Não é preciso deixar ninguém entrar no apartamento.',
        autor: 'Administração',
        data: '2026-10-13T10:00:00',
        lido: true
      },
      {
        id: 'a5',
        importante: false,
        titulo: 'Achados e perdidos: chave com chaveiro azul',
        resumo: 'Encontrada no parquinho. Está na portaria.',
        texto: 'Quem perdeu pode retirar na portaria a qualquer hora, descrevendo o chaveiro.',
        autor: 'Portaria',
        data: '2026-10-12T18:20:00',
        lido: true
      },
      {
        id: 'a6',
        importante: true,
        titulo: 'Troca do controle do portão da garagem até 30/10',
        resumo: 'Os controles antigos param de funcionar no dia 31. A troca é na administração.',
        texto: 'Leve o controle antigo e um documento. A troca é gratuita para o primeiro controle de cada vaga.',
        autor: 'Administração',
        data: '2026-10-08T09:00:00',
        lido: true,
        ciencia: true,
        ciente: '2026-10-08T20:10:00'
      }
    ],

    visitantes: [
      { id: 'v1', unidade: 'A-102', nome: 'Sônia Fernandes', tipo: 'visita', data: '2026-10-16', ate: '23:59', codigo: '5823', status: 'aguardando' },
      { id: 'v2', unidade: 'D-704', nome: 'Técnico da internet', tipo: 'prestador', data: '2026-10-16', ate: '20:00', codigo: '1407', status: 'entrou', entrada: '2026-10-16T17:35:00' },
      { id: 'v3', unidade: 'B-304', nome: 'Diarista Rosa', tipo: 'prestador', data: '2026-10-19', ate: '18:00', codigo: '6650', status: 'aguardando' }
    ]
  };
})();
