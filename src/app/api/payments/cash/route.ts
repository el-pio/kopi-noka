import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';
import { Payment } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  // Only Cashier or Admin can confirm cash payment
  const auth = requireAuth(request, ['CASHIER', 'ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { orderId, receivedAmount, idempotencyKey } = body;

    if (!orderId || receivedAmount === undefined) {
      return NextResponse.json(
        { error: 'Order ID dan jumlah uang tunai diterima wajib diisi' },
        { status: 400 }
      );
    }

    const order = dbStore.getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: 'Pesanan tidak ditemukan' },
        { status: 404 }
      );
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'Pesanan ini sudah lunas sebelumnya.' },
        { status: 400 }
      );
    }

    if (receivedAmount < order.totalAmount) {
      return NextResponse.json(
        {
          error: `Uang diterima (Rp ${receivedAmount.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${order.totalAmount.toLocaleString('id-ID')})`,
        },
        { status: 400 }
      );
    }

    // Verify cashier has an active shift session
    const activeSession = dbStore.getActiveShiftSession(
      auth.user.role === 'CASHIER' ? auth.user.id : undefined
    );

    if (!activeSession && auth.user.role === 'CASHIER') {
      return NextResponse.json(
        { error: 'Shift belum dibuka. Buka shift kasir terlebih dahulu.' },
        { status: 400 }
      );
    }

    const changeAmount = receivedAmount - order.totalAmount;
    const key = idempotencyKey || `cash_${order.id}_${Date.now()}`;

    const newPayment: Payment = {
      id: `pay_cash_${Date.now()}`,
      orderId: order.id,
      method: 'CASH',
      provider: 'TUNAI',
      idempotencyKey: key,
      amount: order.totalAmount,
      feeAmount: 0,
      status: 'PAID',
      paidAt: new Date().toISOString(),
      receivedAmount: Number(receivedAmount),
      changeAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { payment, order: updatedOrder } = await dbStore.recordPayment(newPayment);

    await dbStore.logAudit({
      userId: auth.user.id,
      action: 'PAYMENT_RECEIVED_CASH',
      entityType: 'payments',
      entityId: payment.id,
      details: JSON.stringify({
        orderNumber: order.orderNumber,
        amount: payment.amount,
        receivedAmount,
        changeAmount,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Pembayaran tunai berhasil diterima',
      payment,
      changeAmount,
      order: updatedOrder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Gagal memproses pembayaran tunai', details: err.message },
      { status: 500 }
    );
  }
}
