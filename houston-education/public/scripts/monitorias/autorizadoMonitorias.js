import { parseJwt } from "../utils/parseJWT.js";
import { getToken } from "../utils/getToken.js";

// colocando na home para impedir o acesso direto do link ( clicar direto no link invés de abrir uma nova janela)
const linkCadastrarMonitoria = document.getElementById("linkCadastrarMonitoria");
if (linkCadastrarMonitoria) {
  linkCadastrarMonitoria.addEventListener("click", (e) => {
    e.preventDefault();

    const user = parseJwt(getToken());
    if (user.perfil !== "MONITOR" && user.perfil !== "ADMIN"){
      window.location.href = "/pages/naoAutorizado.html";
    } else {
      window.location.href = "/pages/cadastrarMonitoria.html";
    }
  });
}
