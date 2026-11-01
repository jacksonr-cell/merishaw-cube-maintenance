import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'merishaw-institutional-cube-maintenance-secret-key-2026';

export interface UserPayload {
  id: string;
  email: string;
  identifier_code: string;
  full_name: string;
  role: 'admin' | 'staff' | 'student' | 'supervisor';
  department?: string;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}

// Generate base64url signed token (self-contained JWT)
export function generateToken(payload: UserPayload, expiresInHours = 24): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  const fullPayload = { ...payload, exp };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): (UserPayload & { exp: number }) | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signature] = parts;

    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Fallback to query parameter for CSV exports or kiosk downloads if token is passed
  if (!token && req.query.token) {
    token = String(req.query.token);
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. No authorization token provided.' });
    return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(403).json({ error: 'Invalid or expired session token. Please sign in again.' });
    return;
  }

  // Ensure user is still active in database
  const user = db.prepare('SELECT id, email, identifier_code, full_name, role, department, is_active FROM users WHERE id = ?').get(decoded.id) as any;
  if (!user || user.is_active !== 1) {
    res.status(403).json({ error: 'User account is deactivated or no longer exists.' });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
    identifier_code: user.identifier_code,
    full_name: user.full_name,
    role: user.role,
    department: user.department
  };

  next();
}

export function requireRole(...allowedRoles: Array<'admin' | 'staff' | 'student' | 'supervisor'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // Admin has superuser access to everything
    if (req.user.role === 'admin') {
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      error: `Access denied. Requires one of [${allowedRoles.join(', ')}] roles, but user has '${req.user.role}'.`
    });
  };
}

export function logAudit(userId: string | null, action: string, entityType: string, entityId: string | null, details: any, ip = '127.0.0.1') {
  try {
    const id = 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(id, userId, action, entityType, entityId, JSON.stringify(details), ip);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
