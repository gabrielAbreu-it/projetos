import { parseJwt } from "./parseJWT.js";
import { getToken } from "./getToken.js";

export function getAlunoId(){
  const token = getToken();
  if (!token) return null;

  const payload = parseJwt(token);
  return payload?.id || null;
}