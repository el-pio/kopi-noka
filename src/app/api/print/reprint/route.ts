import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Cashier or Admin can reprint, but must provide an audit reason
  const auth = requireAuth(request, ['CASHIER', 'ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { orderId, printerType = 'CUSTOMER_RECEIPT', reason } = body;

    if (!orderId || !reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Order ID dan alasan cetak ulang wajib diisi' },
        { status: 400 }
      );
    }

    const order = dbStore.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    const printJob = await dbStore.createReprintJob(
      order.id,
      printerType as any,
      auth.user.id,
      reason.trim()
    );

    return NextResponse.json({
      success: true,
      message: 'Permintaan cetak ulang berhasil dicatat dalam audit log',
      printJob,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
