'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Coffee,
  ShoppingBag,
  MonitorCheck,
  LayoutDashboard,
  Clock,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Printer,
  QrCode,
  Flame
} from 'lucide-react';

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Makassar',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now) + ' WITA'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top Banner - Red & White Identity */}
      <header className="bg-brand-red text-white border-b-4 border-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-xl shadow-inner flex items-center justify-center text-brand-red">
              <Coffee className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-extrabold tracking-tight font-display">KOPI NOKA</h1>
                <span className="px-2 py-0.5 text-xs font-bold bg-white text-brand-red rounded-full uppercase tracking-wider">
                  Makassar
                </span>
              </div>
              <p className="text-xs text-red-100 font-medium tracking-wide">
                Specialty Coffee & Brew Bar • Modern POS System
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 bg-red-800/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-red-500/30 text-xs">
              <Clock className="w-3.5 h-3.5 text-red-200" />
              <span className="font-mono font-medium">{currentTime || 'Memuat...'}</span>
            </div>

            <Link
              href="/login"
              className="bg-white text-brand-red hover:bg-stone-100 font-semibold text-sm px-4 py-2 rounded-lg transition-all shadow-sm active:scale-95 flex items-center space-x-1.5"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-100 text-brand-red text-xs font-bold mb-4">
            <Flame className="w-4 h-4 text-brand-red" />
            <span>Sistem Operasional Coffee Shop Siap Pakai</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight font-display mb-4">
            Antarmuka Kasir, Pemesanan Online, & KDS Barista Terpadu
          </h2>
          <p className="text-stone-600 text-base sm:text-lg leading-relaxed">
            Platform manajemen komprehensif Kopi Noka dengan integrasi 3 shift operasional (WITA),
            pencetakan dua printer (struk pelanggan 58mm & tiket barista 80mm), pemisahan omzet bersih,
            serta pembayaran QRIS dinamis.
          </p>
        </div>

        {/* 4 Main Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Portal 1: Customer Online Ordering */}
          <Link
            href="/order"
            className="group relative bg-white rounded-2xl p-6 border-2 border-stone-200 hover:border-brand-red shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
                Untuk Pelanggan
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2 group-hover:text-brand-red transition-colors">
                Website Pemesanan Online
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-4">
                Pelanggan dapat melihat menu, memilih varian kopi (level gula, es), checkout dengan QRIS dinamis, dan memantau status pesanan langsung dari HP.
              </p>
            </div>
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-brand-red font-bold text-sm">
              <span>Buka Menu Online</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 2: POS Cashier */}
          <Link
            href="/pos"
            className="group relative bg-white rounded-2xl p-6 border-2 border-stone-200 hover:border-brand-red shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Coffee className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800 mb-2">
                Kasir & POS Tablet
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2 group-hover:text-brand-red transition-colors">
                Sistem Kasir Penjualan
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-4">
                Antarmuka cepat responsif untuk transaksi kasir: pencarian menu, variasi, diskon dengan limit izin, pembayaran Tunai/QRIS/Debit, dan cetak struk otomatis.
              </p>
            </div>
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-brand-red font-bold text-sm">
              <span>Buka Sistem POS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 3: Barista KDS */}
          <Link
            href="/barista"
            className="group relative bg-white rounded-2xl p-6 border-2 border-stone-200 hover:border-brand-red shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <MonitorCheck className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 mb-2">
                Dapur & Bar
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2 group-hover:text-amber-700 transition-colors">
                Antrean Barista (KDS)
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-4">
                Layar antrean barista real-time dengan nomor pesanan besar, modifikasi racikan (gula, es, susu), dan kontrol status: Sedang Dibuat → Siap Diambil.
              </p>
            </div>
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-amber-700 font-bold text-sm">
              <span>Buka Kitchen KDS</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Portal 4: Admin Dashboard & Reports */}
          <Link
            href="/admin/dashboard"
            className="group relative bg-white rounded-2xl p-6 border-2 border-stone-200 hover:border-brand-red shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-900 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-7 h-7" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-100 text-purple-800 mb-2">
                Admin & Manajer
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2 group-hover:text-brand-red transition-colors">
                Dashboard & Laporan
              </h3>
              <p className="text-stone-500 text-sm leading-relaxed mb-4">
                Omzet harian, penjualan bersih, rekonsiliasi kas per shift, persetujuan refund, pengaturan stok, manajemen printer, audit log, dan ekspor CSV.
              </p>
            </div>
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between text-brand-red font-bold text-sm">
              <span>Masuk Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Operational Highlights Box */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 sm:p-8 mb-10">
          <h3 className="text-lg font-bold text-stone-900 mb-6 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-brand-red" />
            <span>Karakteristik & Integritas Bisnis Kopi Noka</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-red-50 text-brand-red mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Sistem 3 Shift (WITA)</h4>
                  <p className="text-xs text-stone-500 leading-normal mt-1">
                    Shift 1 (07-15), Shift 2 (15-23), Shift 3 (23-07 melintasi tengah malam). Kasir wajib buka shift sebelum transaksi, penutupan menghitung selisih kas fisik.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-red-50 text-brand-red mt-0.5">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Dual Printer System</h4>
                  <p className="text-xs text-stone-500 leading-normal mt-1">
                    Pemisahan Printer Pelanggan (struk 58mm dengan logo dan rincian harga) dan Printer Barista (tiket 80mm dengan nomor pesanan besar tanpa info pembayaran).
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-red-50 text-brand-red mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">QRIS Dinamis & Multi-Bayar</h4>
                  <p className="text-xs text-stone-500 leading-normal mt-1">
                    Pembuatan QRIS otomatis dengan mode simulasi berlabel jelas, webhook aman dengan HMAC signature verification, serta dukungan Tunai, Debit, dan Transfer.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-red-50 text-brand-red mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">Validasi Server & Transaksi</h4>
                  <p className="text-xs text-stone-500 leading-normal mt-1">
                    Nomor pesanan format <code>KN-YYMMDD-XXX</code> terbebas dari bentrok concurrency. Harga dihitung ulang di backend, stok berkurang otomatis secara atomik.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 rounded-xl p-5 border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-brand-red uppercase tracking-wider">Verifikasi Kesiapan</span>
                <h4 className="text-sm font-bold text-stone-900 mt-1 mb-2">
                  Pengujian 20 Kasus Uji Otomatis
                </h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Semua kriteria penerimaan (idempotency, webhook signature, stok negatif, selisih kas, refund approval) dapat diuji langsung melalui test runner.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-stone-200">
                <Link
                  href="/admin/test-suite"
                  className="w-full inline-flex items-center justify-center space-x-2 bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Jalankan Automated Test Suite</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-8 border-t border-stone-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white tracking-wider">KOPI NOKA</span>
            <span>• Jl. Pengayoman No. 12B, Makassar (WITA)</span>
          </div>
          <div>
            <span>Sistem POS & Coffee Shop Management • Siap Operasional</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
