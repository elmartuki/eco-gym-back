import mongoose from "mongoose";

const suscripcionSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuarios",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "planes",
      required: true,
    },
    nombrePlan: String,

    duracionDias: Number,
    estado: {
      type: String,
      enum: ["pendiente", "activa", "vencida", "cancelada", "ninguna"],
      default: "pendiente",
    },
    fechaInicio: Date,
    fechaVencimiento: Date,
    mercadoPago: { preference_id: String, id_pago: String },
  },
  { timestamps: true },
);

export const suscripcionModel = mongoose.model(
  "suscripciones",
  suscripcionSchema,
);
