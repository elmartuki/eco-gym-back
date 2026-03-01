import { Router } from "express";
import {
  validarToken,
  validarAdminOEmpresa,
  validarPropietarioJuego,
} from "../middlewares/auth.middlewares.js";
import {
  agregarJuegoController,
  editarUnJuegoController,
  eliminarUnJuegoController,
  gestionarFavoritosController,
  gestionarVisualizacionController,
  obtenerJuegosController,
  obtenerJuegosPorStudioController,
  obtenerUnJuegoPorStudioController,
  verificarEstadoFavoritoController,
} from "../controllers/juegosController.js";

const router = Router();

router.get("/", obtenerJuegosController);
router.get("/:id", obtenerUnJuegoPorStudioController);

router.get("/juegos-subidos", validarToken, obtenerJuegosPorStudioController);
router.put("/favoritos/:id", validarToken, gestionarFavoritosController);
router.get(
  "/favoritos/verificar/:id",
  validarToken,
  verificarEstadoFavoritoController,
);

router.post(
  "/crear",
  validarToken,
  validarAdminOEmpresa,
  agregarJuegoController,
);

router.put(
  "/estado/:id",
  validarToken,
  validarAdminOEmpresa,
  validarPropietarioJuego,
  gestionarVisualizacionController,
);
router.put(
  "/:id",
  validarToken,
  validarAdminOEmpresa,
  validarPropietarioJuego,
  editarUnJuegoController,
);
router.delete(
  "/:id",
  validarToken,
  validarAdminOEmpresa,
  validarPropietarioJuego,
  eliminarUnJuegoController,
);

export default router;
