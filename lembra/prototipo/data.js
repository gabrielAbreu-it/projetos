/* Lembra — dados fictícios do protótipo.
   Nomes de remédio são genéricos de propósito. Não é orientação médica. */
window.LB = {
  agora: "12:00",
  dataTexto: "Sexta-feira, 16 de outubro",
  pessoa: { nome: "Lúcia", idade: 74 },
  cuidador: { nome: "Ana", relacao: "filha", relacaoDela: "mãe" },

  // forma: comprimido | capsula | gotas
  // caixa: cor da caixa de verdade, para a pessoa reconhecer pelo desenho
  remedios: [
    {
      id: "pressao",
      nome: "Remédio da pressão",
      qtd: 1,
      forma: "comprimido",
      nota: "Depois do café e depois do jantar",
      caixa: { fundo: "#ffffff", faixa: "#2f5fd0", nomeCor: "branca com faixa azul" },
      horarios: ["08:00", "20:00"],
      estoque: 24
    },
    {
      id: "estomago",
      nome: "Remédio do estômago",
      qtd: 1,
      forma: "capsula",
      nota: "Antes do almoço",
      caixa: { fundo: "#ffffff", faixa: "#2e8b57", nomeCor: "branca com faixa verde" },
      horarios: ["10:00"],
      estoque: 15
    },
    {
      id: "vitamina",
      nome: "Vitamina D",
      qtd: 1,
      forma: "capsula",
      nota: "Com o almoço",
      caixa: { fundo: "#ffe9a8", faixa: "#e0a100", nomeCor: "amarela" },
      horarios: ["12:00"],
      estoque: 30
    },
    {
      id: "colesterol",
      nome: "Remédio do colesterol",
      qtd: 1,
      forma: "comprimido",
      nota: "Antes de dormir",
      caixa: { fundo: "#fbe3e1", faixa: "#c0392b", nomeCor: "rosa com faixa vermelha" },
      horarios: ["20:00"],
      estoque: 3
    }
  ],

  // Doses de hoje. estado: pendente | tomado | pulado
  doses: [
    { id: "d1", rem: "pressao", hora: "08:00", estado: "tomado", tomadoAs: "08:04" },
    { id: "d2", rem: "estomago", hora: "10:00", estado: "pendente" },
    { id: "d3", rem: "vitamina", hora: "12:00", estado: "pendente" },
    { id: "d4", rem: "pressao", hora: "20:00", estado: "pendente" },
    { id: "d5", rem: "colesterol", hora: "20:00", estado: "pendente" }
  ],

  // Semana para a visão do cuidador (doses marcadas / doses previstas)
  semana: [
    { dia: "Sáb", marcadas: 5, total: 5 },
    { dia: "Dom", marcadas: 5, total: 5 },
    { dia: "Seg", marcadas: 4, total: 5 },
    { dia: "Ter", marcadas: 5, total: 5 },
    { dia: "Qua", marcadas: 5, total: 5 },
    { dia: "Qui", marcadas: 4, total: 5 }
  ],

  // Horários sugeridos no cadastro
  periodos: [
    { id: "manha", rotulo: "Manhã", hora: "08:00", icone: "sunrise" },
    { id: "almoco", rotulo: "Almoço", hora: "12:00", icone: "sun" },
    { id: "tarde", rotulo: "Tarde", hora: "16:00", icone: "sunset" },
    { id: "noite", rotulo: "Noite", hora: "20:00", icone: "moon" }
  ]
};
