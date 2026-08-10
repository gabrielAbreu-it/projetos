// =========================================
// MODAL DO CHANGELOG
// =========================================

(function () {
    const CHANGELOG_URL = "/changelog.md";
    const API_VERSAO_URL = "/api/versao";

    const NOMES_MESES = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const TRADUCOES_CATEGORIAS = {
        "Added": "Adicionado",
        "Changed": "Alterado",
        "Deprecated": "Descontinuado",
        "Removed": "Removido",
        "Fixed": "Corrigido",
        "Security": "Segurança"
    };

    function criarModal() {
        if (document.getElementById("changelogModalOverlay")) {
            return;
        }

        const overlay = document.createElement("div");
        overlay.id = "changelogModalOverlay";
        overlay.className = "changelog-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "changelogTitulo");

        overlay.innerHTML = `
            <div class="changelog-modal">
                <div class="changelog-header">
                    <div class="changelog-header-titulo">
                        <i class="ph-bold ph-clock-counter-clockwise"></i>
                        <div>
                            <h2 id="changelogTitulo">CHANGELOG</h2>
                            <p class="changelog-subtitulo">Últimos registros documentados no projeto.</p>
                        </div>
                    </div>
                    <button class="changelog-fechar" id="changelogFechar" aria-label="Fechar changelog">&times;</button>
                </div>
                <div class="changelog-aba">
                    <button class="changelog-aba-btn ativo">
                        <i class="ph-bold ph-rocket-launch"></i> Novidades
                    </button>
                </div>
                <div class="changelog-conteudo" id="changelogConteudo">
                    <div class="changelog-carregando">Carregando changelog...</div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                fecharModal();
            }
        });

        document.getElementById("changelogFechar").addEventListener("click", fecharModal);

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && overlay.classList.contains("ativo")) {
                fecharModal();
            }
        });
    }

    function abrirModal() {
        const overlay = document.getElementById("changelogModalOverlay");
        if (!overlay) {
            criarModal();
        }

        const conteudo = document.getElementById("changelogConteudo");
        conteudo.innerHTML = '<div class="changelog-carregando">Carregando changelog...</div>';
        document.getElementById("changelogModalOverlay").classList.add("ativo");
        document.body.style.overflow = "hidden";

        carregarConteudo();
    }

    function fecharModal() {
        const overlay = document.getElementById("changelogModalOverlay");
        if (overlay) {
            overlay.classList.remove("ativo");
            document.body.style.overflow = "";
        }
    }

    function formatarData(dataStr) {
        // Espera yyyy-mm-dd ou dd/mm/yyyy
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
            const [ano, mes, dia] = dataStr.split("-");
            return `${dia}/${mes}/${ano}`;
        }
        return dataStr;
    }

    function parsearVersao(bloco) {
        const linhas = bloco.split("\n").map((l) => l.trimEnd());
        const linhaTitulo = linhas[0];
        const match = linhaTitulo.match(/##\s+\[([\d.]+)\]\s+-\s+(\d{4}-\d{2}-\d{2})/);

        if (!match) {
            return null;
        }

        const versao = match[1];
        const dataOriginal = match[2];
        const dataFormatada = formatarData(dataOriginal);
        const [ano, mes, dia] = dataOriginal.split("-");
        const chaveMes = `${ano}-${mes}`;
        const tituloMes = `${NOMES_MESES[parseInt(mes, 10) - 1]} de ${ano}`;

        const categorias = [];
        let categoriaAtual = null;
        let subcategoriaAtual = null;

        for (let i = 1; i < linhas.length; i++) {
            const linha = linhas[i];
            if (!linha) continue;

            if (linha.startsWith("### ")) {
                categoriaAtual = {
                    nome: linha.replace("### ", "").trim(),
                    itens: []
                };
                categorias.push(categoriaAtual);
                subcategoriaAtual = null;
                continue;
            }

            if (linha.startsWith("**") && linha.endsWith("**")) {
                subcategoriaAtual = linha.replace(/\*\*/g, "").trim();
                continue;
            }

            if (linha.startsWith("- ") && categoriaAtual) {
                const item = {
                    texto: linha.replace("- ", "").trim(),
                    subcategoria: subcategoriaAtual
                };
                categoriaAtual.itens.push(item);
            }
        }

        return {
            versao,
            dataOriginal,
            dataFormatada,
            chaveMes,
            tituloMes,
            categorias
        };
    }

    function parsearMarkdown(markdown) {
        const inicioVersoes = markdown.indexOf("## [");
        const markdownApenasVersoes = inicioVersoes >= 0 ? markdown.slice(inicioVersoes) : markdown;

        const blocos = markdownApenasVersoes
            .split(/\n(?=##\s+\[)/)
            .map((b) => b.trim())
            .filter(Boolean);

        const versoes = blocos
            .map(parsearVersao)
            .filter(Boolean)
            .sort((a, b) => new Date(b.dataOriginal) - new Date(a.dataOriginal));

        const grupos = {};
        for (const versao of versoes) {
            if (!grupos[versao.chaveMes]) {
                grupos[versao.chaveMes] = {
                    titulo: versao.tituloMes,
                    versoes: []
                };
            }
            grupos[versao.chaveMes].versoes.push(versao);
        }

        // Ordenar grupos por data decrescente
        const chavesOrdenadas = Object.keys(grupos).sort().reverse();
        return chavesOrdenadas.map((chave) => grupos[chave]);
    }

    function escaparHtml(texto) {
        const div = document.createElement("div");
        div.textContent = texto;
        return div.innerHTML;
    }

    function renderizarItem(item) {
        // Aplica negrito inline (**texto**) e itálico simples
        let html = escaparHtml(item.texto)
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.+?)\*/g, "<em>$1</em>");

        if (item.subcategoria) {
            html = `<span class="changelog-subcategoria">${escaparHtml(item.subcategoria)}:</span> ${html}`;
        }

        return html;
    }

    function renderizarCategoria(categoria) {
        const nomeTraduzido = TRADUCOES_CATEGORIAS[categoria.nome] || categoria.nome;
        const tipoClasse = categoria.nome.toLowerCase().replace(/[^a-z]/g, "");

        return categoria.itens.map((item) => `
            <tr>
                <td class="changelog-tipo-coluna">
                    <span class="changelog-tipo ${tipoClasse}">${escaparHtml(nomeTraduzido)}</span>
                </td>
                <td class="changelog-descricao-coluna">${renderizarItem(item)}</td>
            </tr>
        `).join("");
    }

    function renderizarVersao(versao) {
        const linhasTabela = versao.categorias.flatMap(renderizarCategoria).join("");

        return `
            <div class="changelog-card">
                <div class="changelog-card-header">
                    <span class="changelog-tag changelog-tag-data">
                        <i class="ph-bold ph-calendar-blank"></i> Data: ${versao.dataFormatada}
                    </span>
                    <span class="changelog-tag changelog-tag-versao">
                        <i class="ph-bold ph-tag"></i> v${versao.versao}
                    </span>
                </div>
                <table class="changelog-card-tabela">
                    <thead>
                        <tr>
                            <th class="changelog-tipo-coluna"><i class="ph-bold ph-flag"></i> Tipo</th>
                            <th class="changelog-descricao-coluna"><i class="ph-bold ph-text-align-left"></i> Descrição</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhasTabela || `
                            <tr>
                                <td colspan="2" class="changelog-sem-itens">Nenhuma alteração documentada.</td>
                            </tr>
                        `}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderizar(grupos) {
        if (!grupos.length) {
            return '<div class="changelog-erro">Nenhuma versão encontrada no changelog.</div>';
        }

        return grupos.map((grupo) => `
            <div class="changelog-grupo-mes">
                <h3 class="changelog-mes-titulo">
                    <i class="ph-bold ph-calendar"></i> ${grupo.titulo}
                </h3>
                <div class="changelog-cards">
                    ${grupo.versoes.map(renderizarVersao).join("")}
                </div>
            </div>
        `).join("");
    }

    async function carregarConteudo() {
        const conteudo = document.getElementById("changelogConteudo");

        try {
            const resposta = await fetch(CHANGELOG_URL);

            if (!resposta.ok) {
                throw new Error(`Erro ${resposta.status}: não foi possível carregar o changelog.`);
            }

            const markdown = await resposta.text();
            const grupos = parsearMarkdown(markdown);
            conteudo.innerHTML = renderizar(grupos);
        } catch (erro) {
            conteudo.innerHTML = `<div class="changelog-erro">Erro ao carregar changelog: ${erro.message}</div>`;
            console.error("[Changelog]", erro);
        }
    }

    async function carregarVersaoMenu() {
        try {
            const resposta = await fetch(API_VERSAO_URL);
            if (!resposta.ok) return;

            const dados = await resposta.json();
            const elemento = document.getElementById("changelogVersaoMenu");
            if (elemento && dados.versao) {
                elemento.textContent = `v${dados.versao}`;
            }
        } catch (erro) {
            console.error("[Changelog] Erro ao carregar versão do menu:", erro);
        }
    }

    function inicializar() {
        const iconeChangelog = document.getElementById("linkChangelog");
        if (iconeChangelog) {
            iconeChangelog.addEventListener("click", (e) => {
                e.preventDefault();
                abrirModal();
            });
        }

        carregarVersaoMenu();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializar);
    } else {
        inicializar();
    }
})();
