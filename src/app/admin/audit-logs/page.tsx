'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Search, RefreshCw, Clock, User,
  FileText, ShieldCheck, Eye
} from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((l) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      l.action.toLowerCase().includes(term) ||
      (l.userName && l.userName.toLowerCase().includes(term)) ||
      (l.entityType && l.entityType.toLowerCase().includes(term)) ||
      (l.details && l.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
            Audit Log & Rekam Jejak Sistem
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pencatatan seluruh aktivitas finansial, login, perubahan shift, cetak ulang struk, dan persetujuan refund
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aksi (SHIFT_OPEN, REFUND, dll), nama pengguna, atau rincian..."
            className="w-full text-xs pl-9 pr-4 py-2 border rounded-xl outline-none focus:border-brand-red"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Waktu (WITA)</th>
                <th className="px-4 py-3">Pengguna</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Entitas</th>
                <th className="px-4 py-3">Rincian Aktivitas</th>
                <th className="px-4 py-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400 font-sans">
                    Belum ada audit log yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 text-[11px] text-stone-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <div className="font-bold text-stone-900">{log.userName}</div>
                      <div className="text-[10px] text-stone-400 uppercase">{log.userRole}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-brand-red bg-red-50 px-2 py-0.5 rounded text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 font-semibold">{log.entityType}</td>
                    <td className="px-4 py-3 text-stone-600 font-sans max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1 rounded hover:bg-stone-200 text-stone-500"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-stone-900 mb-1">
              Rincian Audit Log: {selectedLog.action}
            </h3>
            <p className="text-xs text-stone-500 mb-4">{formatDateTime(selectedLog.createdAt)}</p>

            <div className="space-y-2 text-xs mb-4">
              <div>
                <strong>Pengguna:</strong> {selectedLog.userName} ({selectedLog.userRole})
              </div>
              <div>
                <strong>Entitas:</strong> {selectedLog.entityType} (ID: {selectedLog.entityId || '-'})
              </div>
              {selectedLog.ipAddress && (
                <div>
                  <strong>IP Address:</strong> {selectedLog.ipAddress}
                </div>
              )}
              <div className="pt-2">
                <strong>Payload Data:</strong>
                <pre className="mt-1 p-3 bg-stone-900 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(JSON.parse(selectedLog.details || '{}'), null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
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
