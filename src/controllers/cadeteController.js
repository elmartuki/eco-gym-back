import { connectDB } from "../config/configDB.js";
import {
  actualizarEstado,
  crearSolicitudCadete,
  obtenerCadetes,
} from "../services/cadeteServices.js";

export const crearSolicitudController = async (req, res) => {
  await connectDB();
  try {
    const nuevoCadete = await crearSolicitudCadete(req.body);
    res.status(201).json(nuevoCadete);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const listarCadetesController = async (req, res) => {
  await connectDB();
  try {
    const cadetes = await obtenerCadetes();
    res.status(200).json(cadetes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cambiarEstadoCadeteController = async (req, res) => {
  await connectDB();
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const cadeteActualizado = await actualizarEstado(id, estado);

    if (!cadeteActualizado && estado === "rechazado") {
      return res.status(200).json({ message: "Cadete eliminado" });
    }

    if (!cadeteActualizado) {
      return res.status(404).json({ message: "Cadete no encontrado" });
    }

    res.status(200).json(cadeteActualizado);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
