import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { getCurrentUser } from '@/lib/auth';
import { Order, OrderItem } from '@/lib/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      source = 'POS',
      items,
      customerName,
      customerContact,
      tableNumber,
      discountPercent = 0,
      notes,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Pesanan harus memiliki minimal 1 item produk' },
        { status: 400 }
      );
    }

    const currentUser = getCurrentUser(request);
    let shiftSessionId: string | undefined = undefined;

    // Rule: For POS orders, cashier must be logged in and must have an active shift open
    if (source === 'POS') {
      if (!currentUser) {
        return NextResponse.json(
          { error: 'Sesi kasir tidak valid. Silakan login kembali.' },
          { status: 401 }
        );
      }

      const activeSession = dbStore.getActiveShiftSession(
        currentUser.role === 'CASHIER' ? currentUser.id : undefined
      );

      if (!activeSession) {
        return NextResponse.json(
          {
            error: 'Shift belum dibuka. Kasir wajib membuka shift dengan modal awal sebelum melakukan transaksi.',
            code: 'SHIFT_NOT_OPEN',
          },
          { status: 400 }
        );
      }
      shiftSessionId = activeSession.id;
    }

    // Server-Side Price & Stock Validation
    const allProducts = dbStore.getProducts();
    const allVariants = dbStore.getProductVariants();

    let computedSubtotal = 0;
    const orderItemsToCreate: OrderItem[] = [];
    const tempOrderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    for (const item of items) {
      const product = allProducts.find(p => p.id === item.productId);
      if (!product || !product.isAvailable) {
        return NextResponse.json(
          { error: `Produk "${item.name || item.productId}" tidak tersedia atau dinonaktifkan.` },
          { status: 400 }
        );
      }

      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Stok "${product.name}" tidak mencukupi (Tersisa: ${product.stockQuantity}, Diminta: ${item.quantity}).` },
          { status: 400 }
        );
      }

      // Check variant price if provided
      let additionalPrice = 0;
      let variantName = '';
      if (item.variantId) {
        const variant = allVariants.find(v => v.id === item.variantId && v.productId === product.id);
        if (variant && variant.isActive) {
          additionalPrice = variant.additionalPrice;
          variantName = variant.name;
        }
      }

      const verifiedUnitPrice = product.price + additionalPrice;
      const lineTotal = verifiedUnitPrice * item.quantity;
      computedSubtotal += lineTotal;

      orderItemsToCreate.push({
        id: `oi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        orderId: tempOrderId,
        productId: product.id,
        productNameSnapshot: product.name,
        quantity: item.quantity,
        unitPriceSnapshot: verifiedUnitPrice,
        discountAmount: 0,
        lineTotal,
        variantSnapshot: variantName || undefined,
        customizationSnapshot: item.customization || undefined,
        notes: item.notes || '',
      });
    }

    // Server-Side Discount Validation
    const maxDiscountPercent = Number(
      dbStore.getAppSetting('cashier_max_discount_percent', '15')
    );

    const requestedDiscountPercent = Math.max(0, Number(discountPercent) || 0);

    // If POS and user is CASHIER, check max discount limit
    if (source === 'POS' && currentUser?.role === 'CASHIER') {
      if (requestedDiscountPercent > maxDiscountPercent) {
        return NextResponse.json(
          {
            error: `Diskon melebihi batas izin kasir (${maxDiscountPercent}%). Diperlukan persetujuan Admin.`,
            code: 'DISCOUNT_LIMIT_EXCEEDED',
          },
          { status: 400 }
        );
      }
    }

    const discountAmount = Math.round((computedSubtotal * requestedDiscountPercent) / 100);
    const totalAmount = Math.max(0, computedSubtotal - discountAmount);

    // Generate Safe Unique Monotonic Order Number (e.g. KN-261102-001)
    const orderNumber = await dbStore.generateNextOrderNumber();

    const newOrder: Order = {
      id: tempOrderId,
      orderNumber,
      source: source as 'POS' | 'ONLINE',
      cashierId: currentUser?.id,
      shiftSessionId,
      customerName: customerName || (source === 'ONLINE' ? 'Pelanggan Online' : 'Pelanggan Kasir'),
      customerContact: customerContact || '',
      tableNumber: tableNumber || '',
      status: 'PENDING_PAYMENT',
      paymentStatus: 'PENDING',
      subtotal: computedSubtotal,
      discountAmount,
      totalAmount,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Fix orderId on items
    orderItemsToCreate.forEach(i => (i.orderId = newOrder.id));

    // Save Order Atomically
    const created = await dbStore.createOrder(newOrder, orderItemsToCreate);

    await dbStore.logAudit({
      userId: currentUser?.id,
      action: 'ORDER_CREATED',
      entityType: 'orders',
      entityId: created.id,
      details: JSON.stringify({
        orderNumber: created.orderNumber,
        source: created.source,
        total: created.totalAmount,
        itemCount: orderItemsToCreate.length,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Pesanan berhasil dibuat',
      order: {
        ...created,
        items: orderItemsToCreate,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Gagal membuat pesanan', details: err.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shiftSessionId = searchParams.get('shiftSessionId');
  const cashierId = searchParams.get('cashierId');
  const status = searchParams.get('status');
  const paymentStatus = searchParams.get('paymentStatus');
  const source = searchParams.get('source');
  const limit = Number(searchParams.get('limit')) || 100;

  let orders = dbStore.getOrders();

  if (shiftSessionId) {
    orders = orders.filter(o => o.shiftSessionId === shiftSessionId);
  }

  if (cashierId) {
    orders = orders.filter(o => o.cashierId === cashierId);
  }

  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  if (paymentStatus) {
    orders = orders.filter(o => o.paymentStatus === paymentStatus);
  }

  if (source) {
    orders = orders.filter(o => o.source === source);
  }

  // Sort newest first
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({
    success: true,
    data: orders.slice(0, limit),
  });
}
