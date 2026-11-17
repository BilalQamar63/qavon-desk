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

const AUTH_COOKIE_NAME = 'qavon_desk_token';
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function getAuthCookie(req: Request): string | undefined {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator === -1 || cookie.slice(0, separator).trim() !== AUTH_COOKIE_NAME) continue;

    try {
      return decodeURIComponent(cookie.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE,
  });
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
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
  const token = getAuthCookie(req);
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
