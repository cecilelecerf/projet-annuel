import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { updateRecurringSchema } from "@armali/schemas";
import { recurringController } from "@api/instances";
import { STAFF_ROLES } from "@api/utils";

const recurringMeetingRouter: RouterType = Router();
recurringMeetingRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  recurringController.getRecurring.bind(recurringController) as RequestHandler,
);

recurringMeetingRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  validate(updateRecurringSchema),
  recurringController.patchRecurring.bind(
    recurringController,
  ) as RequestHandler,
);
export default recurringMeetingRouter;
