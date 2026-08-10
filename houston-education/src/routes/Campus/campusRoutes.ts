import CampusController from "../../controllers/Campus/CampusController.js";
import { Router } from "express";
import { autenticado } from "../../middlewares/autenticadoMiddleware.js";

const router = Router();

router.get("/", autenticado, CampusController.getAll);

export default router;
