import { connectDB } from "../config/configDB.js";
import {
  enviarCodigoRegistroService,
  verificarCodigoService,
  registerServices,
  loginServices,
  actualizarDireccionesService,
  googleAuthService,
  actualizarPerfilService,
  eliminarUsuarioService,
  solicitarRecuperacionPasswordService,
  restablecerPasswordService,
} from "../services/usuariosServices.js";

export const enviarCodigoRegistroController = async (req, res) => {
  await connectDB();
  const { email, nombreUsuario } = req.body;
  const { json, statusCode } = await enviarCodigoRegistroService(
    email,
    nombreUsuario,
  );
  res.status(statusCode).json(json);
};

export const verificarCodigoController = async (req, res) => {
  await connectDB();
  const { email, codigo } = req.body;
  const { json, statusCode } = await verificarCodigoService(email, codigo);
  res.status(statusCode).json(json);
};

export const registrarUsuarioController = async (req, res) => {
  await connectDB();
  const datos = req.body;
  const { json, statusCode } = await registerServices(datos);
  res.status(statusCode).json(json);
};

export const loginController = async (req, res) => {
  await connectDB();
  const { json, statusCode } = await loginServices(req.body);
  res.status(statusCode).json(json);
};

export const actualizarDireccionesController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { direcciones } = req.body;
  const { json, statusCode } = await actualizarDireccionesService(
    id,
    direcciones,
  );
  res.status(statusCode).json(json);
};

export const googleAuthController = async (req, res) => {
  await connectDB();
  const { json, statusCode } = await googleAuthService(req.body);
  res.status(statusCode).json(json);
};

export const actualizarPerfilController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { json, statusCode } = await actualizarPerfilService(id, req.body);
  res.status(statusCode).json(json);
};

export const eliminarUsuarioController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { json, statusCode } = await eliminarUsuarioService(id);
  res.status(statusCode).json(json);
};

export const solicitarRecuperacionController = async (req, res) => {
  await connectDB();
  const { email } = req.body;
  const { json, statusCode } =
    await solicitarRecuperacionPasswordService(email);
  res.status(statusCode).json(json);
};

export const restablecerPasswordController = async (req, res) => {
  await connectDB();
  const { email, codigo, nuevaPassword } = req.body;
  const { json, statusCode } = await restablecerPasswordService(
    email,
    codigo,
    nuevaPassword,
  );
  res.status(statusCode).json(json);
};
