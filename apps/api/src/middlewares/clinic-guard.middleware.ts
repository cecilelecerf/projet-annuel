import type { Request, Response, NextFunction } from "express";

/**
 * Vérifie que le directeur authentifié a bien une clinique approuvée
 * (clinicId présent dans le JWT) avant d'autoriser l'accès aux routes
 * métier (planning, personnel, produits, etc.).
 *
 * `clinicId` vient directement du payload JWT (voir jwt.ts / JwtPayload)
 *
 * Contrepartie : `clinicId` n'est mis à jour dans le JWT qu'au moment où
 * l'access token est (re)généré. Si un directeur est approuvé alors qu'il
 * a déjà un access token valide, il ne verra clinicId qu'après expiration
 * de ce token (15 min) ou après un refresh.
 *
 */
export function requireApprovedClinic(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    res.status(401).json({ message: "Non authentifié" });
    return;
  }

  // Cette vérification ne concerne que les directeurs ; les autres rôles
  // (vétérinaire, secrétaire, etc.) passent sans condition sur ce middleware.
  if (req.user.role !== "DIRECTOR") {
    next();
    return;
  }

  if (!req.user.clinicId) {
    res.status(403).json({
      message: "Aucune clinique approuvée n'est associée à ce compte",
      code: "CLINIC_NOT_APPROVED",
    });
    return;
  }

  next();
}
