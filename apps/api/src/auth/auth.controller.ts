import { AuthService } from "@api/auth/auth.service";
import { UnauthorizedError } from "@api/errors";
import { AuthenticatedRequest } from "@api/middlewares";
import { withAvatarUrl } from "@api/users/user.utils";
import type { Request, Response, NextFunction } from "express";

export class AuthController {
  constructor(private service: AuthService) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstname, lastname } = req.body;
      const result = await this.service.register({
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

  async registerDirector(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, firstname, lastname, clinic } = req.body;
      const result = await this.service.registerDirector({
        email,
        password,
        firstname,
        lastname,
        clinic,
      });
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await this.service.login({ email, password });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await this.service.logout(refreshToken);
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
      const user = await this.service.me(token);
      res.status(200).json(withAvatarUrl(user));
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await this.service.refresh(refreshToken);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async updateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const user = await this.service.updateAccount(userId, req.body);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  async requestDeleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await this.service.requestDeleteAccount(userId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async confirmDeleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { code } = req.body;
      await this.service.confirmDeleteAccount(userId, code);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await this.service.forgotPassword({ email });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code, newPassword } = req.body;
      await this.service.resetPassword({ email, code, newPassword });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  async verifyLoginTwoFactor(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      const result = await this.service.verifyLoginTwoFactor({ email, code });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
