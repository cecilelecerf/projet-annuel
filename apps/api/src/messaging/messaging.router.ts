import { authMiddleware, roleMiddleware, validate } from "@api/middlewares";
import { Router } from "express";
import type { RequestHandler, Router as RouterType } from "express";
import {
  addConversationMembersSchema,
  createConversationSchema,
  renameConversationSchema,
  sendMessageSchema,
  updateConversationMemberRoleSchema,
} from "@armali/schemas";
import { CLINIC_STAFF_ROLES } from "@api/utils/role";
import { messagingController } from "@api/instances";

const messagingRouter: RouterType = Router();

messagingRouter.use(authMiddleware, roleMiddleware(CLINIC_STAFF_ROLES));

messagingRouter.get(
  "/contacts",
  messagingController.getContacts.bind(messagingController) as RequestHandler,
);
messagingRouter.get(
  "/",
  messagingController.list.bind(messagingController) as RequestHandler,
);
messagingRouter.post(
  "/",
  validate(createConversationSchema),
  messagingController.create.bind(messagingController) as RequestHandler,
);
messagingRouter.get(
  "/:id",
  messagingController.getById.bind(messagingController) as RequestHandler,
);
messagingRouter.patch(
  "/:id",
  validate(renameConversationSchema),
  messagingController.rename.bind(messagingController) as RequestHandler,
);
messagingRouter.post(
  "/:id/members",
  validate(addConversationMembersSchema),
  messagingController.addMembers.bind(messagingController) as RequestHandler,
);
messagingRouter.delete(
  "/:id/members/:userId",
  messagingController.removeMember.bind(messagingController) as RequestHandler,
);
messagingRouter.patch(
  "/:id/members/:userId",
  validate(updateConversationMemberRoleSchema),
  messagingController.updateMemberRole.bind(
    messagingController,
  ) as RequestHandler,
);
messagingRouter.post(
  "/:id/messages",
  validate(sendMessageSchema),
  messagingController.sendMessage.bind(messagingController) as RequestHandler,
);
messagingRouter.post(
  "/:id/read",
  messagingController.markRead.bind(messagingController) as RequestHandler,
);

export default messagingRouter;
