import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuarios",
      required: true,
    },
    numeroPedido: {
      type: String,
      required: true,
      unique: true,
    },
    codigoSeguridad: {
      type: String,
      required: true,
    },
    datosContacto: {
      nombreCompleto: { type: String, required: true },
      telefono: { type: String, required: true },
      email: { type: String, required: true },
    },
    productos: [
      {
        producto: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "productos",
          required: true,
        },
        nombre: { type: String, required: true },
        imagen: { type: String },
        cantidad: { type: Number, required: true },
        precioUnitario: { type: Number, required: true },
      },
    ],
    metodoEntrega: {
      type: String,
      enum: ["delivery", "pickup"],
      required: true,
    },
    ubicacion: {
      direccionVisual: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      distanciaKm: { type: Number, default: 0 },
    },
    costos: {
      subtotal: { type: Number, required: true },
      envio: { type: Number, required: true },
      total: { type: Number, required: true },
    },
    estado: {
      type: String,
      enum: [
        "pendiente",
        "pagado",
        "preparando",
        "asignando cadete",
        "pedido enviado",
        "entregado",
        "cancelado",
      ],
      default: "pendiente",
    },
    mercadoPago: {
      id_pago: { type: String, default: null },
      estado_pago: { type: String, default: null },
      preference_id: { type: String, default: null },
    },
    cadete: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "usuarios",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);
pedidoSchema.index({ usuario: 1, createdAt: -1 });
export const pedidoModel = mongoose.model("pedidos", pedidoSchema);
