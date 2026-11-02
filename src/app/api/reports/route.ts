import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request, ['ADMIN', 'CASHIER']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const filterPeriod = searchParams.get('period') || 'today'; // today | 7days | 30days | all
  const shiftSessionId = searchParams.get('shiftSessionId');
  const cashierId = searchParams.get('cashierId');
  const method = searchParams.get('method');
  const format = searchParams.get('format'); // 'csv' or json

  let orders = dbStore.getOrders();
  let payments = dbStore.getPayments();
  let refunds = dbStore.getRefunds().filter(r => r.approvalStatus === 'APPROVED' && r.executionStatus === 'EXECUTED');

  // Filter by Date Range (Asia/Makassar)
  const now = new Date();
  if (filterPeriod === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    orders = orders.filter(o => o.createdAt.startsWith(todayStr));
  } else if (filterPeriod === '7days') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    orders = orders.filter(o => new Date(o.createdAt) >= sevenDaysAgo);
  } else if (filterPeriod === '30days') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    orders = orders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
  }

  if (shiftSessionId) {
    orders = orders.filter(o => o.shiftSessionId === shiftSessionId);
  }

  if (cashierId) {
    orders = orders.filter(o => o.cashierId === cashierId);
  }

  // Filter payments associated with filtered orders
  const filteredOrderIds = new Set(orders.map(o => o.id));
  payments = payments.filter(p => filteredOrderIds.has(p.orderId) && p.status === 'PAID');
  refunds = refunds.filter(r => filteredOrderIds.has(r.orderId));

  if (method) {
    payments = payments.filter(p => p.method === method);
  }

  // STRICT FINANCIAL CALCULATIONS (Section 9)
  // 1. Omzet Kotor (Gross Turnover) = sum of all subtotal for non-failed valid orders
  const validOrders = orders.filter(o => o.status !== 'CANCELLED' || o.paymentStatus === 'REFUNDED');
  const grossTurnover = validOrders.reduce((acc, o) => acc + o.subtotal, 0);

  // 2. Total Diskon
  const totalDiscounts = validOrders.reduce((acc, o) => acc + o.discountAmount, 0);

  // 3. Total Refund
  const totalRefunds = refunds.reduce((acc, r) => acc + r.amount, 0);

  // 4. Penjualan Bersih (Net Sales) = Omzet Kotor - Diskon - Refund
  const netSales = Math.max(0, grossTurnover - totalDiscounts - totalRefunds);

  // 5. Penerimaan Pembayaran per Metode (Actual collections)
  const paymentBreakdown = {
    CASH: payments.filter(p => p.method === 'CASH').reduce((acc, p) => acc + p.amount, 0),
    QRIS: payments.filter(p => p.method === 'QRIS').reduce((acc, p) => acc + p.amount, 0),
    BANK_TRANSFER: payments.filter(p => p.method === 'BANK_TRANSFER').reduce((acc, p) => acc + p.amount, 0),
    DEBIT_CREDIT: payments.filter(p => p.method === 'DEBIT_CREDIT').reduce((acc, p) => acc + p.amount, 0),
  };
  const totalCollections = Object.values(paymentBreakdown).reduce((a, b) => a + b, 0);

  // 6. Biaya Transaksi Pembayaran (Payment Gateway / EDC MDR Fees)
  const totalFees = payments.reduce((acc, p) => acc + p.feeAmount, 0);

  // 7. Pendapatan Setelah Diskon dan Biaya Pembayaran (Net Operational Revenue)
  const netOperationalRevenue = Math.max(0, netSales - totalFees);

  // Shift & Cash Difference Summary
  const sessions = dbStore.getShiftSessions();
  const relevantSessions = shiftSessionId
    ? sessions.filter(s => s.id === shiftSessionId)
    : sessions.filter(s => s.closedAt);
  const totalCashDifference = relevantSessions.reduce((acc, s) => acc + (s.cashDifference || 0), 0);

  // Product sales ranking
  const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const o of validOrders) {
    if (o.items) {
      for (const item of o.items) {
        const existing = productSalesMap.get(item.productId) || {
          name: item.productNameSnapshot,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.lineTotal;
        productSalesMap.set(item.productId, existing);
      }
    }
  }
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  // Handle CSV Export
  if (format === 'csv') {
    let csv = 'METRIK KEUANGAN,JUMLAH (RP)\r\n';
    csv += `Omzet Kotor (Gross Turnover),${grossTurnover}\r\n`;
    csv += `Total Diskon,${totalDiscounts}\r\n`;
    csv += `Total Refund,${totalRefunds}\r\n`;
    csv += `Penjualan Bersih (Net Sales),${netSales}\r\n`;
    csv += `Total Penerimaan Kas (Tunai),${paymentBreakdown.CASH}\r\n`;
    csv += `Total Penerimaan QRIS,${paymentBreakdown.QRIS}\r\n`;
    csv += `Total Penerimaan Transfer Bank,${paymentBreakdown.BANK_TRANSFER}\r\n`;
    csv += `Total Penerimaan Debit/Kredit EDC,${paymentBreakdown.DEBIT_CREDIT}\r\n`;
    csv += `Biaya Transaksi Pembayaran (MDR),${totalFees}\r\n`;
    csv += `Pendapatan Setelah Diskon & Biaya Gateway,${netOperationalRevenue}\r\n`;
    csv += `Total Selisih Kas Penutupan Shift,${totalCashDifference}\r\n\r\n`;

    csv += 'RINCIAN TRANSAKSI PESANAN\r\n';
    csv += 'No. Pesanan,Waktu,Sumber,Metode,Subtotal,Diskon,Total,Status\r\n';
    for (const o of orders) {
      const pm = payments.find(p => p.orderId === o.id)?.method || '-';
      csv += `"${o.orderNumber}","${formatDateTime(o.createdAt)}","${o.source}","${pm}",${o.subtotal},${o.discountAmount},${o.totalAmount},"${o.status}"\r\n`;
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Laporan_Kopi_Noka_${filterPeriod}.csv"`,
      },
    });
  }

  return NextResponse.json({
    success: true,
    filter: { period: filterPeriod, shiftSessionId, cashierId, method },
    summary: {
      totalOrders: orders.length,
      grossTurnover,
      totalDiscounts,
      totalRefunds,
      netSales,
      paymentBreakdown,
      totalCollections,
      totalFees,
      netOperationalRevenue,
      totalCashDifference,
      // Transparent COGS disclaimers as required in Section 9E and 9F
      grossMarginNotice: 'HPP (Harga Pokok Penjualan) belum dicatat untuk periode ini. Angka laba kotor tidak dapat dikarang.',
      netProfitNotice: 'Biaya operasional sewa, listrik, dan gaji belum dimasukkan ke sistem. Pendapatan di atas adalah pendapatan operasional setelah diskon dan biaya gateway.',
    },
    topProducts,
    recentOrders: orders.slice(0, 20),
  });
}
