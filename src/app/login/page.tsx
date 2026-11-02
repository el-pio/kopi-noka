'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Coffee, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('kasir1');
  const [password, setPassword] = useState('kasir123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      // Route according to role
      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else if (data.user.role === 'BARISTA') {
        router.push('/barista');
      } else {
        router.push('/pos');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center space-x-3 mb-3">
            <div className="w-14 h-14 bg-brand-red text-white rounded-2xl shadow-lg flex items-center justify-center">
              <Coffee className="w-8 h-8" />
            </div>
          </Link>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight font-display">
            KOPI NOKA
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Portal Masuk Sistem Kasir & Manajemen Operasional
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
          <div className="bg-brand-red h-2 w-full" />

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Username Akun
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none text-sm transition-all text-stone-900"
                    placeholder="Masukkan username kasir atau admin"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none text-sm transition-all text-stone-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-brand-red hover:bg-brand-red-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
              >
                <span>{loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Quick Demo Credentials Picker */}
            <div className="mt-8 pt-6 border-t border-stone-100">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-4 h-4 text-brand-red" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Pilih Akun Demo Cepat:
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => selectDemoAccount('kasir1', 'kasir123')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    username === 'kasir1'
                      ? 'border-brand-red bg-red-50 text-brand-red font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="font-semibold">Kasir 1 (Pagi)</div>
                  <div className="text-[10px] text-stone-500">kasir1 / kasir123</div>
                </button>

                <button
                  type="button"
                  onClick={() => selectDemoAccount('kasir2', 'kasir123')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    username === 'kasir2'
                      ? 'border-brand-red bg-red-50 text-brand-red font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="font-semibold">Kasir 2 (Sore)</div>
                  <div className="text-[10px] text-stone-500">kasir2 / kasir123</div>
                </button>

                <button
                  type="button"
                  onClick={() => selectDemoAccount('admin', 'admin123')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    username === 'admin'
                      ? 'border-brand-red bg-red-50 text-brand-red font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="font-semibold">Admin Manajer</div>
                  <div className="text-[10px] text-stone-500">admin / admin123</div>
                </button>

                <button
                  type="button"
                  onClick={() => selectDemoAccount('barista', 'barista123')}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    username === 'barista'
                      ? 'border-amber-600 bg-amber-50 text-amber-700 font-bold'
                      : 'border-stone-200 hover:border-stone-300 text-stone-700'
                  }`}
                >
                  <div className="font-semibold">Barista Kitchen</div>
                  <div className="text-[10px] text-stone-500">barista / barista123</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors"
          >
            ← Kembali ke Beranda Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
