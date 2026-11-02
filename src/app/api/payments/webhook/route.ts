import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { PaymentGatewayService } from '@/lib/payment-gateway';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Format JSON webhook tidak valid' }, { status: 400 });
    }

    const signature = request.headers.get('x-signature') || payload.signature;
    const serverKey = process.env.QRIS_SERVER_KEY || 'sandbox_mock_server_key';

    // 1. Verify Webhook Signature (Tested in Test Case 8)
    const isSignatureValid = PaymentGatewayService.verifyWebhookSignature(signature, rawBody, serverKey);
    if (!isSignatureValid) {
      await dbStore.logAudit({
        action: 'WEBHOOK_SIGNATURE_REJECTED',
        entityType: 'payments',
        details: JSON.stringify({ signature, ip: request.headers.get('x-forwarded-for') || 'unknown' }),
      });
      return NextResponse.json(
        { error: 'Signature webhook tidak valid. Akses ditolak.' },
        { status: 401 }
      );
    }

    const {
      eventId,
      orderNumber,
      transactionStatus, // 'settlement' | 'capture' | 'pending' | 'expire' | 'cancel'
      grossAmount,
      transactionId,
    } = payload;

    if (!orderNumber || !eventId) {
      return NextResponse.json(
        { error: 'Field eventId dan orderNumber wajib ada pada payload' },
        { status: 400 }
      );
    }

    const order = dbStore.getOrderById(orderNumber);
    if (!order) {
      return NextResponse.json({ error: 'Order tidak ditemukan' }, { status: 404 });
    }

    // 2. Check Idempotency: Prevent duplicate processing of same webhook event (Test Case 9)
    const dbData = dbStore.getData();
    const duplicateEvent = dbData.paymentEvents.find(
      pe => pe.providerEventId === eventId
    );

    if (duplicateEvent) {
      return NextResponse.json({
        success: true,
        message: 'Event webhook sudah pernah diproses sebelumnya (Idempotent).',
        status: 'ALREADY_PROCESSED',
      });
    }

    // 3. Check if status indicates success
    const isPaid = transactionStatus === 'settlement' || transactionStatus === 'capture' || transactionStatus === 'PAID';

    if (isPaid) {
      // Find or prepare payment
      const existingPayment = dbData.payments.find(p => p.orderId === order.id && p.method === 'QRIS');
      const paymentId = existingPayment ? existingPayment.id : `pay_qris_${Date.now()}`;
      const feeAmount = PaymentGatewayService.calculateFee('QRIS', order.totalAmount);

      const paymentRecord = {
        id: paymentId,
        orderId: order.id,
        method: 'QRIS' as const,
        provider: 'MIDTRANS_QRIS',
        providerTransactionId: transactionId || `TX_${Date.now()}`,
        idempotencyKey: `qris_event_${eventId}`,
        amount: Number(grossAmount) || order.totalAmount,
        feeAmount,
        status: 'PAID' as const,
        paidAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const eventRecord = {
        id: `pe_${Date.now()}`,
        paymentId,
        providerEventId: eventId,
        eventType: transactionStatus,
        signatureVerified: true,
        processingStatus: 'PROCESSED',
        receivedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
      };

      // Record atomically
      await dbStore.recordPayment(paymentRecord, eventRecord);

      await dbStore.logAudit({
        action: 'WEBHOOK_PAYMENT_SETTLED',
        entityType: 'payments',
        entityId: paymentId,
        details: JSON.stringify({ orderNumber, amount: paymentRecord.amount, eventId }),
      });

      return NextResponse.json({
        success: true,
        message: 'Pembayaran QRIS berhasil dikonfirmasi dan diproses.',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Status event "${transactionStatus}" dicatat.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Gagal memproses webhook', details: err.message },
      { status: 500 }
    );
  }
}
