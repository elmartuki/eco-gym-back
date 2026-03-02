import { connectDB } from "../config/configDB.js";
import {
  obtenerMisSuscripcionesService,
  obtenerTodosLosSociosService,
  confirmarSuscripcionService,
  obtenerDetallesSocioService,
  cambiarPlanAdminService,
  cancelarSuscripcionService,
  renovarSuscripcionAdminService,
} from "../services/suscripcionesServices.js";

export const obtenerTodosLosSociosController = async (req, res) => {
  try {
    await connectDB();
    const socios = await obtenerTodosLosSociosService();
    res.status(200).json(socios);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const obtenerMisSuscripcionesController = async (req, res) => {
  try {
    await connectDB();
    const data = await obtenerMisSuscripcionesService(req.idUsuario);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmarSuscripcionController = async (req, res) => {
  try {
    await connectDB();
    const { idUsuario } = req.params;
    const data = await confirmarSuscripcionService(idUsuario);
    res.status(200).json(data);
  } catch (error) {
    console.error("ERROR AL CONFIRMAR PAGO:", error.message);
    res.status(500).json({ message: error.message });
  }
};

export const obtenerDetallesSocioController = async (req, res) => {
  try {
    await connectDB();
    const data = await obtenerDetallesSocioService(req.params.id);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelarSuscripcionController = async (req, res) => {
  try {
    await connectDB();
    const data = await cancelarSuscripcionService(req.params.idUsuario);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const renovarSuscripcionAdminController = async (req, res) => {
  try {
    await connectDB();
    const data = await renovarSuscripcionAdminService(
      req.params.idUsuario,
      req.body.metodoPago,
    );
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cambiarPlanAdminController = async (req, res) => {
  try {
    await connectDB();
    const { planId, metodoPago } = req.body;
    const { idUsuario } = req.params;

    if (!planId || !metodoPago) {
      return res
        .status(400)
        .json({ message: "Plan y método de pago requeridos" });
    }

    const data = await cambiarPlanAdminService(idUsuario, planId, metodoPago);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
