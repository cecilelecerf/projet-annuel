import transporter from "@api/lib/mailer";

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
}
