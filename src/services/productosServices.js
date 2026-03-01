import { productoModel } from "../models/productoModel.js";

export const obtenerProductosService = async () => {
  try {
    const productos = await productoModel.find();
    return {
      statusCode: 200,
      json: { productos },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor al obtener productos" },
    };
  }
};

export const crearProductoService = async (datos) => {
  try {
    const { nombre, categoria, precio, stock } = datos;

    if (!nombre || !categoria || precio === undefined || stock === undefined) {
      return {
        statusCode: 400,
        json: { message: "Faltan campos obligatorios" },
      };
    }

    const nuevoProducto = new productoModel(datos);
    await nuevoProducto.save();

    return {
      statusCode: 201,
      json: {
        message: "Producto creado con éxito",
        producto: nuevoProducto,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor al crear producto" },
    };
  }
};

export const editarProductoService = async (id, datos) => {
  try {
    const productoActualizado = await productoModel.findByIdAndUpdate(
      id,
      { $set: datos },
      { new: true, runValidators: true },
    );

    if (!productoActualizado) {
      return {
        statusCode: 404,
        json: { message: "Producto no encontrado" },
      };
    }

    return {
      statusCode: 200,
      json: {
        message: "Producto actualizado con éxito",
        producto: productoActualizado,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor al editar producto" },
    };
  }
};

export const borrarProductoService = async (id) => {
  try {
    const productoEliminado = await productoModel.findByIdAndDelete(id);

    if (!productoEliminado) {
      return {
        statusCode: 404,
        json: { message: "Producto no encontrado" },
      };
    }

    return {
      statusCode: 200,
      json: { message: "Producto eliminado con éxito" },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor al eliminar producto" },
    };
  }
};
