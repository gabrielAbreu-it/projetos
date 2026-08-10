// Garanta que este seletor está correto para o seu ícone de menu
const botaoMenu = document.querySelector('nav .icone img[src="../assets/img/iconeMenu.png"]');
const menuLateral = document.getElementById('menuLateral');
const overlay = document.getElementById('overlay');

// Função "Toggle" (Alternar)
const toggleMenu = (e) => {
    e.preventDefault(); // Previne o clique
    menuLateral.classList.toggle('ativo');
    overlay.classList.toggle('ativo');
    if (botaoMenu) {
        botaoMenu.classList.toggle('girado');
    }
};

// Função SÓ para FECHAR (usada pelo overlay)
const fecharMenu = () => {
    menuLateral.classList.remove('ativo');
    overlay.classList.remove('ativo');
    if (botaoMenu) {
        botaoMenu.classList.remove('girado');
    }
};

// Clicar no ícone agora "troca" (abre ou fecha)
botaoMenu.addEventListener('click', toggleMenu);

// Clicar no overlay SÓ FECHA
overlay.addEventListener('click', fecharMenu);

// Toggle do submenu "Minhas monitorias"
const submenuToggle = document.getElementById('toggleMinhasMonitorias');
if (submenuToggle) {
    submenuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        submenuToggle.closest('.submenu').classList.toggle('aberto');
    });
}

// =========================================
// LÓGICA DO DROPDOWN DO USUÁRIO
// =========================================
const btnDropdown = document.getElementById("btnDropdownUsuario");
const menuDropdown = document.getElementById("dropdownUsuario");

if (btnDropdown && menuDropdown) {
    btnDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle("mostrar");
    });

    window.addEventListener("click", (e) => {
        if (!btnDropdown.contains(e.target) && !menuDropdown.contains(e.target)) {
            if (menuDropdown.classList.contains("mostrar")) {
                menuDropdown.classList.remove("mostrar");
            }
        }
    });
}