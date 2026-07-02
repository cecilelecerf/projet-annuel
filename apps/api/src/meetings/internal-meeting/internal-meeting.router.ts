import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import { createInternalMeetingSchema } from "@armali/schemas";
import { STAFF_ROLES } from "@api/utils";
import { internalMeetingController } from "@api/instances";

const internalMeetingRouter: RouterType = Router();

const internalController = internalMeetingController;
internalMeetingRouter.post(
  "/",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  validate(createInternalMeetingSchema),
  internalController.create.bind(internalController) as RequestHandler,
);
internalMeetingRouter.patch(
  "/:id/participants",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  internalController.updateParticipantStatus.bind(
    internalController,
  ) as RequestHandler,
);
internalMeetingRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  internalController.update.bind(internalController) as RequestHandler,
);
internalMeetingRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(STAFF_ROLES),
  internalController.delete.bind(internalController) as RequestHandler,
);

export default internalMeetingRouter;
