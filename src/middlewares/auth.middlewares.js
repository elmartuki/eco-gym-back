import jwt from "jsonwebtoken";

export const validarToken = (req, res, next) => {
  try {
    const tokenCompleto = req.headers.authorization;

    if (!tokenCompleto || !tokenCompleto.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Acceso denegado. Debes iniciar sesión." });
    }

    const token = tokenCompleto.split(" ")[1];
    const usuarioInfo = jwt.verify(token, process.env.JWT_SECRET);

    req.idUsuario = usuarioInfo.id || usuarioInfo._id;
    req.rol = usuarioInfo.rol;

    if (!req.idUsuario) {
      return res
        .status(403)
        .json({ message: "Token válido pero sin ID de usuario." });
    }

    next();
  } catch (error) {
    console.error("Error en validación de token:", error.message);
    return res.status(401).json({ message: "Token inválido o expirado." });
  }
};

export const validarAdmin = (req, res, next) => {
  if (req.rol === "admin") {
    next();
  } else {
    return res.status(403).json({
      message: "Acceso denegado. Se requiere rol de Administrador.",
    });
  }
};

export const validarAdminOCadete = (req, res, next) => {
  if (req.rol === "admin" || req.rol === "cadete") {
    next();
  } else {
    return res.status(403).json({
      message: "Acceso denegado. Permisos insuficientes.",
    });
  }
};

export const validarPropietario = (req, res, next) => {
  const idRecurso = req.params.id || req.params.idUsuario;

  if (req.rol === "admin") return next();

  if (req.idUsuario.toString() !== idRecurso.toString()) {
    return res.status(403).json({
      message: "Acceso denegado. No puedes manipular datos ajenos.",
    });
  }
  next();
};
