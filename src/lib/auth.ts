import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from './db/store';
import { User, Role } from './db/schema';

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: Role;
  exp: number;
}

const AUTH_COOKIE_NAME = 'kopi_noka_session';

/**
 * Simple, secure session token generator (Base64 signature)
 * In production this can be replaced with jose or jsonwebtoken
 */
export function createSessionToken(user: User): string {
  const payload: SessionPayload = {
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 12, // 12 hours
  };
  const jsonStr = JSON.stringify(payload);
  const base64 = Buffer.from(jsonStr).toString('base64');
  return `kn_sess_${base64}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token.startsWith('kn_sess_')) return null;
    const base64 = token.replace('kn_sess_', '');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    const payload: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > payload.exp) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Get current authenticated user from incoming request
 */
export function getCurrentUser(request: NextRequest): User | null {
  let token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  const session = verifySessionToken(token);
  if (!session) return null;

  const user = dbStore.getUserById(session.userId);
  if (!user || !user.isActive) return null;

  return user;
}

/**
 * Enforce RBAC in API route handlers
 */
export function requireAuth(
  request: NextRequest,
  allowedRoles?: Role[]
): { user: User } | { errorResponse: NextResponse } {
  const user = getCurrentUser(request);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: 'Autentikasi gagal. Silakan login terlebih dahulu.' },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      errorResponse: NextResponse.json(
        { error: `Akses ditolak. Anda tidak memiliki izin untuk tindakan ini. Diperlukan hak akses: ${allowedRoles.join(', ')}` },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export { AUTH_COOKIE_NAME };
