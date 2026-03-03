import { planesModel } from "../models/planesModel.js";
import { suscripcionModel } from "../models/suscripcionModel.js";
import { usuarioModel } from "../models/usuariosModel.js";
import { pagoModel } from "../models/pagosModel.js";
import mongoose from "mongoose";

export const sincronizarSuscripciones = async () => {
  const hoy = new Date();

  await suscripcionModel.updateMany(
    {
      estado: "activa",
      fechaVencimiento: { $lte: hoy },
      planFuturo: { $exists: false },
    },
    { $set: { estado: "vencida" } },
  );

  const suscripcionesParaSwap = await suscripcionModel
    .find({
      estado: "activa",
      fechaVencimiento: { $lte: hoy },
      "planFuturo.plan": { $exists: true },
    })
    .lean();

  for (const sub of suscripcionesParaSwap) {
    const nuevaFechaInicio = new Date(sub.fechaVencimiento);
    const nuevaFechaVencimiento = new Date(nuevaFechaInicio);
    nuevaFechaVencimiento.setDate(
      nuevaFechaVencimiento.getDate() + sub.planFuturo.duracionDias,
    );

    await suscripcionModel.findByIdAndUpdate(
      sub._id,
      {
        plan: sub.planFuturo.plan,
        nombrePlan: sub.planFuturo.nombrePlan,
        duracionDias: sub.planFuturo.duracionDias,
        metodoPago: sub.planFuturo.metodoPago,
        total: sub.planFuturo.total,
        fechaInicio: nuevaFechaInicio,
        fechaVencimiento: nuevaFechaVencimiento,
        estado: sub.planFuturo.estado === "pendiente" ? "pendiente" : "activa",
        $unset: { planFuturo: 1 },
      },
      { strict: false },
    );
  }
};

export const obtenerMisSuscripcionesService = async (idUsuario) => {
  try {
    await sincronizarSuscripciones();
    const suscripcion = await suscripcionModel
      .findOne({ usuario: idUsuario })
      .sort({ createdAt: -1 })
      .lean();

    return suscripcion || { estado: "ninguna" };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const obtenerTodosLosSociosService = async () => {
  try {
    await sincronizarSuscripciones();
    return await usuarioModel.aggregate([
      { $match: { rol: "usuario" } },
      {
        $lookup: {
          from: "suscripciones",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$usuario", "$$userId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "suscripcion",
        },
      },
      {
        $addFields: {
          suscripcion: {
            $ifNull: [
              { $arrayElemAt: ["$suscripcion", 0] },
              { estado: "ninguna" },
            ],
          },
        },
      },
      { $project: { password: 0 } },
    ]);
  } catch (error) {
    throw new Error(error.message);
  }
};

export const confirmarSuscripcionService = async (idUsuario) => {
  try {
    const suscripcion = await suscripcionModel
      .findOne({ usuario: idUsuario })
      .sort({ createdAt: -1 });

    if (!suscripcion) {
      return { statusCode: 404, json: { message: "No hay suscripciones" } };
    }

    if (suscripcion.estado === "pendiente") {
      const dias = suscripcion.duracionDias || 30;
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);

      let queryPlan = [];
      if (suscripcion.plan) queryPlan.push({ _id: suscripcion.plan });
      if (suscripcion.nombrePlan)
        queryPlan.push({ nombre: suscripcion.nombrePlan });

      let montoFinal = suscripcion.total || 0;
      if (queryPlan.length > 0) {
        const planInfo = await planesModel.findOne({ $or: queryPlan }).lean();
        if (planInfo) {
          montoFinal =
            planInfo.precioOferta > 0 ? planInfo.precioOferta : planInfo.precio;
        }
      }

      const subActualizada = await suscripcionModel.findByIdAndUpdate(
        suscripcion._id,
        {
          estado: "activa",
          fechaInicio: new Date(),
          fechaVencimiento,
          total: montoFinal,
        },
        { new: true },
      );

      await pagoModel.findOneAndUpdate(
        {
          usuario: idUsuario,
          estado: "pendiente",
          descripcion: { $regex: suscripcion.nombrePlan, $options: "i" },
        },
        {
          estado: "aprobado",
          descripcion: `Suscripción: ${suscripcion.nombrePlan}`,
          monto: montoFinal,
          metodoPago: suscripcion.metodoPago || "transferencia",
        },
        { sort: { createdAt: -1 } },
      );

      return { statusCode: 200, json: subActualizada };
    } else if (
      suscripcion.planFuturo &&
      suscripcion.planFuturo.estado === "pendiente"
    ) {
      let queryPlanFuturo = [];
      if (suscripcion.planFuturo.plan)
        queryPlanFuturo.push({ _id: suscripcion.planFuturo.plan });
      if (suscripcion.planFuturo.nombrePlan)
        queryPlanFuturo.push({ nombre: suscripcion.planFuturo.nombrePlan });

      let montoFinalFuturo = suscripcion.planFuturo.total || 0;
      if (queryPlanFuturo.length > 0) {
        const planFuturoInfo = await planesModel
          .findOne({ $or: queryPlanFuturo })
          .lean();
        if (planFuturoInfo) {
          montoFinalFuturo =
            planFuturoInfo.precioOferta > 0
              ? planFuturoInfo.precioOferta
              : planFuturoInfo.precio;
        }
      }

      const subActualizada = await suscripcionModel.findByIdAndUpdate(
        suscripcion._id,
        {
          $set: {
            "planFuturo.estado": "pagado",
            "planFuturo.total": montoFinalFuturo,
          },
        },
        { new: true, strict: false },
      );

      await pagoModel.findOneAndUpdate(
        {
          usuario: idUsuario,
          estado: "pendiente",
          descripcion: {
            $regex: suscripcion.planFuturo.nombrePlan,
            $options: "i",
          },
        },
        {
          estado: "aprobado",
          descripcion: `Plan Futuro: ${suscripcion.planFuturo.nombrePlan}`,
          monto: montoFinalFuturo,
          metodoPago: suscripcion.planFuturo.metodoPago || "transferencia",
        },
        { sort: { createdAt: -1 } },
      );

      return { statusCode: 200, json: subActualizada };
    }

    return { statusCode: 400, json: { message: "No hay pagos pendientes" } };
  } catch (error) {
    return { statusCode: 500, json: { message: error.message } };
  }
};

export const renovarSuscripcionAdminService = async (idUsuario, metodoPago) => {
  try {
    const suscripcion = await suscripcionModel
      .findOne({ usuario: idUsuario })
      .sort({ createdAt: -1 });
    if (!suscripcion) throw new Error("No se encontró suscripción");

    let queryPlan = [];
    if (suscripcion.plan) queryPlan.push({ _id: suscripcion.plan });
    if (suscripcion.nombrePlan)
      queryPlan.push({ nombre: suscripcion.nombrePlan });

    let montoFinal = suscripcion.total || 0;
    if (queryPlan.length > 0) {
      const planInfo = await planesModel.findOne({ $or: queryPlan }).lean();
      if (planInfo) {
        montoFinal =
          planInfo.precioOferta > 0 ? planInfo.precioOferta : planInfo.precio;
      }
    }

    const dias = suscripcion.duracionDias || 30;
    let fechaInicio = new Date();
    let fechaVencimiento = new Date();

    if (
      suscripcion.estado === "activa" &&
      new Date(suscripcion.fechaVencimiento) > new Date()
    ) {
      fechaInicio = new Date(suscripcion.fechaVencimiento);
      fechaVencimiento = new Date(suscripcion.fechaVencimiento);
    }

    fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);

    const renovacion = await suscripcionModel.findOneAndUpdate(
      { usuario: idUsuario },
      {
        estado: "activa",
        metodoPago,
        fechaVencimiento,
        total: montoFinal,
        $unset: { planFuturo: 1 },
      },
      { new: true, upsert: true, strict: false },
    );

    await pagoModel.create({
      usuario: idUsuario,
      descripcion: `Renovación Admin: ${suscripcion.nombrePlan}`,
      monto: montoFinal,
      metodoPago: metodoPago,
      estado: "aprobado",
    });

    return renovacion;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const obtenerDetallesSocioService = async (idSocio) => {
  try {
    await sincronizarSuscripciones();
    const usuario = await usuarioModel
      .findById(idSocio)
      .select("-password")
      .lean();
    if (!usuario) throw new Error("Socio no encontrado");

    const suscripcion = await suscripcionModel
      .findOne({ usuario: idSocio })
      .sort({ createdAt: -1 })
      .lean();

    return {
      ...usuario,
      suscripcion: suscripcion || { estado: "ninguna" },
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const cancelarSuscripcionService = async (idUsuario) => {
  try {
    const suscripcion = await suscripcionModel
      .findOne({ usuario: idUsuario })
      .sort({ createdAt: -1 });
    if (!suscripcion) throw new Error("No se encontró suscripción");

    return await suscripcionModel.findByIdAndUpdate(
      suscripcion._id,
      { estado: "cancelada", $unset: { planFuturo: 1 } },
      { new: true, strict: false },
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

export const cambiarPlanAdminService = async (
  idUsuario,
  planId,
  metodoPago,
) => {
  try {
    const planInfo = await planesModel.findById(planId).lean();
    if (!planInfo) throw new Error("El plan seleccionado no existe");

    const subActual = await suscripcionModel
      .findOne({ usuario: idUsuario })
      .sort({ createdAt: -1 })
      .lean();

    if (subActual && subActual.planFuturo) {
      throw new Error(
        "El usuario ya tiene un plan futuro programado. Cancele la suscripción o espere a que se active para cambiarlo.",
      );
    }

    const dias = planInfo.duracionDias || 30;
    const total =
      planInfo.precioOferta > 0 ? planInfo.precioOferta : planInfo.precio;

    if (
      subActual &&
      subActual.estado === "activa" &&
      new Date(subActual.fechaVencimiento) > new Date()
    ) {
      const subActualizada = await suscripcionModel.findByIdAndUpdate(
        subActual._id,
        {
          $set: {
            planFuturo: {
              plan: planId,
              nombrePlan: planInfo.nombre,
              duracionDias: dias,
              metodoPago,
              estado: "pagado",
              total,
            },
          },
        },
        { new: true, strict: false },
      );

      await pagoModel.create({
        usuario: idUsuario,
        descripcion: `Cambio Plan Futuro Admin: ${planInfo.nombre}`,
        monto: total,
        metodoPago: metodoPago,
        estado: "aprobado",
      });

      return subActualizada;
    } else {
      const fechaInicio = new Date();
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);

      const updateData = {
        plan: planId,
        nombrePlan: planInfo.nombre,
        duracionDias: dias,
        metodoPago,
        estado: "activa",
        total,
        fechaInicio,
        fechaVencimiento,
        $unset: { planFuturo: 1 },
      };

      const renovacion = await suscripcionModel.findOneAndUpdate(
        { usuario: idUsuario },
        updateData,
        { new: true, upsert: true, strict: false },
      );

      await pagoModel.create({
        usuario: idUsuario,
        descripcion: `Cambio de Plan Admin: ${planInfo.nombre}`,
        monto: total,
        metodoPago: metodoPago,
        estado: "aprobado",
      });

      return renovacion;
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
