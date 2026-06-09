import nodemailer from "nodemailer";

const isEmailEnabled = process.env.ENABLE_EMAIL === "true";

let transporter: nodemailer.Transporter;

if (isEmailEnabled) {
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
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
