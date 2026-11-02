'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Coffee, CheckCircle2, Clock, QrCode, ArrowLeft,
  Sparkles, ChefHat, PackageCheck, AlertCircle, RefreshCw
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

export default function OrderStatusPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;

  const [order, setOrder] = useState<any>(null);
  const [qrisData, setQrisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrder(data.data);

        // If still pending payment, fetch QRIS
        if (data.data.paymentStatus === 'PENDING') {
          fetchQRIS(data.data.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchQRIS = async (orderId: string) => {
    try {
      const res = await fetch('/api/payments/qris', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.success) {
        setQrisData(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Poll status every 4 seconds
  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 4000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  const handleSimulatePayment = async () => {
    if (!order) return;
    setSimulating(true);
    try {
      await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          method: 'QRIS',
          referenceNumber: `SIM_CUST_${Date.now()}`,
          isSimulation: true,
        }),
      });
      await fetchOrder();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 text-sm">
        Memuat status pesanan #{orderNumber}...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4 text-center">
        <AlertCircle className="w-12 h-12 text-stone-300 mb-3" />
        <h2 className="text-lg font-bold text-stone-800">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-stone-500 mt-1 mb-6">
          Nomor pesanan #{orderNumber} tidak terdaftar di sistem Kopi Noka.
        </p>
        <Link
          href="/order"
          className="px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-xl shadow-md"
        >
          Kembali ke Menu
        </Link>
      </div>
    );
  }

  // Determine stage in timeline
  const isPaid = order.paymentStatus === 'PAID';
  const status = order.status; // PENDING_PAYMENT, QUEUED, BREWING, READY, COMPLETED, CANCELLED

  const steps = [
    { key: 'PENDING_PAYMENT', title: 'Menunggu Pembayaran', desc: 'Scan QRIS untuk menyelesaikan pembayaran' },
    { key: 'QUEUED', title: 'Antrean Barista', desc: 'Pesanan masuk ke dapur racik' },
    { key: 'BREWING', title: 'Sedang Dibuat', desc: 'Barista sedang meracik kopi Anda' },
    { key: 'READY', title: 'Siap Diambil', desc: 'Silakan ambil di bar pengambilan' },
    { key: 'COMPLETED', title: 'Selesai', desc: 'Pesanan telah selesai' },
  ];

  const getStepIndex = () => {
    if (status === 'COMPLETED') return 4;
    if (status === 'READY') return 3;
    if (status === 'BREWING') return 2;
    if (status === 'QUEUED') return 1;
    return 0;
  };

  const currentStepIdx = getStepIndex();

  return (
    <div className="min-h-screen bg-stone-50 pb-16 text-stone-900">
      {/* Top Banner */}
      <header className="bg-brand-red text-white py-6 px-4 text-center shadow-md">
        <div className="max-w-xl mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-red-200">
            Status Pesanan Kopi Noka
          </span>
          <h1 className="text-2xl font-black font-display tracking-tight mt-1">
            #{order.orderNumber}
          </h1>
          <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-800/80 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {status === 'BREWING'
                ? 'Sedang Dibuat Barista'
                : status === 'READY'
                ? 'Siap Diambil di Bar!'
                : status === 'QUEUED'
                ? 'Dalam Antrean Barista'
                : isPaid
                ? 'Pembayaran Diterima'
                : 'Menunggu Pembayaran'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 -mt-4">
        {/* QRIS Box if Still Pending */}
        {!isPaid && qrisData && (
          <div className="bg-white rounded-2xl p-6 border-2 border-brand-red shadow-xl mb-6 text-center">
            <span className="inline-block px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full mb-3">
              Silakan Bayar via QRIS Dinamis
            </span>

            <div className="w-56 h-56 mx-auto bg-white p-2 border-2 border-stone-200 rounded-2xl shadow-inner mb-3">
              <img
                src={qrisData.qrCodeDataUrl}
                alt="QRIS Dinamis"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="font-black text-xl text-brand-red mb-1">
              {formatRupiah(order.totalAmount)}
            </div>
            <p className="text-xs text-stone-500 mb-4">
              Scan dengan BCA Mobile, GoPay, OVO, ShopeePay, Dana, atau Livin
            </p>

            {/* Quick Simulation Button for Evaluation */}
            <div className="pt-3 border-t border-stone-100">
              <button
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {simulating
                    ? 'Memverifikasi Pembayaran...'
                    : 'Simulasi Bayar QRIS Sekarang (Otomatis Lunas)'}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Timeline Status */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm mb-6">
          <h3 className="font-bold text-xs uppercase tracking-wider text-stone-400 mb-5">
            Proses Pembuatan Kopi
          </h3>

          <div className="relative pl-6 space-y-6">
            {/* Vertical Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-stone-200" />

            {steps.map((s, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={s.key} className="relative flex items-start space-x-3.5">
                  <div
                    className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPast
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-brand-red text-white ring-4 ring-red-100 animate-pulse'
                        : 'bg-stone-200 text-stone-500'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>

                  <div>
                    <h4
                      className={`text-xs font-bold leading-none ${
                        isCurrent ? 'text-brand-red text-sm font-black' : isPast ? 'text-stone-900' : 'text-stone-400'
                      }`}
                    >
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-stone-400 text-[11px]">
            Rincian Pesanan
          </h3>

          <div className="space-y-2.5 divide-y divide-stone-100">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="pt-2 first:pt-0 flex justify-between items-start">
                <div>
                  <div className="font-bold text-stone-900">
                    {item.quantity}x {item.productNameSnapshot}
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    {item.variantSnapshot && <span>{item.variantSnapshot} • </span>}
                    {item.customizationSnapshot && (
                      <span>
                        {typeof item.customizationSnapshot === 'string'
                          ? item.customizationSnapshot
                          : `${item.customizationSnapshot.sugarLevel || ''} • ${item.customizationSnapshot.iceLevel || ''}`}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <div className="text-[10px] text-amber-700 italic">
                      Catatan: {item.notes}
                    </div>
                  )}
                </div>
                <div className="font-bold text-stone-900">{formatRupiah(item.lineTotal)}</div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-stone-200 space-y-1 text-stone-600">
            <div className="flex justify-between">
              <span>Tipe:</span>
              <span className="font-bold text-stone-900">
                {order.tableNumber ? `Dine-In (Meja ${order.tableNumber})` : 'Takeaway (Bungkus)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Waktu Pesan:</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm font-black text-stone-900 pt-2 border-t border-stone-200">
              <span>Total:</span>
              <span className="text-brand-red">{formatRupiah(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Bottom Nav Link */}
        <div className="text-center mt-6">
          <Link
            href="/order"
            className="text-xs font-semibold text-brand-red hover:underline"
          >
            ← Buat Pesanan Baru
          </Link>
        </div>
      </main>
    </div>
  );
}
