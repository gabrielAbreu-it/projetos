import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import "dotenv/config";
import { decrypt } from "dotenv";
import { decode } from "punycode";

// Extendendo o Request para incluir user

export interface AuthRequest extends Request { // criando um type authrequest para atribuirmos o req.user 
  
  user?: {
    id: string;
    nome: string;
    email: string;
    matricula: string;
    perfil: string;
  };
}

export const autenticado = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader) {
      const parts = authHeader.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    // Fallback para cookie se não houver header Authorization
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ erro: "TOKEN_NAO_FORNECIDO" });
    }

    // permite passar a chave para o verify, se não o bx apita erro
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET_NAO_DEFINIDO");
    }

    // verifica o token olhando o payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    // adiciona dados do usuário no request
    req.user = { // usando a interface que definimos para poder pegar as informações e exibir pro front
      id: decoded.id as string,
      nome: decoded.nome as string,
      email: decoded.email as string,
      perfil: decoded.perfil as string,
      matricula : decoded.matricula as string
      //adiciono o perfil aqui
    };

    next(); //

  } catch (err: any) {
    return res.status(401).json({ erro: "TOKEN_INVALIDO" });
  }
};

export const autenticadoCookie = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.redirect("/pages/naoAutorizado.html");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET_NAO_DEFINIDO");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.id as string,
      nome: decoded.nome as string,
      email: decoded.email as string,
      matricula: decoded.matricula as string,
      perfil: decoded.perfil as string
    };

    next();
  } catch (err: any) {
    return res.redirect("/pages/naoAutorizado.html");
  }
};
