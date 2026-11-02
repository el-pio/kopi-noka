'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Coffee, Search, ShoppingBag, Plus, Minus, Trash2, Tag,
  Clock, CheckCircle2, AlertTriangle, Printer, RotateCcw,
  ArrowRight, X, User, DollarSign, QrCode, CreditCard,
  Building2, LogOut, ShieldAlert, Sparkles, ChefHat
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stockQuantity: number;
  minimumStock: number;
  categoryId: string;
  description?: string;
  variants?: { id: string; name: string; additionalPrice: number }[];
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  variantId?: string;
  variantName?: string;
  customization?: {
    size?: string;
    sugarLevel?: string;
    iceLevel?: string;
  };
  notes?: string;
}

export default function PosPage() {
  const router = useRouter();

  // State: Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // State: User & Shift Session
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isOpeningShift, setIsOpeningShift] = useState<boolean>(false);
  const [openingCashInput, setOpeningCashInput] = useState<number>(100000);
  const [isClosingShift, setIsClosingShift] = useState<boolean>(false);
  const [actualCashInput, setActualCashInput] = useState<number>(0);
  const [closingNoteInput, setClosingNoteInput] = useState<string>('');
  const [closeShiftSummary, setCloseShiftSummary] = useState<any>(null);

  // State: Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // State: Variant Modal
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('Regular');
  const [selectedSugar, setSelectedSugar] = useState<string>('Normal 100%');
  const [selectedIce, setSelectedIce] = useState<string>('Normal Ice');
  const [itemNote, setItemNote] = useState<string>('');

  // State: Checkout & Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS' | 'DEBIT_CREDIT' | 'BANK_TRANSFER'>('CASH');
  const [receivedCash, setReceivedCash] = useState<number>(0);
  const [cardTraceNumber, setCardTraceNumber] = useState<string>('');
  const [qrisData, setQrisData] = useState<any>(null);
  const [qrisLoading, setQrisLoading] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string>('');

  // State: Post Payment / Receipt Modal
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [activeReceiptTab, setActiveReceiptTab] = useState<'CUSTOMER' | 'BARISTA'>('CUSTOMER');

  // Load Initial Data & Session Check
  useEffect(() => {
    fetchSession();
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!res.ok || !data.authenticated) {
        router.push('/login');
        return;
      }
      setCurrentUser(data.user);
      checkActiveShift();
    } catch (err) {
      router.push('/login');
    }
  };

  const checkActiveShift = async () => {
    try {
      const res = await fetch('/api/shifts/sessions/active');
      const data = await res.json();
      if (data.hasActiveSession) {
        setActiveSession(data.session);
      } else {
        setActiveSession(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Computations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.lineTotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  const changeAmount = useMemo(() => {
    return Math.max(0, receivedCash - grandTotal);
  }, [receivedCash, grandTotal]);

  // Handlers: Open & Close Shift
  const handleOpenShift = async () => {
    try {
      const res = await fetch('/api/shifts/sessions/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: 'shf_01', // Default shift 1
          openingCash: openingCashInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsOpeningShift(false);
      checkActiveShift();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCloseShift = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch('/api/shifts/sessions/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeSession.id,
          actualCash: actualCashInput,
          closingNote: closingNoteInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCloseShiftSummary(data.reconciliation);
      checkActiveShift();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handlers: Product Selection & Cart
  const handleSelectProduct = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert(`Stok produk "${product.name}" saat ini habis.`);
      return;
    }
    // Open variant selector
    setCustomizingProduct(product);
    setSelectedSize('Regular');
    setSelectedSugar('Normal 100%');
    setSelectedIce('Normal Ice');
    setItemNote('');
  };

  const handleConfirmAddProduct = () => {
    if (!customizingProduct) return;

    let additionalPrice = 0;
    let variantId: string | undefined = undefined;
    let variantName = selectedSize;

    if (selectedSize === 'Large') {
      const largeVar = customizingProduct.variants?.find((v) => v.name.includes('Large'));
      additionalPrice = largeVar ? largeVar.additionalPrice : 4000;
      variantId = largeVar?.id;
    }

    const unitPrice = customizingProduct.price + additionalPrice;
    const itemKey = `${customizingProduct.id}_${selectedSize}_${selectedSugar}_${selectedIce}_${itemNote}`;

    const existingIndex = cart.findIndex((item) => item.id === itemKey);

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].lineTotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      const newItem: CartItem = {
        id: itemKey,
        productId: customizingProduct.id,
        name: customizingProduct.name,
        unitPrice,
        quantity: 1,
        lineTotal: unitPrice,
        variantId,
        variantName,
        customization: {
          size: selectedSize,
          sugarLevel: selectedSugar,
          iceLevel: selectedIce,
        },
        notes: itemNote,
      };
      setCart([...cart, newItem]);
    }

    setCustomizingProduct(null);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: newQty,
              lineTotal: newQty * item.unitPrice,
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Handlers: Checkout & Payment
  const handleOpenPayment = async () => {
    if (cart.length === 0) return;

    if (!activeSession) {
      setIsOpeningShift(true);
      return;
    }

    setPaymentError('');
    setReceivedCash(grandTotal);
    setIsPaymentModalOpen(true);

    // If QRIS selected, pre-generate
    if (paymentMethod === 'QRIS') {
      await generateQRISForCart();
    }
  };

  const generateQRISForCart = async () => {
    setQrisLoading(true);
    setPaymentError('');
    try {
      // First create order in PENDING status
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'POS',
          items: cart,
          customerName: customerName || 'Pelanggan POS',
          tableNumber: orderType === 'DINE_IN' ? tableNumber : 'Takeaway',
          discountPercent,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // Now generate QRIS
      const qrisRes = await fetch('/api/payments/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.order.id }),
      });
      const qrisResult = await qrisRes.json();
      if (!qrisRes.ok) throw new Error(qrisResult.error);

      setQrisData({
        ...qrisResult.data,
        orderId: orderData.order.id,
      });
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setQrisLoading(false);
    }
  };

  const handleProcessCashPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      // 1. Create order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'POS',
          items: cart,
          customerName: customerName || 'Pelanggan Kasir',
          tableNumber: orderType === 'DINE_IN' ? tableNumber : 'Takeaway',
          discountPercent,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // 2. Process Cash Payment
      const payRes = await fetch('/api/payments/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.order.id,
          receivedAmount: receivedCash,
          idempotencyKey: `cash_${orderData.order.id}_${Date.now()}`,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error);

      // Fetch preview receipt
      const receiptRes = await fetch(`/api/orders/${orderData.order.orderNumber}`);
      const receiptData = await receiptRes.json();

      setCompletedOrder(receiptData.data);
      setIsPaymentModalOpen(false);
      setCart([]);
      setTableNumber('');
      setCustomerName('');
      setDiscountPercent(0);
      fetchProducts(); // Refresh stock
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleProcessCardPayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError('');

    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'POS',
          items: cart,
          customerName: customerName || 'Pelanggan Kasir',
          tableNumber: orderType === 'DINE_IN' ? tableNumber : 'Takeaway',
          discountPercent,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      const payRes = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.order.id,
          method: 'DEBIT_CREDIT',
          referenceNumber: cardTraceNumber || `EDC_${Date.now()}`,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.error);

      const receiptRes = await fetch(`/api/orders/${orderData.order.orderNumber}`);
      const receiptData = await receiptRes.json();

      setCompletedOrder(receiptData.data);
      setIsPaymentModalOpen(false);
      setCart([]);
      setTableNumber('');
      setCustomerName('');
      setDiscountPercent(0);
      fetchProducts();
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSimulateQRISSuccess = async () => {
    if (!qrisData) return;
    setIsProcessingPayment(true);
    try {
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: qrisData.orderId,
          method: 'QRIS',
          referenceNumber: qrisData.transactionId,
          isSimulation: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const receiptRes = await fetch(`/api/orders/${qrisData.orderNumber}`);
      const receiptData = await receiptRes.json();

      setCompletedOrder(receiptData.data);
      setIsPaymentModalOpen(false);
      setCart([]);
      setTableNumber('');
      setCustomerName('');
      setDiscountPercent(0);
      fetchProducts();
    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="h-screen bg-stone-100 flex flex-col overflow-hidden text-stone-900">
      {/* Top Navbar */}
      <header className="bg-brand-red text-white h-16 flex items-center justify-between px-4 sm:px-6 shadow-md z-30 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white text-brand-red rounded-xl flex items-center justify-center shadow-inner font-black">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight font-display">KOPI NOKA</span>
              <span className="text-[10px] ml-1.5 px-1.5 py-0.5 bg-red-800 rounded font-bold uppercase tracking-wider">
                POS
              </span>
            </div>
          </Link>

          {/* Active Shift Badge */}
          {activeSession ? (
            <div className="hidden sm:flex items-center space-x-2 bg-red-800/80 px-3 py-1 rounded-lg border border-red-500/40 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">{activeSession.shiftName || 'Shift 1'}</span>
              <span className="text-red-200">• Kasir: {currentUser?.name}</span>
            </div>
          ) : (
            <button
              onClick={() => setIsOpeningShift(true)}
              className="bg-amber-400 hover:bg-amber-300 text-stone-900 text-xs font-bold px-3 py-1 rounded-lg shadow-sm flex items-center space-x-1.5 animate-bounce"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Shift Belum Dibuka! (Buka Sekarang)</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu kopi, non-coffee, snack..."
              className="w-full bg-white text-stone-900 text-xs sm:text-sm pl-9 pr-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-white/80 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {activeSession && (
            <button
              onClick={() => setIsClosingShift(true)}
              className="text-xs bg-red-900/60 hover:bg-red-900 text-white font-medium px-3 py-1.5 rounded-lg border border-red-400/30 transition-colors"
            >
              Tutup Shift
            </button>
          )}

          <Link
            href="/barista"
            className="text-xs bg-white text-brand-red font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-stone-50 transition-colors flex items-center space-x-1"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span className="hidden md:inline">KDS Barista</span>
          </Link>

          <Link
            href="/admin/dashboard"
            className="text-xs bg-red-900/80 hover:bg-red-900 text-white font-medium px-3 py-1.5 rounded-lg border border-red-400/30 transition-colors hidden lg:inline-block"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Layout: 2 Columns (Catalog on left, Cart on right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Catalog */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {/* Category Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-2 flex-shrink-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === 'all'
                  ? 'bg-brand-red text-white shadow-md'
                  : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
              }`}
            >
              Semua Menu ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  selectedCategory === cat.id
                    ? 'bg-brand-red text-white shadow-md'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border border-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {loading ? (
              <div className="h-full flex items-center justify-center text-stone-400 text-sm">
                Memuat menu Kopi Noka...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400">
                <Coffee className="w-12 h-12 mb-2 opacity-40" />
                <p className="text-sm">Tidak ada produk ditemukan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stockQuantity <= 0;
                  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minimumStock;

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      disabled={isOutOfStock}
                      className={`relative bg-white rounded-2xl p-3 border text-left transition-all flex flex-col justify-between group shadow-sm hover:shadow-md active:scale-[0.98] ${
                        isOutOfStock
                          ? 'opacity-50 cursor-not-allowed border-stone-200'
                          : 'border-stone-200 hover:border-brand-red'
                      }`}
                    >
                      <div>
                        {/* Image */}
                        <div className="w-full h-32 rounded-xl bg-stone-100 overflow-hidden mb-2.5 relative">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                              <Coffee className="w-8 h-8" />
                            </div>
                          )}

                          {/* Stock Badges */}
                          {isOutOfStock ? (
                            <span className="absolute top-2 right-2 bg-stone-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
                              Sisa {product.stockQuantity}
                            </span>
                          ) : (
                            <span className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-stone-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                              Stok {product.stockQuantity}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 line-clamp-2 leading-snug group-hover:text-brand-red transition-colors">
                          {product.name}
                        </h4>
                      </div>

                      {/* Price */}
                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="font-black text-brand-red text-sm">
                          {formatRupiah(product.price)}
                        </span>
                        <div className="w-6 h-6 rounded-lg bg-red-50 text-brand-red flex items-center justify-center group-hover:bg-brand-red group-hover:text-white transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart & Checkout Panel */}
        <div className="w-80 lg:w-96 bg-white border-l border-stone-200 flex flex-col flex-shrink-0 shadow-lg">
          {/* Cart Header */}
          <div className="p-4 border-b border-stone-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-base text-stone-900 flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-brand-red" />
                <span>Keranjang Kasir</span>
              </h3>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-stone-400 hover:text-red-600 transition-colors font-medium"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Dine-in vs Takeaway Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl mb-3">
              <button
                onClick={() => setOrderType('DINE_IN')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  orderType === 'DINE_IN' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                Dine-In (Meja)
              </button>
              <button
                onClick={() => setOrderType('TAKEAWAY')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  orderType === 'TAKEAWAY' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'
                }`}
              >
                Bungkus (Takeaway)
              </button>
            </div>

            {/* Inputs: Table & Customer */}
            <div className="grid grid-cols-2 gap-2">
              {orderType === 'DINE_IN' && (
                <div>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="No. Meja (01)"
                    className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-brand-red font-bold"
                  />
                </div>
              )}
              <div className={orderType === 'TAKEAWAY' ? 'col-span-2' : ''}>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Pelanggan"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-stone-200 outline-none focus:border-brand-red"
                />
              </div>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-stone-400 py-12">
                <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-xs font-semibold">Keranjang masih kosong</p>
                <p className="text-[11px] text-stone-400 mt-1">Pilih menu di sebelah kiri</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-stone-900">{item.name}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5">
                        {item.variantName && <span className="font-semibold text-brand-red">{item.variantName} • </span>}
                        {item.customization?.sugarLevel && <span>{item.customization.sugarLevel} • </span>}
                        {item.customization?.iceLevel && <span>{item.customization.iceLevel}</span>}
                      </div>
                      {item.notes && (
                        <div className="text-[10px] text-amber-700 italic mt-0.5">
                          Catatan: {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="font-black text-stone-900">
                      {formatRupiah(item.lineTotal)}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      @{formatRupiah(item.unitPrice)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-white border border-stone-300 text-stone-700 flex items-center justify-center hover:bg-stone-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-stone-900 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-white border border-stone-300 text-stone-700 flex items-center justify-center hover:bg-stone-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-md bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 ml-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary & Pay Button */}
          <div className="p-4 border-t border-stone-200 bg-stone-50">
            {/* Discount selector */}
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-stone-600 font-medium flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                <span>Diskon Kasir:</span>
              </span>
              <div className="flex items-center space-x-1">
                {[0, 5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      discountPercent === pct
                        ? 'bg-brand-red text-white'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-stone-600 mb-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900">{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon ({discountPercent}%)</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-200">
                <span>TOTAL AKHIR</span>
                <span className="text-brand-red text-base">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleOpenPayment}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-brand-red hover:bg-brand-red-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm"
            >
              <span>Bayar Pesanan ({cart.length} item)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Customization / Variant Modal */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-stone-900">{customizingProduct.name}</h3>
                <p className="text-xs text-brand-red font-bold">{formatRupiah(customizingProduct.price)}</p>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
              {/* Size */}
              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider block mb-2">
                  Ukuran Gelas (Size)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Regular', 'Large'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                        selectedSize === sz
                          ? 'border-brand-red bg-red-50 text-brand-red'
                          : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      <div>{sz}</div>
                      <div className="text-[10px] text-stone-400 font-normal">
                        {sz === 'Large' ? '+Rp 4.000' : 'Standar'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar Level */}
              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider block mb-2">
                  Tingkat Gula (Sugar Level)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Normal 100%', 'Less Sugar 70%', 'Low Sugar 50%', 'No Sugar 0%'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setSelectedSugar(lvl)}
                      className={`p-2 rounded-xl border text-left font-medium transition-all ${
                        selectedSugar === lvl
                          ? 'border-brand-red bg-red-50 text-brand-red font-bold'
                          : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ice Level */}
              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider block mb-2">
                  Tingkat Es (Ice Level)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Normal Ice', 'Less Ice', 'No Ice'].map((ice) => (
                    <button
                      key={ice}
                      type="button"
                      onClick={() => setSelectedIce(ice)}
                      className={`p-2 rounded-xl border text-center font-medium transition-all ${
                        selectedIce === ice
                          ? 'border-brand-red bg-red-50 text-brand-red font-bold'
                          : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      {ice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Notes */}
              <div>
                <label className="font-bold text-stone-700 uppercase tracking-wider block mb-1">
                  Catatan Khusus untuk Barista
                </label>
                <input
                  type="text"
                  value={itemNote}
                  onChange={(e) => setItemNote(e.target.value)}
                  placeholder="Contoh: Pisahkan es, sedotan ekstra, oat milk"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 outline-none focus:border-brand-red text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 flex items-center justify-end space-x-2">
              <button
                onClick={() => setCustomizingProduct(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAddProduct}
                className="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-700 text-white text-xs font-bold shadow-md"
              >
                Tambahkan ke Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Checkout & Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Konfirmasi Pembayaran</span>
                <h3 className="font-black text-xl text-stone-900 mt-0.5">
                  Total: {formatRupiah(grandTotal)}
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paymentError && (
              <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-brand-red bg-red-50 text-brand-red font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                  <span>Tunai (Cash)</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setPaymentMethod('QRIS');
                    await generateQRISForCart();
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                    paymentMethod === 'QRIS'
                      ? 'border-brand-red bg-red-50 text-brand-red font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                  <span>QRIS Dinamis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('DEBIT_CREDIT')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                    paymentMethod === 'DEBIT_CREDIT'
                      ? 'border-brand-red bg-red-50 text-brand-red font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Debit / EDC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-brand-red bg-red-50 text-brand-red font-bold shadow-sm'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span>Transfer Bank</span>
                </button>
              </div>

              {/* METHOD 1: CASH */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-2">
                      Uang Diterima dari Pelanggan
                    </label>
                    <input
                      type="number"
                      value={receivedCash || ''}
                      onChange={(e) => setReceivedCash(Number(e.target.value))}
                      className="w-full text-xl font-black px-4 py-3 rounded-xl border-2 border-stone-300 focus:border-brand-red outline-none text-stone-900"
                      placeholder="0"
                    />
                  </div>

                  {/* Quick Money Buttons */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setReceivedCash(grandTotal)}
                      className="py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-xs"
                    >
                      Uang Pas
                    </button>
                    {[20000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setReceivedCash(amt)}
                        className="py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg text-xs"
                      >
                        {formatRupiah(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Change Calculation Box */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="text-stone-500 font-medium">Uang Kembalian:</span>
                      <div className="text-xl font-black text-emerald-600 mt-0.5">
                        {formatRupiah(changeAmount)}
                      </div>
                    </div>
                    {receivedCash < grandTotal && (
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md">
                        Kurang {formatRupiah(grandTotal - receivedCash)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* METHOD 2: QRIS */}
              {paymentMethod === 'QRIS' && (
                <div className="text-center space-y-4">
                  {qrisLoading ? (
                    <div className="py-12 text-stone-400">Membuat QRIS Dinamis...</div>
                  ) : qrisData ? (
                    <div>
                      <div className="inline-block p-3 bg-white border-2 border-stone-200 rounded-2xl shadow-md">
                        <img
                          src={qrisData.qrCodeDataUrl}
                          alt="QRIS Dinamis"
                          className="w-56 h-56 mx-auto object-contain"
                        />
                      </div>
                      <div className="mt-2 text-xs font-bold text-stone-700">
                        NMID: {qrisData.transactionId}
                      </div>
                      <div className="mt-1 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        <span>Mode Simulasi (Ready Webhook)</span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={handleSimulateQRISSuccess}
                          disabled={isProcessingPayment}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center space-x-1.5 mx-auto"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Simulasi: Pelanggan Sudah Scan & Bayar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-stone-400">Gagal memuat QRIS.</div>
                  )}
                </div>
              )}

              {/* METHOD 3: DEBIT / EDC */}
              {paymentMethod === 'DEBIT_CREDIT' && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-stone-700 block mb-1">
                      Nomor Ref / Trace EDC Mesin
                    </label>
                    <input
                      type="text"
                      value={cardTraceNumber}
                      onChange={(e) => setCardTraceNumber(e.target.value)}
                      placeholder="Contoh: BCA-984321 / MANDIRI-12003"
                      className="w-full px-4 py-3 rounded-xl border border-stone-300 font-mono text-xs outline-none focus:border-brand-red"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Gesek atau tap kartu pelanggan pada mesin EDC kasir, masukkan nominal tagihan, dan catat nomor referensi struk mesin EDC di atas.
                  </p>
                </div>
              )}

              {/* METHOD 4: BANK TRANSFER */}
              {paymentMethod === 'BANK_TRANSFER' && (
                <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-200">
                  <div className="font-bold text-stone-900">Rekening Tujuan Kopi Noka:</div>
                  <div className="text-xs text-stone-700 space-y-1">
                    <div>Bank: <strong>BCA Makassar</strong></div>
                    <div>No. Rek: <strong className="font-mono text-brand-red">789-012-3456</strong></div>
                    <div>Atas Nama: <strong>PT KOPI NOKA INDONESIA</strong></div>
                  </div>
                  <p className="text-[10px] text-stone-400 italic">
                    Periksa notifikasi m-Banking atau mutasi kasir sebelum menyelesaikan transaksi.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-100 flex items-center justify-end space-x-2 bg-stone-50">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                Batal
              </button>

              {paymentMethod === 'CASH' && (
                <button
                  type="button"
                  onClick={handleProcessCashPayment}
                  disabled={isProcessingPayment || receivedCash < grandTotal}
                  className="px-6 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Memproses...' : 'Selesaikan Pembayaran Tunai'}
                </button>
              )}

              {paymentMethod === 'DEBIT_CREDIT' && (
                <button
                  type="button"
                  onClick={handleProcessCardPayment}
                  disabled={isProcessingPayment}
                  className="px-6 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
                >
                  {isProcessingPayment ? 'Memproses...' : 'Konfirmasi Transaksi EDC'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Success & Dual Receipt Printing */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Pembayaran Berhasil!</h3>
                  <p className="text-xs text-emerald-100">Pesanan #{completedOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setCompletedOrder(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Tabs (Customer vs Barista) */}
            <div className="flex border-b border-stone-200 bg-stone-100">
              <button
                onClick={() => setActiveReceiptTab('CUSTOMER')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all ${
                  activeReceiptTab === 'CUSTOMER'
                    ? 'bg-white text-brand-red border-b-2 border-brand-red'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Struk Pelanggan (58mm)
              </button>
              <button
                onClick={() => setActiveReceiptTab('BARISTA')}
                className={`flex-1 py-2.5 text-xs font-bold transition-all ${
                  activeReceiptTab === 'BARISTA'
                    ? 'bg-white text-brand-red border-b-2 border-brand-red'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tiket Barista Kitchen (80mm)
              </button>
            </div>

            {/* Preview Thermal Text Box */}
            <div className="p-4 overflow-y-auto flex-1 bg-stone-900 text-emerald-400 font-mono text-[11px] leading-tight select-all">
              <pre className="whitespace-pre-wrap">
                {activeReceiptTab === 'CUSTOMER'
                  ? completedOrder.receiptPreview
                  : completedOrder.baristaTicketPreview}
              </pre>
            </div>

            {/* Hidden Element for window.print() */}
            <div id="printable-receipt" className="hidden">
              <pre className="whitespace-pre-wrap">
                {activeReceiptTab === 'CUSTOMER'
                  ? completedOrder.receiptPreview
                  : completedOrder.baristaTicketPreview}
              </pre>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-stone-200 bg-white flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-bold text-stone-700 hover:bg-stone-50 flex items-center space-x-2"
              >
                <Printer className="w-4 h-4 text-brand-red" />
                <span>Cetak Thermal ({activeReceiptTab})</span>
              </button>

              <button
                onClick={() => setCompletedOrder(null)}
                className="px-6 py-2.5 rounded-xl bg-brand-red hover:bg-brand-red-700 text-white text-xs font-bold shadow-md"
              >
                Selesai / Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Open Shift Session */}
      {isOpeningShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1">Buka Shift Kasir</h3>
            <p className="text-xs text-stone-500 mb-4">
              Masukkan jumlah modal kas awal di laci kasir sebelum memulai transaksi penjualan.
            </p>

            <div className="mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1.5">
                Modal Awal Kas (IDR)
              </label>
              <input
                type="number"
                value={openingCashInput}
                onChange={(e) => setOpeningCashInput(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-xl border border-stone-300 font-bold text-sm outline-none focus:border-brand-red"
                placeholder="100000"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsOpeningShift(false)}
                className="flex-1 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50"
              >
                Batal
              </button>
              <button
                onClick={handleOpenShift}
                className="flex-1 py-2.5 bg-brand-red hover:bg-brand-red-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Buka Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Close Shift Session & Reconciliation */}
      {isClosingShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-stone-900 mb-1">Tutup Shift & Rekonsiliasi Kas</h3>
            <p className="text-xs text-stone-500 mb-4">
              Hitung uang fisik di laci kasir dan masukkan nominalnya untuk menghitung selisih kas secara otomatis.
            </p>

            {closeShiftSummary ? (
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Modal Awal:</span>
                    <span className="font-semibold">{formatRupiah(closeShiftSummary.openingCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Uang Kas Seharusnya:</span>
                    <span className="font-bold text-stone-900">{formatRupiah(closeShiftSummary.expectedCash)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Uang Kas Aktual Dihitung:</span>
                    <span className="font-bold text-stone-900">{formatRupiah(closeShiftSummary.actualCash)}</span>
                  </div>
                  <div className="pt-2 border-t border-stone-200 flex justify-between font-black text-sm">
                    <span>Selisih Kas:</span>
                    <span className={closeShiftSummary.cashDifference === 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {formatRupiah(closeShiftSummary.cashDifference)} ({closeShiftSummary.status})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsClosingShift(false);
                    setCloseShiftSummary(null);
                  }}
                  className="w-full py-2.5 bg-brand-red text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                    Jumlah Uang Tunai Fisik di Laci (IDR)
                  </label>
                  <input
                    type="number"
                    value={actualCashInput || ''}
                    onChange={(e) => setActualCashInput(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 font-bold text-sm outline-none focus:border-brand-red"
                    placeholder="Masukkan hasil hitung fisik"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
                    Catatan Penutupan Shift (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={closingNoteInput}
                    onChange={(e) => setClosingNoteInput(e.target.value)}
                    placeholder="Contoh: Kas pas, mesin EDC berfungsi baik."
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs outline-none focus:border-brand-red"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => setIsClosingShift(false)}
                    className="flex-1 py-2.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-bold hover:bg-stone-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCloseShift}
                    className="flex-1 py-2.5 bg-brand-red hover:bg-brand-red-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Konfirmasi Tutup Shift
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
