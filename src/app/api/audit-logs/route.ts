import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Only Admin can view audit logs (Section 4 RBAC)
  const auth = requireAuth(request, ['ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const logs = dbStore.getAuditLogs();
  const users = dbStore.getUsers();

  const enriched = logs.map(l => {
    const user = l.userId ? users.find(u => u.id === l.userId) : null;
    return {
      ...l,
      userName: user ? user.name : 'Sistem / Tamu',
      userRole: user ? user.role : '-',
    };
  });

  return NextResponse.json({ success: true, data: enriched });
}
