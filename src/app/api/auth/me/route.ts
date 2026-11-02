import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/db/store';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Check active shift session for this cashier
  const activeSession = dbStore.getActiveShiftSession(user.role === 'CASHIER' ? user.id : undefined);

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    activeShiftSession: activeSession || null,
  });
}
