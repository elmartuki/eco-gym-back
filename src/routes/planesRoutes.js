import express from "express";
import {
  actualizarPlanController,
  crearPlanController,
  eliminarPlanController,
  obtenerPlanesController,
} from "../controllers/planController.js";

const router = express.Router();

router.get("/", obtenerPlanesController);
router.post("/", crearPlanController);
router.put("/:id", actualizarPlanController);
router.delete("/:id", eliminarPlanController);

export default router;
