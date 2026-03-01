import { Router } from "express";
import { validarToken } from "../middlewares/auth.middlewares.js";

const router = Router();

// router.post("/:id", validarToken, agregarProductoCarrito);
// router.delete("/:id", validarToken, eliminarProductoCarrito);
// router.get("/", validarToken, obtenerDatosCarrito);
export default router;