import { Router } from "express";
import { autenticado } from "../../middlewares/autenticadoMiddleware.js";
import { autorizado } from "../../middlewares/autorizadoMiddleware.js";
import AuditoriaController from "../../controllers/Auditoria/AuditoriaController.js";

const auditoriaController = new AuditoriaController();

const router = Router();

router.get("/", autenticado, autorizado(["ADMIN"]), auditoriaController.getAll); // todos os registros de auditoria

export default router;
