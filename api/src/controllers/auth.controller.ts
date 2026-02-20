import { AuthService } from "@api/services/auth.service";
import type { Request, Response } from "express";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const { email, password, firstname, lastname, role } = req.body;
    const result = await authService.register({
      email,
      password,
      firstname,
      lastname,
      role,
    });
    res.status(201).json(result);
  }

  async login(req: Request, res: Response) {
    console.log(req.body);
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(204).json();
  }
}
