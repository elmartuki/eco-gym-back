import { Router } from "express";
import {
  cambiarEstadoCadeteController,
  crearSolicitudController,
  listarCadetesController,
} from "../controllers/cadeteController.js";
import { validarAdmin, validarToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.post("/solicitud", crearSolicitudController);
router.get("/", validarToken, validarAdmin, listarCadetesController);
router.put("/:id", validarToken, validarAdmin, cambiarEstadoCadeteController);

export default router;
