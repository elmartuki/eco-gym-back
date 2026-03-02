import mongoose from "mongoose";

const reservaSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuarios",
      required: true,
    },
    dia: { type: String, required: true },
    fechaCompleta: { type: Date, required: true },
    estado: {
      type: String,
      enum: ["pendiente", "activa", "vencida", "cancelada", "ninguna"],
      default: "pendiente",
    },
    metodoPago: String,
    mercadoPago: { preference_id: String, id_pago: String },
  },
  { timestamps: true },
);

export const reservaModel = mongoose.model("reservas", reservaSchema);
