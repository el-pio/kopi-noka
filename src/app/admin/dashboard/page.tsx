'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, ShoppingBag, DollarSign, CreditCard, Clock,
  AlertTriangle, CheckCircle2, ChevronRight, ArrowUpRight,
  Flame, Printer, QrCode, Tag, RotateCcw, ShieldCheck
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

export default function AdminDashboardPage() {
  const [report, setReport] = useState<any>(null);
  const [activeShift, setActiveShift] = useState<any>(null);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>('today');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [repRes, shiftRes, prodRes] = await Promise.all([
        fetch(`/api/reports?period=${period}`),
        fetch('/api/shifts/sessions/active'),
        fetch('/api/products'),
      ]);

      const repData = await repRes.json();
      const shiftData = await shiftRes.json();
      const prodData = await prodRes.json();

      if (repData.success) setReport(repData);
      if (shiftData.hasActiveSession) setActiveShift(shiftData.session);
      else setActiveShift(null);

      if (prodData.success) {
        const low = prodData.data.filter(
          (p: any) => p.stockQuantity <= p.minimumStock
        );
        setLowStockProducts(low);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const summary = report?.summary;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
            Dashboard Operasional Kopi Noka
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pantauan omzet aktual, penerimaan pembayaran, shift, dan stok produk
          </p>
        </div>

        {/* Period Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-sm text-xs font-bold">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              period === 'today' ? 'bg-brand-red text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Hari Ini
          </button>
          <button
            onClick={() => setPeriod('7days')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              period === '7days' ? 'bg-brand-red text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            7 Hari
          </button>
          <button
            onClick={() => setPeriod('30days')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              period === '30days' ? 'bg-brand-red text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            30 Hari
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              period === 'all' ? 'bg-brand-red text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Semua
          </button>
        </div>
      </div>

      {/* Warning Banner: Low Stock */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start justify-between shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Peringatan Stok Menipis ({lowStockProducts.length} Produk)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Produk berikut berada pada batas minimum:{' '}
                <span className="font-semibold">
                  {lowStockProducts.map((p) => `${p.name} (${p.stockQuantity})`).join(', ')}
                </span>
              </p>
            </div>
          </div>
          <Link
            href="/admin/menu"
            className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-4"
          >
            Restock
          </Link>
        </div>
      )}

      {/* 4 Primary Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Omzet Kotor */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Omzet Kotor
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 font-display">
            {formatRupiah(summary?.grossTurnover || 0)}
          </div>
          <div className="mt-2 text-[11px] text-stone-400">
            Total {summary?.totalOrders || 0} transaksi pesanan
          </div>
        </div>

        {/* Card 2: Penjualan Bersih */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Penjualan Bersih
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 font-display">
            {formatRupiah(summary?.netSales || 0)}
          </div>
          <div className="mt-2 text-[11px] text-stone-400">
            Setelah dikurangi diskon & refund
          </div>
        </div>

        {/* Card 3: Biaya Gateway (MDR) */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Biaya Pembayaran (MDR)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 font-display">
            {formatRupiah(summary?.totalFees || 0)}
          </div>
          <div className="mt-2 text-[11px] text-stone-400">
            Biaya fee QRIS 0.7% & EDC
          </div>
        </div>

        {/* Card 4: Pendapatan Setelah Biaya */}
        <div className="bg-white rounded-2xl p-5 border-2 border-brand-red shadow-sm bg-gradient-to-br from-white to-red-50/40">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-brand-red uppercase tracking-wider">
              Pendapatan Operasional
            </span>
            <div className="w-8 h-8 rounded-lg bg-brand-red text-white flex items-center justify-center shadow-sm">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-brand-red font-display">
            {formatRupiah(summary?.netOperationalRevenue || 0)}
          </div>
          <div className="mt-2 text-[11px] text-stone-500 font-medium">
            Penjualan bersih dikurangi fee gateway
          </div>
        </div>
      </div>

      {/* Middle Row: Payment Methods Breakdown & Shift Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Breakdown Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
            <h3 className="font-bold text-sm text-stone-900">
              Penerimaan Berdasarkan Metode Pembayaran
            </h3>
            <span className="text-xs text-stone-400">
              Total: {formatRupiah(summary?.totalCollections || 0)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Tunai (Cash)</span>
              <div className="text-base font-black text-stone-900 mt-1">
                {formatRupiah(summary?.paymentBreakdown?.CASH || 0)}
              </div>
            </div>

            <div className="p-3 bg-red-50/60 rounded-xl border border-red-200/60">
              <span className="text-[11px] font-bold text-brand-red uppercase">QRIS Dinamis</span>
              <div className="text-base font-black text-brand-red mt-1">
                {formatRupiah(summary?.paymentBreakdown?.QRIS || 0)}
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Transfer BCA</span>
              <div className="text-base font-black text-stone-900 mt-1">
                {formatRupiah(summary?.paymentBreakdown?.BANK_TRANSFER || 0)}
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-[11px] font-bold text-stone-500 uppercase">Debit / EDC</span>
              <div className="text-base font-black text-stone-900 mt-1">
                {formatRupiah(summary?.paymentBreakdown?.DEBIT_CREDIT || 0)}
              </div>
            </div>
          </div>

          {/* Transparent Accounting Disclaimers as required in Section 9 */}
          <div className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500 space-y-1">
            <div>
              <strong>Catatan Laba Kotor:</strong> {summary?.grossMarginNotice}
            </div>
            <div>
              <strong>Catatan Laba Bersih:</strong> {summary?.netProfitNotice}
            </div>
          </div>
        </div>

        {/* Active Shift & Hardware Status Card */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900">Status Operasional</h3>
              <span className="text-xs text-stone-400">WITA (Makassar)</span>
            </div>

            {/* Shift Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-brand-red" />
                  <div>
                    <div className="text-xs font-bold text-stone-900">
                      {activeShift ? activeShift.shiftName : 'Tidak Ada Shift Terbuka'}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {activeShift ? `Kasir: ${activeShift.cashierName}` : 'Buka shift pada modul kasir'}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeShift ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {activeShift ? 'AKTIF' : 'IDLE'}
                </span>
              </div>

              {/* Hardware / Gateway Status */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Printer className="w-3.5 h-3.5 text-stone-500" />
                    <span>Printer Pelanggan (58mm):</span>
                  </div>
                  <span className="font-semibold text-emerald-600">Terhubung</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Printer className="w-3.5 h-3.5 text-stone-500" />
                    <span>Printer Barista (80mm):</span>
                  </div>
                  <span className="font-semibold text-emerald-600">Terhubung</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <QrCode className="w-3.5 h-3.5 text-stone-500" />
                    <span>Integrasi QRIS:</span>
                  </div>
                  <span className="font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                    SIMULATION MODE
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100">
            <Link
              href="/admin/shifts"
              className="text-xs font-bold text-brand-red hover:text-brand-red-700 flex items-center justify-between"
            >
              <span>Kelola Jadwal & Sesi Shift</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Row: Top Selling Products & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <h3 className="font-bold text-sm text-stone-900 mb-4 pb-2 border-b border-stone-100">
            Produk Terlaris (Top Selling)
          </h3>

          {report?.topProducts?.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              Belum ada data penjualan pada periode ini.
            </div>
          ) : (
            <div className="space-y-2.5">
              {report?.topProducts?.slice(0, 5).map((p: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 transition-colors text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-50 text-brand-red font-black flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </div>
                    <span className="font-bold text-stone-900">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-brand-red">{p.quantity} terjual</div>
                    <div className="text-[10px] text-stone-400">{formatRupiah(p.revenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
            <h3 className="font-bold text-sm text-stone-900">Pesanan Terakhir</h3>
            <Link
              href="/admin/transactions"
              className="text-xs font-bold text-brand-red hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          {report?.recentOrders?.length === 0 ? (
            <div className="py-8 text-center text-stone-400 text-xs">
              Belum ada pesanan terbaru.
            </div>
          ) : (
            <div className="space-y-2">
              {report?.recentOrders?.slice(0, 5).map((order: any) => (
                <div
                  key={order.id}
                  className="p-2.5 rounded-xl border border-stone-100 hover:border-stone-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-stone-900 font-mono">{order.orderNumber}</div>
                    <div className="text-[10px] text-stone-500">
                      {order.source} • {formatDateTime(order.createdAt)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-stone-900">
                      {formatRupiah(order.totalAmount)}
                    </div>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
