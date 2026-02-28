import { AuthService } from "@api/services/auth.service";
import type { Request, Response } from "express";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    const { email, password, firstname, lastname } = req.body;

    const result = await authService.register({
      email,
      password,
      firstname,
      lastname,
    });
    res.status(201).json(result);
  }

  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  }

  async logout(req: Request, res: Response) {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.status(204).json();
  }

  async me(req: Request, res: Response) {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      res.status(401).json({ message: "Token manquant" });
      return;
    }
    const token = authorization.split(" ")[1];
    const user = await authService.me(token);
    res.status(200).json(user);
  }
}
