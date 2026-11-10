# Segundo Cérebro · aba Faculdade

Aba Faculdade do meu painel pessoal: puxa as atividades do Espaço Aluno (UniCEUB), ordena por prioridade e tem um tutor de IA por atividade.

Supabase: **só o projeto `nzydtjhcibzazcotyabp` (segundo-cerebro)**. Nada de senha ou chave no código: chaves ficam no `.env` local (fora do git) ou nos secrets do Supabase.

```
segundo-cerebro/
├── painel/faculdade.js, faculdade.css     # aba nova (substitui o vFac do app.js)
├── scripts/faculdade_sync.py               # robô do portal (roda no meu computador)
└── supabase/functions/faculdade-tutor/     # tutor (Edge Function)
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
