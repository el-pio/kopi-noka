'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock, Edit3, Check, X, AlertTriangle, User,
  DollarSign, ArrowUpRight, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '@/lib/formatters';

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editStartTime, setEditStartTime] = useState<string>('');
  const [editEndTime, setEditEndTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    fetchShiftsAndSessions();
  }, []);

  const fetchShiftsAndSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shifts');
      const json = await res.json();
      if (json.success) {
        setShifts(json.data);
        if (json.sessions) setSessions(json.sessions);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditShift = (shift: any) => {
    setEditingShiftId(shift.id);
    setEditStartTime(shift.startTime);
    setEditEndTime(shift.endTime);
  };

  const handleSaveShift = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/shifts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name,
          startTime: editStartTime,
          endTime: editEndTime,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(`Jadwal ${name} berhasil diperbarui.`);
      setEditingShiftId(null);
      fetchShiftsAndSessions();
      setTimeout(() => setMessage(''), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
          Manajemen 3 Shift Operasional
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Pengaturan jam shift dan rekonsiliasi selisih kas fisik penutupan shift (Asia/Makassar WITA)
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* 3 Shifts Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.map((shift, idx) => {
          const isEditing = editingShiftId === shift.id;
          const isOvernight = parseInt(shift.startTime) > parseInt(shift.endTime);

          return (
            <div
              key={shift.id}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-brand-red uppercase tracking-wider">
                    Shift {idx + 1}
                  </span>
                  {isOvernight && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Lintas Tengah Malam
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-base text-stone-900 mb-2">{shift.name}</h3>

                {isEditing ? (
                  <div className="space-y-2 my-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-stone-500">Jam Mulai</label>
                      <input
                        type="time"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-stone-500">Jam Selesai</label>
                      <input
                        type="time"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-lg text-xs font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 my-3 flex items-center justify-between">
                    <span className="text-xs text-stone-500">Jam Operasional:</span>
                    <span className="text-sm font-black text-brand-red font-mono">
                      {shift.startTime} - {shift.endTime} WITA
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingShiftId(null)}
                      className="px-3 py-1.5 text-xs text-stone-600 font-bold hover:bg-stone-100 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleSaveShift(shift.id, shift.name)}
                      className="px-3 py-1.5 text-xs bg-brand-red text-white font-bold rounded-lg shadow-sm"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEditShift(shift)}
                    className="text-xs text-stone-600 hover:text-brand-red font-bold flex items-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ubah Jadwal</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Shift Sessions History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-stone-900">Riwayat Sesi Shift & Rekonsiliasi Kas Fisik</h3>
            <p className="text-[11px] text-stone-500">Pencatatan modal awal, uang kas aktual, dan selisih kas per kasir</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Shift</th>
                <th className="px-4 py-3">Kasir Bertugas</th>
                <th className="px-4 py-3">Waktu Buka (WITA)</th>
                <th className="px-4 py-3">Waktu Tutup (WITA)</th>
                <th className="px-4 py-3">Modal Awal</th>
                <th className="px-4 py-3">Kas Seharusnya</th>
                <th className="px-4 py-3">Kas Fisik Aktual</th>
                <th className="px-4 py-3">Selisih Kas</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-stone-400">
                    Belum ada sesi shift yang tercatat. Buka shift pada layar POS untuk memulai.
                  </td>
                </tr>
              ) : (
                sessions.map((ses) => (
                  <tr key={ses.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-stone-900">{ses.shiftName}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{ses.cashierName}</td>
                    <td className="px-4 py-3 text-stone-500">{formatDateTime(ses.openedAt)}</td>
                    <td className="px-4 py-3 text-stone-500">{formatDateTime(ses.closedAt)}</td>
                    <td className="px-4 py-3 font-semibold text-stone-800">{formatRupiah(ses.openingCash)}</td>
                    <td className="px-4 py-3 font-semibold text-stone-800">{formatRupiah(ses.expectedCash)}</td>
                    <td className="px-4 py-3 font-bold text-stone-900">{ses.actualCash !== null && ses.actualCash !== undefined ? formatRupiah(ses.actualCash) : '-'}</td>
                    <td className="px-4 py-3 font-black">
                      {ses.cashDifference !== null && ses.cashDifference !== undefined ? (
                        <span className={ses.cashDifference === 0 ? 'text-emerald-600' : ses.cashDifference > 0 ? 'text-blue-600' : 'text-red-600'}>
                          {formatRupiah(ses.cashDifference)} {ses.cashDifference === 0 ? '(Pas)' : ses.cashDifference > 0 ? '(Lebih)' : '(Kurang)'}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ses.status === 'OPEN' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-stone-200 text-stone-700'
                      }`}>
                        {ses.status === 'OPEN' ? 'SEDANG BUKA' : 'DITUTUP'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift Operating Rules Box */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm text-xs space-y-3">
        <h3 className="font-bold text-sm text-stone-900 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-brand-red" />
          <span>Aturan Integritas Shift Kopi Noka (Section 8)</span>
        </h3>
        <ul className="list-disc list-inside space-y-1.5 text-stone-600">
          <li>Kasir <strong>wajib membuka shift</strong> dengan menginput modal awal kas sebelum memproses transaksi tunai.</li>
          <li>Setiap transaksi terhubung dengan ID sesi shift aktif yang bersangkutan.</li>
          <li>Shift yang melintasi tengah malam (Shift 3: 23:00 - 07:00 WITA) tetap dihitung dalam <strong>satu sesi tunggal</strong> tanpa penutupan otomatis akibat pergantian tanggal kalender.</li>
          <li>Pembayaran QRIS dan Kartu EDC <strong>tidak dimasukkan</strong> ke dalam hitungan fisik kas laci.</li>
          <li>Selisih Kas dihitung secara ketat: <code>Kas Aktual - (Modal Awal + Tunai Diterima - Refund Tunai)</code>.</li>
        </ul>
      </div>
    </div>
  );
}
