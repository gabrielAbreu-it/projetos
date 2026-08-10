import { parseJwt } from "../utils/parseJWT.js";

const token = localStorage.getItem("token");
const user = token ? parseJwt(token) : null;
const perfil = user?.perfil || "";

const linkCadastrar = document.getElementById("linkCadastrarMonitoria")?.closest("li");
const linkGerenciar = document.getElementById("linkGerenciarMonitoria")?.closest(".submenu");
const linkDashboard = document.getElementById("linkDashboardAdmin.html")?.closest("li");

// ALUNO (perfil 3) - apenas home e logout
if (perfil === "ALUNO") {
  if (linkCadastrar) linkCadastrar.style.display = "none";
  if (linkGerenciar) linkGerenciar.style.display = "none";
  if (linkDashboard) linkDashboard.style.display = "none";
}

// MONITOR (perfil 2) - tudo exceto dashboard admin
if (perfil === "MONITOR") {
  if (linkDashboard) linkDashboard.style.display = "none";
}
