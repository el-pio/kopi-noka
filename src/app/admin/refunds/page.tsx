'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCcw, CheckCircle2, XCircle, Clock, AlertCircle,
  User, ShieldCheck, DollarSign
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/refunds');
      const data = await res.json();
      if (data.success) setRefunds(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (refundId: string, approved: boolean) => {
    setProcessingId(refundId);
    try {
      const res = await fetch('/api/refunds/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundId, approved }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(approved ? 'Refund berhasil disetujui!' : 'Permohonan refund ditolak.');
      fetchRefunds();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
          Persetujuan Refund Penjualan
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Hanya peran Admin yang berwenang menyetujui atau menolak permohonan pengembalian dana dari kasir
        </p>
      </div>

      {/* Refunds Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">No. Pesanan</th>
                <th className="px-4 py-3">Waktu Diajukan</th>
                <th className="px-4 py-3">Pemohon (Kasir)</th>
                <th className="px-4 py-3">Nominal Refund</th>
                <th className="px-4 py-3">Alasan Refund</th>
                <th className="px-4 py-3">Status Approval</th>
                <th className="px-4 py-3">Penyetuju (Admin)</th>
                <th className="px-4 py-3 text-right">Keputusan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {refunds.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-stone-400">
                    Tidak ada riwayat permohonan refund.
                  </td>
                </tr>
              ) : (
                refunds.map((r) => {
                  const isPending = r.approvalStatus === 'PENDING';

                  return (
                    <tr key={r.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-stone-900">
                        {r.orderNumber || r.orderId}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{formatDateTime(r.requestedAt)}</td>
                      <td className="px-4 py-3 font-semibold text-stone-800">{r.requesterName}</td>
                      <td className="px-4 py-3 font-black text-brand-red">{formatRupiah(r.amount)}</td>
                      <td className="px-4 py-3 text-stone-600 max-w-xs truncate">{r.reason}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            r.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.approvalStatus === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {r.approvalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-stone-500">{r.approverName}</td>
                      <td className="px-4 py-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleProcessRefund(r.id, false)}
                              disabled={processingId === r.id}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => handleProcessRefund(r.id, true)}
                              disabled={processingId === r.id}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                            >
                              Setujui
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400 font-medium">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
