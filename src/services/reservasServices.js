import { reservaModel } from "../models/reservasModel.js";

export const obtenerMisReservasService = async (idUsuario, proxima) => {
  let filtro = { usuario: idUsuario };
  if (proxima === "true") {
    filtro.fechaCompleta = { $gte: new Date() };
    filtro.estado = "activa";
  }
  return await reservaModel.find(filtro).sort({ fechaCompleta: 1 });
};

export const crearReservaService = async (idUsuario, body) => {
  const { dia, fechaCompleta } = body;
  const nuevaReserva = new reservaModel({
    usuario: idUsuario,
    dia,
    fechaCompleta,
    estado: "activa",
  });
  return await nuevaReserva.save();
};

export const obtenerReservasPorSocioService = async (idUsuario) => {
  return await reservaModel
    .find({ usuario: idUsuario })
    .sort({ fechaCompleta: 1 });
};

export const confirmarReservaService = async (idReserva) => {
  const reserva = await reservaModel.findById(idReserva);
  if (!reserva) throw new Error("Reserva no encontrada");

  if (reserva.estado !== "pendiente") {
    throw new Error("Esta reserva no esta pendiente de pago");
  }

  reserva.estado = "activa";
  return await reserva.save();
};
