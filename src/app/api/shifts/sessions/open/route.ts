import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request, ['CASHIER', 'ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { shiftId, openingCash = 0 } = body;

    if (!shiftId) {
      return NextResponse.json({ error: 'Pilih shift yang akan dibuka' }, { status: 400 });
    }

    // Check if cashier already has an open session
    const existing = dbStore.getActiveShiftSession(auth.user.id);
    if (existing) {
      return NextResponse.json(
        { error: 'Anda masih memiliki shift yang sedang aktif. Tutup shift sebelumnya terlebih dahulu.' },
        { status: 400 }
      );
    }

    const session = await dbStore.openShiftSession(
      shiftId,
      auth.user.id,
      Math.max(0, Number(openingCash) || 0)
    );

    return NextResponse.json({
      success: true,
      message: 'Shift kasir berhasil dibuka dengan modal awal',
      session,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
