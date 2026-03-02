import { Router } from "express";
import { validarToken } from "../middlewares/auth.middlewares.js";
import {
  obtenerMisReservasController,
  crearReservaController,
} from "../controllers/reservasController.js";

const router = Router();
router.get("/mis-reservas", validarToken, obtenerMisReservasController);
router.post("/", validarToken, crearReservaController);

export default router;
