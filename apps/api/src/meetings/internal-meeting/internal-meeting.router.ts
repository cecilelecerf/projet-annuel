import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import {
  createAnimalMeetingSchema,
  createInternalMeetingSchema,
  updateAnimalMeetingSchema,
  UserRole,
} from "@armali/schemas";
import { InternalMeetingController } from "./internal-meeting.controller";

const internalMeetingRouter: RouterType = Router();
export const staffRoles: UserRole[] = [
  "VETERINARIAN",
  "SECRETARY",
  "REFERANT",
  "DIRECTOR",
] as const;
const internalController = new InternalMeetingController();
internalMeetingRouter.post(
  "/",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  validate(createInternalMeetingSchema),
  internalController.create.bind(internalController) as RequestHandler,
);
internalMeetingRouter.patch(
  "/:id",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  internalController.update.bind(internalController) as RequestHandler,
);
internalMeetingRouter.delete(
  "/:id",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  internalController.delete.bind(internalController) as RequestHandler,
);
internalMeetingRouter.patch(
  "/:id/participants/:userId",
  authMiddleware,
  roleMiddleware([...staffRoles]),
  internalController.updateParticipantStatus.bind(
    internalController,
  ) as RequestHandler,
);

export default internalMeetingRouter;
