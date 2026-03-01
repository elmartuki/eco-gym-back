import mongoose from "mongoose";

const { Schema } = mongoose;

const juegosSchema = new Schema(
  {
    mostrar: {
      type: Boolean,
      default: true,
      index: true,
    },
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    precioBase: {
      type: Number,
      required: true,
      min: 0,
    },
    precioDescuento: {
      type: Number,
      default: 0,
      min: 0,
    },
    imagenPortada: {
      type: String,
      required: true,
    },
    imagenBanner: {
      type: String,
      required: true,
    },
    galeria: {
      type: [String],
      default: [],
    },
    categorias: [
      {
        type: String,
        enum: [
          "Acción",
          "Aventura",
          "RPG",
          "Estrategia",
          "Deportes",
          "Carreras",
          "Simulación",
          "Terror",
          "Indie",
          "Sci-Fi",
          "Shooter",
          "Lucha",
          "Plataformas",
          "Sigilo",
          "Psicológico",
          "Indie",
        ],
      },
    ],
    etiquetas: [{ type: String }],

    desarrolladora: {
      type: String,
      required: true,
    },

    studioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuarios",
    },

    fechaLanzamiento: {
      type: Date,
      default: Date.now,
    },
    version: {
      type: String,
      default: "1.0.0",
    },
    pesoGB: {
      type: Number,
    },

    cantidadFavoritos: {
      type: Number,
      default: 0,
    },

    usuarios_likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "usuarios",
      },
    ],

    descargasTotales: {
      type: Number,
      default: 0,
    },
    ventasTotales: {
      type: Number,
      default: 0,
      index: true,
    },
    ingresosGenerados: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const juegosModel = mongoose.model("juegos", juegosSchema);
