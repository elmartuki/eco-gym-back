import {
  obtenerMisReservasService,
  crearReservaService,
} from "../services/reservasServices.js";

export const obtenerMisReservasController = async (req, res) => {
  try {
    const data = await obtenerMisReservasService(
      req.idUsuario,
      req.query.proxima,
    );
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const crearReservaController = async (req, res) => {
  try {
    const data = await crearReservaService(req.idUsuario, req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
