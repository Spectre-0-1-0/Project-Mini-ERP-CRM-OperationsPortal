import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { AuthUser } from '../types/express.js';

interface JwtPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export const authenticateJwt = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication token missing or invalid format');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
    next();
  } catch (err) {
    throw new AppError(401, 'Invalid or expired authentication token');
  }
};

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        `Access denied: requires one of the following roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};
