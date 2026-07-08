import transporter from "@api/lib/mailer";
import {
  AppointmentEmailType,
  appointmentTemplates,
} from "./templates/appointment.templates";
import { emailLayout } from "./templates/layout";

export class EmailService {
  private from = process.env.MAIL_USER || "noreply@armali.fr";

  async sendOtpDeleteAccount(email: string, code: string) {
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Suppression de votre compte Armali",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
          <h2 style="color:#e74c3c;">Suppression de compte</h2>
          <p>Vous avez demandé la suppression de votre compte Armali.</p>
          <p>Votre code de confirmation :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                      padding: 16px; background: #f4f4f4; border-radius: 8px; margin: 16px 0;">
            ${code}
          </div>
          <p style="color: #888; font-size: 13px;">Ce code expire dans <strong>15 minutes</strong>.</p>
          <p style="color: #888; font-size: 13px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
      `,
    });
  }

  async sendWelcome(email: string, firstname: string) {
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Bienvenue sur Armali",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
          <h2 style="color:#2ecc71;">Bienvenue ${firstname} !</h2>
          <p>Votre compte Armali a bien été créé.</p>
          <p>Vous pouvez maintenant vous connecter et profiter de nos services.</p>
        </div>
      `,
    });
  }
  async sendAppointmentEmail(
    type: AppointmentEmailType,
    email: string,
    data: Parameters<(typeof appointmentTemplates)[typeof type]>[0],
  ) {
    const { subject, titleColor, title, body } =
      appointmentTemplates[type](data);
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject,
      html: emailLayout(titleColor, title, body),
    });
  }

  async sendOrderConfirmation(
    email: string,
    firstname: string,
    data: {
      clinicName: string;
      pickupCode: string;
      items: { name: string; quantity: number; unitPrice: number }[];
      total: number;
    },
  ) {
    const itemsHtml = data.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 8px 0;">${item.quantity} × ${item.name}</td>
            <td style="padding: 8px 0; text-align: right;">${(item.unitPrice * item.quantity).toFixed(2)} €</td>
          </tr>`,
      )
      .join("");
  
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: `Confirmation de votre commande — ${data.clinicName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
          <h2 style="color:#2ecc71;">Merci ${firstname} !</h2>
          <p>Votre commande chez <strong>${data.clinicName}</strong> a bien été payée.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            ${itemsHtml}
            <tr style="border-top: 1px solid #ddd; font-weight: bold;">
              <td style="padding: 8px 0;">Total</td>
              <td style="padding: 8px 0; text-align: right;">${data.total.toFixed(2)} €</td>
            </tr>
          </table>
          <p>Voici votre code de retrait à donner à la secrétaire de la clinique :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                      padding: 16px; background: #f4f4f4; border-radius: 8px; margin: 16px 0;">
            ${data.pickupCode}
          </div>
          <p style="color: #888; font-size: 13px;">
            Présentez ce code lors du retrait de votre commande à la clinique.
          </p>
        </div>
      `,
    });
  }

  async sendOrderReady(
    email: string,
    firstname: string,
    data: {
      clinicName: string;
      clinicAddress: string;
      clinicPhone?: string;
      openingHours?: string;
      pickupCode: string;
      items: { name: string; quantity: number; unitPrice: number }[];
      total: number;
    },
  ) {
    const itemsHtml = data.items
      .map(
        (item) =>
          `<tr>
            <td style="padding: 8px 0;">${item.quantity} × ${item.name}</td>
            <td style="padding: 8px 0; text-align: right;">${(item.unitPrice * item.quantity).toFixed(2)} €</td>
          </tr>`,
      )
      .join("");
  
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: `Votre commande est prête — ${data.clinicName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
          <h2 style="color:#2ecc71;">Bonne nouvelle ${firstname} !</h2>
          <p>Votre commande est prête à être récupérée chez <strong>${data.clinicName}</strong>.</p>
  
          <div style="background: #f4f4f4; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 4px; font-weight: bold;">${data.clinicName}</p>
            <p style="margin: 0 0 4px; color: #555;">${data.clinicAddress}</p>
            ${data.clinicPhone ? `<p style="margin: 0 0 4px; color: #555;">${data.clinicPhone}</p>` : ""}
            ${data.openingHours ? `<p style="margin: 0; color: #555;">Horaires : ${data.openingHours}</p>` : ""}
          </div>
  
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            ${itemsHtml}
            <tr style="border-top: 1px solid #ddd; font-weight: bold;">
              <td style="padding: 8px 0;">Total</td>
              <td style="padding: 8px 0; text-align: right;">${data.total.toFixed(2)} €</td>
            </tr>
          </table>
  
          <p>Voici de nouveau votre code de retrait à donner à la secrétaire :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                      padding: 16px; background: #f4f4f4; border-radius: 8px; margin: 16px 0;">
            ${data.pickupCode}
          </div>
          <p style="color: #888; font-size: 13px;">
            Présentez ce code lors du retrait de votre commande à la clinique.
          </p>
        </div>
      `,
    });
  }
}
