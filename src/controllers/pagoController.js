
import { connectDB } from "../config/configDB.js";
import { obtenerHistorialPagosService } from "../services/pagosServices.js";


export const obtenerHistorialPagos = async (req, res) => {
  await connectDB();
  const { idUsuario } = req.params;
  const { json, statusCode } = await obtenerHistorialPagosService(idUsuario);
  res.status(statusCode).json(json);
};
