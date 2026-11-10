#!/usr/bin/env python3
"""Sincroniza o Espaço Aluno (UniCEUB) com a tabela faculdade_itens do Segundo Cérebro.

Fluxo: abre o portal num Chromium visível com perfil persistente, espera eu fazer o login
à mão e, quando a página pós-login carrega, varre as disciplinas do semestre sozinho.
Grava por upsert pelo hash (disciplina+titulo+prazo), baixa os anexos, extrai o texto,
recalcula a prioridade e registra a execução em faculdade_sync.

Uso (de dentro de segundo-cerebro/):
    python scripts/faculdade_sync.py               # sincroniza
    python scripts/faculdade_sync.py --mapear      # só salva HTML/print das páginas em debug/ para ajustar seletores
    python scripts/faculdade_sync.py --dry-run     # varre, mas grava em debug/sync-dry-run.json em vez do Supabase
    python scripts/faculdade_sync.py --sem-resumo  # não pede o resumo da IA para os itens novos
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import threading
import time
import traceback
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
from zoneinfo import ZoneInfo

import requests
from dotenv import load_dotenv
from playwright.sync_api import BrowserContext, Frame, Page, sync_playwright

BASE = Path(__file__).resolve().parent.parent
PERFIL = BASE / ".perfil-portal"
DOWNLOADS = BASE / "downloads"
DEBUG = BASE / "debug"
TZ = ZoneInfo("America/Sao_Paulo")

PROJETO_OK = "nzydtjhcibzazcotyabp"
PROJETO_PROIBIDO = "jndcyvzypmqmeiognsjz"  # STRATON: nunca

ANEXO_RE = re.compile(r"\.(pdf|docx?|pptx?|xlsx?|txt|md|odt|zip)(\?|$)|pluginfile\.php|/download", re.I)
MOODLE_ATIV_RE = re.compile(r"/mod/(assign|quiz|workshop|lesson|forum|h5pactivity|choice|feedback|data|glossary)/view\.php", re.I)
MOODLE_CURSO_RE = re.compile(r"/course/view\.php\?id=\d+", re.I)
DISC_TXT_RE = re.compile(r"disciplina|turma|sala de aula|ambiente virtual|minhas aulas|meus cursos|my courses", re.I)
ATIV_TXT_RE = re.compile(r"atividade|trabalho|prova|avalia[cç][aã]o|exerc[ií]cio|question[aá]rio|tarefa|entrega|semin[aá]rio|projeto|lista", re.I)
AVISO_TXT_RE = re.compile(r"aviso|comunicado|not[ií]cia|f[oó]rum de not[ií]cias|announcement", re.I)
PROX_RE = re.compile(r"^(pr[oó]xim[ao]|seguinte|next|›|»|>)$", re.I)
LOGIN_TXT_RE = re.compile(r"\b(sair|logout|desconectar|meu perfil|minhas disciplinas|painel)\b", re.I)

DIAS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"]
MESES = {"jan": 1, "fev": 2, "mar": 3, "abr": 4, "mai": 5, "jun": 6, "jul": 7, "ago": 8, "set": 9, "out": 10, "nov": 11, "dez": 12}
PRAZO_ROTULO_RE = re.compile(
    r"(data de entrega|data limite|prazo|vencimento|fecha(?:mento)?|encerra(?:mento)?|até|due|data da prova|data)\s*[:\-–]?\s*(.{0,60})",
    re.I,
)


# ----------------------------------------------------------------------------- utilidades

def log(msg: str) -> None:
    print(f"[{datetime.now():%H:%M:%S}] {msg}", flush=True)


def slug(s: str) -> str:
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()[:60] or "sem-nome"


def limpa(s: str | None) -> str:
    return re.sub(r"[ \t]+", " ", re.sub(r"\n{3,}", "\n\n", (s or "").replace("\r", ""))).strip()


def parse_data(texto: str) -> datetime | None:
    """Acha a primeira data em português no texto. Sem hora, assume 23:59."""
    t = texto.lower()
    m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{2,4})(?:[^\d]{1,12}(\d{1,2})[:h](\d{2}))?", t)
    if m:
        d, mo, a = int(m[1]), int(m[2]), int(m[3])
        a += 2000 if a < 100 else 0
        h, mi = (int(m[4]), int(m[5])) if m[4] else (23, 59)
    else:
        m = re.search(r"(\d{1,2})\s*(?:de\s+)?([a-zç]{3})[a-zç.]*\s*(?:de\s+)?(\d{4})(?:[^\d]{1,12}(\d{1,2})[:h](\d{2}))?", t)
        if not m or m[2][:3] not in MESES:
            return None
        d, mo, a = int(m[1]), MESES[m[2][:3]], int(m[3])
        h, mi = (int(m[4]), int(m[5])) if m[4] else (23, 59)
    try:
        return datetime(a, mo, d, h, mi, tzinfo=TZ)
    except ValueError:
        return None


def acha_prazo(texto: str) -> datetime | None:
    for m in PRAZO_ROTULO_RE.finditer(texto):
        dt = parse_data(m[2])
        if dt:
            return dt
    return None


def acha_numero(rotulos: str, texto: str) -> float | None:
    m = re.search(rf"(?:{rotulos})\s*[:\-–]?\s*(\d+(?:[.,]\d+)?)", texto, re.I)
    return float(m[1].replace(",", ".")) if m else None


def classifica(titulo: str, url: str, contexto: str = "") -> str | None:
    alvo = f"{titulo} {contexto}"
    if re.search(r"/mod/forum/", url) and AVISO_TXT_RE.search(alvo):
        return "aviso"
    if MOODLE_ATIV_RE.search(url) and not re.search(r"/mod/forum/", url):
        return "atividade"
    if AVISO_TXT_RE.search(alvo):
        return "aviso"
    if ATIV_TXT_RE.search(alvo):
        return "atividade"
    if re.search(r"\bnotas?\b|boletim", alvo, re.I):
        return "nota"
    return None


def calc_hash(disciplina: str, titulo: str, prazo: str | None) -> str:
    base = f"{disciplina.strip().lower()}|{titulo.strip().lower()}|{prazo or ''}"
    return hashlib.sha256(base.encode()).hexdigest()


def extrai_texto_arquivo(caminho: Path) -> str:
    ext = caminho.suffix.lower()
    try:
        if ext == ".pdf":
            from pypdf import PdfReader
            return limpa("\n".join((p.extract_text() or "") for p in PdfReader(str(caminho)).pages))
        if ext == ".docx":
            import docx
            d = docx.Document(str(caminho))
            partes = [p.text for p in d.paragraphs]
            for tb in d.tables:
                for row in tb.rows:
                    partes.append(" | ".join(c.text for c in row.cells))
            return limpa("\n".join(partes))
        if ext in (".txt", ".md"):
            return limpa(caminho.read_text(errors="ignore"))
    except Exception as e:  # arquivo corrompido ou protegido: segue sem texto
        log(f"  ! não consegui extrair texto de {caminho.name}: {e}")
    return ""


# ----------------------------------------------------------------------------- Supabase (REST)

class Supabase:
    def __init__(self, url: str, chave: str):
        self.url = url.rstrip("/")
        self.h = {"apikey": chave, "Authorization": f"Bearer {chave}", "Content-Type": "application/json"}

    def get(self, tabela: str, params: dict) -> list[dict]:
        r = requests.get(f"{self.url}/rest/v1/{tabela}", headers=self.h, params=params, timeout=60)
        r.raise_for_status()
        return r.json()

    def upsert(self, tabela: str, linhas: list[dict], conflito: str) -> list[dict]:
        if not linhas:
            return []
        h = {**self.h, "Prefer": "resolution=merge-duplicates,return=representation"}
        r = requests.post(f"{self.url}/rest/v1/{tabela}", headers=h, params={"on_conflict": conflito}, json=linhas, timeout=120)
        if not r.ok:
            raise RuntimeError(f"upsert {tabela}: {r.status_code} {r.text[:400]}")
        return r.json()

    def patch(self, tabela: str, filtros: dict, valores: dict) -> None:
        r = requests.patch(f"{self.url}/rest/v1/{tabela}", headers=self.h, params=filtros, json=valores, timeout=60)
        if not r.ok:
            raise RuntimeError(f"patch {tabela}: {r.status_code} {r.text[:400]}")

    def insert(self, tabela: str, linha: dict) -> None:
        r = requests.post(f"{self.url}/rest/v1/{tabela}", headers=self.h, json=linha, timeout=60)
        if not r.ok:
            raise RuntimeError(f"insert {tabela}: {r.status_code} {r.text[:400]}")

    def resumir(self, item_id: str) -> bool:
        r = requests.post(f"{self.url}/functions/v1/faculdade-tutor", headers=self.h,
                          json={"acao": "resumir", "item_id": item_id}, timeout=300)
        if not r.ok:
            log(f"  ! resumo IA falhou ({r.status_code}): {r.text[:200]}")
        return r.ok


# ----------------------------------------------------------------------------- coleta

@dataclass
class Item:
    tipo: str
    disciplina: str
    titulo: str
    url: str = ""
    descricao: str = ""
    enunciado: str = ""
    prazo: datetime | None = None
    data_ref: datetime | None = None
    peso: float | None = None
    nota: float | None = None
    materiais: list[dict] = field(default_factory=list)
    secao: str = ""
    ordem: int | None = None
    concluido_portal: bool | None = None

    def linha(self) -> dict:
        prazo = self.prazo.isoformat() if self.prazo else None
        # atividade/aviso/nota: hash = disciplina+título+prazo (como combinado);
        # material/aula/outro podem repetir título entre semanas, então entram seção e link
        chave = self.titulo if self.tipo in ("atividade", "aviso", "nota") else f"{self.titulo}|{self.secao}|{self.url}"
        return {
            "tipo": self.tipo, "disciplina": self.disciplina, "titulo": self.titulo[:300],
            "descricao": self.descricao[:2000] or None, "enunciado": self.enunciado or None,
            "data_ref": self.data_ref.isoformat() if self.data_ref else None, "prazo": prazo,
            "peso": self.peso, "nota": self.nota, "url": self.url or None,
            "materiais": self.materiais, "hash": calc_hash(self.disciplina, chave, prazo),
            "secao": self.secao or None, "ordem": self.ordem, "concluido_portal": self.concluido_portal,
            "atualizado_em": datetime.now(timezone.utc).isoformat(),
        }


MOD_TIPO = {
    **dict.fromkeys(["assign", "quiz", "workshop", "lesson", "h5pactivity", "choice", "feedback", "data", "glossary", "scorm", "lti"], "atividade"),
    **dict.fromkeys(["resource", "url", "folder", "page", "book", "imscp"], "material"),
    "label": "aula", "forum": "forum",
}

# Lê a estrutura de uma página de disciplina do Moodle: seções, módulos e marca de concluído.
MAPA_CURSO_JS = r"""() => {
  const out = []; let ordem = 0;
  const secoes = document.querySelectorAll('li.section, li[data-for="section"], div[data-for="section"]');
  secoes.forEach(sec => {
    const nomeSec = (sec.querySelector('.sectionname, [data-for="section_title"], h3')?.innerText || '').trim();
    const resumo = (sec.querySelector('.summary, .summarytext, [data-for="sectioninfo"]')?.innerText || '').trim();
    if (resumo) out.push({k: 'secao', secao: nomeSec, titulo: nomeSec || 'Apresentação', texto: resumo, ordem: ordem++});
    sec.querySelectorAll('li.activity, li[data-for="cmitem"]').forEach(a => {
      const mod = ((a.className.match(/modtype_(\w+)/) || [])[1]) || '';
      const link = a.querySelector('a[href*="/mod/"]') || a.querySelector('a[href]:not([href^="#"]):not([href^="javascript"])');
      let nome = (a.querySelector('.instancename, .activityname, [data-activityname]')?.innerText || link?.innerText || '').split('\n')[0].trim();
      const info = [...a.querySelectorAll('[data-region="completion-info"], .completion-info, .activity-completion, .automatic-completion-conditions, button[data-action="toggle-manual-completion"], img.icon')]
        .map(e => (e.innerText || '') + ' ' + (e.getAttribute('alt') || '') + ' ' + (e.getAttribute('data-toggletype') || '') + ' ' + (e.getAttribute('title') || '')).join(' ');
      let conc = null;
      if (/n[ãa]o conclu[ií]d|to do|a fazer|manual:mark-done|marcar como feito|incomplete/i.test(info)) conc = false;
      else if (/conclu[ií]d|done|feito|manual:undo|complete/i.test(info)) conc = true;
      out.push({k: 'mod', mod, secao: nomeSec, titulo: nome, href: link ? link.href : null,
                texto: link ? '' : (a.innerText || '').trim(), concluido: conc, ordem: ordem++});
    });
  });
  return out;
}"""


class Varredor:
    def __init__(self, ctx: BrowserContext, page: Page, mapear: bool):
        self.ctx, self.page, self.mapear = ctx, page, mapear
        self.falhas: list[str] = []
        self.n_debug = 0
        self._baixados: dict[str, dict] = {}

    # --- depuração
    def debug(self, rotulo: str, page: Page | None = None) -> None:
        page = page or self.page
        DEBUG.mkdir(exist_ok=True)
        self.n_debug += 1
        base = DEBUG / f"{datetime.now():%Y%m%d-%H%M%S}-{self.n_debug:03d}-{slug(rotulo)}"
        try:
            page.screenshot(path=f"{base}.png", full_page=True)
        except Exception:
            pass
        if self.mapear:
            for i, fr in enumerate(page.frames):
                try:
                    Path(f"{base}-frame{i}.html").write_text(f"<!-- {fr.url} -->\n{fr.content()}", encoding="utf-8")
                except Exception:
                    pass

    def falhou(self, onde: str, e: Exception, page: Page | None = None) -> None:
        self.falhas.append(f"{onde}: {e}")
        log(f"  ! {onde}: {e}")
        self.debug(f"erro-{onde}", page)

    # --- navegação
    def abre(self, url: str) -> Page:
        self.page.goto(url, wait_until="domcontentloaded", timeout=60_000)
        try:
            self.page.wait_for_load_state("networkidle", timeout=15_000)
        except Exception:
            pass
        return self.page

    @staticmethod
    def links(frame: Frame) -> list[tuple[str, str]]:
        try:
            return frame.eval_on_selector_all(
                "a[href]",
                "els => els.map(a => [(a.innerText || a.title || a.getAttribute('aria-label') || '').trim(), a.href])",
            )
        except Exception:
            return []

    def todos_links(self) -> list[tuple[str, str]]:
        out, vistos = [], set()
        for fr in self.page.frames:  # o portal usa iframes: varre todos
            for txt, href in self.links(fr):
                if href and href not in vistos and not href.startswith(("javascript:", "mailto:")):
                    vistos.add(href)
                    out.append((re.sub(r"\s+", " ", txt), href))
        return out

    def texto_pagina(self) -> str:
        partes = []
        for fr in self.page.frames:
            try:
                partes.append(fr.evaluate("() => document.body ? document.body.innerText : ''"))
            except Exception:
                pass
        return limpa("\n".join(partes))

    def proxima_pagina(self) -> bool:
        """Clica no 'próxima' da paginação, em qualquer frame. Devolve False se não houver."""
        for fr in self.page.frames:
            try:
                cands = fr.locator("a, button").filter(has_text=PROX_RE)
                cands = cands.or_(fr.locator("[aria-label*='próxima' i], [aria-label*='next' i], [rel=next]"))
                for i in range(min(cands.count(), 5)):
                    c = cands.nth(i)
                    if c.is_visible() and c.is_enabled() and c.get_attribute("aria-disabled") != "true":
                        c.click(timeout=5_000)
                        try:
                            self.page.wait_for_load_state("networkidle", timeout=10_000)
                        except Exception:
                            pass
                        return True
            except Exception:
                continue
        return False

    # --- disciplinas
    def disciplinas(self) -> list[tuple[str, str]]:
        sel = os.getenv("PORTAL_SELETOR_DISCIPLINAS", "").strip()
        achadas: dict[str, str] = {}

        def coleta():
            if sel:
                for fr in self.page.frames:
                    try:
                        for txt, href in fr.eval_on_selector_all(sel, "els => els.map(a => [a.innerText.trim(), a.href])"):
                            achadas.setdefault(href, txt)
                    except Exception:
                        pass
                return
            for txt, href in self.todos_links():
                if MOODLE_CURSO_RE.search(href) and txt and not re.fullmatch(r"(?i)(geral|todos|ver todos)", txt):
                    achadas.setdefault(href, txt)

        coleta()
        if achadas:
            for _ in range(10):  # lista de disciplinas paginada
                if not self.proxima_pagina():
                    break
                coleta()
        if not achadas:
            # ainda no portal principal: entra no menu de disciplinas/ambiente virtual e tenta de novo
            for txt, href in self.todos_links():
                if DISC_TXT_RE.search(txt):
                    log(f"  entrando em '{txt}' para achar as disciplinas")
                    try:
                        self.abre(href)
                        coleta()
                        # paginação da lista de cursos
                        for _ in range(10):
                            if not self.proxima_pagina():
                                break
                            coleta()
                    except Exception as e:
                        self.falhou("menu-disciplinas", e)
                    if achadas:
                        break
        if not achadas:
            self.debug("sem-disciplinas")
        return [(re.sub(r"\s+", " ", t).strip() or "Disciplina", h) for h, t in achadas.items()]

    # --- atividades de uma disciplina
    def atividades(self, nome: str, url: str) -> list[Item]:
        """Copia tudo da disciplina: atividades, materiais, aulas (rótulos/seções), avisos e notas."""
        self.abre(url)
        if self.mapear:
            self.debug(f"disciplina-{nome}")
        estrutura: list[dict] = []
        for fr in self.page.frames:
            try:
                estrutura += fr.evaluate(MAPA_CURSO_JS)
            except Exception:
                pass

        itens: list[Item] = []
        if estrutura:  # Moodle: segue a ordem do portal
            for m in estrutura:
                try:
                    if m["k"] == "secao" or not m.get("href"):
                        texto = limpa(m.get("texto"))
                        if texto:
                            titulo = m.get("titulo") or texto.split("\n")[0][:120]
                            itens.append(Item(tipo="aula", disciplina=nome, titulo=titulo, enunciado=texto, descricao=texto[:400],
                                              secao=m.get("secao") or "", ordem=m.get("ordem"), concluido_portal=m.get("concluido")))
                        continue
                    tipo = MOD_TIPO.get(m.get("mod") or "", None)
                    itens.extend(self.detalhe(nome, m.get("titulo") or "", m["href"], tipo=tipo, secao=m.get("secao") or "",
                                              ordem=m.get("ordem"), concluido=m.get("concluido")))
                except Exception as e:
                    self.falhou(f"item-{slug(m.get('titulo') or 'sem-nome')}", e)
        else:  # portal sem a estrutura do Moodle: heurística por links
            cands: dict[str, str] = {}
            for _ in range(20):
                for txt, href in self.todos_links():
                    if not txt or len(txt) < 3:
                        continue
                    if MOODLE_ATIV_RE.search(href) or ANEXO_RE.search(href) or (classifica(txt, href) and urlparse(href).netloc == urlparse(url).netloc):
                        cands.setdefault(href, txt)
                if not self.proxima_pagina():
                    break
            for n, (href, txt) in enumerate(cands.items()):
                try:
                    itens.extend(self.detalhe(nome, txt, href, ordem=n))
                except Exception as e:
                    self.falhou(f"item-{slug(txt)}", e)

        notas = self.boletim(nome, url)
        por_titulo = {i.titulo.strip().lower(): i for i in itens if i.tipo == "atividade"}
        for n in notas:  # nota também vai para a atividade com o mesmo nome
            alvo = por_titulo.get(n.titulo.strip().lower())
            if alvo and n.nota is not None:
                alvo.nota = n.nota
        return itens + notas

    def boletim(self, disciplina: str, url_curso: str) -> list[Item]:
        m = re.search(r"[?&]id=(\d+)", url_curso)
        if not m:
            return []
        base = f"{urlparse(url_curso).scheme}://{urlparse(url_curso).netloc}"
        try:
            self.abre(f"{base}/grade/report/user/index.php?id={m[1]}")
            linhas = []
            for fr in self.page.frames:
                try:
                    linhas += fr.eval_on_selector_all(
                        "table.user-grade tr, table.generaltable tr",
                        "rows => rows.map(r => [...r.querySelectorAll('th,td')].map(c => c.innerText.trim()))")
                except Exception:
                    pass
            itens = []
            for n, cols in enumerate(linhas):
                if len(cols) < 2 or not cols[0] or re.fullmatch(r"(?i)item de nota|grade item|nota|total.*", cols[0]):
                    continue
                valor = next((acha_numero("", c) for c in cols[1:] if re.fullmatch(r"\s*\d+(?:[.,]\d+)?\s*", c or "")), None)
                if valor is None:
                    continue
                itens.append(Item(tipo="nota", disciplina=disciplina, titulo=cols[0][:200], nota=valor, secao="Notas", ordem=10_000 + n,
                                  enunciado=" | ".join(cols), descricao=" | ".join(cols)[:400], url=self.page.url))
            if self.mapear:
                self.debug(f"boletim-{disciplina}")
            return itens
        except Exception as e:
            self.falhou(f"boletim-{slug(disciplina)}", e)
            return []

    def detalhe(self, disciplina: str, titulo_link: str, href: str, tipo: str | None = None,
                secao: str = "", ordem: int | None = None, concluido: bool | None = None) -> list[Item]:
        extra = {"secao": secao, "ordem": ordem, "concluido_portal": concluido}
        if tipo == "material" or ANEXO_RE.search(href):
            arq = self.baixa_url(href, disciplina, titulo_link)
            if arq:  # o link já era o arquivo (ex.: mod/resource que baixa direto)
                return [Item(tipo="material", disciplina=disciplina, titulo=titulo_link or arq["nome"], url=href,
                             enunciado=arq.get("texto", "")[:20000], descricao=(arq.get("texto") or "")[:400], materiais=[arq], **extra)]
        self.abre(href)
        corpo = self.texto_pagina()
        titulo = titulo_link
        for fr in self.page.frames:
            try:
                h = fr.locator("h1, h2").first
                if h.count() and h.inner_text(timeout=2_000).strip():
                    t = h.inner_text().strip()
                    if 3 <= len(t) <= 200 and t.lower() != disciplina.lower():
                        titulo = t
                        break
            except Exception:
                pass
        # Moodle: some "Marcar como feito", rótulos do tipo de atividade, etc.
        titulo = re.sub(r"\s*(Tarefa|Questionário|Fórum|Atividade)\s*$", "", titulo).strip() or titulo_link

        # fórum de avisos: cada tópico vira um aviso
        if re.search(r"/mod/forum/view\.php", href):
            if AVISO_TXT_RE.search(f"{titulo_link} {titulo}"):
                avisos = self.avisos_forum(disciplina)
                for a in avisos:
                    a.secao = secao or "Avisos"
                return avisos
            tipo = "outro"  # fórum de discussão: entra como item para eu ver/participar

        enunciado = ""
        for sel in ("#intro", ".activity-description", ".box.generalbox", "[data-region='activity-information'] ~ div", "div.no-overflow", "main"):
            for fr in self.page.frames:
                try:
                    loc = fr.locator(sel).first
                    if loc.count():
                        t = limpa(loc.inner_text(timeout=2_000))
                        if len(t) > len(enunciado):
                            enunciado = t
                except Exception:
                    pass
            if enunciado and sel != "main":
                break
        enunciado = enunciado or corpo[:8000]

        tipo = tipo or classifica(titulo, href, corpo[:400]) or "atividade"
        if concluido is None and re.search(r"(?i)enviado para avalia[cç][aã]o|submitted for grading|tentativa finalizada|status de conclus[aã]o:\s*conclu", corpo):
            concluido = True
            extra["concluido_portal"] = True
        item = Item(tipo=tipo, disciplina=disciplina, titulo=titulo, url=href, enunciado=enunciado,
                    descricao=enunciado[:400], prazo=acha_prazo(corpo) if tipo != "material" else None,
                    peso=acha_numero(r"peso|valor|vale|pontua[cç][aã]o m[aá]xima", corpo),
                    nota=acha_numero(r"\bnota\b(?! m[aá]xima)|nota obtida|sua nota", corpo), **extra)
        item.materiais = self.baixa_anexos(disciplina)
        if not item.enunciado.strip() or len(item.enunciado) < 80:
            texto_anexo = "\n\n".join(m["texto"] for m in item.materiais if m.get("texto"))
            if texto_anexo:
                item.enunciado = limpa(f"{item.enunciado}\n\n{texto_anexo}")
        return [item]

    def avisos_forum(self, disciplina: str) -> list[Item]:
        itens = []
        topicos: dict[str, str] = {}
        for _ in range(10):
            for txt, href in self.todos_links():
                if re.search(r"/mod/forum/discuss\.php\?d=\d+", href) and txt and "#" not in href:
                    topicos.setdefault(href, txt)
            if not self.proxima_pagina():
                break
        for href, txt in list(topicos.items())[:40]:
            try:
                self.abre(href)
                corpo = self.texto_pagina()
                itens.append(Item(tipo="aviso", disciplina=disciplina, titulo=txt, url=href,
                                  enunciado=corpo[:8000], descricao=corpo[:400], data_ref=parse_data(corpo),
                                  prazo=acha_prazo(corpo) if ATIV_TXT_RE.search(corpo[:2000]) else None))
            except Exception as e:
                self.falhou(f"aviso-{slug(txt)}", e)
        return itens

    def baixa_url(self, href: str, disciplina: str, txt: str = "") -> dict | None:
        """Baixa um arquivo com a sessão logada. Devolve None se o link for uma página HTML."""
        if href in self._baixados:
            return self._baixados[href]
        r = self.ctx.request.get(href, timeout=60_000)  # usa os cookies da sessão logada
        if not r.ok:
            return None
        ctype = r.headers.get("content-type", "")
        if "text/html" in ctype:
            return None  # página intermediária, não é o arquivo
        nome = self._nome_arquivo(r.headers.get("content-disposition", ""), href, txt, ctype)
        pasta = DOWNLOADS / slug(disciplina)
        pasta.mkdir(parents=True, exist_ok=True)
        destino = pasta / nome
        destino.write_bytes(r.body())
        log(f"    arquivo: {nome}")
        arq = {"nome": txt or nome, "url": href, "arquivo": str(destino.relative_to(BASE)), "texto": extrai_texto_arquivo(destino)}
        self._baixados[href] = arq
        return arq

    def baixa_anexos(self, disciplina: str) -> list[dict]:
        mats, vistos = [], set()
        for txt, href in self.todos_links():
            if not ANEXO_RE.search(href) or href in vistos:
                continue
            vistos.add(href)
            try:
                arq = self.baixa_url(href, disciplina, txt)
                if arq:
                    mats.append(arq)
            except Exception as e:
                self.falhou(f"anexo-{slug(txt or href)}", e)
        return mats

    @staticmethod
    def _nome_arquivo(disp: str, href: str, txt: str, ctype: str) -> str:
        m = re.search(r"filename\*?=(?:UTF-8'')?\"?([^\";]+)", disp, re.I)
        nome = unquote(m[1]) if m else unquote(Path(urlparse(href).path).name)
        if "." not in nome:
            ext = {"application/pdf": ".pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx"}.get(ctype.split(";")[0], "")
            nome = (slug(txt) or "anexo") + ext
        raiz, ext = os.path.splitext(nome)
        return f"{slug(raiz)}{ext.lower()}"


# ----------------------------------------------------------------------------- login

def logado(page: Page, url_login: str) -> bool:
    alvo = os.getenv("PORTAL_URL_LOGADO", "").strip()
    sel = os.getenv("PORTAL_SELETOR_LOGADO", "").strip()
    if alvo:
        return any(alvo in fr.url for fr in page.frames)
    if sel:
        return any(fr.locator(sel).count() > 0 for fr in page.frames)
    # heurística: sem campo de senha visível, saiu da URL de login e tem cara de área logada
    for fr in page.frames:
        try:
            if fr.locator("input[type=password]:visible").count():
                return False
        except Exception:
            pass
    if re.search(r"login|signin|auth|sso|adfs|oauth", page.url, re.I):
        return False
    try:
        texto = " ".join(fr.evaluate("() => document.body ? document.body.innerText.slice(0, 5000) : ''") for fr in page.frames)
    except Exception:
        return False
    return page.url.rstrip("/") != url_login.rstrip("/") or bool(LOGIN_TXT_RE.search(texto))


def espera_login(page: Page, url_login: str, limite_min: int = 15) -> None:
    enter = threading.Event()

    def ouvir():
        try:
            if sys.stdin.readline():  # EOF (sem terminal) não conta como Enter
                enter.set()
        except Exception:
            pass

    threading.Thread(target=ouvir, daemon=True).start()
    log("Faça o login no navegador que abriu. Eu detecto sozinho quando a área do aluno carregar")
    log("(ou aperte Enter aqui quando estiver na página inicial do aluno).")
    fim = time.time() + limite_min * 60
    ok_seguidos = 0
    while time.time() < fim:
        if enter.is_set():
            break
        try:
            ok_seguidos = ok_seguidos + 1 if logado(page, url_login) else 0
        except Exception:
            ok_seguidos = 0
        if ok_seguidos >= 2:  # dois checks seguidos para não pegar redirect no meio
            break
        time.sleep(2)
    else:
        raise TimeoutError(f"login não detectado em {limite_min} min")
    try:
        page.wait_for_load_state("networkidle", timeout=15_000)
    except Exception:
        pass
    log(f"Login ok. Página: {page.url}")


# ----------------------------------------------------------------------------- prioridade e resumo

def calcula_prioridades(itens: list[dict]) -> list[dict]:
    """1 = mais urgente: prazo mais próximo primeiro (atrasados no topo), empate pelo maior peso.
    Itens entregues ou sem prazo ficam sem prioridade."""
    abertos = [i for i in itens if i.get("status") != "entregue" and i.get("prazo") and i.get("tipo") in ("atividade", "aviso", "outro")]
    abertos.sort(key=lambda i: (i["prazo"], -(float(i.get("peso") or 0))))
    pri = {i["id"]: n for n, i in enumerate(abertos, 1)}
    return [{"id": i["id"], "tipo": i["tipo"], "titulo": i["titulo"], "hash": i["hash"], "prioridade": pri.get(i["id"])}
            for i in itens if i.get("prioridade") != pri.get(i["id"])]


def resumo_terminal(itens: list[dict], n_disc: int, novos: int, falhas: list[str]) -> str:
    agora = datetime.now(timezone.utc)
    sete = agora + timedelta(days=7)
    ativ = [i for i in itens if i["tipo"] == "atividade"]
    prox = sorted((i for i in itens if i.get("prazo") and i.get("status") != "entregue"
                   and agora <= datetime.fromisoformat(i["prazo"]) <= sete), key=lambda i: i["prazo"])
    linhas = ["", "=" * 60, f"Disciplinas: {n_disc}", f"Atividades: {len(ativ)}  (itens no total: {len(itens)}, novos: {novos})",
              f"Próximos 7 dias: {len(prox)}"]
    for i in prox:
        dt = datetime.fromisoformat(i["prazo"]).astimezone(TZ)
        linhas.append(f"  - {DIAS[dt.weekday()]} {dt:%d/%m %H:%M}  {i.get('disciplina') or ''} · {i['titulo']}" + (f"  (peso {i['peso']})" if i.get("peso") else ""))
    if falhas:
        linhas.append(f"Falhas: {len(falhas)} (prints em {DEBUG.relative_to(BASE)}/)")
    linhas.append("=" * 60)
    return "\n".join(linhas)


# ----------------------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--mapear", action="store_true", help="salva HTML de cada página em debug/ para ajustar seletores")
    ap.add_argument("--dry-run", action="store_true", help="não grava no Supabase; salva debug/sync-dry-run.json")
    ap.add_argument("--sem-resumo", action="store_true", help="não pede resumo da IA para itens novos")
    ap.add_argument("--max-disciplinas", type=int, default=0)
    args = ap.parse_args()

    load_dotenv(BASE / ".env")
    sb_url = os.getenv("SUPABASE_URL", "").strip()
    sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    portal = os.getenv("PORTAL_URL", "").strip()
    if not portal:
        log("Defina PORTAL_URL no .env.")
        return 2
    if not args.dry_run:
        if PROJETO_PROIBIDO in sb_url or PROJETO_OK not in sb_url:
            log(f"SUPABASE_URL precisa ser o projeto {PROJETO_OK} (segundo-cerebro). Abortando.")
            return 2
        if not sb_key:
            log("Defina SUPABASE_SERVICE_ROLE_KEY no .env.")
            return 2
    sb = Supabase(sb_url, sb_key) if not args.dry_run else None

    coletados: list[Item] = []
    disciplinas: list[tuple[str, str]] = []
    erro_fatal = None
    var = None
    with sync_playwright() as p:
        extra = {"executable_path": os.environ["PORTAL_NAVEGADOR"]} if os.getenv("PORTAL_NAVEGADOR") else {}
        ctx = p.chromium.launch_persistent_context(str(PERFIL), headless=False, accept_downloads=True,
                                                   viewport={"width": 1366, "height": 900}, locale="pt-BR",
                                                   timezone_id="America/Sao_Paulo", **extra)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()
        # se o portal abrir a sala virtual em outra aba, passo a usar a aba nova
        ctx.on("page", lambda nova: log(f"  nova aba aberta: {nova.url or '(carregando)'}"))
        var = Varredor(ctx, page, args.mapear)
        try:
            page.goto(portal, wait_until="domcontentloaded", timeout=60_000)
            espera_login(page, portal)
            if len(ctx.pages) > 1:
                var.page = page = ctx.pages[-1]
            var.debug("pos-login")
            disciplinas = var.disciplinas()
            if args.max_disciplinas:
                disciplinas = disciplinas[: args.max_disciplinas]
            log(f"{len(disciplinas)} disciplinas encontradas")
            for nome, url in disciplinas:
                log(f"- {nome}")
                try:
                    achados = var.atividades(nome, url)
                    log(f"  {len(achados)} itens")
                    coletados.extend(achados)
                except Exception as e:
                    var.falhou(f"disciplina-{slug(nome)}", e)
        except Exception as e:
            erro_fatal = e
            traceback.print_exc()
            var.debug("erro-fatal")
        finally:
            ctx.close()

    falhas = var.falhas if var else []
    # dedup pelo hash (o mesmo item pode aparecer por dois caminhos)
    linhas = list({l["hash"]: l for l in (i.linha() for i in coletados)}.values())

    if args.dry_run:
        DEBUG.mkdir(exist_ok=True)
        (DEBUG / "sync-dry-run.json").write_text(json.dumps(linhas, ensure_ascii=False, indent=2), encoding="utf-8")
        fake = [{**l, "id": l["hash"][:8], "status": "pendente"} for l in linhas]
        print(resumo_terminal(fake, len(disciplinas), len(linhas), falhas))
        log(f"dry-run: {len(linhas)} itens em debug/sync-dry-run.json")
        return 1 if erro_fatal else 0

    assert sb is not None
    novos_ids: list[str] = []
    resumir_ids: list[str] = []
    try:
        if linhas:
            existentes: set[str] = set()
            for k in range(0, len(linhas), 100):
                lote = ",".join(l["hash"] for l in linhas[k:k + 100])
                existentes |= {r["hash"] for r in sb.get("faculdade_itens", {"select": "hash", "hash": f"in.({lote})"})}
            gravados = []
            for k in range(0, len(linhas), 50):
                gravados += sb.upsert("faculdade_itens", linhas[k:k + 50], "hash")
            novos = [g for g in gravados if g["hash"] not in existentes]
            novos_ids = [g["id"] for g in novos]
            resumir_ids = [g["id"] for g in novos if g["tipo"] == "atividade"]  # resumo só de atividade
        sb.patch("faculdade_itens", {"tipo": "in.(material,aula)", "lido": "eq.false"}, {"lido": True})  # não poluir a aba Hoje
        todos = sb.get("faculdade_itens", {"select": "id,tipo,titulo,hash,prazo,peso,status,prioridade,disciplina"})
        mud = calcula_prioridades(todos)
        for k in range(0, len(mud), 100):
            sb.upsert("faculdade_itens", mud[k:k + 100], "id")
        todos = sb.get("faculdade_itens", {"select": "id,tipo,titulo,prazo,peso,status,disciplina"})

        if resumir_ids and not args.sem_resumo:
            log(f"Pedindo resumo da IA para {len(resumir_ids)} atividades novas…")
            for iid in resumir_ids:
                sb.resumir(iid)

        status = "erro" if erro_fatal else "ok"
        msg = (f"{len(disciplinas)} disciplinas, {len(linhas)} itens lidos"
               + (f"; {len(falhas)} falhas (ver debug/)" if falhas else "")
               + (f"; erro: {erro_fatal}" if erro_fatal else ""))
        sb.insert("faculdade_sync", {"status": status, "itens_novos": len(novos_ids), "mensagem": msg[:1000]})
        print(resumo_terminal(todos, len(disciplinas), len(novos_ids), falhas))
    except Exception as e:
        traceback.print_exc()
        try:
            sb.insert("faculdade_sync", {"status": "erro", "itens_novos": len(novos_ids), "mensagem": f"gravação: {e}"[:1000]})
        except Exception:
            pass
        return 1
    return 1 if erro_fatal else 0


if __name__ == "__main__":
    sys.exit(main())
