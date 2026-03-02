import { Router } from "express";
import { validarToken, validarAdmin } from "../middlewares/auth.middlewares.js";
import {
  obtenerMisSuscripcionesController,
  obtenerTodosLosSociosController,
  confirmarSuscripcionController,
  obtenerDetallesSocioController,
  cancelarSuscripcionController,
  renovarSuscripcionAdminController,
  cambiarPlanAdminController,
} from "../controllers/suscripcionesController.js";

const router = Router();

router.get("/", validarToken, validarAdmin, obtenerTodosLosSociosController);
router.get(
  "/mis-suscripciones",
  validarToken,
  obtenerMisSuscripcionesController,
);
router.put(
  "/confirmar/:idUsuario",
  validarToken,
  validarAdmin,
  confirmarSuscripcionController,
);

router.get(
  "/socio/:id",
  validarToken,
  validarAdmin,
  obtenerDetallesSocioController,
);

router.put(
  "/cancelar/:idUsuario",
  validarToken,
  validarAdmin,
  cancelarSuscripcionController,
);
router.post(
  "/admin/renovar/:idUsuario",
  validarToken,
  validarAdmin,
  renovarSuscripcionAdminController,
);
router.post(
  "/admin/cambiar-plan/:idUsuario",
  validarToken,
  validarAdmin,
  cambiarPlanAdminController,
);

export default router;
