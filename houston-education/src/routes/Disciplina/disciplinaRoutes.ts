import DisciplinaController from "../../controllers/Disciplina/DisiciplinaController.js";
import { Router } from "express";
import { validateSchema } from "../../middlewares/validateSchemaMiddleware.js";
import * as schema from "../../schemas/disciplinaSchema.js";
import { autenticado } from "../../middlewares/autenticadoMiddleware.js";
import { autorizado } from "../../middlewares/autorizadoMiddleware.js";

const router = Router();

router.get("/", autenticado, autorizado(["ADMIN", "MONITOR"]), DisciplinaController.getAll);

router.get("/:id",autenticado, autorizado(["ADMIN", "MONITOR"]), validateSchema(schema.disciplinaGetByIdSchema, "params"), DisciplinaController.getById);

router.post("/", autenticado, autorizado(["ADMIN", "MONITOR"]), validateSchema(schema.disciplinaCreateSchema), DisciplinaController.create);

router.put("/:id",autenticado, autorizado(["ADMIN"]), validateSchema(schema.disciplinaUpdateIdSchema, "params"), validateSchema(schema.disciplinaUpdateSchema, "body"), DisciplinaController.update);

router.delete("/:id", autenticado, autorizado(["ADMIN"]), validateSchema(schema.disciplinaDeleteSchema, "params"), DisciplinaController.delete);

export default router;