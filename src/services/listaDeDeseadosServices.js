export const ejemploServicio = async () => {
  try {
    return {
      json: {
        message: "Texto ejemplo",
        datos: usuarioDB,
      },
      statusCode: 200,
    };
  } catch (error) {
    return {
      json: { message: "Texto ejemplo" },
      statusCode: 500,
    };
  }
};