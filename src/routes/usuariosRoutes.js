import { Router } from "express";
import {
  actualizarDireccionesController,
  actualizarPerfilController,
  enviarCodigoRegistroController,
  googleAuthController,
  loginController,
  registrarUsuarioController,
  verificarCodigoController,
  eliminarUsuarioController,
  solicitarRecuperacionController,
  restablecerPasswordController,
} from "../controllers/usuariosController.js";
import {
  validarToken,
  validarPropietario,
} from "../middlewares/auth.middlewares.js";

const router = Router();

router.post("/codigo", enviarCodigoRegistroController);
router.post("/verificarCodigo", verificarCodigoController);
router.post("/register", registrarUsuarioController);
router.post("/login", loginController);
router.post("/google-auth", googleAuthController);

router.post("/recuperar-password", solicitarRecuperacionController);
router.post("/restablecer-password", restablecerPasswordController);

router.put(
  "/perfil/:id",
  validarToken,
  validarPropietario,
  actualizarPerfilController,
);

router.delete(
  "/perfil/:id",
  validarToken,
  validarPropietario,
  eliminarUsuarioController,
);

router.put(
  "/direcciones/:id",
  validarToken,
  validarPropietario,
  actualizarDireccionesController,
);

export default router;
