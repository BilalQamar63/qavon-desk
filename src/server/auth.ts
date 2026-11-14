import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/crm.ts';
import { crmRepo } from './db/repository.ts';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length >= 16) {
    return secret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable (min 16 characters) is required in production.');
  }
  return 'qavon_desk_local_dev_jwt_secret_key_2026';
}

export function isDemoModeEnabled(): boolean {
  if (process.env.ENABLE_DEMO_MODE === 'true') return true;
  if (process.env.ENABLE_DEMO_MODE === 'false') return false;
  return process.env.NODE_ENV !== 'production';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspaceId: user.workspaceId,
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  if (!plain || !hashed) return false;
  return bcrypt.compare(plain, hashed);
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const rawHeader = req.headers.authorization || (req.headers['x-auth-token'] as string | undefined);

  let token = '';
  if (rawHeader && rawHeader.startsWith('Bearer ')) {
    token = rawHeader.substring(7).trim();
  } else if (rawHeader) {
    token = rawHeader.trim();
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthenticatedUser;
    const currentUser = await crmRepo.findUserById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ error: 'Session is no longer valid. Please sign in again.' });
    }
    req.user = {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
      workspaceId: currentUser.workspaceId,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role "${req.user.role}" does not have permission for this action.`,
      });
    }
    return next();
  };
}
