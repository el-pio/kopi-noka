'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Coffee, ChefHat, Clock, CheckCircle2, AlertCircle,
  Play, Check, Flame, RefreshCw, Volume2, VolumeX, ArrowLeft
} from 'lucide-react';
import { formatTimeOnly } from '@/lib/formatters';

export default function BaristaKdsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'QUEUED' | 'BREWING' | 'READY'>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders?limit=50');
      const data = await res.json();
      if (data.success) {
        // Show active orders: QUEUED, BREWING, READY (filter out COMPLETED/CANCELLED/PENDING_PAYMENT)
        const active = data.data.filter(
          (o: any) =>
            o.paymentStatus === 'PAID' &&
            ['QUEUED', 'BREWING', 'READY'].includes(o.status)
        );
        setOrders(active);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch('/api/orders/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });
      fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col font-sans">
      {/* Top KDS Navbar */}
      <header className="bg-stone-950 border-b border-stone-800 px-6 h-16 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2 text-white">
            <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center font-black">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight font-display">KOPI NOKA</span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded font-bold uppercase tracking-wider">
                  BARISTA KDS
                </span>
              </div>
              <p className="text-[10px] text-stone-400">Kitchen Display System • Dapur Racik</p>
            </div>
          </Link>

          {/* Quick Counter */}
          <div className="hidden sm:flex items-center space-x-2 pl-4 border-l border-stone-800 text-xs">
            <span className="px-2 py-1 bg-stone-800 rounded-md font-bold text-amber-400">
              {orders.filter((o) => o.status === 'QUEUED').length} Menunggu
            </span>
            <span className="px-2 py-1 bg-stone-800 rounded-md font-bold text-blue-400">
              {orders.filter((o) => o.status === 'BREWING').length} Sedang Dibuat
            </span>
            <span className="px-2 py-1 bg-stone-800 rounded-md font-bold text-emerald-400">
              {orders.filter((o) => o.status === 'READY').length} Siap Diambil
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2">
          {(['ALL', 'QUEUED', 'BREWING', 'READY'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === tab
                  ? 'bg-brand-red text-white'
                  : 'bg-stone-800 text-stone-400 hover:text-white'
              }`}
            >
              {tab === 'ALL'
                ? `Semua (${orders.length})`
                : tab === 'QUEUED'
                ? 'Antrean'
                : tab === 'BREWING'
                ? 'Seduh'
                : 'Siap'}
            </button>
          ))}

          <Link
            href="/pos"
            className="text-xs bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold px-3 py-1.5 rounded-lg border border-stone-700 transition-colors ml-2"
          >
            Buka POS
          </Link>
        </div>
      </header>

      {/* Main Order Grid */}
      <main className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center text-stone-500 text-sm">
            Memuat antrean barista...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-600 py-20">
            <CheckCircle2 className="w-16 h-16 text-stone-700 mb-3" />
            <h3 className="text-lg font-bold text-stone-400">Semua Pesanan Selesai!</h3>
            <p className="text-xs text-stone-600 mt-1">
              Tidak ada tiket racik aktif saat ini. Tiket baru akan muncul otomatis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredOrders.map((order) => {
              const isQueued = order.status === 'QUEUED';
              const isBrewing = order.status === 'BREWING';
              const isReady = order.status === 'READY';

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border-2 flex flex-col justify-between overflow-hidden transition-all shadow-xl ${
                    isBrewing
                      ? 'border-blue-500 bg-stone-950'
                      : isReady
                      ? 'border-emerald-500 bg-stone-950'
                      : 'border-amber-500/80 bg-stone-950'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-3.5 flex items-center justify-between text-xs font-bold ${
                      isBrewing
                        ? 'bg-blue-600/20 text-blue-300 border-b border-blue-500/30'
                        : isReady
                        ? 'bg-emerald-600/20 text-emerald-300 border-b border-emerald-500/30'
                        : 'bg-amber-600/20 text-amber-300 border-b border-amber-500/30'
                    }`}
                  >
                    <div>
                      <div className="text-[10px] uppercase tracking-wider opacity-75">
                        {order.source === 'POS' ? 'KASIR POS' : 'ONLINE PELANGGAN'}
                      </div>
                      <div className="text-lg font-black font-mono tracking-tight text-white mt-0.5">
                        {order.orderNumber}
                      </div>
                    </div>

                    <div className="text-right">
                      {order.tableNumber && (
                        <div className="text-sm font-black px-2 py-0.5 rounded bg-white text-stone-950">
                          MEJA {order.tableNumber}
                        </div>
                      )}
                      <div className="text-[10px] text-stone-400 mt-1">
                        {formatTimeOnly(order.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Customer Name */}
                  {order.customerName && (
                    <div className="px-3.5 pt-2 text-xs font-semibold text-stone-400 border-b border-stone-800/60 pb-1.5">
                      Pelanggan: <span className="text-white font-bold">{order.customerName}</span>
                    </div>
                  )}

                  {/* Item List */}
                  <div className="p-3.5 flex-1 space-y-3 overflow-y-auto max-h-72 divide-y divide-stone-800">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="pt-2 first:pt-0">
                        <div className="flex items-start justify-between">
                          <div className="font-black text-sm text-white">
                            <span className="text-amber-400 mr-1.5">{item.quantity}x</span>
                            <span>{item.productNameSnapshot}</span>
                          </div>
                        </div>

                        {/* Modifiers Badges */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.variantSnapshot && (
                            <span className="px-2 py-0.5 bg-brand-red/40 border border-brand-red/60 text-red-200 text-[10px] font-bold rounded">
                              {item.variantSnapshot}
                            </span>
                          )}
                          {item.customizationSnapshot && (
                            <>
                              {typeof item.customizationSnapshot === 'string' ? (
                                <span className="px-2 py-0.5 bg-stone-800 text-stone-300 text-[10px] rounded">
                                  {item.customizationSnapshot}
                                </span>
                              ) : (
                                <>
                                  {item.customizationSnapshot.sugarLevel && (
                                    <span className="px-2 py-0.5 bg-amber-950 border border-amber-700 text-amber-300 text-[10px] font-bold rounded">
                                      Gula: {item.customizationSnapshot.sugarLevel}
                                    </span>
                                  )}
                                  {item.customizationSnapshot.iceLevel && (
                                    <span className="px-2 py-0.5 bg-blue-950 border border-blue-700 text-blue-300 text-[10px] font-bold rounded">
                                      Es: {item.customizationSnapshot.iceLevel}
                                    </span>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </div>

                        {item.notes && (
                          <div className="mt-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] font-bold text-amber-300">
                            ** {item.notes.toUpperCase()} **
                          </div>
                        )}
                      </div>
                    ))}

                    {order.notes && (
                      <div className="pt-2 text-[11px] text-amber-400 italic">
                        Catatan Order: {order.notes}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 bg-stone-900 border-t border-stone-800">
                    {isQueued && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'BREWING')}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Mulai Racik (Sedang Dibuat)</span>
                      </button>
                    )}

                    {isBrewing && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'READY')}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Racikan Selesai (Siap Diambil)</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                        className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold rounded-xl text-xs border border-stone-700 transition-all flex items-center justify-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Tandai Diambil Pelanggan</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
