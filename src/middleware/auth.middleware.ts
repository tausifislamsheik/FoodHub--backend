import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import { AppError } from "../utils/error";

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify session
    const session = await prisma.session.findUnique({
      where: { token },
      include: { 
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
          }
        }
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new AppError("Invalid or expired session", 401);
    }

    if (!session.user.isActive) {
      throw new AppError("Account is inactive", 403);
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action",
          403
        )
      );
    }

    next();
  };
};