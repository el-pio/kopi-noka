import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/db/store';

export async function POST(request: NextRequest) {
  const user = getCurrentUser(request);
  if (user) {
    await dbStore.logAudit({
      userId: user.id,
      action: 'USER_LOGOUT',
      entityType: 'users',
      entityId: user.id,
      details: JSON.stringify({ username: user.username }),
      ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    });
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil',
  });

  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
