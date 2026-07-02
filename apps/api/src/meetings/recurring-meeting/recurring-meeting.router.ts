import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { updateRecurringSchema } from "@armali/schemas";
import { recurringController } from "@api/instances";

const recurringMeetingRouter: RouterType = Router();
recurringMeetingRouter.get(
  "/:id",
  authMiddleware,
  roleMiddleware(["SECRETARY", "VETERINARIAN", "CLIENT"]),
  recurringController.getRecurring.bind(recurringController) as RequestHandler,
);

recurringMeetingRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(["SECRETARY", "VETERINARIAN"]),
  validate(updateRecurringSchema),
  recurringController.patchRecurring.bind(
    recurringController,
  ) as RequestHandler,
);
export default recurringMeetingRouter;
