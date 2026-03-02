import { obtenerMisSuscripcionesService } from "../services/suscripcionesServices.js";
import { connectDB } from "../config/configDB.js";

export const obtenerMisSuscripcionesController = async (req, res) => {
  await connectDB();
  try {
    const suscripcion = await obtenerMisSuscripcionesService(req.idUsuario);

    res.status(200).json(suscripcion);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener suscripción", error: error.message });
  }
};
