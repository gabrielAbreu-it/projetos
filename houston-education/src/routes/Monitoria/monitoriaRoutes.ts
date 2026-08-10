import MonitoriaController from "../../controllers/Monitoria/MonitoriaController.js";
import { validateSchema } from "../../middlewares/validateSchemaMiddleware.js";
import * as schema from "../../schemas/monitoriaSchema.js";
import { autenticado } from "../../middlewares/autenticadoMiddleware.js";
import { autorizado } from "../../middlewares/autorizadoMiddleware.js";

import { Router } from "express";

            
const router = Router();

router.get("/", autenticado, MonitoriaController.getAll); // get de todas as monitorias
router.get("/disponiveis", autenticado, MonitoriaController.getDisponiveis); // get de monitorias que ainda vão acontecer
router.get("/monitor/:monitorId", autenticado, autorizado(["ADMIN", "MONITOR"]) , MonitoriaController.getByMonitor); // get de monitorias que possuem um monitor x como dono
router.get("/historico", autenticado, autorizado(["ADMIN"]), MonitoriaController.getHistoricoAdmin); // get de todas as monitorias e suas informações para o admin
router.get("/historico/:monitorId", autenticado, autorizado(["ADMIN", "MONITOR"]), validateSchema(schema.monitoriaGetHistoricoSchema, "params"), MonitoriaController.getHistoricoMonitor); // get de todas as monitorias de um monitor e suas informações
router.get("/:id", autenticado, autorizado(["ADMIN"]) , validateSchema(schema.monitoriaGetByIdSchema, "params"), MonitoriaController.getById); // get de uma monitoria pelo id
router.get("/:id/chamada", autenticado, autorizado(["ADMIN", "MONITOR"]), validateSchema(schema.monitoriaGetByIdSchema, "params"), MonitoriaController.getChamadaMonitoria) // get de uma chamada de uma monitoria 

router.post("/", autenticado, autorizado(["ADMIN", "MONITOR"]), validateSchema(schema.monitoriaCreateSchema), MonitoriaController.create); // adicionar monitoria

router.patch("/:id", autenticado, autorizado(["ADMIN", "MONITOR"]),validateSchema(schema.monitoriaUpdateIdSchema, "params"), validateSchema(schema.monitoriaUpdateSchema, "body"), MonitoriaController.update); // atualizar monitoria

router.delete("/:id", autenticado, autorizado(["ADMIN"]) , validateSchema(schema.monitoriaDeleteSchema, "params"), MonitoriaController.delete); // deletar uma monitoria

export default router;