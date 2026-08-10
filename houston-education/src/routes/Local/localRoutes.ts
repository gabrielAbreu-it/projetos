import LocalController from "../../controllers/Local/LocalController.js";
import { Router } from "express";
import { autenticado } from "../../middlewares/autenticadoMiddleware.js";
import { autorizado } from "../../middlewares/autorizadoMiddleware.js";
import { validateSchema } from "../../middlewares/validateSchemaMiddleware.js";
import { schema } from "../../schemas/localSchema.js";

const router = Router();

router.get("/", autenticado, autorizado(["ADMIN", "MONITOR", "ALUNO"]), LocalController.getAll);
router.get("/:id", autenticado, autorizado(["ADMIN", "MONITOR"]), validateSchema(schema.localGetByIdSchema, "params"), LocalController.getById);
router.post("/", autenticado, autorizado(["ADMIN"]), validateSchema(schema.localCreateSchema), LocalController.create);
router.patch("/:id", autenticado, autorizado(["ADMIN"]), validateSchema(schema.localUpdateSchema), LocalController.update);
router.delete("/:id", autenticado, autorizado(["ADMIN"]), validateSchema(schema.localGetByIdSchema, "params"), LocalController.delete);

export default router;
