import { suscripcionModel } from "../models/suscripcionModel.js";
import mongoose from "mongoose";

export const obtenerMisSuscripcionesService = async (idUsuario) => {
  try {
    // 1. Log para verificar qué ID está llegando del token
    console.log("Consultando suscripción para el usuario ID:", idUsuario);

    // 2. Convertimos explícitamente a ObjectId por seguridad
    const userObjectId = new mongoose.Types.ObjectId(idUsuario);

    const suscripcion = await suscripcionModel
      .findOne({ usuario: userObjectId })
      .sort({ createdAt: -1 });

    // 3. Log para ver qué encontró la base de datos
    if (suscripcion) {
      console.log(
        "Suscripción encontrada:",
        suscripcion.nombrePlan,
        "-",
        suscripcion.estado,
      );
    } else {
      console.log("No se encontró ninguna suscripción en la DB para este ID.");
    }

    return suscripcion || { estado: "ninguna" };
  } catch (error) {
    console.error(
      "Error crítico en el servicio de suscripciones:",
      error.message,
    );
    return { estado: "ninguna", error: error.message };
  }
};
