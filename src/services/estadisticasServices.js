import { pedidoModel } from "../models/pedidoModel.js";
import { usuarioModel } from "../models/usuariosModel.js";

export const obtenerEstadisticasService = async (mes, anio) => {
  try {
    const startDate = new Date(anio, mes - 1, 1);
    const endDate = new Date(anio, mes, 0, 23, 59, 59, 999);

    const usuariosTotales = await usuarioModel.countDocuments();

    const pedidosMes = await pedidoModel.find({
      createdAt: { $gte: startDate, $lte: endDate },
      estado: { $nin: ["pendiente", "cancelado"] },
    });

    const totalPedidos = pedidosMes.length;
    const ingresosTotales = pedidosMes.reduce(
      (acc, p) => acc + p.costos.total,
      0,
    );

    const ingresosPorSemana = [0, 0, 0, 0];
    const detallesPorSemana = [
      {
        pedidos: 0,
        ingresos: 0,
        milanesas: 0,
        empanadas: 0,
        otros: 0,
        totalItems: 0,
      },
      {
        pedidos: 0,
        ingresos: 0,
        milanesas: 0,
        empanadas: 0,
        otros: 0,
        totalItems: 0,
      },
      {
        pedidos: 0,
        ingresos: 0,
        milanesas: 0,
        empanadas: 0,
        otros: 0,
        totalItems: 0,
      },
      {
        pedidos: 0,
        ingresos: 0,
        milanesas: 0,
        empanadas: 0,
        otros: 0,
        totalItems: 0,
      },
    ];

    let milanesas = 0;
    let empanadas = 0;
    let otros = 0;
    let totalItems = 0;

    pedidosMes.forEach((p) => {
      const date = new Date(p.createdAt);
      const day = date.getDate();
      let week = Math.floor((day - 1) / 7);
      if (week > 3) week = 3;

      ingresosPorSemana[week] += p.costos.total;
      detallesPorSemana[week].pedidos += 1;
      detallesPorSemana[week].ingresos += p.costos.total;

      p.productos.forEach((item) => {
        const nombre = item.nombre.toLowerCase();
        const qty = item.cantidad;

        totalItems += qty;
        detallesPorSemana[week].totalItems += qty;

        if (nombre.includes("milanesa")) {
          milanesas += qty;
          detallesPorSemana[week].milanesas += qty;
        } else if (nombre.includes("empanada")) {
          empanadas += qty;
          detallesPorSemana[week].empanadas += qty;
        } else {
          otros += qty;
          detallesPorSemana[week].otros += qty;
        }
      });
    });

    const formatearPorcentajes = (m, e, o, t) => ({
      milanesas: t ? Math.round((m / t) * 100) : 0,
      empanadas: t ? Math.round((e / t) * 100) : 0,
      otros: t ? Math.round((o / t) * 100) : 0,
    });

    const productosVendidos = formatearPorcentajes(
      milanesas,
      empanadas,
      otros,
      totalItems,
    );

    const detallesFormateados = detallesPorSemana.map((w) => ({
      pedidos: w.pedidos,
      ingresos: w.ingresos,
      productosVendidos: formatearPorcentajes(
        w.milanesas,
        w.empanadas,
        w.otros,
        w.totalItems,
      ),
    }));

    return {
      statusCode: 200,
      json: {
        usuariosTotales,
        pedidosDelMes: totalPedidos,
        ingresosTotales,
        ingresosPorSemana,
        productosVendidos,
        detallesPorSemana: detallesFormateados,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error al obtener estadísticas", error: error.message },
    };
  }
};
