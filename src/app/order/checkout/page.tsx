'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Coffee, ArrowLeft, ArrowRight, ShoppingBag, QrCode,
  Building2, CheckCircle2, AlertCircle, ShieldCheck
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';

export default function CustomerCheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'QRIS' | 'BANK_TRANSFER'>('QRIS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('kopi_noka_customer_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length === 0) {
          router.push('/order');
        }
        setCart(parsed);
      } else {
        router.push('/order');
      }
    } catch (e) {
      router.push('/order');
    }
  }, [router]);

  const subtotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!customerName) {
      setError('Nama pemesan wajib diisi');
      return;
    }

    if (orderType === 'DINE_IN' && !tableNumber) {
      setError('Nomor meja wajib diisi untuk makan di tempat (Dine-in)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Submit online order
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'ONLINE',
          items: cart,
          customerName,
          customerContact,
          tableNumber: orderType === 'DINE_IN' ? tableNumber : 'Takeaway',
          notes,
          discountPercent: 0,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error);

      // 2. Clear customer cart
      localStorage.removeItem('kopi_noka_customer_cart');

      // 3. Redirect to live order tracking page
      router.push(`/order/status/${orderData.order.orderNumber}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-16 text-stone-900">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            href="/order"
            className="flex items-center space-x-1 text-xs font-semibold text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Menu</span>
          </Link>
          <div className="font-extrabold text-sm tracking-tight text-brand-red font-display">
            CHECKOUT PESANAN
          </div>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 pt-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCheckout} className="space-y-5">
          {/* 1. Customer Info */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3.5">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-400">
              Informasi Pemesan
            </h3>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Andi Pratama"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nomor WhatsApp / HP (Opsional)
              </label>
              <input
                type="tel"
                value={customerContact}
                onChange={(e) => setCustomerContact(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 outline-none focus:border-brand-red"
              />
            </div>
          </div>

          {/* 2. Dine-In vs Takeaway */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-400">
              Tipe Pesanan
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('DINE_IN')}
                className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  orderType === 'DINE_IN'
                    ? 'border-brand-red bg-red-50 text-brand-red shadow-sm'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                Makan di Tempat (Dine-In)
              </button>
              <button
                type="button"
                onClick={() => setOrderType('TAKEAWAY')}
                className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  orderType === 'TAKEAWAY'
                    ? 'border-brand-red bg-red-50 text-brand-red shadow-sm'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                Bungkus (Takeaway)
              </button>
            </div>

            {orderType === 'DINE_IN' && (
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nomor Meja Anda *
                </label>
                <input
                  type="text"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Contoh: 08 atau Meja Bar"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-300 font-bold outline-none focus:border-brand-red"
                />
              </div>
            )}
          </div>

          {/* 3. Items Summary */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-400 mb-3">
              Ringkasan Pesanan ({cart.length} menu)
            </h3>

            <div className="space-y-2.5 divide-y divide-stone-100 text-xs">
              {cart.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between">
                  <div>
                    <div className="font-bold text-stone-900">
                      {item.quantity}x {item.name}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {item.size} • {item.sugarLevel} • {item.iceLevel}
                    </div>
                    {item.notes && (
                      <div className="text-[10px] text-amber-700 italic">
                        Catatan: {item.notes}
                      </div>
                    )}
                  </div>
                  <div className="font-black text-stone-900">
                    {formatRupiah(item.lineTotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-stone-200 mt-3 flex justify-between items-center text-sm">
              <span className="font-bold text-stone-700">Total Pembayaran</span>
              <span className="font-black text-brand-red text-base">{formatRupiah(subtotal)}</span>
            </div>
          </div>

          {/* 4. Payment Selection */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-400">
              Metode Pembayaran
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                  paymentMethod === 'QRIS'
                    ? 'border-brand-red bg-red-50 text-brand-red font-bold'
                    : 'border-stone-200 text-stone-700'
                }`}
              >
                <QrCode className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold">QRIS Dinamis</div>
                  <div className="text-[10px] text-stone-500 font-normal">Semua e-Wallet / Bank</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-brand-red bg-red-50 text-brand-red font-bold'
                    : 'border-stone-200 text-stone-700'
                }`}
              >
                <Building2 className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-bold">Transfer BCA</div>
                  <div className="text-[10px] text-stone-500 font-normal">Konfirmasi Kasir</div>
                </div>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-red hover:bg-brand-red-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
          >
            <span>{loading ? 'Membuat Pesanan...' : 'Bayar Sekarang & Buat Pesanan'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </main>
    </div>
  );
}
