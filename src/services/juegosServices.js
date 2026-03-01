import mongoose from "mongoose";
import { juegosModel } from "../models/juegosModel.js";
import { usuarioModel } from "../models/usuariosModel.js";

export const agregarJuegoServices = async (idUsuario, nuevoJuego) => {
  const studio = await usuarioModel.findById(idUsuario);

  if (!studio) {
    return {
      json: { message: "No se encontró el estudio" },
      statusCode: 404,
    };
  }

  try {
    const juegoDB = new juegosModel({
      ...nuevoJuego,
      studioId: idUsuario,
      desarrolladora: studio.nombreUsuario,
    });

    await juegoDB.save();

    await usuarioModel.findByIdAndUpdate(
      idUsuario,
      { $push: { juegosSubidos: juegoDB._id } },
      { returnDocument: "after" },
    );

    return {
      json: {
        message: "Juego creado y vinculado al estudio correctamente",
        datos: juegoDB,
      },
      statusCode: 201,
    };
  } catch (error) {
    console.error("Error al agregar juego:", error);
    return {
      json: { message: "Error interno al intentar guardar el juego" },
      statusCode: 500,
    };
  }
};

export const obtenerJuegosServices = async () => {
  try {
    const juegos = await juegosModel.find({ mostrar: true });

    return {
      json: {
        message: "Juegos obtenidos correctamente",
        datos: juegos,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error al obtener juegos:", error);
    return {
      json: { message: "Error interno del servidor" },
      statusCode: 500,
    };
  }
};

export const obtenerUnJuegoPorStudioServices = async (id) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { slug: id };

    const juego = await juegosModel.findOne(query);

    if (!juego) {
      return {
        json: { message: "No se encontro ningun juego." },
        statusCode: 404,
      };
    }

    return {
      json: {
        message: "Juegos del estudio obtenidos con éxito",
        datos: juego,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error al obtener juegos del estudio:", error);
    return {
      json: { message: "Error interno del servidor" },
      statusCode: 500,
    };
  }
};

export const obtenerJuegosPorStudioServices = async (idUsuario) => {
  try {
    const juegos = await juegosModel.find({ studioId: idUsuario });

    if (!juegos || juegos.length === 0) {
      return {
        json: { message: "Este estudio aún no tiene juegos publicados" },
        statusCode: 404,
      };
    }

    return {
      json: {
        message: "Juegos del estudio obtenidos con éxito",
        datos: juegos,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error al obtener juegos del estudio:", error);
    return {
      json: { message: "Error interno del servidor" },
      statusCode: 500,
    };
  }
};

export const editarUnJuegoServices = async (id, datos) => {
  try {
    const juegoActualizado = await juegosModel.findByIdAndUpdate(id, datos, {
      returnDocument: "after",
    });

    if (!juegoActualizado) {
      return {
        json: { message: "El juego no existe" },
        statusCode: 404,
      };
    }

    return {
      json: {
        message: "Juego actualizado correctamente",
        datos: juegoActualizado,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error al editar juego:", error);
    return {
      json: { message: "Error interno del servidor: " + error.message },
      statusCode: 500,
    };
  }
};

export const eliminarUnJuegoServices = async (id) => {
  try {
    const juegoEliminado = await juegosModel.findByIdAndDelete(id);

    if (!juegoEliminado) {
      return {
        json: { message: "El juego no existe" },
        statusCode: 404,
      };
    }

    if (juegoEliminado.studioId) {
      await usuarioModel.findByIdAndUpdate(juegoEliminado.studioId, {
        $pull: { juegosSubidos: id },
      });
    }

    return {
      json: {
        message: "Juego eliminado y desvinculado del estudio correctamente",
        datos: juegoEliminado,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error al eliminar juego:", error);
    return {
      json: { message: "Error interno del servidor: " + error.message },
      statusCode: 500,
    };
  }
};

export const gestionarVisualizacionServices = async (id) => {
  try {
    const juego = await juegosModel.findById(id);

    if (!juego) {
      return {
        json: { message: "No se encontró el juego con ese ID" },
        statusCode: 404,
      };
    }

    juego.mostrar = !juego.mostrar;

    const juegoActualizado = await juego.save();

    return {
      json: {
        message: "Estado de visualización actualizado con éxito",
        datos: juegoActualizado,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error en el servidor:", error);
    return {
      json: { message: "Error interno del servidor: " + error.message },
      statusCode: 500,
    };
  }
};

export const gestionarFavoritosServices = async (idJuego, idUsuario) => {
  try {
    const juego = await juegosModel.findById(idJuego);

    if (!juego) {
      return {
        json: { message: "Juego no encontrado" },
        statusCode: 404,
      };
    }

    const yaTieneLike = juego.usuarios_likes.some(
      (likeId) => String(likeId) === String(idUsuario),
    );

    let juegoActualizado;
    let esFavoritoFinal;

    if (yaTieneLike) {
      await usuarioModel.findByIdAndUpdate(idUsuario, {
        $pull: { favoritos: idJuego },
      });

      juegoActualizado = await juegosModel.findByIdAndUpdate(
        idJuego,
        { $pull: { usuarios_likes: idUsuario } },
        { returnDocument: "after" },
      );

      esFavoritoFinal = false;
    } else {
      await usuarioModel.findByIdAndUpdate(idUsuario, {
        $addToSet: { favoritos: idJuego },
      });

      juegoActualizado = await juegosModel.findByIdAndUpdate(
        idJuego,
        { $addToSet: { usuarios_likes: idUsuario } },
        { returnDocument: "after" },
      );

      esFavoritoFinal = true;
    }

    return {
      json: {
        message: esFavoritoFinal
          ? "Agregado a favoritos"
          : "Eliminado de favoritos",
        esFavorito: esFavoritoFinal,
        cantidadFavoritos: juegoActualizado.usuarios_likes.length,
      },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error favoritos:", error);
    return {
      json: { message: "Error interno del servidor" },
      statusCode: 500,
    };
  }
};

export const verificarEstadoFavoritoService = async (idJuego, idUsuario) => {
  try {
    const juego = await juegosModel.findById(idJuego);

    if (!juego) {
      return { json: { esFavorito: false }, statusCode: 404 };
    }

    const esFavorito = juego.usuarios_likes.some(
      (likeId) => String(likeId) === String(idUsuario),
    );

    return {
      json: { esFavorito },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error verificando favorito:", error);

    return { json: { esFavorito: false }, statusCode: 500 };
  }
};
