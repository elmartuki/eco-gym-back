import admin from "firebase-admin";

const serviceAccount = {
  type: process.env.TYPE,
  project_id: process.env.PROJECT_ID,
  private_key: process.env.PRIVATE_KEY
    ? process.env.PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("🔥 Firebase Admin inicializado correctamente");
} catch (error) {
  console.error("❌ Error inicializando Firebase Admin:", error);
}

export default admin;
