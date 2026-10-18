/* Pila — dados fictícios do protótipo.
   Todos os valores (movimentações, DAS e limite anual) são exemplos inventados.
   Não são valores oficiais. */
window.PILA_DATA = {
  hoje: { dia: 16, mes: 10, ano: 2026 },
  usuaria: 'Rosana',
  mesNome: 'outubro',

  atividades: [
    { id: 'manicure', nome: 'Manicure', icone: 'sparkles', receita: 'Atendimento', negocio: 'Esmaltes e material' },
    { id: 'eletricista', nome: 'Eletricista', icone: 'zap', receita: 'Serviço', negocio: 'Material elétrico' },
    { id: 'confeitaria', nome: 'Confeitaria', icone: 'cake-slice', receita: 'Encomenda', negocio: 'Insumos' },
    { id: 'motorista', nome: 'Motorista de app', icone: 'car', receita: 'Corridas', negocio: 'Combustível' },
    { id: 'outra', nome: 'Outra atividade', icone: 'briefcase', receita: 'Venda ou serviço', negocio: 'Material' }
  ],

  /* escopo sugerido por categoria: o usuário pode trocar */
  categorias: {
    entrada: [
      { id: 'receita', nome: null, escopo: 'negocio', icone: 'hand-coins' },
      { id: 'venda', nome: 'Venda avulsa', escopo: 'negocio', icone: 'store' },
      { id: 'outra-entrada', nome: 'Dinheiro pessoal', escopo: 'pessoal', icone: 'wallet' }
    ],
    saida: [
      { id: 'material', nome: null, escopo: 'negocio', icone: 'package' },
      { id: 'transporte', nome: 'Transporte e entrega', escopo: 'negocio', icone: 'fuel' },
      { id: 'taxas', nome: 'Taxas e maquininha', escopo: 'negocio', icone: 'receipt' },
      { id: 'mercado', nome: 'Mercado de casa', escopo: 'pessoal', icone: 'shopping-basket' },
      { id: 'contas', nome: 'Contas de casa', escopo: 'pessoal', icone: 'lightbulb' },
      { id: 'outros-pessoal', nome: 'Outros pessoais', escopo: 'pessoal', icone: 'user' }
    ]
  },

  movimentos: [
    { id: 'm1', dia: 2, tipo: 'entrada', cat: 'receita', escopo: 'negocio', desc: 'Bolo de aniversário (Júlia)', valor: 280 },
    { id: 'm2', dia: 3, tipo: 'saida', cat: 'material', escopo: 'negocio', desc: 'Farinha, ovos e chocolate no atacado', valor: 520 },
    { id: 'm3', dia: 4, tipo: 'entrada', cat: 'venda', escopo: 'negocio', desc: 'Doces na feira do bairro', valor: 410 },
    { id: 'm4', dia: 5, tipo: 'saida', cat: 'mercado', escopo: 'pessoal', desc: 'Mercado do mês', valor: 312.5 },
    { id: 'm5', dia: 6, tipo: 'entrada', cat: 'receita', escopo: 'negocio', desc: '100 brigadeiros (festa infantil)', valor: 190 },
    { id: 'm6', dia: 7, tipo: 'saida', cat: 'material', escopo: 'negocio', desc: 'Embalagens e fitas', valor: 135 },
    { id: 'm7', dia: 8, tipo: 'entrada', cat: 'venda', escopo: 'negocio', desc: 'Venda por Pix', valor: 95 },
    { id: 'm8', dia: 9, tipo: 'saida', cat: 'contas', escopo: 'pessoal', desc: 'Conta de luz', valor: 148.9 },
    { id: 'm9', dia: 10, tipo: 'entrada', cat: 'receita', escopo: 'negocio', desc: 'Bolo de casamento (Carla e Davi)', valor: 650 },
    { id: 'm10', dia: 11, tipo: 'saida', cat: 'material', escopo: 'negocio', desc: 'Botijão de gás do forno', valor: 125 },
    { id: 'm11', dia: 11, tipo: 'entrada', cat: 'venda', escopo: 'negocio', desc: 'Doces na feira do bairro', valor: 380 },
    { id: 'm12', dia: 13, tipo: 'saida', cat: 'taxas', escopo: 'negocio', desc: 'Taxa da maquininha', valor: 38.4 },
    { id: 'm13', dia: 14, tipo: 'entrada', cat: 'receita', escopo: 'negocio', desc: 'Kit festa (Marcos)', valor: 320 },
    { id: 'm14', dia: 14, tipo: 'saida', cat: 'outros-pessoal', escopo: 'pessoal', desc: 'Farmácia', valor: 64.3 },
    { id: 'm15', dia: 15, tipo: 'saida', cat: 'transporte', escopo: 'negocio', desc: 'Entrega por aplicativo', valor: 46.8 },
    { id: 'm16', dia: 16, tipo: 'entrada', cat: 'venda', escopo: 'negocio', desc: 'Venda por Pix', valor: 140 }
  ],

  /* DAS: valor de exemplo, fictício */
  das: {
    valorExemplo: 80.9,
    vencimentoDia: 20,
    historico: [
      { mes: 'setembro', pagoEm: '18/09', valor: 80.9 },
      { mes: 'agosto', pagoEm: '20/08', valor: 80.9 },
      { mes: 'julho', pagoEm: '15/07', valor: 80.9 }
    ]
  },

  /* Limite anual de referência usado só no protótipo (exemplo) */
  limite: {
    referencia: 81000,
    avisos: [70, 80, 90],
    /* entradas do negócio por mês, jan a set (fictício); outubro vem dos movimentos */
    meses: [
      ['jan', 5200], ['fev', 5480], ['mar', 6100], ['abr', 6350], ['mai', 7900],
      ['jun', 8650], ['jul', 6820], ['ago', 7475], ['set', 9980]
    ]
  },

  /* mês anterior para comparação no relatório (fictício) */
  setembro: { entrou: 9980, saiu: 3410 }
};
