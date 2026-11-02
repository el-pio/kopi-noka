import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = getCurrentUser(request);
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID dan status baru wajib dikirim' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING_PAYMENT', 'QUEUED', 'BREWING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status pesanan tidak valid' },
        { status: 400 }
      );
    }

    const updated = await dbStore.updateOrderStatus(orderId, status, user?.id);
    if (!updated) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Status pesanan #${updated.orderNumber} berhasil diperbarui menjadi ${status}`,
      order: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
