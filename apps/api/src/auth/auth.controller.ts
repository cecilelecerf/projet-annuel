import { AuthService } from "@api/auth/auth.service";
import { UnauthorizedError } from "@api/errors";
import type { Request, Response, NextFunction } from "express";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstname, lastname } = req.body;
      const result = await authService.register({
        email,
        password,
        firstname,
        lastname,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.status(204).json();
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const authorization = req.headers.authorization;
      if (!authorization || !authorization.startsWith("Bearer ")) {
        throw new UnauthorizedError("Token manquant");
      }

      const token = authorization.split(" ")[1];
      const user = await authService.me(token);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }
}
