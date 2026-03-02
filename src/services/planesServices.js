import { planesModel } from "../models/planesModel.js";

export const obtenerPlanesService = async () => {
  try {
    const planes = await planesModel.find();
    return { json: planes, statusCode: 200 };
  } catch (error) {
    return { json: { message: error.message }, statusCode: 500 };
  }
};

export const crearPlanService = async (datos) => {
  try {
    const nuevoPlan = new planesModel(datos);
    await nuevoPlan.save();
    return { json: nuevoPlan, statusCode: 201 };
  } catch (error) {
    return { json: { message: error.message }, statusCode: 400 };
  }
};

export const actualizarPlanService = async (id, datos) => {
  try {
    const plan = await planesModel.findByIdAndUpdate(id, datos, { new: true });
    if (!plan)
      return { json: { message: "Plan no encontrado" }, statusCode: 404 };
    return { json: plan, statusCode: 200 };
  } catch (error) {
    return { json: { message: error.message }, statusCode: 400 };
  }
};

export const eliminarPlanService = async (id) => {
  try {
    const plan = await planesModel.findByIdAndDelete(id);
    if (!plan)
      return { json: { message: "Plan no encontrado" }, statusCode: 404 };
    return {
      json: { message: "Plan eliminado correctamente" },
      statusCode: 200,
    };
  } catch (error) {
    return { json: { message: error.message }, statusCode: 500 };
  }
};
