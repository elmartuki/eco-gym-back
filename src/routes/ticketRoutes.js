import { Router } from "express";
import { enviarTicket } from "../controllers/ticketController.js";

const router = Router();

router.post("/", enviarTicket);

export default router;
