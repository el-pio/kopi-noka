import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const user = getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
  }

  const activeSession = dbStore.getActiveShiftSession(
    user.role === 'CASHIER' ? user.id : undefined
  );

  if (!activeSession) {
    return NextResponse.json({
      hasActiveSession: false,
      session: null,
    });
  }

  const shiftConfig = dbStore.getShifts().find(s => s.id === activeSession.shiftId);
  const cashier = dbStore.getUserById(activeSession.cashierId);

  // Compute live real-time stats for this session
  const orders = dbStore.getOrders().filter(
    o => o.shiftSessionId === activeSession.id && o.paymentStatus === 'PAID'
  );

  const payments = dbStore.getPayments().filter(
    p => p.status === 'PAID' && orders.some(o => o.id === p.orderId)
  );

  const cashIn = payments.filter(p => p.method === 'CASH').reduce((acc, p) => acc + p.amount, 0);
  const qrisIn = payments.filter(p => p.method === 'QRIS').reduce((acc, p) => acc + p.amount, 0);
  const transferIn = payments.filter(p => p.method === 'BANK_TRANSFER').reduce((acc, p) => acc + p.amount, 0);
  const debitIn = payments.filter(p => p.method === 'DEBIT_CREDIT').reduce((acc, p) => acc + p.amount, 0);

  // Refunds
  const refunds = dbStore.getRefunds().filter(
    r => r.approvalStatus === 'APPROVED' && r.executionStatus === 'EXECUTED' &&
    orders.some(o => o.id === r.orderId)
  );
  const cashRefunds = refunds.filter(r => {
    const p = payments.find(pay => pay.id === r.paymentId);
    return p?.method === 'CASH';
  }).reduce((acc, r) => acc + r.amount, 0);

  const expectedDrawerCash = activeSession.openingCash + cashIn - cashRefunds;

  return NextResponse.json({
    hasActiveSession: true,
    session: {
      ...activeSession,
      shiftName: shiftConfig?.name || 'Shift Aktif',
      startTime: shiftConfig?.startTime,
      endTime: shiftConfig?.endTime,
      cashierName: cashier?.name || 'Kasir',
      stats: {
        totalOrders: orders.length,
        cashIn,
        qrisIn,
        transferIn,
        debitIn,
        totalSales: cashIn + qrisIn + transferIn + debitIn,
        cashRefunds,
        expectedDrawerCash,
      },
    },
  });
}
