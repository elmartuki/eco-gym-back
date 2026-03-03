import { reservaModel } from "../models/reservasModel.js";
import { pagoModel } from "../models/pagosModel.js";
import { planesModel } from "../models/planesModel.js";

export const obtenerMisReservasService = async (idUsuario, proxima) => {
  let filtro = { usuario: idUsuario };
  if (proxima === "true") {
    filtro.fechaCompleta = { $gte: new Date() };
    filtro.estado = "activa";
  }
  return await reservaModel.find(filtro).sort({ fechaCompleta: 1 });
};

export const crearReservaService = async (idUsuario, body) => {
  const { dia, fechaCompleta, metodoPago, monto, total } = body;

  let montoReserva = total || monto || 0;

  if (montoReserva === 0) {
    const planDiario = await planesModel
      .findOne({ nombre: "PASE DIARIO" })
      .lean();
    if (planDiario) {
      montoReserva =
        planDiario.precioOferta > 0
          ? planDiario.precioOferta
          : planDiario.precio;
    }
  }

  const nuevaReserva = new reservaModel({
    usuario: idUsuario,
    dia,
    fechaCompleta,
    estado: "pendiente",
    metodoPago,
    total: montoReserva,
  });

  const reservaGuardada = await nuevaReserva.save();

  if (metodoPago === "efectivo" || metodoPago === "transferencia") {
    await pagoModel.create({
      usuario: idUsuario,
      descripcion: `Reserva Clase (Pendiente)`,
      monto: montoReserva,
      metodoPago: metodoPago,
      estado: "pendiente",
    });
  }

  return reservaGuardada;
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

  let montoFinal = reserva.total || reserva.monto || 0;

  if (montoFinal === 0) {
    const planDiario = await planesModel
      .findOne({ nombre: "PASE DIARIO" })
      .lean();
    if (planDiario) {
      montoFinal =
        planDiario.precioOferta > 0
          ? planDiario.precioOferta
          : planDiario.precio;
    }
  }

  reserva.estado = "activa";
  reserva.total = montoFinal;
  const reservaActualizada = await reserva.save();

  await pagoModel.findOneAndUpdate(
    {
      usuario: reserva.usuario,
      estado: "pendiente",
      descripcion: { $regex: "Reserva Clase", $options: "i" },
    },
    {
      estado: "aprobado",
      descripcion: "Reserva de clase",
      monto: montoFinal,
      metodoPago: reserva.metodoPago || "administración",
    },
    { sort: { createdAt: -1 } },
  );

  return reservaActualizada;
};
