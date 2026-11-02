import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  const settings = dbStore.getAppSettings();
  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(request: NextRequest) {
  const auth = requireAuth(request, ['ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Kunci dan nilai pengaturan wajib diisi' }, { status: 400 });
    }

    await dbStore.updateAppSetting(key, String(value));

    await dbStore.logAudit({
      userId: auth.user.id,
      action: 'SETTING_UPDATED',
      entityType: 'app_settings',
      entityId: key,
      details: JSON.stringify({ key, value }),
    });

    return NextResponse.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
