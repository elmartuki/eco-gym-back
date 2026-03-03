import mongoose from "mongoose";

const pagoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuario",
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    monto: {
      type: Number,
      required: true,
    },
    metodoPago: {
      type: String,
      required: true,
    },
    estado: {
      type: String,
      default: "aprobado",
    },
    idMercadoPago: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const pagoModel = mongoose.model("pago", pagoSchema);
