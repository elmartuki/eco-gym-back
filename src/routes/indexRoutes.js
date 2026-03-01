import { Router } from "express";
import usuariosRoutes from "./usuariosRoutes.js";
import carritoRoutes from "./carritoRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import productosRoutes from "./productosRoutes.js";
import pedidosRoutes from "./pedidosRoutes.js";
import estadisticasRoutes from "./estadisticasRoutes.js";
import cadetesRoutes from "./cadeteRoutes.js";

const router = Router();

router.use("/usuarios", usuariosRoutes);
router.use("/carrito", carritoRoutes);
router.use("/payment", paymentRoutes);
router.use("/productos", productosRoutes);
router.use("/pedidos", pedidosRoutes);
router.use("/estadisticas", estadisticasRoutes);
router.use("/cadetes", cadetesRoutes);

export default router;
