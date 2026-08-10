import { Router } from "express";
import { autenticado, AuthRequest } from "../../middlewares/autenticadoMiddleware.js";
import { Response } from "express";

const router = Router();


router.get("/pages", autenticado, (req: AuthRequest, res: Response) => {
  res.json({ nome: req.user?.nome });
});


export default router
