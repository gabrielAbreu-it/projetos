# projetos

Esse repo é minha base pra um exercício de QA/segurança — vou montar protótipos com bugs de propósito pra treinar entrevista de emprego. Tem dois tipos de conteúdo aqui: cópias de trabalho de projetos que já fiz (sem tocar em nada nos originais) e protótipos escritos do zero, inspirados em sistemas meus que não pude copiar por acesso/PI.

## O que tem aqui

| Pasta | Projeto | De quem é | Situação |
|---|---|---|---|
| `/site` | Site institucional STRATON.AI | Meu, sou sócio da STRATON.AI | ✅ Protótipo original — não é cópia do site real, escrevi do zero |
| `/sis` | SIS — Sistema Interno STRATON.AI | Meu, sou sócio da STRATON.AI | ✅ Protótipo original — não é cópia do sistema real, escrevi do zero a partir da especificação funcional |
| `/houston-education` | Houston Education | Projeto original do Henrique Gennari (github.com/HenriqueGennari), ele deixou eu usar, entrei como colaborador | ✅ Cópia importada |
| `/prevismob` | PrevIsmob | TCC que fiz em grupo — original em github.com/joseguilherme01/Prevismob | ✅ Cópia importada |

Escrevi a análise comparativa completa (stack, tamanho, formulários e nota de quanto cada um serve pra colocar bugs de propósito) no `ANALISE.md`.

## Por que `/site` e `/sis` são protótipos e não cópias

Os dois são repositórios privados da empresa (`STRATON-AI/site-straton` e `STRATON-AI/SIS`). Tentei importar automaticamente e esbarrei em duas barreiras diferentes: o `site-straton` nunca teve acesso liberado pra integração do Claude com o GitHub, e o `SIS` até teve o acesso liberado, mas a sessão que eu estava usando não conseguia puxar um repositório de outro dono — e a tentativa de cópia ainda acionou um gate de segurança pedindo confirmação explícita de que o código podia sair do repositório da empresa.

Pra não ficar travado nisso e pra não misturar código proprietário da STRATON.AI com um repositório pessoal de portfólio, decidi não copiar nenhum dos dois. Em vez disso, escrevi protótipos originais — mesma proposta, mesma identidade visual (âmbar e preto), mesmas telas principais —, mas com código e conteúdo escritos do zero por mim, sem nenhum trecho vindo dos repositórios reais.

## Demos de apresentação

`houston-education` e `prevismob` são só API, sem tela — pra narrar os bugs ao vivo numa entrevista, cada um tem uma página simples em `demo/index.html` que chama a API local de verdade e mostra a resposta (status + corpo) lado a lado com o que era esperado. Instruções de como rodar em `houston-education/demo/README.md` e `prevismob/demo/README.md`.
