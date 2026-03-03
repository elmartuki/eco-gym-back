import { Router } from "express";
import usuariosRoutes from "./usuariosRoutes.js";
import carritoRoutes from "./carritoRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import productosRoutes from "./productosRoutes.js";
import estadisticasRoutes from "./estadisticasRoutes.js";

const router = Router();

router.use("/usuarios", usuariosRoutes);
router.use("/carrito", carritoRoutes);
router.use("/payment", paymentRoutes);
router.use("/productos", productosRoutes);
router.use("/estadisticas", estadisticasRoutes);

export default router;
