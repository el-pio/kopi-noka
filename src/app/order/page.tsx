'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Coffee, ShoppingBag, Search, Plus, Minus, X, ArrowRight,
  Sparkles, Check, ChevronRight, MapPin, Clock
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  stockQuantity: number;
  categoryId: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
}

interface CustomerCartItem {
  id: string;
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  size: string;
  sugarLevel: string;
  iceLevel: string;
  notes: string;
}

export default function CustomerOrderPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  // Customization state
  const [size, setSize] = useState('Regular');
  const [sugar, setSugar] = useState('Normal 100%');
  const [ice, setIce] = useState('Normal Ice');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Load persisted cart from localStorage if exists
    try {
      const saved = localStorage.getItem('kopi_noka_customer_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {}

    fetchData();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('kopi_noka_customer_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  const fetchData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products?availableOnly=true'),
      ]);
      const catData = await catRes.json();
      const prodData = await prodRes.json();

      if (catData.success) setCategories(catData.data);
      if (prodData.success) setProducts(prodData.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchQuery =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchQuery;
  });

  const cartTotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const openCustomizeModal = (p: Product) => {
    setCustomizingProduct(p);
    setSize('Regular');
    setSugar('Normal 100%');
    setIce('Normal Ice');
    setNotes('');
  };

  const handleAddToCart = () => {
    if (!customizingProduct) return;

    const additionalPrice = size === 'Large' ? 4000 : 0;
    const unitPrice = customizingProduct.price + additionalPrice;
    const key = `${customizingProduct.id}_${size}_${sugar}_${ice}_${notes}`;

    const existingIndex = cart.findIndex((i) => i.id === key);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].lineTotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: key,
          productId: customizingProduct.id,
          name: customizingProduct.name,
          unitPrice,
          quantity: 1,
          lineTotal: unitPrice,
          size,
          sugarLevel: sugar,
          iceLevel: ice,
          notes,
        },
      ]);
    }

    setCustomizingProduct(null);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28 text-stone-900">
      {/* Brand Header */}
      <header className="bg-brand-red text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-white text-brand-red rounded-xl flex items-center justify-center font-black shadow-inner">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight font-display">KOPI NOKA</h1>
              <p className="text-[10px] text-red-100 font-medium">Pesan Online • Makassar</p>
            </div>
          </Link>

          <Link
            href="/pos"
            className="text-xs bg-white text-brand-red font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-stone-100"
          >
            Portal Kasir
          </Link>
        </div>

        {/* Search */}
        <div className="max-w-3xl mx-auto px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kopi favorit Anda..."
              className="w-full bg-white text-stone-900 text-xs pl-9 pr-4 py-2.5 rounded-xl shadow-sm outline-none placeholder:text-stone-400"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 pt-4">
        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-brand-red text-white shadow-sm'
                : 'bg-white text-stone-700 border border-stone-200'
            }`}
          >
            Semua
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-brand-red text-white shadow-sm'
                  : 'bg-white text-stone-700 border border-stone-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Product List */}
        <div className="space-y-3">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => openCustomizeModal(p)}
              className="bg-white rounded-2xl p-3 border border-stone-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-brand-red transition-all group active:scale-[0.99]"
            >
              <div className="flex items-center space-x-3.5 flex-1 pr-3">
                <div className="w-20 h-20 rounded-xl bg-stone-100 overflow-hidden flex-shrink-0 relative">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <Coffee className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 group-hover:text-brand-red transition-colors">
                    {p.name}
                  </h3>
                  {p.description && (
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{p.description}</p>
                  )}
                  <div className="mt-2 font-black text-brand-red text-sm">
                    {formatRupiah(p.price)}
                  </div>
                </div>
              </div>

              <div className="w-9 h-9 rounded-xl bg-red-50 text-brand-red flex items-center justify-center flex-shrink-0 group-hover:bg-brand-red group-hover:text-white transition-colors">
                <Plus className="w-5 h-5" />
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 shadow-2xl">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <div className="text-[11px] text-stone-500 font-medium">
                {cartItemCount} item pesanan
              </div>
              <div className="text-lg font-black text-brand-red">
                {formatRupiah(cartTotal)}
              </div>
            </div>

            <Link
              href="/order/checkout"
              className="bg-brand-red hover:bg-brand-red-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-2"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Product Customization Modal */}
      {customizingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base text-stone-900">{customizingProduct.name}</h3>
                <p className="text-xs text-brand-red font-bold">{formatRupiah(customizingProduct.price)}</p>
              </div>
              <button
                onClick={() => setCustomizingProduct(null)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {/* Size */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5 uppercase tracking-wider text-[11px]">
                  Pilih Ukuran
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Regular', 'Large'].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSize(sz)}
                      className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                        size === sz
                          ? 'border-brand-red bg-red-50 text-brand-red'
                          : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      <div>{sz}</div>
                      <div className="text-[10px] text-stone-400 font-normal">
                        {sz === 'Large' ? '+Rp 4.000' : 'Harga dasar'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5 uppercase tracking-wider text-[11px]">
                  Tingkat Kemanisan (Sugar)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Normal 100%', 'Less Sugar 70%', 'Low Sugar 50%', 'No Sugar 0%'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setSugar(lvl)}
                      className={`p-2 rounded-xl border text-left font-semibold ${
                        sugar === lvl
                          ? 'border-brand-red bg-red-50 text-brand-red'
                          : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ice */}
              <div>
                <label className="font-bold text-stone-700 block mb-1.5 uppercase tracking-wider text-[11px]">
                  Tingkat Es (Ice)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Normal Ice', 'Less Ice', 'No Ice'].map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setIce(ic)}
                      className={`p-2 rounded-xl border text-center font-semibold ${
                        ice === ic
                          ? 'border-brand-red bg-red-50 text-brand-red'
                          : 'border-stone-200 text-stone-700'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-stone-700 block mb-1 uppercase tracking-wider text-[11px]">
                  Catatan untuk Barista
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Kurangi es batu"
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 outline-none focus:border-brand-red text-xs"
                />
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50">
              <button
                onClick={handleAddToCart}
                className="w-full py-3 bg-brand-red hover:bg-brand-red-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Tambahkan ke Keranjang (
                {formatRupiah(customizingProduct.price + (size === 'Large' ? 4000 : 0))})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
