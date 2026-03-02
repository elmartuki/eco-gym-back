import { Router } from "express";
import { validarToken, validarAdmin } from "../middlewares/auth.middlewares.js";
import {
  obtenerMisReservasController,
  crearReservaController,
  obtenerReservasPorSocioController,
  confirmarReservaController,
} from "../controllers/reservasController.js";

const router = Router();
router.get("/mis-reservas", validarToken, obtenerMisReservasController);
router.post("/", validarToken, crearReservaController);
router.get(
  "/socio/:idUsuario",
  validarToken,
  validarAdmin,
  obtenerReservasPorSocioController,
);
router.put(
  "/confirmar/:idReserva",
  validarToken,
  validarAdmin,
  confirmarReservaController,
);

export default router;
