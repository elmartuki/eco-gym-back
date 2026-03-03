import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { usuarioModel } from "../models/usuariosModel.js";
import { suscripcionModel } from "../models/suscripcionModel.js";
import { planesModel } from "../models/planesModel.js";
import { reservaModel } from "../models/reservasModel.js";
import { pagoModel } from "../models/pagosModel.js";
import dotenv from "dotenv";

dotenv.config();

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export const createPreferenceServicio = async (
  idUsuario,
  { planId, metodoPago, fechaReserva },
) => {
  try {
    const [plan, usuario] = await Promise.all([
      planesModel.findById(planId),
      usuarioModel.findById(idUsuario),
    ]);

    if (!plan || !usuario)
      return { statusCode: 404, json: { message: "Error" } };

    const total = plan.precioOferta > 0 ? plan.precioOferta : plan.precio;
    let mpResult = null;

    if (metodoPago === "mercado-pago") {
      const preference = new Preference(client);
      mpResult = await preference.create({
        body: {
          items: [
            {
              id: String(plan._id),
              title: `EcoGym: ${plan.nombre}`,
              unit_price: Number(total),
              quantity: 1,
              currency_id: "ARS",
            },
          ],
          back_urls: { success: `${process.env.URL_FRONTEND}/dashboard` },
          auto_return: "approved",
          external_reference: idUsuario.toString(),
          notification_url: `${process.env.URL_BACKEND}/api/payment/webhook`,
        },
      });
    }

    if (fechaReserva) {
      const dateObj = new Date(fechaReserva);
      const daysOfWeek = [
        "LUNES",
        "MARTES",
        "MIERCOLES",
        "JUEVES",
        "VIERNES",
        "SABADO",
        "DOMINGO",
      ];
      const dayIndex = dateObj.getDay();
      const strDia = daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1];

      await reservaModel.create({
        usuario: idUsuario,
        dia: strDia,
        fechaCompleta: dateObj,
        estado: "pendiente",
        metodoPago,
        mercadoPago: mpResult ? { preference_id: mpResult.id } : {},
      });

      await pagoModel.create({
        usuario: idUsuario,
        descripcion: `Reserva Clase (Pendiente)`,
        monto: total,
        metodoPago,
        estado: "pendiente",
        idMercadoPago: mpResult ? mpResult.id : undefined,
      });
    } else {
      const subActual = await suscripcionModel
        .findOne({ usuario: idUsuario })
        .lean();
      const isActiva =
        subActual &&
        subActual.estado === "activa" &&
        new Date(subActual.fechaVencimiento) > new Date();

      if (isActiva) {
        await suscripcionModel.findOneAndUpdate(
          { usuario: idUsuario },
          {
            $set: {
              planFuturo: {
                plan: plan._id,
                nombrePlan: plan.nombre,
                duracionDias: plan.duracionDias || 30,
                metodoPago,
                estado: "pendiente",
                total,
                mercadoPago: mpResult ? { preference_id: mpResult.id } : {},
              },
            },
          },
          { upsert: true, new: true, strict: false },
        );

        await pagoModel.create({
          usuario: idUsuario,
          descripcion: `Plan Futuro: ${plan.nombre} (Pendiente)`,
          monto: total,
          metodoPago,
          estado: "pendiente",
          idMercadoPago: mpResult ? mpResult.id : undefined,
        });
      } else {
        const dataSuscripcion = {
          plan: plan._id,
          nombrePlan: plan.nombre,
          duracionDias: plan.duracionDias || 30,
          metodoPago,
          estado: "pendiente",
          total,
          mercadoPago: mpResult ? { preference_id: mpResult.id } : {},
          $unset: { planFuturo: 1 },
        };

        await suscripcionModel.findOneAndUpdate(
          { usuario: idUsuario },
          dataSuscripcion,
          { upsert: true, new: true, strict: false },
        );

        await pagoModel.create({
          usuario: idUsuario,
          descripcion: `Suscripción: ${plan.nombre} (Pendiente)`,
          monto: total,
          metodoPago,
          estado: "pendiente",
          idMercadoPago: mpResult ? mpResult.id : undefined,
        });
      }
    }

    return { statusCode: 200, json: { init_point: mpResult?.init_point } };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error", error: error.message },
    };
  }
};

export const webhookServicio = async (body) => {
  try {
    if (body.type === "payment") {
      const payment = new Payment(client);
      const res = await payment.get({ id: body.data.id });

      if (res.status === "approved") {
        const suscripcion = await suscripcionModel
          .findOne({ usuario: res.external_reference })
          .lean();

        if (suscripcion) {
          if (suscripcion.estado === "pendiente") {
            const dias = suscripcion.duracionDias || 30;
            const fechaVencimiento = new Date();
            fechaVencimiento.setDate(fechaVencimiento.getDate() + dias);

            await suscripcionModel.findByIdAndUpdate(
              suscripcion._id,
              {
                estado: "activa",
                fechaInicio: new Date(),
                fechaVencimiento,
                "mercadoPago.id_pago": res.id.toString(),
              },
              { new: true },
            );

            await pagoModel.findOneAndUpdate(
              {
                usuario: res.external_reference,
                estado: "pendiente",
                metodoPago: "mercado-pago",
              },
              {
                estado: "aprobado",
                descripcion: `Suscripción MP: ${suscripcion.nombrePlan}`,
                idMercadoPago: res.id.toString(),
              },
              { sort: { createdAt: -1 } },
            );
          } else if (
            suscripcion.planFuturo &&
            suscripcion.planFuturo.estado === "pendiente"
          ) {
            await suscripcionModel.findByIdAndUpdate(
              suscripcion._id,
              {
                $set: {
                  "planFuturo.estado": "pagado",
                  "planFuturo.mercadoPago.id_pago": res.id.toString(),
                },
              },
              { new: true, strict: false },
            );

            await pagoModel.findOneAndUpdate(
              {
                usuario: res.external_reference,
                estado: "pendiente",
                metodoPago: "mercado-pago",
              },
              {
                estado: "aprobado",
                descripcion: `Plan Futuro MP: ${suscripcion.planFuturo.nombrePlan}`,
                idMercadoPago: res.id.toString(),
              },
              { sort: { createdAt: -1 } },
            );
          }
        }

        const reserva = await reservaModel
          .findOne({ usuario: res.external_reference, estado: "pendiente" })
          .sort({ createdAt: -1 });

        if (reserva) {
          await reservaModel.findByIdAndUpdate(
            reserva._id,
            {
              estado: "activa",
              "mercadoPago.id_pago": res.id.toString(),
            },
            { new: true },
          );

          await pagoModel.findOneAndUpdate(
            {
              usuario: res.external_reference,
              estado: "pendiente",
              metodoPago: "mercado-pago",
            },
            {
              estado: "aprobado",
              descripcion: `Reserva Clase MP`,
              monto: res.transaction_amount,
              idMercadoPago: res.id.toString(),
            },
            { sort: { createdAt: -1 } },
          );
        }
      }
    }
    return { statusCode: 200 };
  } catch (error) {
    return { statusCode: 500 };
  }
};
