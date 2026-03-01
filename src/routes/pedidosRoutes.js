import { Router } from "express";
import {
  actualizarEstadoPedidoAdminController,
  obtenerPedidoAdminPorIdController,
  obtenerPedidoController,
  obtenerPedidosAdminController,
  obtenerMisPedidosController,
} from "../controllers/pedidosController.js";
import { validarAdmin, validarAdminOCadete, validarToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.get("/mis-pedidos", validarToken, obtenerMisPedidosController);

router.get("/numero-pedido/:slug", validarToken, obtenerPedidoController);

router.get(
  "/admin",
  validarToken,
  validarAdminOCadete,
  obtenerPedidosAdminController,
);

router.get(
  "/admin/:id",
  validarToken,
  validarAdminOCadete,
  obtenerPedidoAdminPorIdController,
);

router.put(
  "/admin/:id",
  validarToken,
  validarAdminOCadete,
  actualizarEstadoPedidoAdminController,
);

router.get("/:numeroPedido", validarToken, obtenerPedidoController);

export default router;
