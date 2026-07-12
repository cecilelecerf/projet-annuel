import nodemailer from "nodemailer";

const isEmailEnabled = process.env.ENABLE_EMAIL === "true";
const isProd = process.env.NODE_ENV === "production";

let transporter: nodemailer.Transporter;

if (isEmailEnabled) {
  if (isProd && !process.env.RESEND_API_KEY) {
    throw new Error(
      "ENABLE_EMAIL=true mais RESEND_API_KEY manque dans l'environnement",
    );
  }
  if (
    !isProd &&
    (!process.env.MAIL_HOST || !process.env.MAIL_USER || !process.env.MAIL_PASS)
  ) {
    throw new Error(
      "ENABLE_EMAIL=true mais MAIL_HOST/MAIL_USER/MAIL_PASS manquent dans l'environnement",
    );
  }

  transporter = nodemailer.createTransport({
    host: isProd ? "smtp.resend.com" : process.env.MAIL_HOST,
    port: isProd ? 465 : Number(process.env.MAIL_PORT),
    secure: isProd ? true : false, // 465 = TLS direct en prod, Mailhog reste en clair
    requireTLS: !isProd && process.env.MAIL_REQUIRE_TLS === "true",
    auth: {
      user: isProd ? "resend" : process.env.MAIL_USER,
      pass: isProd ? process.env.RESEND_API_KEY : process.env.MAIL_PASS,
    },
  });
} else {
  transporter = {
    sendMail: async (mailOptions: nodemailer.SendMailOptions) => {
      console.log(
        `[EMAIL DÉSACTIVÉ] Email vers ${mailOptions.to} — Sujet: ${mailOptions.subject}`,
      );
      return { messageId: "disabled" };
    },
  } as unknown as nodemailer.Transporter;
}

export default transporter;
