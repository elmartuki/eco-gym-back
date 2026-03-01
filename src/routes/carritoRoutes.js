import { Router } from "express";
import {
  obtenerCarritoController,
  agregarProductoCarritoController,
  eliminarProductoCarritoController,
} from "../controllers/carritoController.js";
import {
  validarToken,
  validarPropietario,
} from "../middlewares/auth.middlewares.js";

const router = Router();

router.get(
  "/:idUsuario",
  validarToken,
  validarPropietario,
  obtenerCarritoController,
);
router.post(
  "/:idUsuario/agregar",
  validarToken,
  validarPropietario,
  agregarProductoCarritoController,
);
router.post(
  "/:idUsuario/eliminar",
  validarToken,
  validarPropietario,
  eliminarProductoCarritoController,
);

export default router;
