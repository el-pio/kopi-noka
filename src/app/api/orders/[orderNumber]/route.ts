import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { ThermalPrinterFormatter } from '@/lib/printer';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  const orderNumber = params.orderNumber;
  const order = dbStore.getOrderById(orderNumber);

  if (!order) {
    return NextResponse.json(
      { error: `Pesanan dengan nomor #${orderNumber} tidak ditemukan.` },
      { status: 404 }
    );
  }

  // Pre-generate customer and barista receipt preview text
  const cashier = order.cashierId ? dbStore.getUserById(order.cashierId) : null;
  const cashierName = cashier ? cashier.name : 'Kasir Kopi Noka';

  const customerReceiptText = ThermalPrinterFormatter.generateCustomerReceipt(
    order,
    order.items || [],
    cashierName,
    '58mm'
  );

  const baristaTicketText = ThermalPrinterFormatter.generateBaristaTicket(
    order,
    order.items || [],
    '80mm'
  );

  return NextResponse.json({
    success: true,
    data: {
      ...order,
      cashierName,
      receiptPreview: customerReceiptText,
      baristaTicketPreview: baristaTicketText,
    },
  });
}
