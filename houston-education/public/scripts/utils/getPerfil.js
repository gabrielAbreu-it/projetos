import { parseJwt } from "./parseJWT.js";
import { getToken } from "./getToken.js";

export function getPerfil(){
    const token = getToken();
    if (!token){
        return null;
    }

    const payload = parseJwt(token)
    return payload.perfil;

}