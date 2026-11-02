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
    const { sessionId, actualCash, closingNote } = body;

    if (!sessionId || actualCash === undefined) {
      return NextResponse.json(
        { error: 'Session ID dan jumlah uang kas fisik aktual wajib diisi' },
        { status: 400 }
      );
    }

    const closed = await dbStore.closeShiftSession(
      sessionId,
      Number(actualCash),
      closingNote,
      auth.user.id
    );

    if (!closed) {
      return NextResponse.json(
        { error: 'Sesi shift tidak ditemukan atau sudah pernah ditutup' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sesi shift berhasil ditutup dan kas berhasil direkonsiliasi',
      session: closed,
      reconciliation: {
        openingCash: closed.openingCash,
        expectedCash: closed.expectedCash,
        actualCash: closed.actualCash,
        cashDifference: closed.cashDifference,
        status: (closed.cashDifference ?? 0) === 0 ? 'SESUAI (PAS)' : ((closed.cashDifference ?? 0) > 0 ? 'SURPLUS (LEBIH)' : 'DEFISIT (KURANG)'),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
