import { connectDB } from "../config/configDB.js";
import {
  createPreferenceServicio,
  webhookServicio,
} from "../services/paymentServices.js";

export const createPreferenceController = async (req, res) => {
  try {
    await connectDB();
    const { statusCode, json } = await createPreferenceServicio(
      req.idUsuario,
      req.body,
    );
    res.status(statusCode).json(json);
  } catch (error) {
    res.status(500).json({ message: "Error interno", error: error.message });
  }
};

export const webhookController = (req, res) => {
  res.sendStatus(200);
  (async () => {
    try {
      await connectDB();
      await webhookServicio(req.body);
    } catch (error) {
      console.error("Error en webhook:", error.message);
    }
  })();
};
