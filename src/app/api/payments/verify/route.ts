import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';
import { PaymentGatewayService } from '@/lib/payment-gateway';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, method = 'QRIS', referenceNumber, isSimulation = false } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID wajib diisi' }, { status: 400 });
    }

    const order = dbStore.getOrderById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }

    if (order.paymentStatus === 'PAID') {
      return NextResponse.json({ error: 'Pesanan sudah berstatus lunas' }, { status: 400 });
    }

    // If Bank Transfer or Debit/Credit, require Cashier or Admin login
    let user;
    if (!isSimulation) {
      const auth = requireAuth(request, ['CASHIER', 'ADMIN']);
      if ('errorResponse' in auth) {
        return auth.errorResponse;
      }
      user = auth.user;
    }

    const feeAmount = PaymentGatewayService.calculateFee(method, order.totalAmount);
    const paymentId = `pay_${method.toLowerCase()}_${Date.now()}`;
    const idempotencyKey = `verify_${method}_${order.id}_${Date.now()}`;

    const paymentRecord = {
      id: paymentId,
      orderId: order.id,
      method: method as any,
      provider: method === 'QRIS' ? 'SIMULATOR_QRIS' : (method === 'BANK_TRANSFER' ? 'BCA_TRANSFER' : 'EDC_DEBIT'),
      providerTransactionId: referenceNumber || `REF_${Date.now()}`,
      idempotencyKey,
      amount: order.totalAmount,
      feeAmount,
      status: 'PAID' as const,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const eventRecord = {
      id: `pe_${Date.now()}`,
      paymentId,
      providerEventId: `sim_evt_${Date.now()}`,
      eventType: 'MANUAL_VERIFY',
      signatureVerified: true,
      processingStatus: 'PROCESSED',
      receivedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
    };

    const { payment, order: updatedOrder } = await dbStore.recordPayment(paymentRecord, eventRecord);

    await dbStore.logAudit({
      userId: user?.id,
      action: `PAYMENT_VERIFIED_${method}`,
      entityType: 'payments',
      entityId: payment.id,
      details: JSON.stringify({
        orderNumber: order.orderNumber,
        method,
        referenceNumber,
        isSimulation,
      }),
    });

    return NextResponse.json({
      success: true,
      message: `Pembayaran melalui ${method} berhasil diverifikasi.`,
      payment,
      order: updatedOrder,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
