import { Router } from "express";
import { validarToken, validarAdmin } from "../middlewares/auth.middlewares.js";
import { obtenerMisSuscripcionesController } from "../controllers/suscripcionesController.js";

const router = Router();
router.get(
  "/mis-suscripciones",
  validarToken,
  obtenerMisSuscripcionesController,
);

export default router;
