import type { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service";

const adminService = new AdminService();

export class AdminController {
  async getClinicRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await adminService.getClinicRequests();
      res.status(200).json(requests);
    } catch (err) {
      next(err);
    }
  }

  async approveClinicRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.approveClinicRequest(req.params.id as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async rejectClinicRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.rejectClinicRequest(req.params.id as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getClinics(req: Request, res: Response, next: NextFunction) {
    try {
      const clinics = await adminService.getClinics();
      res.status(200).json(clinics);
    } catch (err) {
      next(err);
    }
  }

  async deleteClinic(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteClinic(req.params.id as string);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await adminService.getUsers();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteUser(
        req.params.id as string,
        req.user!.id,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
