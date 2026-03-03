import { pagoModel } from "../models/pagosModel.js";

export const obtenerHistorialPagosService = async (idUsuario) => {
  try {
    const historial = await pagoModel
      .find({ usuario: idUsuario })
      .sort({ createdAt: -1 })
      .lean();

    return { statusCode: 200, json: historial };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error al obtener historial", error: error.message },
    };
  }
};
