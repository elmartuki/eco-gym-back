import mongoose from "mongoose";

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    categoria: {
      type: String,
      required: true,
      enum: ["milanesas", "empanadas", "combos", "huevos", "otros"],
    },
    precio: {
      type: Number,
      required: true,
      min: 0,
    },
    precio_oferta: {
      type: Number,
      min: 0,
      default: null,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    imagen: {
      type: String,
      default: "",
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const productoModel = mongoose.model("productos", productoSchema);
