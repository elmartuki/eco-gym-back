import {
  MercadoPagoConfig,
  Preference,
  Payment,
  MerchantOrder,
} from "mercadopago";
import { pedidoModel } from "../models/pedidoModel.js";
import { carritoModel } from "../models/carritoModel.js";
import { usuarioModel } from "../models/usuariosModel.js";
import { productoModel } from "../models/productoModel.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const generarNumeroPedidoAleatorio = () => {
  const prefijo = "RP";
  const randomValue = crypto.randomBytes(3).toString("hex").toUpperCase();
  const timestamp = Date.now().toString().slice(-4);
  return `${prefijo}-${timestamp}-${randomValue}`;
};

const generarCodigoSeguridad = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

export const createPreferenceServicio = async (idUsuario, body) => {
  try {
    const { metodoEntrega, costoEnvio, distancia } = body;
    const carrito = await carritoModel
      .findOne({ usuario: idUsuario })
      .populate("productos.producto");

    if (!carrito || !carrito.productos?.length)
      return { statusCode: 400, json: { message: "Carrito vacío" } };

    const productosValidos = carrito.productos.filter(
      (item) => item.producto !== null,
    );
    const usuario = await usuarioModel.findById(idUsuario);
    if (!usuario)
      return { statusCode: 404, json: { message: "Usuario no encontrado" } };

    for (const item of productosValidos) {
      if (item.producto.stock < item.cantidad) {
        return {
          statusCode: 400,
          json: { message: `Stock insuficiente: ${item.producto.nombre}` },
        };
      }
    }

    const numeroPedido = generarNumeroPedidoAleatorio();
    const codigoSeguridad = generarCodigoSeguridad();
    let subtotalCalculado = 0;

    const itemsMercadoPago = productosValidos.map((item) => {
      const precio = Number(
        item.producto.precio_oferta || item.producto.precio,
      );
      subtotalCalculado += precio * item.cantidad;
      return {
        id: String(item.producto._id),
        title: String(item.producto.nombre),
        description: `Producto de Que Rico Pollo - ${item.producto.categoria}`,
        category_id: "food",
        unit_price: precio,
        quantity: Number(item.cantidad),
        currency_id: "ARS",
      };
    });

    if (metodoEntrega === "delivery" && Number(costoEnvio) > 0) {
      itemsMercadoPago.push({
        id: "envio-001",
        title: "Costo de Envío",
        description: "Servicio de entrega a domicilio",
        category_id: "others",
        unit_price: Number(costoEnvio),
        quantity: 1,
        currency_id: "ARS",
      });
    }

    const totalFinal =
      subtotalCalculado +
      (metodoEntrega === "delivery" ? Number(costoEnvio) : 0);

    const [firstName, ...lastNameParts] = usuario.nombreCompleto.split(" ");
    const lastName = lastNameParts.join(" ") || "Sin Apellido";

    const preference = new Preference(client);
    const mpResult = await preference.create({
      body: {
        items: itemsMercadoPago,
        payer: {
          name: firstName,
          surname: lastName,
          email: usuario.email,
          phone: {
            number: usuario.telefono.replace(/\D/g, ""),
          },
          address: {
            street_name: usuario.direcciones?.[0]?.direccion || "A convenir",
          },
        },
        back_urls: {
          success: `${process.env.URL_FRONTEND}/pago/exitoso`,
          failure: `${process.env.URL_FRONTEND}/pago/fallido`,
          pending: `${process.env.URL_FRONTEND}/pago/pendiente`,
        },
        auto_return: "approved",
        external_reference: numeroPedido,
        notification_url: `${process.env.URL_BACKEND}/api/payment/webhook`,
        statement_descriptor: "QUE RICO POLLO",
      },
    });

    const nuevoPedido = new pedidoModel({
      usuario: idUsuario,
      numeroPedido,
      codigoSeguridad,
      datosContacto: {
        nombreCompleto: usuario.nombreCompleto,
        telefono: usuario.telefono,
        email: usuario.email,
      },
      productos: productosValidos.map((item) => ({
        producto: item.producto._id,
        nombre: item.producto.nombre,
        imagen: item.producto.imagen || "",
        cantidad: item.cantidad,
        precioUnitario: Number(
          item.producto.precio_oferta || item.producto.precio,
        ),
      })),
      metodoEntrega,
      ubicacion: {
        direccionVisual: usuario.direcciones?.[0]?.direccion || "A convenir",
        lat: usuario.direcciones?.[0]?.lat || 0,
        lng: usuario.direcciones?.[0]?.lng || 0,
        distanciaKm: Number(distancia) || 0,
      },
      costos: {
        subtotal: subtotalCalculado,
        envio: metodoEntrega === "delivery" ? Number(costoEnvio) : 0,
        total: totalFinal,
      },
      mercadoPago: { preference_id: mpResult.id },
    });

    await nuevoPedido.save();
    return {
      statusCode: 200,
      json: { init_point: mpResult.init_point, numeroPedido, codigoSeguridad },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno", error: error.message },
    };
  }
};

const procesarAprobacionPedido = async (
  externalReference,
  paymentId,
  status,
  amount,
) => {
  console.log(`🔍 Intentando procesar pedido: ${externalReference}`);
  const pedido = await pedidoModel.findOne({ numeroPedido: externalReference });

  if (!pedido) {
    console.error(`❌ No se encontró el pedido ${externalReference} en la DB.`);
    return;
  }

  if (pedido.estado === "pagado") {
    console.log(`⚠️ El pedido ${externalReference} ya estaba procesado.`);
    return;
  }

  const diferencia = Math.abs(amount - pedido.costos.total);
  if (diferencia > 0.01) {
    console.error(
      `⚠️ DIFERENCIA DE MONTO: Cobrado ${amount}, Esperado ${pedido.costos.total}`,
    );
    return;
  }

  pedido.estado = "pagado";
  pedido.mercadoPago.id_pago = paymentId.toString();
  pedido.mercadoPago.estado_pago = status;
  await pedido.save();

  console.log(`✅ Pedido ${externalReference} marcado como PAGADO.`);

  for (const item of pedido.productos) {
    const resultado = await productoModel.findOneAndUpdate(
      {
        _id: item.producto,
        stock: { $gte: item.cantidad },
      },
      { $inc: { stock: -item.cantidad } },
      { new: true },
    );

    if (!resultado) {
      console.error(
        `❌ STOCK INSUFICIENTE CRÍTICO para el producto ${item.nombre}`,
      );
    }
  }

  await carritoModel.findOneAndUpdate(
    { usuario: pedido.usuario },
    { productos: [] },
  );
  console.log(`✅ Pedido ${externalReference} procesado con éxito.`);
};

export const webhookServicio = async (body) => {
  try {
    const topic = body.type || body.topic;
    const resourceId = body.data?.id || body.id;

    if (topic === "payment") {
      const payment = new Payment(client);
      const res = await payment.get({ id: resourceId });

      if (res.status === "approved") {
        await procesarAprobacionPedido(
          res.external_reference,
          res.id,
          res.status,
          res.transaction_details.total_paid_amount,
        );
      }
    } else if (
      topic === "merchant_order" ||
      topic === "topic_merchant_order_wh"
    ) {
      const mOrder = new MerchantOrder(client);
      const res = await mOrder.get({ merchantOrderId: resourceId });

      if (res.status === "closed" || res.order_status === "paid") {
        const approvedPayment = res.payments.find(
          (p) => p.status === "approved",
        );
        if (approvedPayment) {
          await procesarAprobacionPedido(
            res.external_reference,
            approvedPayment.id,
            approvedPayment.status,
            approvedPayment.transaction_amount,
          );
        }
      }
    }

    return { statusCode: 200 };
  } catch (error) {
    console.error("💥 Error en Webhook Servicio:", error.message);
    return { statusCode: 500 };
  }
};
