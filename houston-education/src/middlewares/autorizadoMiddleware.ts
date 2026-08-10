import { NextFunction } from "express";
import { Request, Response } from "express";
import { AuthRequest } from "./autenticadoMiddleware.js";

export const autorizado = (perfisPermitidos: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: "USUARIO_NAO_AUTENTICADO" });
    }

    if (!perfisPermitidos.includes(user.perfil)) {
      return res.status(403).json({ error: "SEM_PERMISSAO_HOUSTON" });
    }

    next();
  };
};