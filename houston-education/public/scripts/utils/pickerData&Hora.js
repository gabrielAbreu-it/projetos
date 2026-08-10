
// Ativa o calendário para o campo de data
flatpickr(".datepicker", {
    dateFormat: "Y-m-d", // lembrar de altear para o formato americado e colocar o traço pra não dar erro no schema

    "locale": {
        "firstDayOfWeek": 1, 
        "weekdays": {
            "shorthand": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
            "longhand": ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
        },
        "months": {
            "shorthand": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
            "longhand": ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        }
    }
});

// Ativa o relógio para os campos de hora
flatpickr(".timepicker", {
    enableTime: true,   // Habilita a seleção de hora
    noCalendar: true,   // Esconde o calendário
    dateFormat: "H:i",  // Formato 24h (ex: 14:30)
    time_24hr: true     // Força o modo 24h
});
