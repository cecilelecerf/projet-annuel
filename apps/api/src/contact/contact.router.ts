import { Router } from "express";
import type { RequestHandler } from "express";
import { validate } from "@api/middlewares";
import { contactMessageSchema } from "@armali/schemas";
import { contactController } from "@api/instances";

const contactRouter: Router = Router();
const controller = contactController;

contactRouter.post(
  "/",
  validate(contactMessageSchema),
  controller.send.bind(controller) as RequestHandler,
);

export default contactRouter;
