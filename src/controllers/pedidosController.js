import { connectDB } from "../config/configDB.js";
import {
  actualizarEstadoPedidoAdminService,
  obtenerPedidoAdminPorIdService,
  obtenerPedidosAdminService,
  obtenerMisPedidosService,
  obtenerPedidoService,
} from "../services/pedidosServices.js";

export const obtenerPedidoController = async (req, res) => {
  try {
    await connectDB();
    const { numeroPedido, slug, id } = req.params;
    const parametroBusqueda = (numeroPedido || slug || id)?.trim();
    const idUsuario = req.idUsuario;

    if (
      !parametroBusqueda ||
      parametroBusqueda.length === 0 ||
      parametroBusqueda.length > 50
    ) {
      return res
        .status(400)
        .json({ message: "Parámetro de búsqueda inválido." });
    }

    const { statusCode, json } = await obtenerPedidoService(
      parametroBusqueda,
      idUsuario,
    );

    return res.status(statusCode).json(json);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error interno del servidor.", error: error.message });
  }
};

export const obtenerMisPedidosController = async (req, res) => {
  try {
    await connectDB();
    const idUsuario = req.idUsuario;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const estado = req.query.estado || "todos";

    await obtenerMisPedidosService(idUsuario, page, limit, estado, res);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error interno del servidor.", error: error.message });
  }
};

export const obtenerPedidosAdminController = async (req, res) => {
  try {
    await connectDB();
    const queryParams = {
      page: req.query.page,
      limit: req.query.limit,
      estado: req.query.estado,
      search: req.query.search,
      cadeteId: req.user?.id || req.usuario?.id,
      rol: req.user?.rol || req.usuario?.rol,
    };

    const { statusCode, json } = await obtenerPedidosAdminService(queryParams);
    return res.status(statusCode).json(json);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error interno del servidor.", error: error.message });
  }
};

export const obtenerPedidoAdminPorIdController = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;

    if (!id || id.trim().length < 3) {
      return res.status(400).json({ message: "ID de pedido inválido." });
    }

    const { statusCode, json } = await obtenerPedidoAdminPorIdService(id);
    return res.status(statusCode).json(json);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error interno del servidor.", error: error.message });
  }
};

export const actualizarEstadoPedidoAdminController = async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { estado, codigoSeguridad } = req.body;
    const rol = req.rol;
    const idUsuario = req.idUsuario;

    if (!id || id.trim().length < 3) {
      return res.status(400).json({ message: "ID de pedido inválido." });
    }

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

    if (!estado || !estadosValidos.includes(estado.toLowerCase().trim())) {
      return res
        .status(400)
        .json({ message: "Estado de pedido no permitido." });
    }

    if (
      codigoSeguridad &&
      (typeof codigoSeguridad !== "string" || codigoSeguridad.length > 10)
    ) {
      return res.status(400).json({ message: "Código de seguridad inválido." });
    }

    const { statusCode, json } = await actualizarEstadoPedidoAdminService(
      id,
      estado.toLowerCase().trim(),
      codigoSeguridad ? codigoSeguridad.trim() : null,
      rol,
      idUsuario,
    );

    return res.status(statusCode).json(json);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error interno del servidor.", error: error.message });
  }
};
