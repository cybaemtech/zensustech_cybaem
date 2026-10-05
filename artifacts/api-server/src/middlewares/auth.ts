import { Request, Response, NextFunction } from "express";

export type Role = "CXO" | "CTO" | "IT_ADMIN" | "USER";

// Mocking a basic auth middleware for now.
// In a real app, this would verify a JWT or session token and fetch user details from DB.
export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // For demonstration, taking role from headers.
    const userRole = (req.headers["x-user-role"] as Role) || "USER";
    const userId = req.headers["x-user-id"] || "anonymous";

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: "Forbidden: You do not have the required permissions to access this resource."
      });
      return;
    }

    // Attach user to request for audit logging
    (req as any).user = { id: userId, role: userRole };
    next();
  };
};
