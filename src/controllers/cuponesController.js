import { connectDB } from "../config/configDB.js";

export const ejemploController = async (req, res) => {
  await connectDB();
  const { json, statusCode } = await ejemploService();
  res.status(statusCode).json(json);
};