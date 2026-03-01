import bcrypt from "bcrypt";
import { usuarioModel } from "../models/usuariosModel.js";

export const crearSolicitudCadete = async (datos) => {
  const existeUsuario = await usuarioModel.findOne({ email: datos.email });
  if (existeUsuario) {
    throw new Error("El correo ya está registrado");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(datos.password, salt);

  const nuevoCadete = new usuarioModel({
    nombreCompleto: datos.nombre,
    email: datos.email,
    password: hashedPassword,
    telefono: datos.telefono,
    experiencia: datos.experiencia,
    vehiculo: datos.vehiculo,
    rol: "cadete",
    estado: "pendiente",
    activo: false,
    baneado: false,
  });

  return await nuevoCadete.save();
};

export const obtenerCadetes = async () => {
  return await usuarioModel.find({ rol: "cadete" }).select("-password");
};

export const actualizarEstado = async (id, estado) => {
  if (estado === "rechazado") {
    return await usuarioModel.findByIdAndDelete(id);
  }

  if (estado === "baneado") {
    return await usuarioModel.findByIdAndUpdate(
      id,
      { estado: "baneado", activo: false, baneado: true },
      { new: true },
    );
  }

  if (estado === "desbaneado") {
    return await usuarioModel.findByIdAndUpdate(
      id,
      { estado: "activo", activo: true, baneado: false },
      { new: true },
    );
  }

  if (estado === "activo") {
    return await usuarioModel.findByIdAndUpdate(
      id,
      { estado: "activo", activo: true, baneado: false },
      { new: true },
    );
  }

  return await usuarioModel.findByIdAndUpdate(id, { estado }, { new: true });
};
