import { Router } from "express";
import usuariosRoutes from "./usuariosRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import suscripcionesRoutes from "./suscripcionesRoutes.js";
import planesRoutes from "./planesRoutes.js";
import reservasRoutes from "./reservasRoutes.js";
import pagosRoutes from "./pagosRoutes.js";

const router = Router();

router.use("/usuarios", usuariosRoutes);
router.use("/payment", paymentRoutes);
router.use("/suscripciones", suscripcionesRoutes);
router.use("/planes", planesRoutes);
router.use("/reservas", reservasRoutes);
router.use("/pagos", pagosRoutes);
export default router;
