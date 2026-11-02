import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';
import { Refund } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['ADMIN', 'CASHIER']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const refunds = dbStore.getRefunds();
  const users = dbStore.getUsers();
  const orders = dbStore.getOrders();

  const enriched = refunds.map(r => {
    const requester = users.find(u => u.id === r.requestedBy);
    const approver = r.approvedBy ? users.find(u => u.id === r.approvedBy) : null;
    const order = orders.find(o => o.id === r.orderId);

    return {
      ...r,
      orderNumber: order?.orderNumber,
      requesterName: requester?.name || 'Kasir',
      approverName: approver?.name || '-',
    };
  });

  return NextResponse.json({ success: true, data: enriched });
}

export async function POST(request: NextRequest) {
  // Cashier or Admin can submit a refund request
  const auth = requireAuth(request, ['CASHIER', 'ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { orderId, amount, reason } = body;

    if (!orderId || !amount || !reason || reason.trim() === '') {
      return NextResponse.json(
        { error: 'Order ID, nominal refund, dan alasan wajib diisi dengan jelas' },
        { status: 400 }
      );
    }

    const order = dbStore.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (order.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { error: 'Hanya pesanan yang sudah lunas (PAID) yang dapat diajukan refund.' },
        { status: 400 }
      );
    }

    const payments = dbStore.getPayments().filter(p => p.orderId === order.id && p.status === 'PAID');
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    // Rule: Refund cannot exceed total amount paid (Test Case 13)
    if (amount > totalPaid) {
      return NextResponse.json(
        {
          error: `Nominal refund (Rp ${amount.toLocaleString('id-ID')}) tidak boleh melebihi jumlah yang dibayar (Rp ${totalPaid.toLocaleString('id-ID')})`,
        },
        { status: 400 }
      );
    }

    const primaryPayment = payments[0];
    const newRefund: Refund = {
      id: `ref_${Date.now()}`,
      orderId: order.id,
      paymentId: primaryPayment.id,
      requestedBy: auth.user.id,
      amount: Number(amount),
      reason: reason.trim(),
      approvalStatus: 'PENDING',
      executionStatus: 'PENDING',
      requestedAt: new Date().toISOString(),
    };

    const saved = await dbStore.requestRefund(newRefund);

    return NextResponse.json({
      success: true,
      message: 'Permohonan refund berhasil dikirim. Menunggu persetujuan Admin.',
      refund: saved,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
