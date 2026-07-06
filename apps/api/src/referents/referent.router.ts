import { Router } from "express";
import type { Router as RouterType, RequestHandler } from "express";
import { authMiddleware } from "@api/middlewares/auth.middleware";
import { roleMiddleware } from "@api/middlewares/role.middleware";
import { validate } from "@api/middlewares/validate.middleware";
import { updateClinicSpecialitiesSchema } from "@armali/schemas";
import { referentController } from "@api/instances";

const referentRouter: RouterType = Router();
const controller = referentController;

referentRouter.get(
  "/dashboard",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  controller.getDashboard.bind(controller),
);

referentRouter.get(
  "/clinic/specialities",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  controller.getClinicSpecialities.bind(controller),
);

referentRouter.patch(
  "/clinic/specialities",
  authMiddleware,
  roleMiddleware(["REFERENT"]),
  validate(updateClinicSpecialitiesSchema),
  controller.updateClinicSpecialities.bind(controller),
);

export default referentRouter;
