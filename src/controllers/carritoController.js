import { connectDB } from "../config/configDB.js";
import {
  obtenerCarritoService,
  agregarProductoCarritoService,
  eliminarProductoCarritoService,
} from "../services/carritoServices.js";

export const obtenerCarritoController = async (req, res) => {
  await connectDB();
  const { idUsuario } = req.params;
  const { json, statusCode } = await obtenerCarritoService(idUsuario);
  res.status(statusCode).json(json);
};

export const agregarProductoCarritoController = async (req, res) => {
  await connectDB();
  const { idUsuario } = req.params;
  const { idProducto } = req.body;
  const { json, statusCode } = await agregarProductoCarritoService(
    idUsuario,
    idProducto,
  );
  res.status(statusCode).json(json);
};

export const eliminarProductoCarritoController = async (req, res) => {
  await connectDB();
  const { idUsuario } = req.params;
  const { idProducto } = req.body;
  const { json, statusCode } = await eliminarProductoCarritoService(
    idUsuario,
    idProducto,
  );
  res.status(statusCode).json(json);
};
