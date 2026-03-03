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
        body { margin: 0; padding: 0; font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #000000; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #121212; border-radius: 12px; border: 1px solid #222222; overflow: hidden; }
        .header { background-color: #1a1a1a; padding: 40px 30px; text-align: center; border-bottom: 2px solid #c1ff00; }
        .logo { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 2px; margin: 0; }
        .logo span { color: #c1ff00; }
        .title { margin: 20px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 40px 30px; text-align: center; }
        .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 20px; text-align: left; text-transform: uppercase; }
        .message { font-size: 15px; color: #cccccc; line-height: 1.6; margin-bottom: 35px; text-align: left; }
        .code-container { background-color: #000000; border: 1px solid #333333; border-radius: 8px; padding: 30px; margin: 0 auto 35px; max-width: 300px; position: relative; }
        .code-container::before { content: ''; position: absolute; top: -1px; left: 50%; transform: translateX(-50%); width: 40px; height: 2px; background-color: #c1ff00; }
        .code { font-size: 48px; font-weight: 900; color: #c1ff00; letter-spacing: 12px; margin: 0; display: flex; justify-content: center; align-items: center; text-shadow: 0 0 20px rgba(193, 255, 0, 0.2); }
        .footer { padding: 30px; background-color: #0a0a0a; border-top: 1px solid #222222; text-align: center; }
        .note-box { background-color: rgba(255, 59, 59, 0.1); border-left: 3px solid #ff3b3b; padding: 15px; margin-bottom: 20px; text-align: left; }
        .note-text { color: #ff3b3b; font-size: 13px; font-weight: 600; margin: 0; }
        .footer-text { font-size: 12px; color: #666666; margin: 0 0 15px; line-height: 1.5; }
        .brand { font-size: 12px; font-weight: 800; color: #444444; text-transform: uppercase; letter-spacing: 2px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h2 class="logo">ECO<span>GYM</span></h2>
            <h1 class="title">${titulo}</h1>
          </div>
          <div class="content">
            ${nombre ? `<p class="greeting">HOLA ${nombre},</p>` : ""}
            <p class="message">${mensaje}</p>
            <div class="code-container">
              <h2 class="code">${codigo}</h2>
            </div>
            ${
              nota
                ? `
            <div class="note-box">
              <p class="note-text">${nota}</p>
            </div>`
                : ""
            }
          </div>
          <div class="footer">
            <p class="footer-text">Este código expirará en 15 minutos.<br>Si no solicitaste este código, ignora este mensaje.</p>
            <p class="brand">ECOGYM FITNESS CENTER</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const enviarCodigoRegistroService = async (
  email,
  nombreUsuario,
  userId = null,
) => {
  try {
    const existe = await usuarioModel.findOne({ email });

    if (existe) {
      if (!(userId && existe._id.toString() === userId.toString())) {
        return {
          statusCode: 400,
          json: { message: "El correo electrónico ya está registrado" },
        };
      }
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
      from: `"EcoGym" <stremusoporte@gmail.com>`,
      to: email,
      subject: `⚡ Código de Verificación - EcoGym`,
      html: generarTemplateCorreo(
        "VERIFICACIÓN DE CUENTA",
        nombreUsuario,
        "Estás a un paso de comenzar tu entrenamiento. Ingresa el siguiente código de seguridad en la aplicación para activar tu cuenta:",
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
      from: `"EcoGym" <stremusoporte@gmail.com>`,
      to: email,
      subject: `🔑 Recuperación de Contraseña - EcoGym`,
      html: generarTemplateCorreo(
        "RECUPERAR CONTRASEÑA",
        usuario.nombreCompleto,
        "Hemos recibido una solicitud para restablecer el acceso a tu cuenta. Ingresa este código de seguridad para crear una nueva contraseña:",
        codigo,
        "IMPORTANTE: No compartas este código con nadie por motivos de seguridad.",
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
    const usuarioActualizado = await usuarioModel.findByIdAndUpdate(
      id,
      { $set: datos },
      { new: true, runValidators: true },
    );

    if (!usuarioActualizado) {
      return { statusCode: 404, json: { message: "Usuario no encontrado." } };
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
