import { Router } from "express";
import type { Router as RouterType } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { adminController } from "@api/instances";

const adminRouter: RouterType = Router();
const controller = adminController;

adminRouter.use(authMiddleware);
adminRouter.get(
  "/clinic-requests",
  roleMiddleware(["ADMIN"]),
  controller.getClinicRequests.bind(controller),
);

adminRouter.patch(
  "/clinic-requests/:id/approve",
  roleMiddleware(["ADMIN"]),
  controller.approveClinicRequest.bind(controller),
);

adminRouter.patch(
  "/clinic-requests/:id/reject",
  roleMiddleware(["ADMIN"]),
  controller.rejectClinicRequest.bind(controller),
);

adminRouter.get(
  "/clinics",
  roleMiddleware(["ADMIN"]),
  controller.getClinics.bind(controller),
);

adminRouter.delete(
  "/clinics/:id",
  roleMiddleware(["ADMIN"]),
  controller.deleteClinic.bind(controller),
);

export default adminRouter;
