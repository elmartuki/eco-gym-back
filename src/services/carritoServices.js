import { carritoModel } from "../models/carritoModel.js";
import { productoModel } from "../models/productoModel.js";
import { usuarioModel } from "../models/usuariosModel.js";

const COORDS_SUCURSAL = { lat: -26.81887, lng: -65.28951 };
const COORDS_POR_DEFECTO = { lat: -26.8167, lng: -65.3167 };

const calcularDistanciaKM = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  try {
    const R = 6371;
    const dLat = (Number(lat2) - Number(lat1)) * (Math.PI / 180);
    const dLon = (Number(lon2) - Number(lon1)) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(Number(lat1) * (Math.PI / 180)) *
        Math.cos(Number(lat2) * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  } catch (e) {
    return 0;
  }
};

const obtenerPrecioEnvio = (distancia) => {
  const d = Number(distancia) || 0;
  if (d <= 0) return 0;
  if (d < 2) return 2000;
  if (d < 3) return 3000;
  if (d < 4) return 3500;
  return 4000;
};

export const obtenerCarritoService = async (idUsuario) => {
  try {
    let carrito = await carritoModel
      .findOne({ usuario: idUsuario })
      .populate("productos.producto");

    if (!carrito) {
      carrito = await carritoModel.create({
        usuario: idUsuario,
        productos: [],
      });
    }

    const productosValidos = (carrito.productos || []).filter(
      (item) => item && item.producto != null,
    );

    if (productosValidos.length !== (carrito.productos || []).length) {
      carrito.productos = productosValidos;
      await carrito.save();
    }

    const usuario = await usuarioModel.findById(idUsuario).lean();

    let latDestino = COORDS_POR_DEFECTO.lat;
    let lngDestino = COORDS_POR_DEFECTO.lng;

    if (usuario?.direcciones && usuario.direcciones.length > 0) {
      const dir = usuario.direcciones[0];
      if (dir.lat && dir.lng) {
        latDestino = dir.lat;
        lngDestino = dir.lng;
      }
    }

    const distancia = calcularDistanciaKM(
      COORDS_SUCURSAL.lat,
      COORDS_SUCURSAL.lng,
      latDestino,
      lngDestino,
    );

    const costoEnvio = obtenerPrecioEnvio(distancia);

    return {
      statusCode: 200,
      json: {
        carrito: carrito.toObject(),
        costoEnvio: Number(costoEnvio),
        distancia: Number(distancia).toFixed(2),
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno", error: error.message },
    };
  }
};

export const agregarProductoCarritoService = async (idUsuario, idProducto) => {
  try {
    const producto = await productoModel.findById(idProducto);
    if (!producto || !producto.activo) {
      return { statusCode: 400, json: { message: "Producto no disponible" } };
    }

    let carrito = await carritoModel.findOne({ usuario: idUsuario });
    if (!carrito) {
      carrito = new carritoModel({ usuario: idUsuario, productos: [] });
    }

    const productoIndex = carrito.productos.findIndex(
      (p) => p.producto && p.producto.toString() === idProducto.toString(),
    );

    if (productoIndex > -1) {
      const nuevaCantidad = carrito.productos[productoIndex].cantidad + 1;
      if (nuevaCantidad > 10)
        return { statusCode: 400, json: { message: "Límite 10 unidades" } };
      if (nuevaCantidad > (producto.stock || 0))
        return { statusCode: 400, json: { message: "Stock insuficiente" } };
      carrito.productos[productoIndex].cantidad = nuevaCantidad;
    } else {
      if ((producto.stock || 0) < 1)
        return { statusCode: 400, json: { message: "Sin stock" } };
      carrito.productos.push({ producto: idProducto, cantidad: 1 });
    }

    await carrito.save();
    return obtenerCarritoService(idUsuario);
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error al agregar", error: error.message },
    };
  }
};

export const eliminarProductoCarritoService = async (idUsuario, idProducto) => {
  try {
    let carrito = await carritoModel.findOne({ usuario: idUsuario });
    if (!carrito)
      return { statusCode: 404, json: { message: "Carrito no encontrado" } };

    const productoIndex = carrito.productos.findIndex(
      (p) => p.producto && p.producto.toString() === idProducto.toString(),
    );

    if (productoIndex > -1) {
      if (carrito.productos[productoIndex].cantidad > 1) {
        carrito.productos[productoIndex].cantidad -= 1;
      } else {
        carrito.productos.splice(productoIndex, 1);
      }
      await carrito.save();
    }
    return obtenerCarritoService(idUsuario);
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error al eliminar", error: error.message },
    };
  }
};
