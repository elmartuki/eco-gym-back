import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema(
  {
    nombreCompleto: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Email inválido"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    telefono: {
      type: String,
      required: true,
    },
    foto_de_perfil: {
      type: String,
      default: "",
    },
    rol: {
      type: String,
      enum: ["usuario", "admin"],
      default: "usuario",
    },

    activo: {
      type: Boolean,
      default: true,
    },
    baneado: {
      type: Boolean,
      default: false,
    },
    codigoRecuperacion: {
      type: String,
      default: null,
    },
    expiracionCodigo: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const usuarioModel = mongoose.model("usuarios", usuarioSchema);
