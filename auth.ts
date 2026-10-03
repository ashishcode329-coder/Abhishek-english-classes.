import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { getDb, saveDb, PROTECTED_OWNER_EMAIL, ALL_ADMIN_PERMISSIONS } from './db.ts';
import { User, AdminPermission } from '../src/types/index.ts';

const TOKEN_SECRET = process.env.AUTH_SECRET || 'abhishek_english_classes_secret_key_2026_xyz987';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email.toLowerCase().trim(),
    role: user.role,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  };
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadStr).digest('base64url');
  return `${payloadStr}.${signature}`;
}

export function verifyToken(token: string): { userId: string; email?: string; role: string } | null {
  try {
    const [payloadStr, signature] = token.split('.');
    if (!payloadStr || !signature) return null;

    const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payloadStr).digest('base64url');
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf-8'));
    if (payload.expiresAt && Date.now() > payload.expiresAt) return null;

    return payload;
  } catch (err) {
    return null;
  }
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  // 1. Cryptographically verify the token signature
  const payload = verifyToken(token);
  if (!payload) {
    res.status(403).json({ error: 'Invalid or expired authentication token' });
    return;
  }

  // 2. Resolve the authenticated user's real Google identity/email on the backend
  const db = getDb();
  const foundUser = db.users.find((u) => u.id === payload.userId && u.isActive);
  if (!foundUser) {
    res.status(403).json({ error: 'User not found or account is deactivated' });
    return;
  }

  // 3. Compare the verified email with the protected owner identity
  const verifiedEmail = (foundUser.email || '').trim().toLowerCase();
  const isOwner = verifiedEmail === PROTECTED_OWNER_EMAIL;

  // 4. Only an authenticated user whose verified identity matches that email may receive SUPER_ADMIN
  if (isOwner) {
    if (foundUser.role !== 'SUPER_ADMIN') {
      foundUser.role = 'SUPER_ADMIN';
      foundUser.permissions = [...ALL_ADMIN_PERMISSIONS];
      saveDb(db);
    }
  } else if (foundUser.role === 'SUPER_ADMIN') {
    // Immediate downgrade of any non-owner possessing SUPER_ADMIN
    foundUser.role = 'STUDENT';
    foundUser.permissions = [];
    saveDb(db);
  }

  // Strip password hash and salt
  const { passwordHash, salt, ...safeUser } = foundUser;
  req.user = safeUser;
  next();
}

export function optionalAuthenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      const db = getDb();
      const foundUser = db.users.find((u) => u.id === payload.userId && u.isActive);
      if (foundUser) {
        const verifiedEmail = (foundUser.email || '').trim().toLowerCase();
        const isOwner = verifiedEmail === PROTECTED_OWNER_EMAIL;
        if (isOwner) {
          foundUser.role = 'SUPER_ADMIN';
          foundUser.permissions = [...ALL_ADMIN_PERMISSIONS];
        } else if (foundUser.role === 'SUPER_ADMIN') {
          foundUser.role = 'STUDENT';
          foundUser.permissions = [];
        }
        const { passwordHash, salt, ...safeUser } = foundUser;
        req.user = safeUser;
      }
    }
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const verifiedEmail = (req.user.email || '').trim().toLowerCase();
  const isOwner = verifiedEmail === PROTECTED_OWNER_EMAIL;

  if (req.user.role === 'SUPER_ADMIN' && !isOwner) {
    res.status(403).json({ error: 'Access denied: Non-owner cannot hold SUPER_ADMIN role' });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      error: 'Authorization error: Admin access required. Students cannot access admin operations.',
      role: req.user.role,
      redirect: '/',
    });
    return;
  }

  next();
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const verifiedEmail = (req.user.email || '').trim().toLowerCase();
  if (verifiedEmail !== PROTECTED_OWNER_EMAIL || req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({
      error: 'Authorization error: Super Admin (Owner) access required.',
      role: req.user.role,
      redirect: '/',
    });
    return;
  }

  next();
}

export function requirePermission(permission: AdminPermission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        error: 'Authorization error: Admin access required. Students cannot access admin operations.',
        role: req.user.role,
        redirect: '/',
      });
      return;
    }

    const hasSpecificPerm =
      req.user.role === 'ADMIN' &&
      (req.user.permissions.includes(permission) ||
        (permission === 'CAN_MANAGE_STUDENTS' && req.user.permissions.includes('CAN_MANAGE_USERS')) ||
        (permission === 'CAN_MANAGE_USERS' && req.user.permissions.includes('CAN_MANAGE_STUDENTS')) ||
        (permission === 'CAN_MANAGE_QUESTIONS' && req.user.permissions.includes('CAN_CREATE_QUESTION')) ||
        (permission === 'CAN_CREATE_PRACTICE' && (req.user.permissions.includes('CAN_CREATE_QUESTION') || req.user.permissions.includes('CAN_CREATE_COURSE'))));

    if (hasSpecificPerm) {
      return next();
    }

    res.status(403).json({
      error: `Permission denied: Missing required permission [${permission}]`,
      requiredPermission: permission,
      role: req.user.role,
    });
  };
}
