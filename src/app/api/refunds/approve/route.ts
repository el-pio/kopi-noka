import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // CRITICAL: Only ADMIN is authorized to approve/reject refund requests
  const auth = requireAuth(request, ['ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { refundId, approved } = body;

    if (!refundId || approved === undefined) {
      return NextResponse.json(
        { error: 'Refund ID dan keputusan persetujuan (approved: boolean) wajib dikirim' },
        { status: 400 }
      );
    }

    const processed = await dbStore.processRefundApproval(
      refundId,
      Boolean(approved),
      auth.user.id
    );

    if (!processed) {
      return NextResponse.json(
        { error: 'Permohonan refund tidak ditemukan atau sudah pernah diproses sebelumnya' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: approved ? 'Refund berhasil disetujui dan dieksekusi.' : 'Permohonan refund ditolak.',
      refund: processed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
