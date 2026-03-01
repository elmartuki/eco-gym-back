import { Router } from "express";
import {
  borrarProductoController,
  crearProductoController,
  editarProductoController,
  obtenerProductosController,
} from "../controllers/productosController.js";
import { validarAdmin, validarToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get("/", obtenerProductosController);
router.post("/", validarToken, validarAdmin, crearProductoController);
router.put("/:id", validarToken, validarAdmin, editarProductoController);
router.delete("/:id", validarToken, validarAdmin, borrarProductoController);

export default router;
