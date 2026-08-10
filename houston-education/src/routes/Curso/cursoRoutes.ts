import CursoController from "../../controllers/Curso/CursoController.js";
import { Router } from "express";
import { autenticado } from "../../middlewares/autenticadoMiddleware.js";
import { autorizado } from "../../middlewares/autorizadoMiddleware.js";
import { validateSchema } from "../../middlewares/validateSchemaMiddleware.js";
import * as schema from "../../schemas/cursoSchema.js";

const router = Router();

router.get("/", autenticado, CursoController.getAll);

router.post("/", autenticado, autorizado(["ADMIN"]), validateSchema(schema.cursoCreateSchema), CursoController.create);

router.put("/:id", autenticado, autorizado(["ADMIN"]), validateSchema(schema.cursoGetByIdSchema, "params"), validateSchema(schema.cursoUpdateSchema, "body"), CursoController.update);

router.delete("/:id", autenticado, autorizado(["ADMIN"]), validateSchema(schema.cursoDeleteSchema, "params"), CursoController.delete);

export default router;
