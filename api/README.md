# API · /api/editais

Função serverless (Vercel, Node, sem dependências) usada pelo **Aprova Hub** para mostrar editais de concurso publicados nos diários oficiais, já resumidos e com os links oficiais.

## O que faz

`GET /api/editais?uf=SP&q=professor&dias=3&limite=30`

| Parâmetro | Padrão | Limite | O que é |
|---|---|---|---|
| `uf` | todas | 2 letras | Filtra pela sigla do estado (filtro feito na própria função) |
| `q` | vazio | 60 caracteres | Termo extra somado à busca por "concurso público" |
| `dias` | 3 | 1 a 15 | Quantos dias para trás |
| `limite` | 30 | 1 a 60 | Quantos itens devolver |

1. Consulta a API pública do **Querido Diário** (Open Knowledge Brasil), em `https://api.queridodiario.ok.org.br/gazettes`, com tempo limite de 8 segundos.
2. Transforma cada trecho encontrado em um item com órgão, UF, data, tipo (edital de abertura, retificação, resultado, homologação ou processo seletivo), resumo de até 3 frases, vagas, salário, data final das inscrições e banca (só se o nome aparecer escrito no trecho).
3. Remove repetidos, ordena do mais novo para o mais antigo e devolve `{ atualizado_em, fonte, itens }`.
4. A resposta fica em cache na Vercel por 15 minutos (`s-maxage=900, stale-while-revalidate=3600`).
5. Se a fonte falhar, devolve status 200 com `{ erro: true, itens: [] }`. O app então mostra os dados de exemplo, marcados como exemplo.

## Limites

- Só cobre os **diários oficiais municipais** que o Querido Diário já processa. Concursos federais (Diário Oficial da União) e estaduais ficam de fora por enquanto. Ligar essas fontes é o próximo passo.
- O tipo, as vagas, o salário, a data e a banca são encontrados por regras simples de texto. Podem falhar ou ficar vazios.
- **O resumo é automático. Confira sempre o documento original** pelo link "Ver no Diário Oficial".
- Os nomes dos parâmetros e o formato da resposta do Querido Diário foram escritos de memória e precisam ser conferidos na documentação oficial da API antes de publicar (veja a seção "Conferir" abaixo).

## Conferir antes de publicar

- Nomes dos parâmetros: `querystring`, `published_since`, `size`, `excerpt_size`, `number_of_excerpts`, `sort_by=descending_date`.
- Campos da resposta: `total_gazettes`, `gazettes[].territory_name`, `state_code`, `date`, `url`, `txt_url`, `excerpts`.
- Se a API aceitar filtro por estado, trocar o filtro de UF feito aqui pelo parâmetro dela.
- Limites de uso da API pública.

## Teste local

O ambiente de desenvolvimento não acessa a internet, então o teste usa uma resposta simulada:

```
node api/_editais.test.js
```

Arquivos que começam com `_` não viram rota na Vercel.
