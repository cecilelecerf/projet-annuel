import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { RecurringMeetingController } from "./recurring-meeting.controller";
import { updateRecurringSchema } from "@armali/schemas";

const recurringMeetingRouter: RouterType = Router();
const recurringController = new RecurringMeetingController();
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
