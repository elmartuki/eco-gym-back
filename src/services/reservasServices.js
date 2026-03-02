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
