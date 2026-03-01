import nodemailer from "nodemailer";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "https://developers.google.com/oauthplayground",
);

oAuth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

export const enviarTicketService = async ({
  nombre,
  email,
  asunto,
  mensaje,
}) => {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

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
      from: `Soporte Web <stremusoporte@gmail.com>`,
      to: "stremusoporte@gmail.com",
      replyTo: email,
      subject: `📢 Nuevo Ticket: ${asunto}`,
      html: `
        <div style="background-color: #09090b; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #121212; border: 1px solid #27272a; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
            
            <div style="padding: 30px; text-align: center; border-bottom: 1px solid #27272a;">
              <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">NUEVO TICKET</h2>
              <p style="margin: 5px 0 0 0; color: #84cc16; font-size: 14px; font-weight: 600; letter-spacing: 1px;">SOPORTE STREMU GAMES</p>
            </div>

            <div style="padding: 30px;">
              
              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Usuario</p>
                <p style="margin: 0; font-size: 16px; color: #f4f4f5;">${nombre}</p>
              </div>

              <div style="margin-bottom: 20px;">
                <p style="margin: 0 0 5px 0; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Email de contacto</p>
                <a href="mailto:${email}" style="margin: 0; font-size: 16px; color: #84cc16; text-decoration: none;">${email}</a>
              </div>

              <div style="margin-bottom: 25px;">
                <p style="margin: 0 0 5px 0; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Asunto</p>
                <p style="margin: 0; font-size: 16px; color: #f4f4f5;">${asunto}</p>
              </div>

              <div style="background-color: #18181b; padding: 20px; border-radius: 4px; border-left: 3px solid #84cc16;">
                <p style="margin: 0 0 10px 0; color: #71717a; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Mensaje del Usuario</p>
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #e4e4e7;">
                  ${mensaje.replace(/\n/g, "<br>")}
                </p>
              </div>

            </div>

            <div style="background-color: #0c0c0c; padding: 15px; text-align: center; border-top: 1px solid #27272a;">
              <p style="margin: 0; color: #52525b; font-size: 12px;">StremuGames &copy; ${new Date().getFullYear()} - Sistema de Soporte</p>
            </div>

          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      json: { message: "Ticket enviado correctamente" },
      statusCode: 200,
    };
  } catch (error) {
    console.error("Error enviando correo:", error);
    return {
      json: { message: "Error al enviar el ticket" },
      statusCode: 500,
    };
  }
};
