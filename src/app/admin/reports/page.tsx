'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3, Download, Calendar, DollarSign, TrendingUp,
  CreditCard, Printer, FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<string>('today');
  const [method, setMethod] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchReport();
  }, [period, method]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?period=${period}`;
      if (method) url += `&method=${method}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    let url = `/api/reports?period=${period}&format=csv`;
    if (method) url += `&method=${method}`;
    window.open(url, '_blank');
  };

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
            Laporan Keuangan & Rekapitulasi
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pemisahan tegas omzet kotor, penjualan bersih, penerimaan pembayaran, fee gateway, dan selisih kas
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-2 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor File CSV / Excel</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-1.5 font-bold">
          {['today', '7days', '30days', 'all'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                period === p
                  ? 'bg-brand-red text-white border-brand-red'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {p === 'today' ? 'Hari Ini' : p === '7days' ? '7 Hari Terakhir' : p === '30days' ? '30 Hari' : 'Semua Data'}
            </button>
          ))}
        </div>

        <div>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="border border-stone-200 rounded-xl px-3 py-1.5 outline-none font-medium bg-white"
          >
            <option value="">Semua Metode Bayar</option>
            <option value="CASH">Hanya Tunai (Cash)</option>
            <option value="QRIS">Hanya QRIS Dinamis</option>
            <option value="BANK_TRANSFER">Hanya Transfer Bank</option>
            <option value="DEBIT_CREDIT">Hanya Kartu Debit/EDC</option>
          </select>
        </div>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
            A. Omzet Kotor (Gross Turnover)
          </span>
          <div className="text-2xl font-black text-stone-900 font-display">
            {formatRupiah(summary?.grossTurnover || 0)}
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Nilai total penjualan produk sebelum potongan diskon dan refund
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
            B. Total Diskon Diberikan
          </span>
          <div className="text-2xl font-black text-amber-600 font-display">
            {formatRupiah(summary?.totalDiscounts || 0)}
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Potongan harga kasir dalam batas izin yang disetujui
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
            C. Total Refund Disetujui
          </span>
          <div className="text-2xl font-black text-purple-600 font-display">
            {formatRupiah(summary?.totalRefunds || 0)}
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Pengembalian dana resmi yang disetujui admin
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
            D. Penjualan Bersih (Net Sales)
          </span>
          <div className="text-2xl font-black text-emerald-600 font-display">
            {formatRupiah(summary?.netSales || 0)}
          </div>
          <p className="text-[11px] text-stone-400 mt-2">
            Omzet kotor dikurangi diskon & refund
          </p>
        </div>
      </div>

      {/* Operational Revenue Highlight */}
      <div className="bg-gradient-to-r from-red-50 to-white border-2 border-brand-red rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-red">
              Pendapatan Operasional Kopi Noka (Section 9D)
            </span>
            <div className="text-3xl font-black text-brand-red font-display mt-1">
              {formatRupiah(summary?.netOperationalRevenue || 0)}
            </div>
            <p className="text-xs text-stone-600 mt-1 max-w-xl">
              Dihitung dari: <strong>Penjualan Bersih ({formatRupiah(summary?.netSales || 0)})</strong> dikurangi{' '}
              <strong>Biaya Transaksi Pembayaran / MDR ({formatRupiah(summary?.totalFees || 0)})</strong>.
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-sm text-xs space-y-1">
            <div className="text-stone-500">Penerimaan Kas Fisik:</div>
            <div className="font-bold text-stone-900 text-sm">
              {formatRupiah(summary?.paymentBreakdown?.CASH || 0)}
            </div>
            <div className="text-[10px] text-stone-400">
              Uang di laci kasir (Non-Tunai dipisahkan)
            </div>
          </div>
        </div>
      </div>

      {/* Notice Section for Accounting Compliance (Section 9E & 9F) */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm text-xs space-y-3">
        <h3 className="font-bold text-sm text-stone-900 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-brand-red" />
          <span>Transparansi Akuntansi & Laba Bersih</span>
        </h3>
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-stone-600">
          <p>
            <strong>Status Laba Kotor:</strong> {summary?.grossMarginNotice}
          </p>
          <p>
            <strong>Status Laba Bersih:</strong> {summary?.netProfitNotice}
          </p>
        </div>
      </div>
    </div>
  );
}
