import transporter from "@api/lib/mailer";
import {
  AppointmentEmailType,
  appointmentTemplates,
} from "./templates/appointment.templates";
import { emailLayout } from "./templates/layout";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export class EmailService {
  private from = process.env.MAIL_FROM || "noreply@armali.fr";

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

  async sendResetPassword(email: string, code: string) {
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Réinitialisation de votre mot de passe Armali",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
          <h2 style="color:#409eff;">Mot de passe oublié</h2>
          <p>Vous avez demandé la réinitialisation de votre mot de passe Armali.</p>
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

  async sendStaffAccountCreated(
    email: string,
    firstname: string,
    temporaryPassword: string,
    roleLabel: string,
    clinicName: string,
  ) {
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: `Votre compte ${roleLabel} Armali a été créé`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
          <h2 style="color:#2ecc71;">Bienvenue ${firstname} !</h2>
          <p>Un compte <strong>${roleLabel}</strong> vient d'être créé pour vous au sein de la clinique <strong>${clinicName}</strong> sur Armali.</p>
          <p>Voici votre mot de passe provisoire :</p>
          <div style="font-size: 20px; font-weight: bold; letter-spacing: 2px; text-align: center;
                      padding: 16px; background: #f4f4f4; border-radius: 8px; margin: 16px 0;">
            ${temporaryPassword}
          </div>
          <p>Connectez-vous avec votre email (<strong>${email}</strong>) et ce mot de passe, puis pensez à le modifier depuis votre profil.</p>
        </div>
      `,
    });
  }

  async sendLoginTwoFactorCode(email: string, code: string) {
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Votre code de connexion Armali",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
          <h2 style="color:#409eff;">Vérification en deux étapes</h2>
          <p>Voici votre code de connexion Armali :</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center;
                      padding: 16px; background: #f4f4f4; border-radius: 8px; margin: 16px 0;">
            ${code}
          </div>
          <p style="color: #888; font-size: 13px;">Ce code expire dans <strong>10 minutes</strong>.</p>
          <p style="color: #888; font-size: 13px;">Si vous n'êtes pas à l'origine de cette connexion, changez votre mot de passe immédiatement.</p>
        </div>
      `,
    });
  }

  async sendClinicLinked(email: string, firstname: string, clinicName: string) {
    await transporter.sendMail({
      from: this.from,
      to: email,
      subject: "Vous avez été ajouté à une clinique sur Armali",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
          <h2 style="color:#2ecc71;">Bonjour ${firstname}</h2>
          <p>Votre compte vétérinaire a été rattaché à la clinique <strong>${clinicName}</strong> sur Armali.</p>
          <p>Vous pouvez dès maintenant y exercer avec votre compte existant.</p>
        </div>
      `,
    });
  }

  async sendContactMessage(
    to: string,
    data: { name: string; email: string; subject: string; message: string },
  ) {
    await transporter.sendMail({
      from: this.from,
      to,
      replyTo: data.email,
      subject: `[Contact] ${escapeHtml(data.subject)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px;">
          <h2 style="color:#409eff;">Nouveau message de contact</h2>
          <p><strong>De :</strong> ${escapeHtml(data.name)} (${escapeHtml(data.email)})</p>
          <p><strong>Sujet :</strong> ${escapeHtml(data.subject)}</p>
          <p style="white-space: pre-wrap; background: #f4f4f4; border-radius: 8px; padding: 16px;">${escapeHtml(data.message)}</p>
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
