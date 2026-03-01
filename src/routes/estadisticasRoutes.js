import { Router } from "express";
import { validarAdmin, validarToken } from "../middlewares/auth.middlewares.js";
import { obtenerEstadisticasController } from "../controllers/estadisticasController.js";

const router = Router();

router.get("/", validarToken, validarAdmin, obtenerEstadisticasController);

export default router;
