import { Request } from "express";
import { AuthenticatedRequest } from "./auth.middleware";

export { authMiddleware, type AuthenticatedRequest } from "./auth.middleware";
export { roleMiddleware } from "./role.middleware";
export { validate } from "./validate.middleware";
export { errorHandler } from "./error.middleware";
export type RequestWithParams<T extends Record<string, string>> =
  AuthenticatedRequest & Request<T>;
