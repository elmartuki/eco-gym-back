import { usuarioModel } from "../models/usuariosModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { carritoModel } from "../models/carritoModel.js";

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const codigosRegistro = new Map();

const generarTemplateCorreo = (titulo, nombre, mensaje, codigo, nota) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #f1f5f9; }
        .header { background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 32px 20px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 40px 32px; text-align: center; }
        .greeting { font-size: 18px; font-weight: 600; color: #1e293b; margin-top: 0; margin-bottom: 16px; text-align: left; }
        .message { font-size: 15px; color: #475569; line-height: 1.6; margin-bottom: 32px; text-align: left; }
        .code-container { background-color: #fff7ed; border: 2px dashed #fdba74; border-radius: 12px; padding: 24px; margin: 0 auto 32px; max-width: 300px; }
        .code { font-size: 42px; font-weight: 800; color: #ea580c; letter-spacing: 8px; margin: 0; display: flex; justify-content: center; align-items: center; }
        .footer { padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; }
        .note { font-size: 13px; color: #64748b; margin: 0 0 12px; line-height: 1.5; }
        .brand { font-size: 14px; font-weight: 700; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${titulo}</h1>
        </div>
        <div class="content">
          ${nombre ? `<p class="greeting">Hola ${nombre},</p>` : ""}
          <p class="message">${mensaje}</p>
          <div class="code-container">
            <h2 class="code">${codigo}</h2>
          </div>
          ${nota ? `<p class="note" style="color: #ef4444; font-weight: 500;">${nota}</p>` : ""}
        </div>
        <div class="footer">
          <p class="note">Este código expirará en 15 minutos. Si no solicitaste este código, puedes ignorar este correo de forma segura.</p>
          <p class="brand">QUÉ RICO POLLO</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const enviarCodigoRegistroService = async (email, nombreUsuario) => {
  try {
    const existe = await usuarioModel.findOne({ email });

    if (existe) {
      return {
        statusCode: 400,
        json: { message: "El correo electrónico ya está registrado" },
      };
    }

    const codigo = Math.floor(10000 + Math.random() * 90000).toString();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);

    codigosRegistro.set(email, { codigo, expiracion });

    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token || accessTokenResponse;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "stremusoporte@gmail.com",
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `"Qué Rico Pollo" <stremusoporte@gmail.com>`,
      to: email,
      subject: `🍗 Código de Verificación - Qué Rico Pollo`,
      html: generarTemplateCorreo(
        "Verifica tu cuenta",
        nombreUsuario,
        "¡Gracias por elegirnos! Para completar tu registro y empezar a disfrutar de nuestros productos, ingresa el siguiente código de seguridad en la aplicación:",
        codigo,
      ),
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      json: { message: "Te hemos enviado un código a tu correo." },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: error.message || "Error al enviar el correo." },
    };
  }
};

export const verificarCodigoService = async (email, codigo) => {
  try {
    const registro = codigosRegistro.get(email);

    if (!registro) {
      return {
        statusCode: 404,
        json: {
          message: "No se encontró un código para este correo o ya expiró.",
        },
      };
    }

    if (registro.codigo !== codigo) {
      return {
        statusCode: 400,
        json: { message: "El código ingresado es incorrecto." },
      };
    }

    if (new Date() > registro.expiracion) {
      codigosRegistro.delete(email);
      return {
        statusCode: 400,
        json: {
          message: "El código ha expirado. Por favor, solicita uno nuevo.",
        },
      };
    }

    return {
      statusCode: 200,
      json: { message: "Código verificado correctamente." },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor al verificar el código." },
    };
  }
};

export const solicitarRecuperacionPasswordService = async (email) => {
  try {
    const usuario = await usuarioModel.findOne({ email });

    if (!usuario) {
      return {
        statusCode: 404,
        json: { message: "El correo no está registrado en el sistema." },
      };
    }

    const codigo = Math.floor(10000 + Math.random() * 90000).toString();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);

    codigosRegistro.set(email, { codigo, expiracion });

    const accessTokenResponse = await oAuth2Client.getAccessToken();
    const accessToken = accessTokenResponse?.token || accessTokenResponse;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "stremusoporte@gmail.com",
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: `"Qué Rico Pollo" <stremusoporte@gmail.com>`,
      to: email,
      subject: `🔑 Recuperación de Contraseña - Qué Rico Pollo`,
      html: generarTemplateCorreo(
        "Recuperar Contraseña",
        usuario.nombreCompleto,
        "Hemos recibido una solicitud para cambiar la contraseña de tu cuenta. Ingresa este código de 5 dígitos para proceder con el cambio:",
        codigo,
        "Importante: No compartas este código con nadie.",
      ),
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      json: { message: "Te hemos enviado un código a tu correo." },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error al enviar el correo." },
    };
  }
};

export const restablecerPasswordService = async (
  email,
  codigo,
  nuevaPassword,
) => {
  try {
    const registro = codigosRegistro.get(email);

    if (!registro || registro.codigo !== codigo) {
      return {
        statusCode: 400,
        json: { message: "El código ingresado es incorrecto." },
      };
    }

    if (new Date() > registro.expiracion) {
      codigosRegistro.delete(email);
      return {
        statusCode: 400,
        json: { message: "El código ha expirado." },
      };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHasheada = await bcrypt.hash(nuevaPassword, salt);

    await usuarioModel.findOneAndUpdate(
      { email },
      { password: passwordHasheada },
    );
    codigosRegistro.delete(email);

    return {
      statusCode: 200,
      json: { message: "Contraseña actualizada exitosamente." },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor." },
    };
  }
};

export const registerServices = async (datos) => {
  try {
    const registro = codigosRegistro.get(datos.email);

    if (!registro || String(registro.codigo) !== String(datos.codigo)) {
      return {
        json: { message: "Código de verificación inválido o expirado." },
        statusCode: 400,
      };
    }

    const existe = await usuarioModel.findOne({
      $or: [{ email: datos.email }, { nombreCompleto: datos.nombreCompleto }],
    });

    if (existe) {
      return {
        json: { message: "El nombre o correo ya están registrados" },
        statusCode: 409,
      };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHasheada = await bcrypt.hash(datos.password, salt);

    const usuarioDB = new usuarioModel({
      nombreCompleto: datos.nombreCompleto,
      email: datos.email,
      password: passwordHasheada,
      telefono: datos.telefono,
      rol: datos.rol || "usuario",
    });

    const usuarioGuardado = await usuarioDB.save();

    await carritoModel.create({
      usuario: usuarioGuardado._id,
      productos: [],
    });

    codigosRegistro.delete(datos.email);

    const token = jwt.sign(
      {
        id: usuarioGuardado._id,
        rol: usuarioGuardado.rol,
        nombreCompleto: usuarioGuardado.nombreCompleto,
        email: usuarioGuardado.email,
        telefono: usuarioGuardado.telefono,
      },
      process.env.JWT_SECRET || "43003673",
      { expiresIn: "7d" },
    );

    return {
      json: {
        message: "Registrado con éxito",
        token,
        usuario: {
          id: usuarioGuardado._id,
          nombreCompleto: usuarioGuardado.nombreCompleto,
          email: usuarioGuardado.email,
          rol: usuarioGuardado.rol,
        },
      },
      statusCode: 201,
    };
  } catch (error) {
    return {
      json: { message: "Error interno del servidor", error: error.message },
      statusCode: 500,
    };
  }
};

export const loginServices = async (datos) => {
  try {
    const { email, password } = datos;

    if (!email || !password) {
      return {
        statusCode: 400,
        json: { message: "Todos los campos son obligatorios" },
      };
    }

    const usuario = await usuarioModel.findOne({ email }).select("+password");

    if (!usuario) {
      return {
        statusCode: 401,
        json: { message: "Credenciales inválidas" },
      };
    }

    if (usuario.baneado) {
      return {
        statusCode: 403,
        json: { message: "Tu cuenta fue baneada" },
      };
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return {
        statusCode: 401,
        json: { message: "Credenciales inválidas" },
      };
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        rol: usuario.rol,
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email,
        telefono: usuario.telefono,
        foto_de_perfil: usuario.foto_de_perfil,
        direcciones: usuario.direcciones,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return {
      statusCode: 200,
      json: {
        message: "Login exitoso",
        token,
        usuario: {
          id: usuario._id,
          nombreCompleto: usuario.nombreCompleto,
          email: usuario.email,
          rol: usuario.rol,
          foto_de_perfil: usuario.foto_de_perfil,
          telefono: usuario.telefono,
          direcciones: usuario.direcciones,
        },
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno del servidor" },
    };
  }
};

export const actualizarDireccionesService = async (id, direcciones) => {
  try {
    if (!Array.isArray(direcciones)) {
      return {
        statusCode: 400,
        json: { message: "El formato de las direcciones es inválido." },
      };
    }

    const usuarioActualizado = await usuarioModel.findByIdAndUpdate(
      id,
      { $set: { direcciones } },
      { new: true, runValidators: true },
    );

    if (!usuarioActualizado) {
      return {
        statusCode: 404,
        json: { message: "Usuario no encontrado." },
      };
    }

    const token = jwt.sign(
      {
        id: usuarioActualizado._id,
        rol: usuarioActualizado.rol,
        nombreCompleto: usuarioActualizado.nombreCompleto,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        foto_de_perfil: usuarioActualizado.foto_de_perfil,
        direcciones: usuarioActualizado.direcciones,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return {
      statusCode: 200,
      json: {
        message: "Direcciones actualizadas correctamente",
        token,
        direcciones: usuarioActualizado.direcciones,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: {
        message: "Error interno del servidor al actualizar direcciones.",
      },
    };
  }
};

export const googleAuthService = async (datos) => {
  try {
    const { email, nombreCompleto, foto_de_perfil } = datos;

    let usuario = await usuarioModel.findOne({ email });

    if (!usuario) {
      const passwordTemporal = await bcrypt.hash(
        Math.random().toString(36),
        10,
      );
      usuario = new usuarioModel({
        nombreCompleto,
        email,
        foto_de_perfil,
        rol: "usuario",
        password: passwordTemporal,
        telefono: "Sin especificar",
      });
      await usuario.save();

      await carritoModel.findOneAndUpdate(
        { usuario: usuario._id },
        { usuario: usuario._id, productos: [] },
        { upsert: true, new: true },
      );
    }

    const token = jwt.sign(
      {
        id: usuario._id,
        rol: usuario.rol,
        nombreCompleto: usuario.nombreCompleto,
        email: usuario.email,
        foto_de_perfil: usuario.foto_de_perfil,
        direcciones: usuario.direcciones || [],
      },
      process.env.JWT_SECRET || "43003673",
      { expiresIn: "7d" },
    );

    return {
      statusCode: 200,
      json: { message: "Ok", token, usuario },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error interno", error: error.message },
    };
  }
};

export const actualizarPerfilService = async (id, datos) => {
  try {
    const { nombreCompleto, telefono } = datos;

    const usuarioActualizado = await usuarioModel.findByIdAndUpdate(
      id,
      { $set: { nombreCompleto, telefono } },
      { new: true },
    );

    if (!usuarioActualizado) {
      return {
        statusCode: 404,
        json: { message: "Usuario no encontrado." },
      };
    }

    const token = jwt.sign(
      {
        id: usuarioActualizado._id,
        rol: usuarioActualizado.rol,
        nombreCompleto: usuarioActualizado.nombreCompleto,
        email: usuarioActualizado.email,
        telefono: usuarioActualizado.telefono,
        foto_de_perfil: usuarioActualizado.foto_de_perfil,
        direcciones: usuarioActualizado.direcciones,
      },
      process.env.JWT_SECRET || "43003673",
      { expiresIn: "7d" },
    );

    return {
      statusCode: 200,
      json: {
        message: "Perfil actualizado correctamente",
        token,
        usuario: usuarioActualizado,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error al actualizar perfil", error: error.message },
    };
  }
};

export const eliminarUsuarioService = async (id) => {
  try {
    const usuarioEliminado = await usuarioModel.findByIdAndDelete(id);

    if (!usuarioEliminado) {
      return {
        statusCode: 404,
        json: { message: "Usuario no encontrado" },
      };
    }

    await carritoModel.findOneAndDelete({ usuario: id });

    return {
      statusCode: 200,
      json: { message: "Cuenta eliminada permanentemente" },
    };
  } catch (error) {
    return {
      statusCode: 500,
      json: { message: "Error al eliminar la cuenta", error: error.message },
    };
  }
};
