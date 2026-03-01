import { connectDB } from "../config/configDB.js";
import { enviarTicketService } from "../services/ticketServices.js";


export const enviarTicket = async (req, res) => {
  await connectDB;
  const { nombre, email, asunto, mensaje } = req.body;
  const { json, statusCode } = await enviarTicketService({
    nombre,
    email,
    asunto,
    mensaje,
  });
  res.status(statusCode).json(json);
};
