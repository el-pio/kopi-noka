'use client';

import React, { useState, useEffect } from 'react';
import {
  Receipt, Search, Filter, Printer, RotateCcw, Eye,
  CheckCircle2, Clock, AlertTriangle, X, ShieldCheck
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

export default function AdminTransactionsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Reprint Modal
  const [reprintOrder, setReprintOrder] = useState<any>(null);
  const [reprintReason, setReprintReason] = useState('');
  const [reprintPrinter, setReprintPrinter] = useState<'CUSTOMER_RECEIPT' | 'BARISTA_TICKET'>('CUSTOMER_RECEIPT');

  // Refund Modal
  const [refundOrder, setRefundOrder] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState('');

  // Preview Receipt Modal
  const [previewOrder, setPreviewOrder] = useState<any>(null);
  const [previewText, setPreviewText] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?limit=100');
      const data = await res.json();
      if (data.success) setOrders(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteReprint = async () => {
    if (!reprintOrder || !reprintReason.trim()) {
      alert('Alasan cetak ulang wajib diisi');
      return;
    }

    try {
      const res = await fetch('/api/print/reprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: reprintOrder.id,
          printerType: reprintPrinter,
          reason: reprintReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Permintaan cetak ulang berhasil dicatat dalam audit log.');
      setReprintOrder(null);
      setReprintReason('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRequestRefund = async () => {
    if (!refundOrder || !refundReason.trim() || refundAmount <= 0) {
      alert('Nominal refund dan alasan wajib diisi dengan benar');
      return;
    }

    try {
      const res = await fetch('/api/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: refundOrder.id,
          amount: Number(refundAmount),
          reason: refundReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Permohonan refund berhasil diajukan. Menunggu persetujuan Admin.');
      setRefundOrder(null);
      setRefundReason('');
      fetchOrders();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleOpenPreview = async (orderNumber: string) => {
    try {
      const res = await fetch(`/api/orders/${orderNumber}`);
      const data = await res.json();
      if (data.success) {
        setPreviewOrder(data.data);
        setPreviewText(data.data.receiptPreview);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PAID' && o.paymentStatus === 'PAID') ||
      (statusFilter === 'REFUNDED' && o.paymentStatus === 'REFUNDED') ||
      (statusFilter === 'PENDING' && o.paymentStatus === 'PENDING');

    const matchSearch =
      search === '' ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()));

    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
          Riwayat Transaksi & Struk Penjualan
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Daftar seluruh transaksi POS dan Pemesanan Online dengan opsi cetak ulang (tercatat audit) dan permohonan refund
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no pesanan (KN-...) atau nama pelanggan..."
            className="w-full text-xs pl-9 pr-4 py-2 border rounded-xl outline-none focus:border-brand-red font-mono"
          />
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-bold w-full sm:w-auto">
          {['ALL', 'PAID', 'PENDING', 'REFUNDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl border transition-all ${
                statusFilter === st
                  ? 'bg-brand-red text-white border-brand-red'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">No. Pesanan</th>
                <th className="px-4 py-3">Waktu (WITA)</th>
                <th className="px-4 py-3">Sumber</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Total Tagihan</th>
                <th className="px-4 py-3">Status Bayar</th>
                <th className="px-4 py-3">Produksi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 font-mono font-black text-stone-900">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        order.source === 'POS'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {order.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone-800">
                    {order.customerName || '-'}
                  </td>
                  <td className="px-4 py-3 font-black text-brand-red">
                    {formatRupiah(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.paymentStatus === 'REFUNDED'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-600">{order.status}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenPreview(order.orderNumber)}
                        className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                        title="Lihat Struk"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setReprintOrder(order);
                          setReprintReason('');
                        }}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-brand-red transition-colors"
                        title="Cetak Ulang Struk"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {order.paymentStatus === 'PAID' && (
                        <button
                          onClick={() => {
                            setRefundOrder(order);
                            setRefundAmount(order.totalAmount);
                            setRefundReason('');
                          }}
                          className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors"
                          title="Ajukan Refund"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPRINT MODAL WITH AUDIT REASON */}
      {reprintOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-stone-900 mb-1">
              Cetak Ulang Struk #{reprintOrder.orderNumber}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Sesuai SOP keamanan keuangan, setiap pencetakan ulang wajib mencantumkan alasan yang dicatat dalam audit trail.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Tipe Dokumen</label>
                <select
                  value={reprintPrinter}
                  onChange={(e: any) => setReprintPrinter(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium bg-white"
                >
                  <option value="CUSTOMER_RECEIPT">Struk Pelanggan (58mm)</option>
                  <option value="BARISTA_TICKET">Tiket Barista Kitchen (80mm)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">
                  Alasan Cetak Ulang *
                </label>
                <input
                  type="text"
                  required
                  value={reprintReason}
                  onChange={(e) => setReprintReason(e.target.value)}
                  placeholder="Contoh: Kertas printer macet, pelanggan minta salinan"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setReprintOrder(null)}
                className="px-3 py-1.5 border rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteReprint}
                className="px-4 py-1.5 bg-brand-red text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Konfirmasi & Cetak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-stone-900 mb-1">
              Ajukan Refund: #{refundOrder.orderNumber}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Kasir dapat mengajukan refund, namun <strong>persetujuan mutlak memerlukan akun Admin</strong>.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nominal Refund (IDR) *</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-brand-red outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Alasan Refund *</label>
                <textarea
                  rows={2}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Contoh: Pelanggan salah pesan rasa, komplain kualitas rasa"
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRefundOrder(null)}
                className="px-3 py-1.5 border rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleRequestRefund}
                className="px-4 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Kirim Permohonan Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW MODAL */}
      {previewOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900">
                Struk: #{previewOrder.orderNumber}
              </h3>
              <button
                onClick={() => setPreviewOrder(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto bg-stone-900 text-emerald-400 font-mono text-xs select-all">
              <pre className="whitespace-pre-wrap">{previewText}</pre>
            </div>
            <div className="p-3 border-t bg-stone-50 flex justify-end">
              <button
                onClick={() => setPreviewOrder(null)}
                className="px-4 py-1.5 bg-stone-800 text-white rounded-lg text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
