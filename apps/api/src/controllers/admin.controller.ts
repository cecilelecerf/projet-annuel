import { AdminService } from "@api/services/admin.service";
import type { Request, Response, NextFunction } from "express";

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
      const result = await adminService.approveClinicRequest(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async rejectClinicRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.rejectClinicRequest(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }
}
