import {parseJwt} from "./utils/parseJWT.js"
import { getToken } from "./utils/getToken.js";

export function carregarUsuario() {
  const token = getToken();
  if (!token) return window.location.href = '/pages/login.html';

  const payload = parseJwt(token);
  if (!payload || !payload.nome) {
    localStorage.removeItem('token');
    return window.location.href = '/pages/login.html';
  }

  document.querySelectorAll('.usuarioNome').forEach(e => {
    e.innerText = payload.nome;
  });

}

carregarUsuario();
