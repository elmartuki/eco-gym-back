import express from "express";
import { obtenerHistorialPagos } from "../controllers/pagoController.js";

const router = express.Router();

router.get("/historial/:idUsuario", obtenerHistorialPagos);

export default router;
