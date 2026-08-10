import InscricoesController from "../../controllers/Inscricoes/InscricoesController.js";
import { Router } from "express";

import { validateSchema } from "../../middlewares/validateSchemaMiddleware.js";
import * as schema from "../../schemas/inscricoesSchema.js";
import { autenticado, AuthRequest } from "../../middlewares/autenticadoMiddleware.js";
import { autorizado } from "../../middlewares/autorizadoMiddleware.js";


const router = Router();

router.get("/", autenticado, autorizado(["ADMIN", "MONITOR"]), InscricoesController.getAll); // get de todas as inscrições

router.get("/aluno", autenticado, autorizado(["ADMIN", "MONITOR", "ALUNO"]), InscricoesController.getInscricaoAluno); // lembrar que essa rota é pra pegar as inscrições de um unico aluno ATRAVÉS DO TOKEN

router.get("/monitoria/:monitoriaId", autenticado, autorizado(["ADMIN", "MONITOR"]), InscricoesController.getByMonitoria); // get da inscrição pelo id da monitoria associada

router.get("/:id", autenticado, autorizado(["ADMIN", "MONITOR"]), validateSchema(schema.inscricoesGetByIdSchema, "params"), InscricoesController.getById); // get de uma inscrição pelo id 

router.get("/:id/minhas-inscricoes", autenticado, autorizado(["ADMIN", "MONITOR", "ALUNO"]), validateSchema(schema.inscricoesGetByIdSchema, "params") , InscricoesController.getMinhasInscricoes) // get de todas as inscrições já feitas

router.post("/", autenticado, validateSchema(schema.inscricoesCreateSchema), InscricoesController.create); // se inscrever

router.put("/monitoria/:monitoriaId/presenca", autenticado, autorizado(["ADMIN", "MONITOR"]), validateSchema(schema.inscricoesSalvarChamadaSchema), InscricoesController.salvarChamada); // salvar a chamada de uma monitoria - setar o status de presente como false ou true pra cada inscrição

router.delete("/:id", autenticado, validateSchema(schema.inscricoesDeleteSchema, "params"), InscricoesController.delete); // se desinscrever



export default router;