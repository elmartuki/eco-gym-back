import { pedidoModel } from "../models/pedidoModel.js";
import mongoose from "mongoose";

export const obtenerPedidoService = async (parametroBusqueda, idUsuario) => {
  try {
    const esObjectId = mongoose.Types.ObjectId.isValid(parametroBusqueda);

    const query = {
      usuario: new mongoose.Types.ObjectId(idUsuario),
      ...(esObjectId
        ? { _id: new mongoose.Types.ObjectId(parametroBusqueda) }
        : { numeroPedido: parametroBusqueda }),
    };

    const pedido = await pedidoModel.findOne(query);

    if (!pedido) {
      return {
        statusCode: 404,
        json: { message: "Pedido no encontrado." },
      };
    }

    if (pedido.usuario.toString() !== idUsuario.toString()) {
      return {
        statusCode: 403,
        json: { message: "No tienes permisos para ver este pedido." },
      };
    }

    return {
      statusCode: 200,
      json: pedido,
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error en DB al obtener pedido", error: error.message },
    };
  }
};
export const obtenerMisPedidosService = async (
  idUsuario,
  page,
  limit,
  estado,
  res,
) => {
  try {
    const query = { usuario: new mongoose.Types.ObjectId(idUsuario) };

    if (estado !== "todos") {
      query.estado = estado;
    }

    const skip = (page - 1) * limit;

    const [pedidos, totalPedidos] = await Promise.all([
      pedidoModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      pedidoModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalPedidos / limit);

    return res.status(200).json({
      pedidos,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error interno del servidor.",
      error: error.message,
    });
  }
};

export const obtenerPedidosAdminService = async (query) => {
  try {
    const { page = 1, limit = 6, estado, search, cadeteId, rol } = query;
    const skip = (Number(page) - 1) * Number(limit);

    let filtro = {};

    if (estado) {
      filtro.estado = { $regex: new RegExp(`^${estado}$`, "i") };
    }

    if (search) {
      filtro.$or = [
        { numeroPedido: { $regex: search, $options: "i" } },
        { "datosContacto.nombreCompleto": { $regex: search, $options: "i" } },
      ];
    }

    if (rol === "cadete") {
      if (
        estado &&
        !["preparando", "asignando cadete"].includes(estado.toLowerCase())
      ) {
        filtro.cadete = cadeteId;
      }
    }

    const pedidos = await pedidoModel
      .find(filtro)
      .populate("cadete", "nombreCompleto telefono foto_de_perfil vehiculo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const totalDocumentos = await pedidoModel.countDocuments(filtro);
    const totalPages = Math.ceil(totalDocumentos / Number(limit));

    let filtroParaConteos = { ...filtro };
    delete filtroParaConteos.estado;

    const conteosAgrupados = await pedidoModel.aggregate([
      { $match: filtroParaConteos },
      { $group: { _id: "$estado", count: { $sum: 1 } } },
    ]);

    const counts = conteosAgrupados.reduce((acc, curr) => {
      acc[curr._id.toLowerCase()] = curr.count;
      return acc;
    }, {});

    return {
      statusCode: 200,
      json: {
        pedidos,
        totalPages,
        total: totalDocumentos,
        counts,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor", error: error.message },
    };
  }
};

export const obtenerPedidoAdminPorIdService = async (id) => {
  try {
    const pedido = await pedidoModel
      .findOne({ numeroPedido: id })
      .populate("productos.producto")
      .populate("cadete", "nombreCompleto telefono foto_de_perfil vehiculo")
      .lean();

    if (!pedido) {
      return { statusCode: 404, json: { message: "Pedido no encontrado" } };
    }

    return {
      statusCode: 200,
      json: pedido,
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor", error: error.message },
    };
  }
};

export const actualizarEstadoPedidoAdminService = async (
  id,
  nuevoEstado,
  codigoSeguridad,
  rol,
  idUsuario,
) => {
  try {
    const estadoNormalizado = nuevoEstado.toLowerCase();

    const estadosValidos = [
      "pendiente",
      "pagado",
      "preparando",
      "asignando cadete",
      "listo para retirar",
      "en camino",
      "entregado",
      "cancelado",
    ];

    if (!estadosValidos.includes(estadoNormalizado)) {
      return {
        statusCode: 400,
        json: { message: "Estado no válido" },
      };
    }

    const pedidoExistente = await pedidoModel.findOne({ numeroPedido: id });

    if (!pedidoExistente) {
      return { statusCode: 404, json: { message: "Pedido no encontrado" } };
    }

    if (rol === "cadete") {
      const isAsignadoAEnCamino =
        pedidoExistente.estado === "asignando cadete" &&
        estadoNormalizado === "en camino";

      const isEnCaminoAEntregado =
        pedidoExistente.estado === "en camino" &&
        estadoNormalizado === "entregado";

      if (!isAsignadoAEnCamino && !isEnCaminoAEntregado) {
        return {
          statusCode: 403,
          json: {
            message: "No tienes permisos para realizar este cambio de estado.",
          },
        };
      }

      if (isAsignadoAEnCamino) {
        const cadeteInfo = await usuarioModel.findById(idUsuario);
        if (!cadeteInfo || cadeteInfo.estado !== "activo") {
          return {
            statusCode: 403,
            json: { message: "No eres un cadete activo." },
          };
        }

        const todosMisPedidos = await pedidoModel.find({ cadete: idUsuario });
        const pedidosEnCamino = todosMisPedidos.filter(
          (p) => p.estado === "en camino",
        );

        if (pedidosEnCamino.length >= 3) {
          return {
            statusCode: 403,
            json: { message: "Límite de 3 pedidos en camino alcanzado." },
          };
        }

        if (pedidosEnCamino.length > 0) {
          const tiempoInicioViaje = Math.min(
            ...pedidosEnCamino.map((p) => p.updatedAt.getTime()),
          );

          const tieneEntregasEnEsteViaje = todosMisPedidos.some(
            (p) =>
              p.estado === "entregado" &&
              p.updatedAt.getTime() > tiempoInicioViaje,
          );

          if (tieneEntregasEnEsteViaje) {
            return {
              statusCode: 403,
              json: {
                message:
                  "Ya has entregado pedidos de tu lote actual. Debes finalizar las entregas restantes antes de asignar nuevos.",
              },
            };
          }
        }

        pedidoExistente.cadete = idUsuario;
      }

      if (isEnCaminoAEntregado) {
        if (pedidoExistente.cadete?.toString() !== idUsuario.toString()) {
          return {
            statusCode: 403,
            json: { message: "No puedes entregar un pedido que no tomaste." },
          };
        }
      }
    }

    if (estadoNormalizado === "entregado") {
      if (
        !codigoSeguridad ||
        pedidoExistente.codigoSeguridad !== codigoSeguridad
      ) {
        return {
          statusCode: 400,
          json: { message: "Código de seguridad incorrecto" },
        };
      }
    }

    pedidoExistente.estado = estadoNormalizado;
    const pedidoActualizado = await pedidoExistente.save();

    const pedidoPopulado = await pedidoModel
      .findById(pedidoActualizado._id)
      .populate("cadete", "nombreCompleto telefono foto_de_perfil vehiculo")
      .lean();

    return {
      statusCode: 200,
      json: {
        message: "Estado actualizado correctamente",
        pedido: pedidoPopulado,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor", error: error.message },
    };
  }
};
