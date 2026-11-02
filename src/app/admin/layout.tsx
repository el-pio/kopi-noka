'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Coffee, LayoutDashboard, Clock, UtensilsCrossed, Receipt,
  BarChart3, RotateCcw, Printer, Settings, ShieldAlert,
  LogOut, User, CheckCircle2, Menu, X, ChevronRight, FlaskConical
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
        } else {
          setCurrentUser(data.user);
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { href: '/admin/shifts', label: 'Manajemen 3 Shift', icon: Clock },
    { href: '/admin/menu', label: 'Menu & Stok Produk', icon: UtensilsCrossed },
    { href: '/admin/transactions', label: 'Transaksi & Struk', icon: Receipt },
    { href: '/admin/refunds', label: 'Persetujuan Refund', icon: RotateCcw },
    { href: '/admin/reports', label: 'Laporan Keuangan', icon: BarChart3 },
    { href: '/admin/printer', label: 'Konfigurasi Printer', icon: Printer },
    { href: '/admin/settings', label: 'Pengaturan Outlet', icon: Settings },
    { href: '/admin/audit-logs', label: 'Audit Log Sistem', icon: ShieldAlert },
    { href: '/admin/test-suite', label: 'Automated 20 Tests', icon: FlaskConical },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row text-stone-900 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-brand-red text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-white text-brand-red rounded-lg flex items-center justify-center font-black">
            <Coffee className="w-5 h-5" />
          </div>
          <span className="font-extrabold tracking-tight">KOPI NOKA</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-lg hover:bg-red-800 text-white"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-30 w-64 bg-white border-r border-stone-200 flex flex-col justify-between transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } h-screen flex-shrink-0 shadow-sm`}
      >
        <div>
          {/* Logo Brand */}
          <div className="p-5 border-b border-stone-100 flex items-center space-x-3 bg-brand-red text-white">
            <div className="w-10 h-10 bg-white text-brand-red rounded-xl flex items-center justify-center shadow-inner font-black">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-base tracking-tight font-display">KOPI NOKA</h2>
              <p className="text-[10px] text-red-100 font-medium">Panel Manajemen & POS</p>
            </div>
          </div>

          {/* Quick POS Navigation Link */}
          <div className="p-3 border-b border-stone-100">
            <Link
              href="/pos"
              className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-brand-red rounded-xl text-xs font-bold flex items-center justify-between transition-colors border border-red-200/60"
            >
              <div className="flex items-center space-x-2">
                <Coffee className="w-4 h-4" />
                <span>Buka Layar Kasir POS</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-red text-white shadow-sm'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-stone-100 bg-stone-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-stone-900 truncate">
                  {currentUser?.name || 'Memuat...'}
                </div>
                <div className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">
                  Role: {currentUser?.role}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 bg-white hover:bg-stone-100 text-stone-700 text-xs font-semibold rounded-lg border border-stone-200 transition-colors flex items-center justify-center space-x-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full">
        {children}
      </main>
    </div>
  );
}
