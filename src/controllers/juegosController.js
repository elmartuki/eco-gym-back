import { connectDB } from "../config/configDB.js";
import {
  agregarJuegoServices,
  editarUnJuegoServices,
  eliminarUnJuegoServices,
  gestionarFavoritosServices,
  gestionarVisualizacionServices,
  obtenerJuegosPorStudioServices,
  obtenerJuegosServices,
  obtenerUnJuegoPorStudioServices,
  verificarEstadoFavoritoService,
} from "../services/juegosServices.js";

export const agregarJuegoController = async (req, res) => {
  await connectDB();

  const idUsuario = req.idUsuario;

  const { json, statusCode } = await agregarJuegoServices(idUsuario, req.body);

  res.status(statusCode).json(json);
};

export const obtenerJuegosController = async (req, res) => {
  await connectDB();
  const { json, statusCode } = await obtenerJuegosServices();
  res.status(statusCode).json(json);
};

export const obtenerUnJuegoPorStudioController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { json, statusCode } = await obtenerUnJuegoPorStudioServices(id);
  res.status(statusCode).json(json);
};

export const obtenerJuegosPorStudioController = async (req, res) => {
  await connectDB();
  const idUsuario = req.idUsuario;
  const { json, statusCode } = await obtenerJuegosPorStudioServices(idUsuario);
  res.status(statusCode).json(json);
};

export const editarUnJuegoController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const datos = req.body;
  const { json, statusCode } = await editarUnJuegoServices(id, datos);
  res.status(statusCode).json(json);
};

export const eliminarUnJuegoController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { json, statusCode } = await eliminarUnJuegoServices(id);
  res.status(statusCode).json(json);
};

export const gestionarVisualizacionController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { json, statusCode } = await gestionarVisualizacionServices(id);
  res.status(statusCode).json(json);
};

export const gestionarFavoritosController = async (req, res) => {
  await connectDB();

  const { id } = req.params;
  const idUsuario = req.idUsuario;

  const { json, statusCode } = await gestionarFavoritosServices(id, idUsuario);

  res.status(statusCode).json(json);
};

export const verificarEstadoFavoritoController = async (req, res) => {
  await connectDB();

  const { id } = req.params;
  const idUsuario = req.idUsuario;

  const { json, statusCode } = await verificarEstadoFavoritoService(
    id,
    idUsuario,
  );

  res.status(statusCode).json(json);
};
