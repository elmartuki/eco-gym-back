import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import routes from "./src/routes/indexRoutes.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message:
    "Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos.",
  standardHeaders: true,
  legacyHeaders: false,
});

const corsOptions = {
  origin: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(
  helmet({
    contentSecurityPolicy: false,
  }),
);

app.use(cors(corsOptions));
app.use(express.json({ limit: "50kb" }));

app.use((req, res, next) => {
  mongoSanitize.sanitize(req.body);
  mongoSanitize.sanitize(req.params);
  mongoSanitize.sanitize(req.query);
  next();
});

app.use("/api", limiter);
app.use("/api", routes);

app.listen(3000, () => {
  console.log("Aguante la tobilleraaa");
});

export default app;
