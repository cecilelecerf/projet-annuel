import { Router } from "express";
import type { RequestHandler } from "express";
import { authMiddleware, roleMiddleware } from "@api/middlewares";
import { productRequestController } from "@api/instances";
import { requireApprovedClinic } from "@api/middlewares/clinic-guard.middleware";

const productRequestRouter: Router = Router();
const controller = productRequestController;

const REQUESTER_ROLES = ["DIRECTOR", "REFERENT"] as const;

productRequestRouter.use(authMiddleware);
productRequestRouter.use(requireApprovedClinic);

// Admin uniquement : liste toutes les demandes (filtrable par ?status=)
productRequestRouter.get(
  "/",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.getAll.bind(controller) as RequestHandler,
);

// Référent/Directeur : liste les demandes de leur propre clinique
productRequestRouter.get(
  "/mine",
  authMiddleware,
  roleMiddleware([...REQUESTER_ROLES]),
  controller.getMine.bind(controller) as RequestHandler,
);

productRequestRouter.post(
  "/",
  authMiddleware,
  roleMiddleware([...REQUESTER_ROLES]),
  controller.create.bind(controller) as RequestHandler,
);

productRequestRouter.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.approve.bind(controller) as RequestHandler,
);

productRequestRouter.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware(["ADMIN"]),
  controller.reject.bind(controller) as RequestHandler,
);

export default productRequestRouter;