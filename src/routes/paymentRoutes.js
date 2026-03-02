import { Router } from "express";
import { validarToken } from "../middlewares/auth.middlewares.js";
import {
  createPreferenceController,
  webhookController,
} from "../controllers/paymentController.js";
import crypto from "crypto";

const router = Router();

router.post("/create_preference", validarToken, createPreferenceController);

const verificarFirmaMercadoPago = (req, res, next) => {
  try {
    const resourceId = req.body?.data?.id || req.body?.id || req.query?.id;

    if (!resourceId || resourceId === "123456") {
      console.log("ℹ️ [WEBHOOK] Notificación de prueba o sin ID.");
      return res.sendStatus(200);
    }

    const xSignature = req.headers["x-signature"];
    const xRequestId = req.headers["x-request-id"];

    if (!xSignature || !xRequestId) {
      console.log("⚠️ [WEBHOOK] Sin firma (IPN). Pasando al servicio...");
      return next();
    }

    const parts = xSignature.split(",");
    let ts, hash;
    parts.forEach((p) => {
      const [k, v] = p.split("=");
      if (k.trim() === "ts") ts = v.trim();
      if (k.trim() === "v1") hash = v.trim();
    });

    const manifest = `id:${resourceId};request-id:${xRequestId};ts:${ts};`;

    const hmacTest = crypto.createHmac("sha256", process.env.MP_WEBHOOK_SECRET);
    hmacTest.update(manifest);
    const shaTest = hmacTest.digest("hex");

    const hmacProd = crypto.createHmac(
      "sha256",
      process.env.MP_WEBHOOK_SECRET_PROD,
    );
    hmacProd.update(manifest);
    const shaProd = hmacProd.digest("hex");

    if (shaTest === hash || shaProd === hash) {
      console.log(
        `✅ [WEBHOOK] Firma Válida (${shaProd === hash ? "PROD" : "TEST"})`,
      );
      return next();
    }

    console.error("❌ [WEBHOOK] FIRMA INVÁLIDA. No se procesará el pago.");
    return res.sendStatus(200);
  } catch (error) {
    console.error("💥 Error en middleware:", error.message);
    return res.sendStatus(200);
  }
};

router.post("/webhook", verificarFirmaMercadoPago, webhookController);

export default router;
