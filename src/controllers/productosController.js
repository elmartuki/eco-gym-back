import { connectDB } from "../config/configDB.js";
import {
  borrarProductoService,
  crearProductoService,
  editarProductoService,
  obtenerProductosService,
} from "../services/productosServices.js";

export const obtenerProductosController = async (req, res) => {
  await connectDB();
  const { json, statusCode } = await obtenerProductosService();
  res.status(statusCode).json(json);
};

export const crearProductoController = async (req, res) => {
  await connectDB();
  const datos = req.body;
  const { json, statusCode } = await crearProductoService(datos);
  res.status(statusCode).json(json);
};

export const editarProductoController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const datos = req.body;
  const { json, statusCode } = await editarProductoService(id, datos);
  res.status(statusCode).json(json);
};

export const borrarProductoController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { json, statusCode } = await borrarProductoService(id);
  res.status(statusCode).json(json);
};
