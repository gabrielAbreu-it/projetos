// Dados fictícios do protótipo Roxx Energy.
// Estações, avaliações e valores são inventados para a demonstração.

window.RX_DATA = {
  // Relógio fixo do protótipo, para as telas serem sempre iguais
  agora: { hora: '18:40', data: 'qua, 14 out' },

  conectores: {
    CCS2: { nome: 'CCS2', corrente: 'DC' },
    T2: { nome: 'Tipo 2', corrente: 'AC' },
    CHADEMO: { nome: 'CHAdeMO', corrente: 'DC' }
  },

  // Bateria em kWh (valores aproximados de mercado)
  veiculos: [
    { id: 'dolphin', modelo: 'BYD Dolphin', bateria: 44.9, conectores: ['CCS2', 'T2'] },
    { id: 'dolphin-mini', modelo: 'BYD Dolphin Mini', bateria: 38, conectores: ['CCS2', 'T2'] },
    { id: 'kwid', modelo: 'Renault Kwid E-Tech', bateria: 26.8, conectores: ['CCS2', 'T2'] },
    { id: 'ora', modelo: 'GWM Ora 03', bateria: 48, conectores: ['CCS2', 'T2'] },
    { id: 'leaf', modelo: 'Nissan Leaf', bateria: 40, conectores: ['CHADEMO', 'T2'] }
  ],

  estacoes: [
    {
      id: 'cln204',
      nome: 'Asa Norte · CLN 204',
      endereco: 'CLN 204, Bloco B — estacionamento',
      distancia: 1.2,
      horario: 'Aberto 24 horas',
      atualizado: 1,
      nota: 4.6,
      totalAvaliacoes: 128,
      mapa: { x: 57, y: 30 },
      comodidades: ['Banheiro', 'Café', 'Coberto'],
      pontos: [
        { id: 'A1', tipo: 'CCS2', potencia: 60, preco: 1.99, status: 'livre' },
        { id: 'A2', tipo: 'CCS2', potencia: 60, preco: 1.99, status: 'ocupado' },
        { id: 'B1', tipo: 'T2', potencia: 22, preco: 1.49, status: 'livre' },
        { id: 'B2', tipo: 'T2', potencia: 22, preco: 1.49, status: 'livre' }
      ],
      avaliacoes: [
        { autor: 'Marcos T.', nota: 5, quando: 'há 3 dias', texto: 'Os dois DC funcionando. Café do lado ajuda a esperar.' },
        { autor: 'Lívia R.', nota: 4, quando: 'há 1 semana', texto: 'Vaga às vezes ocupada por carro a combustão à noite.' }
      ]
    },
    {
      id: 'scs',
      nome: 'Setor Comercial Sul',
      endereco: 'SCS Quadra 6 — garagem subsolo',
      distancia: 2.8,
      horario: '06h às 23h',
      atualizado: 2,
      nota: 4.3,
      totalAvaliacoes: 86,
      mapa: { x: 47, y: 55 },
      comodidades: ['Coberto', 'Segurança'],
      pontos: [
        { id: 'A1', tipo: 'CCS2', potencia: 150, preco: 2.29, status: 'ocupado' },
        { id: 'A2', tipo: 'CCS2', potencia: 150, preco: 2.29, status: 'ocupado' },
        { id: 'C1', tipo: 'CHADEMO', potencia: 50, preco: 2.29, status: 'livre' }
      ],
      avaliacoes: [
        { autor: 'Paulo S.', nota: 4, quando: 'há 2 dias', texto: 'Carga muito rápida, mas no fim da tarde sempre tem fila.' },
        { autor: 'Renata M.', nota: 4, quando: 'há 2 semanas', texto: 'Garagem paga à parte. Sinal de celular fraco no subsolo.' }
      ]
    },
    {
      id: 'clsw103',
      nome: 'Sudoeste · CLSW 103',
      endereco: 'CLSW 103, lado do mercado',
      distancia: 3.5,
      horario: '07h às 22h',
      atualizado: 4,
      nota: 4.8,
      totalAvaliacoes: 54,
      mapa: { x: 24, y: 63 },
      comodidades: ['Banheiro', 'Mercado'],
      pontos: [
        { id: 'B1', tipo: 'T2', potencia: 22, preco: 1.49, status: 'livre' },
        { id: 'B2', tipo: 'T2', potencia: 22, preco: 1.49, status: 'livre' },
        { id: 'B3', tipo: 'T2', potencia: 22, preco: 1.49, status: 'livre' },
        { id: 'B4', tipo: 'T2', potencia: 22, preco: 1.49, status: 'fora' }
      ],
      avaliacoes: [
        { autor: 'Ana C.', nota: 5, quando: 'há 5 dias', texto: 'Dá pra fazer as compras enquanto carrega. Nunca peguei fila.' },
        { autor: 'João V.', nota: 4, quando: 'há 3 semanas', texto: 'O B4 está quebrado faz tempo.' }
      ]
    },
    {
      id: 'pontejk',
      nome: 'Lago Sul · Ponte JK',
      endereco: 'SHIS QI 25, cabeceira da ponte',
      distancia: 6.1,
      horario: 'Aberto 24 horas',
      atualizado: 1,
      nota: 4.7,
      totalAvaliacoes: 203,
      mapa: { x: 82, y: 78 },
      comodidades: ['Banheiro', 'Café', 'Wi-Fi'],
      pontos: [
        { id: 'A1', tipo: 'CCS2', potencia: 120, preco: 2.19, status: 'livre' },
        { id: 'A2', tipo: 'CCS2', potencia: 120, preco: 2.19, status: 'livre' },
        { id: 'A3', tipo: 'CCS2', potencia: 120, preco: 2.19, status: 'ocupado' },
        { id: 'A4', tipo: 'CCS2', potencia: 120, preco: 2.19, status: 'ocupado' }
      ],
      avaliacoes: [
        { autor: 'Fernanda L.', nota: 5, quando: 'ontem', texto: 'Melhor ponto da cidade. Quatro carregadores e vista pro lago.' },
        { autor: 'Rodrigo P.', nota: 4, quando: 'há 1 semana', texto: 'Preço um pouco mais alto, mas sempre funcionando.' }
      ]
    },
    {
      id: 'clnw10',
      nome: 'Noroeste · CLNW 10',
      endereco: 'CLNW 10/11, Bloco A',
      distancia: 4.4,
      horario: '08h às 22h',
      atualizado: 12,
      nota: 3.9,
      totalAvaliacoes: 31,
      mapa: { x: 30, y: 22 },
      comodidades: ['Coberto'],
      pontos: [
        { id: 'A1', tipo: 'CCS2', potencia: 60, preco: 1.99, status: 'fora' },
        { id: 'B1', tipo: 'T2', potencia: 7, preco: 1.39, status: 'livre' },
        { id: 'B2', tipo: 'T2', potencia: 7, preco: 1.39, status: 'livre' }
      ],
      avaliacoes: [
        { autor: 'Bruno A.', nota: 3, quando: 'há 4 dias', texto: 'O DC está fora de serviço. Só sobram os AC lentos.' },
        { autor: 'Carla D.', nota: 4, quando: 'há 1 mês', texto: 'Tranquilo pra deixar carregando durante o trabalho.' }
      ]
    },
    {
      id: 'aguasclaras',
      nome: 'Águas Claras · Av. Araucárias',
      endereco: 'Av. das Araucárias, 1.400',
      distancia: 18.0,
      horario: 'Aberto 24 horas',
      atualizado: 3,
      nota: 4.5,
      totalAvaliacoes: 77,
      mapa: { x: 10, y: 86 },
      comodidades: ['Banheiro', 'Café', 'Segurança'],
      pontos: [
        { id: 'A1', tipo: 'CCS2', potencia: 60, preco: 1.99, status: 'livre' },
        { id: 'A2', tipo: 'CCS2', potencia: 60, preco: 1.99, status: 'livre' }
      ],
      avaliacoes: [
        { autor: 'Thiago N.', nota: 5, quando: 'há 6 dias', texto: 'Sempre livre de madrugada. Bem iluminado.' },
        { autor: 'Patrícia F.', nota: 4, quando: 'há 2 semanas', texto: 'Às vezes o app demora pra liberar o cabo.' }
      ]
    },
    {
      id: 'cls405',
      nome: 'Asa Sul · CLS 405',
      endereco: 'CLS 405, Bloco C',
      distancia: 2.1,
      horario: '07h às 23h',
      atualizado: 2,
      nota: 4.2,
      totalAvaliacoes: 40,
      mapa: { x: 61, y: 66 },
      comodidades: ['Café'],
      pontos: [
        { id: 'B1', tipo: 'T2', potencia: 22, preco: 1.49, status: 'ocupado' },
        { id: 'B2', tipo: 'T2', potencia: 22, preco: 1.49, status: 'ocupado' }
      ],
      avaliacoes: [
        { autor: 'Diego H.', nota: 4, quando: 'há 3 dias', texto: 'Só AC, bom pra quem vai ficar mais de uma hora.' },
        { autor: 'Sônia B.', nota: 4, quando: 'há 1 mês', texto: 'Comércio em volta resolve a espera.' }
      ]
    }
  ],

  reserva: {
    taxa: 3.0, // abatida do valor da recarga
    tolerancia: 15, // minutos
    horarios: ['18:50', '19:00', '19:15', '19:30', '19:45', '20:00']
  },

  pagamento: {
    cartao: { bandeira: 'Visa', final: '4821' }
  },

  // Histórico: recargas anteriores de outubro e total dos meses passados
  historico: [
    { id: 'RX-10391', data: '09 out', hora: '21:12', estacao: 'pontejk', kwh: 31.2, preco: 2.19, minutos: 24 },
    { id: 'RX-10277', data: '05 out', hora: '08:03', estacao: 'cln204', kwh: 22.4, preco: 1.99, minutos: 26 },
    { id: 'RX-10154', data: '01 out', hora: '19:45', estacao: 'clsw103', kwh: 18.0, preco: 1.49, minutos: 52 }
  ],
  mesesAnteriores: [
    { mes: 'mai', total: 182.4 },
    { mes: 'jun', total: 205.1 },
    { mes: 'jul', total: 168.75 },
    { mes: 'ago', total: 221.3 },
    { mes: 'set', total: 196.6 }
  ]
};
