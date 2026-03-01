import { obtenerEstadisticasService } from "../services/estadisticasServices.js";

export const obtenerEstadisticasController = async (req, res) => {
  const { mes, anio } = req.query;
  const m = mes ? parseInt(mes) : new Date().getMonth() + 1;
  const a = anio ? parseInt(anio) : new Date().getFullYear();

  const { statusCode, json } = await obtenerEstadisticasService(m, a);
  res.status(statusCode).json(json);
};
