// src/routes/alunoRoutes.ts
import { Router } from "express";
import AlunoController from "../../controllers/Aluno/AlunoController.js";
import { validateSchema } from "../../middlewares/validateSchemaMiddleware.js";
import { autenticado } from "../../middlewares/autenticadoMiddleware.js";
import { autorizado } from "../../middlewares/autorizadoMiddleware.js";

import * as schema from "../../schemas/alunoSchema.js";

const alunoController = new AlunoController();
const router = Router();

router.get("/", autenticado, autorizado(["ADMIN", "MONITOR"]) , alunoController.getAll);
router.get("/:id", autenticado, autorizado(["ADMIN"]), validateSchema(schema.alunoGetByIdSchema, "params"), alunoController.getById);

router.post("/", validateSchema(schema.alunoCreateSchema), alunoController.create); // cadastro

router.put("/:id", autenticado, validateSchema(schema.alunoUpdateIdSchema, "params"), validateSchema(schema.alunoUpdateSchema, "body"), alunoController.update); // atualização que o aluno pode fazer

router.patch("/:id/senha", autenticado, autorizado(["ADMIN", "MONITOR", "ALUNO"]), validateSchema(schema.alunoUpdateSenha, "body"), alunoController.updateSenha);

router.patch("/:id/updateAluno", autenticado, autorizado(["ADMIN"]), validateSchema(schema.alunoUpdatePerfilSchema, "body"), alunoController.updateUsuarioByAdmin); // atualização de perfil e dados do usuário

router.delete("/:id", autenticado , autorizado(["ADMIN"]), validateSchema(schema.alunoDeleteSchema, "params"), alunoController.delete);



export default router;
    