import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { PaymentGatewayService } from '@/lib/payment-gateway';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

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

    // Generate Dynamic QRIS
    const qrisResult = await PaymentGatewayService.createDynamicQRIS(
      order.orderNumber,
      order.totalAmount
    );

    // Prepare pending payment record with idempotency
    const idempotencyKey = `qris_${order.id}_${qrisResult.transactionId}`;
    const pendingPayment = {
      id: `pay_qris_${Date.now()}`,
      orderId: order.id,
      method: 'QRIS' as const,
      provider: qrisResult.provider,
      providerTransactionId: qrisResult.transactionId,
      idempotencyKey,
      amount: order.totalAmount,
      feeAmount: qrisResult.feeAmount,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbStore.transaction(db => {
      const existing = db.payments.find(p => p.orderId === order.id && p.method === 'QRIS');
      if (!existing) {
        db.payments.push(pendingPayment);
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        qrCodeDataUrl: qrisResult.qrCodeDataUrl,
        qrContent: qrisResult.qrContent,
        transactionId: qrisResult.transactionId,
        expiresAt: qrisResult.expiresAt,
        feeAmount: qrisResult.feeAmount,
        mode: qrisResult.mode,
        provider: qrisResult.provider,
        instructions: [
          'Buka aplikasi BCA Mobile, GoPay, OVO, Dana, ShopeePay, atau Livin',
          'Pilih menu QRIS / Scan QR',
          'Arahkan kamera ke kode QR di atas',
          'Periksa nama merchant: KOPI NOKA',
          'Konfirmasi pembayaran',
        ],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
