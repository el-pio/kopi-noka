import { NextRequest, NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get('categoryId');
  const search = searchParams.get('search')?.toLowerCase();
  const availableOnly = searchParams.get('availableOnly') === 'true';

  let products = dbStore.getProducts();
  const variants = dbStore.getProductVariants();

  if (categoryId && categoryId !== 'all') {
    products = products.filter(p => p.categoryId === categoryId);
  }

  if (search) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(search) ||
      (p.description && p.description.toLowerCase().includes(search))
    );
  }

  if (availableOnly) {
    products = products.filter(p => p.isAvailable && p.stockQuantity > 0);
  }

  const result = products.map(p => ({
    ...p,
    variants: variants.filter(v => v.productId === p.id && v.isActive),
  }));

  return NextResponse.json({ success: true, data: result });
}

export async function POST(request: NextRequest) {
  // Only Admin can create/update products or modify prices
  const auth = requireAuth(request, ['ADMIN']);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const { id, name, categoryId, price, stockQuantity, minimumStock, isAvailable, description, imageUrl } = body;

    if (!name || price === undefined || price < 0) {
      return NextResponse.json(
        { error: 'Nama dan harga produk wajib diisi dengan benar' },
        { status: 400 }
      );
    }

    const saved = await dbStore.saveProduct({
      id,
      name,
      categoryId,
      price: Number(price),
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 0,
      minimumStock: minimumStock !== undefined ? Number(minimumStock) : 5,
      isAvailable: isAvailable ?? true,
      description,
      imageUrl,
    });

    await dbStore.logAudit({
      userId: auth.user.id,
      action: id ? 'PRODUCT_UPDATED' : 'PRODUCT_CREATED',
      entityType: 'products',
      entityId: saved.id,
      details: JSON.stringify({ name: saved.name, price: saved.price, stock: saved.stockQuantity }),
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
