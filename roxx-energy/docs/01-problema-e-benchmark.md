# 1. Problema, objetivo e benchmark

[← Voltar ao índice](README.md)

## Problema

Quem tem carro elétrico no Brasil sai de casa sem saber três coisas sobre o carregador onde pretende parar:

1. **Se vai estar livre.** Pode ter fila, ou um carro estacionado na vaga sem carregar.
2. **Se está funcionando.** Ponto quebrado é comum e a informação demora a chegar nos apps.
3. **Se é compatível.** Conector CCS2, Tipo 2, CHAdeMO, potência AC ou DC: nem todo ponto serve em todo carro.

Na prática a pessoa usa mais de um app, liga para o estabelecimento, ou só descobre quando chega.

## Objetivo

Desenhar um app em que o motorista consiga, **em menos de um minuto, achar um carregador livre, funcionando e compatível**, garantir a vaga e pagar sem sair do app.

O que considero sucesso para o protótipo:

- Achar uma estação compatível e livre sem precisar entender a diferença entre os conectores.
- Saber quanto vai pagar antes de começar, e quanto está pagando durante a recarga.
- Ter o gasto do mês num lugar só.

### Como podemos…

- Como podemos fazer o motorista confiar no status do carregador antes de sair de casa?
- Como podemos tirar do motorista a necessidade de entender de conector e potência?
- Como podemos garantir a vaga sem punir quem atrasa um pouco no trânsito?

### Fora do escopo

- Planejamento de viagem entre cidades (fica para depois, ver próximos passos).
- Carregador em casa ou no condomínio: o problema aqui é o ponto público.
- Painel do operador da rede: o case é sobre o motorista.

## Benchmark

Analisei cinco produtos reais que resolvem parte do problema. As informações vêm das páginas nas lojas de apps, dos sites oficiais e de matérias da imprensa especializada, consultadas em outubro de 2026. Esses apps mudam com frequência: onde não encontrei informação, escrevi "não encontrei", e não "não tem".

| | PlugShare | Tupi (antiga Tupinambá) | Zletric | EZVolt | Shell Recharge (Raízen) |
|---|---|---|---|---|---|
| **O que é** | Mapa colaborativo mundial de pontos de recarga | App que reúne eletropostos de várias redes e faz a recarga | Rede própria, forte em condomínios e estabelecimentos | Rede própria de eletropostos | Rede de carga rápida em postos Shell |
| **Mapa e filtro por conector** | Sim, com muitos filtros | Sim, AC/DC e compatibilidade de plugue | Sim, no app | Sim | Pela rede de parceiros |
| **Status em tempo real** | Em parte: depende de rede integrada ou de check-in da comunidade | Sim, filtro de disponibilidade | Não encontrei detalhes | Sim, disponibilidade em tempo real | Livre/ocupado (relato de 2022) |
| **Reserva** | Não encontrei | Sim, exceto carga rápida | Não encontrei | Sim, via BYD Recharge | Até 15 min antes (relato de 2022) |
| **Iniciar e pagar no app** | Não encontrei para o Brasil | Sim, com carteira e Pix | Sim, cartão de crédito | Sim, cartão de crédito e Ticket Car | Sim, pelo app da Tupinambá na época |
| **Histórico e gastos** | Não é o foco | Sim, histórico e consumo | Não encontrei | Não encontrei | Não encontrei |
| **Avaliações** | Sim, é o ponto forte | Não encontrei | Não encontrei | Não encontrei | Não encontrei |

### Pontos fortes e falhas que observei

**PlugShare**
- Forte: a maior base de pontos e uma comunidade ativa, com fotos, comentários e check-ins.
- Falha: quando o ponto não é de uma rede integrada, o status depende de alguém ter feito check-in. Um "funcionando" de três dias atrás não diz muito.

**Tupi (antiga Tupinambá Energia)**
- Forte: é o mais completo da lista. Junta várias redes, filtra por compatibilidade, deixa reservar, iniciar, acompanhar e pagar com Pix.
- Falha: a reserva não vale para carga rápida, que é justamente onde costuma ter mais disputa.

**Zletric**
- Forte: presença em lugares onde o carro já fica parado por horas (condomínio, shopping, estacionamento).
- Falha: o pagamento que encontrei citado é só cartão de crédito, e não achei reserva. Para quem depende de ponto público num horário apertado, falta previsibilidade.

**EZVolt**
- Forte: mostra disponibilidade em tempo real e libera a recarga pelo app.
- Falha: a mesma rede aparece no app próprio e no BYD Recharge. O motorista precisa decidir em qual app confiar.

**Shell Recharge (Raízen)**
- Forte: carregadores de 50 kW e 150 kW em postos de rodovia e cidade, pensados para recarga rápida.
- Falha: no começo, o pagamento era feito pelo app de outra empresa. Para o motorista, isso vira mais um cadastro e mais um app.

### O que eu levei para o Roxx

| Observação | Decisão no Roxx |
|---|---|
| Status sem data de atualização não passa confiança (PlugShare) | Todo status mostra **há quantos minutos foi atualizado** |
| Checagem de plugue existe (Tupi), mas o usuário ainda precisa ligar o filtro | O carro é cadastrado no onboarding e o **filtro de conector já vem ligado** |
| Reserva só para AC deixa de fora o caso mais disputado (Tupi) | **Reserva vale para AC e DC**, com 15 min de tolerância (ideia que vi no Shell Recharge) |
| Pagamento espalhado em apps diferentes (Shell Recharge, EZVolt) | Reservar, carregar e **pagar no mesmo app**, com Pix e cartão salvo |
| Avaliações ajudam a decidir (PlugShare) | Avaliações curtas na tela da estação e botão para **reportar problema** |
| Pouca visão de gasto | **Histórico com total do mês** e comparação com os meses anteriores |

## Referências visuais

Não usei prints desses apps. Anotei o padrão que me interessava em cada referência e como ele aparece no Roxx.

| Referência | O que observei | Como usei |
|---|---|---|
| Apps de mobilidade (Uber, 99) | Mapa ocupa a tela, prévia do item selecionado em cima da lista, ação principal fixa no rodapé | Prévia da estação abaixo do mapa e botões fixos no rodapé nas telas de decisão |
| Apps de banco digital (Nubank, Inter) | Fluxo de Pix com valor em destaque, QR code e "copia e cola" lado a lado | Tela de pagamento com o mesmo modelo mental, sem inventar nada |
| Anéis de atividade (Apple Fitness) | Progresso circular lido de relance | Anel da bateria na recarga em andamento |
| Painéis de carros elétricos | Tema escuro, números grandes, verde associado a energia | Identidade escura com verde elétrico e números em Space Grotesk |

### Fontes consultadas

- Tupi Recarga na App Store e matéria do CanalVE sobre a mudança de marca da Tupi
- Matérias do CanalVE, Autopapo e Olhar Digital sobre EZVolt, Shell Recharge/Raízen e Zletric
- Páginas do PlugShare e dos apps nas lojas
