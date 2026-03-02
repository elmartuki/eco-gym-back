import mongoose from "mongoose";

const PlanSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    precio: {
      type: Number,
      required: true,
    },
    precioOferta: {
      type: Number,
      default: 0,
    },

    duracionDias: {
      type: Number,
      default: 30,
    },
    foto: {
      type: String,
      default: "",
    },
    caracteristicas: {
      type: [String],
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const planesModel = mongoose.model("planes", PlanSchema);
