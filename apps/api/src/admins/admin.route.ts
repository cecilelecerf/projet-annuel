import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { AdminController } from "@api/admins/admin.controller";

const adminRouter: RouterType = Router();
const controller = new AdminController();

adminRouter.get(
  "/clinic-requests",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.getClinicRequests.bind(controller),
);

adminRouter.patch(
  "/clinic-requests/:id/approve",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.approveClinicRequest.bind(controller),
);

adminRouter.patch(
  "/clinic-requests/:id/reject",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.rejectClinicRequest.bind(controller),
);

adminRouter.get(
  "/clinics",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.getClinics.bind(controller),
);

adminRouter.delete(
  "/clinics/:id",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.deleteClinic.bind(controller),
);

export default adminRouter;
