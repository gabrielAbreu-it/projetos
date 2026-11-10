# Segundo Cérebro · aba Faculdade

Aba Faculdade do meu painel pessoal: puxa as atividades do Espaço Aluno (UniCEUB), ordena por prioridade e tem um tutor de IA por atividade.

Supabase: **só o projeto `nzydtjhcibzazcotyabp` (segundo-cerebro)**. Nada de senha ou chave no código: chaves ficam no `.env` local (fora do git) ou nos secrets do Supabase.

```
segundo-cerebro/
├── painel/faculdade.js, faculdade.css     # aba Faculdade (substitui o vFac do app.js)
├── painel/agente.js, agente.css           # aba Agente (prospecção)
├── painel/m.html                          # prévia interna do mockup
├── scripts/faculdade_sync.py               # robô do portal (roda no meu computador)
├── supabase/functions/faculdade-tutor/     # tutor (Edge Function)
└── supabase/functions/prospector/          # agente de prospecção (Edge Function)

../proposta/index.html                      # página pública do mockup (vai no portfólio)
```

Tabelas (já migradas, RLS só com `is_dono()`): `faculdade_itens`, `faculdade_chat`, `faculdade_sync`.

## 1. Rodar o sync

Uma vez:

```bash
cd segundo-cerebro
python -m venv .venv && source .venv/bin/activate
pip install -r scripts/requirements.txt
playwright install chromium
cp .env.example .env   # preencher SUPABASE_SERVICE_ROLE_KEY (Project Settings > API Keys > service_role)
```

Sempre que quiser atualizar:

```bash
python scripts/faculdade_sync.py
```

Abre um Chromium visível com perfil próprio (`.perfil-portal/`, guarda a sessão entre execuções). Eu faço o login à mão; o script detecta a página pós-login (ou aperto Enter no terminal) e varre sozinho: disciplinas, atividades, provas, avisos, prazo, peso, nota, anexos. PDFs e DOCX vão para `downloads/<disciplina>/` e o texto extraído vai para `materiais`. Depois recalcula a prioridade (prazo mais próximo e maior peso = 1), pede o resumo da IA dos itens novos e registra a execução em `faculdade_sync`. No fim mostra quantas disciplinas, quantas atividades e o que vence nos próximos 7 dias.

Se algo falhar, fica um print em `debug/` e o script segue.

O que entra (cópia do portal): todas as disciplinas e, em cada uma, as seções/semanas na ordem do portal, com atividades (tarefas, questionários), materiais (arquivos baixados e com texto extraído, links, páginas), aulas (rótulos e textos das seções), avisos (fórum de avisos), fóruns, e as notas do boletim. Cada item guarda se o portal marca como concluído ou não. Na aba, "Atividades e prazos" mostra o que tem prazo e prioridade; "Tudo da faculdade" mostra a cópia completa.

Opções úteis:

- `--mapear`: salva o HTML de cada página (todos os iframes) em `debug/`. Uso na primeira vez para conferir se os seletores batem com o portal e, se precisar, preencher `PORTAL_SELETOR_DISCIPLINAS` / `PORTAL_URL_LOGADO` no `.env`.
- `--dry-run`: varre sem gravar nada no Supabase (salva `debug/sync-dry-run.json`).
- `--sem-resumo`: não chama a IA.

O scraping nunca roda no servidor: o portal exige o meu login.

## 2. Chave do modelo

O tutor usa a API da Anthropic. A chave fica só em secret do Supabase, nunca no front:

```bash
supabase secrets set ANTHROPIC_API_KEY=... --project-ref nzydtjhcibzazcotyabp
```

(ou no dashboard: Edge Functions > Secrets). Opcionais: `TUTOR_MODELO` (padrão `claude-fable-5-1`, o mais forte) e `TUTOR_ESFORCO` (`low` a `max`, padrão `medium`; mais alto = mais lento e caro).

## 3. Deploy da função

```bash
cd segundo-cerebro
supabase functions deploy faculdade-tutor --project-ref nzydtjhcibzazcotyabp
```

`verify_jwt = true` (em `supabase/config.toml`). A função ainda confere `is_dono()` com o token de quem chamou; o script de sync entra com a service_role. Ações: `chat` (pergunta), `revisar` (rascunho colado) e `resumir` (gera `resumo_ia` com conceitos, o que é pedido, critérios e checklist). Histórico de cada item fica em `faculdade_chat`.

## 4. Aba no painel

Copiar `painel/faculdade.js` e `painel/faculdade.css` para a pasta do painel e incluir no `index.html`, depois do `app.js`:

```html
<link rel="stylesheet" href="/faculdade.css">
...
<script src="/app.js"></script>
<script src="/faculdade.js"></script>
```

Deploy do painel como sempre (`vercel --prod` na pasta do painel). A aba mostra a lista por prioridade, filtros por disciplina e status, destaque para prazo < 72h, atrasados em vermelho, contador dos próximos 7 dias e o botão Sincronizar (mostra o último sync e o comando). Clicando num item: enunciado, resumo da IA, checklist marcável, materiais, chat do tutor ao lado e a área de rascunho para revisar. O status muda com um clique (pendente → estudando → em produção → revisão → entregue); entregue também marca `concluido`, que o card da aba Hoje já usa.

## 5. Agente de prospecção (aba Agente)

Mesma lógica do Lead Gen que fiz para o Levi (Places API por nicho + cidade), agora dentro do painel e indo além:

1. **Buscar no Maps**: nicho + cidade → grava as lojas em `cb_leads` (sem duplicar, pelo `place_id`).
2. **Analisar**: lê o site, acha Instagram/Facebook/WhatsApp/e-mail, pesquisa na web quem é o dono ou gerente (só informação pública) e lista problemas e oportunidades.
3. **Mockup**: gera na hora uma página proposta para a loja. O link público abre em `gabriel-abreu-portfolio.vercel.app/proposta/?t=<token>` (o painel tem proteção da Vercel, então o lojista não conseguiria abrir por lá). O HTML gerado roda isolado, sem scripts.
4. **Abordagem**: escreve WhatsApp, e-mail e roteiro de ligação pedindo uma conversa de 20 min, com o link do mockup, o portfólio e dois horários livres da minha agenda.
5. **Eu aprovo**: nada sai sem aprovação (regra `mensagem_externa` do `cb_config`). "Aprovar e abrir WhatsApp/e-mail" registra a aprovação em `cb_aprovacoes`, marca o lead como abordado e abre a conversa pronta para eu enviar.
6. **Reunião**: "Marcar reunião" põe o evento na agenda do painel e move o lead para Reunião.

Secrets da função `prospector` (Supabase > Edge Functions > Secrets):

- `ANTHROPIC_API_KEY` (a mesma do tutor)
- `GOOGLE_PLACES_API_KEY`: Google Cloud > APIs > ativar **Places API (New)** > criar chave restrita a essa API
- opcionais: `PROSPECTOR_MODELO` (padrão `claude-opus-5-5`), `PROPOSTA_URL`, `PORTFOLIO_URL`

Deploy: `supabase functions deploy prospector --project-ref nzydtjhcibzazcotyabp`.

Envio automático (sem eu clicar) não está ligado de propósito: disparo automático por WhatsApp sem API oficial costuma bloquear o número. Dá para ligar depois com a API oficial do WhatsApp Business ou um provedor de e-mail.
