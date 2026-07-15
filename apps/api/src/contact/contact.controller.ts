import type { NextFunction, Request, Response } from "express";
import type { ContactMessage } from "@armali/schemas";
import { ContactService } from "./contact.service";

export class ContactController {
  constructor(private service: ContactService) {}

  async send(
    req: Request & { body: ContactMessage },
    res: Response,
    next: NextFunction,
  ) {
    try {
      await this.service.send(req.body);
      res.status(200).json({ message: "Message envoyé avec succès" });
    } catch (err) {
      next(err);
    }
  }
}
