import type { ContactMessage } from "@armali/schemas";
import { EmailService } from "@api/emails/email.service";

const emailService = new EmailService();
const CONTACT_RECIPIENT =
  process.env.CONTACT_EMAIL ||
  process.env.MAIL_USER ||
  "contact@armali.fr";

export class ContactService {
  async send(data: ContactMessage) {
    await emailService.sendContactMessage(CONTACT_RECIPIENT, data);
  }
}
