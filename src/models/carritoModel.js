import mongoose from "mongoose";

const carritoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuarios",
      required: true,
      unique: true,
    },
    productos: [
      {
        producto: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "productos",
          required: true,
        },
        cantidad: {
          type: Number,
          required: true,
          min: 1,
          max: 10,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const carritoModel = mongoose.model("carritos", carritoSchema);
