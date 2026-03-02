import { connectDB } from "../config/configDB.js";
import {
  actualizarPlanService,
  crearPlanService,
  eliminarPlanService,
  obtenerPlanesService,
} from "../services/planesServices.js";

export const obtenerPlanesController = async (req, res) => {
  await connectDB();
  const { json, statusCode } = await obtenerPlanesService();
  res.status(statusCode).json(json);
};

export const crearPlanController = async (req, res) => {
  await connectDB();
  const { json, statusCode } = await crearPlanService(req.body);
  res.status(statusCode).json(json);
};

export const actualizarPlanController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { json, statusCode } = await actualizarPlanService(id, req.body);
  res.status(statusCode).json(json);
};

export const eliminarPlanController = async (req, res) => {
  await connectDB();
  const { id } = req.params;
  const { json, statusCode } = await eliminarPlanService(id);
  res.status(statusCode).json(json);
};
