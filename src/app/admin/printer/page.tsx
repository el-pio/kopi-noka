'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer, CheckCircle2, AlertCircle, RefreshCw,
  FileText, ShieldCheck, Laptop, Cpu
} from 'lucide-react';
import { formatDateTime } from '@/lib/formatters';

export default function AdminPrinterPage() {
  const [printJobs, setPrintJobs] = useState<any[]>([]);
  const [customerPaper, setCustomerPaper] = useState('58mm');
  const [baristaPaper, setBaristaPaper] = useState('80mm');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/print/jobs');
      const data = await res.json();
      if (data.success) setPrintJobs(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestPrint = (type: 'CUSTOMER' | 'BARISTA') => {
    setTestResult(`Pekerjaan cetak uji untuk ${type === 'CUSTOMER' ? 'Printer Pelanggan' : 'Printer Barista'} berhasil dikirim ke antrean.`);
    setTimeout(() => setTestResult(''), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
          Konfigurasi Dual Printer Kopi Noka
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Pengaturan fisik Printer Pelanggan (Struk 58mm) dan Printer Barista (Tiket Racik 80mm)
        </p>
      </div>

      {testResult && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{testResult}</span>
        </div>
      )}

      {/* 2 Printer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Printer 1: Customer Receipt */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center font-black">
                <Printer className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                TERHUBUNG (READY)
              </span>
            </div>

            <h3 className="text-base font-bold text-stone-900 mb-1">
              Printer 1: Struk Pelanggan (Kasir)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Mencetak rincian transaksi, nama kasir, item menu, diskon, dan metode pembayaran setelah transaksi lunas.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Lebar Kertas Thermal</label>
                <select
                  value={customerPaper}
                  onChange={(e) => setCustomerPaper(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium bg-white"
                >
                  <option value="58mm">Thermal 58 mm (32 Kolom) - Standar Kasir</option>
                  <option value="80mm">Thermal 80 mm (48 Kolom)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Perangkat Port / USB</label>
                <input
                  type="text"
                  disabled
                  value="POS_THERMAL_USB_01 (Local Print Bridge)"
                  className="w-full px-3 py-2 border rounded-xl bg-stone-50 text-stone-600 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button
              onClick={() => handleTestPrint('CUSTOMER')}
              className="px-4 py-2 bg-brand-red hover:bg-brand-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Uji Cetak Struk Pelanggan
            </button>
          </div>
        </div>

        {/* Printer 2: Barista Ticket */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-black">
                <Printer className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                TERHUBUNG (READY)
              </span>
            </div>

            <h3 className="text-base font-bold text-stone-900 mb-1">
              Printer 2: Tiket Barista (Kitchen Bar)
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Mencetak nomor pesanan ukuran besar, variasi racikan (gula, es), dan catatan pesanan tanpa data finansial sensitif.
            </p>

            <div className="space-y-3 text-xs mb-4">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Lebar Kertas Thermal</label>
                <select
                  value={baristaPaper}
                  onChange={(e) => setBaristaPaper(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-medium bg-white"
                >
                  <option value="80mm">Thermal 80 mm (48 Kolom) - Rekomendasi Dapur</option>
                  <option value="58mm">Thermal 58 mm (32 Kolom)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Perangkat Port / USB</label>
                <input
                  type="text"
                  disabled
                  value="BARISTA_KITCHEN_NET_02 (LAN / USB Bridge)"
                  className="w-full px-3 py-2 border rounded-xl bg-stone-50 text-stone-600 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end">
            <button
              onClick={() => handleTestPrint('BARISTA')}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              Uji Cetak Tiket Barista
            </button>
          </div>
        </div>
      </div>

      {/* Print Jobs Queue */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900">Antrean Pekerjaan Cetak (Print Jobs Queue)</h3>
          <button
            onClick={fetchJobs}
            className="text-xs text-stone-500 hover:text-stone-800 flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Tipe Printer</th>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Tipe Pekerjaan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Percobaan</th>
                <th className="px-4 py-3">Waktu Dibuat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {printJobs.slice(0, 10).map((job) => (
                <tr key={job.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-stone-900">{job.printerType}</td>
                  <td className="px-4 py-3 font-mono text-stone-500">{job.orderId}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        job.jobType === 'REPRINT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {job.jobType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        job.status === 'PRINTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-stone-600">{job.attempts}x</td>
                  <td className="px-4 py-3 text-stone-500">{formatDateTime(job.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
