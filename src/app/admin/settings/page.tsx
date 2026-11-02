'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, Save, CheckCircle2, ShieldCheck, MapPin,
  Clock, Tag, QrCode, Building2
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any[]>([]);
  const [outletName, setOutletName] = useState('Kopi Noka');
  const [outletSubname, setOutletSubname] = useState('Specialty Coffee & Brew Bar');
  const [outletAddress, setOutletAddress] = useState('Jl. Pengayoman No. 12B, Makassar');
  const [outletPhone, setOutletPhone] = useState('+62 811-4567-8901');
  const [timezone, setTimezone] = useState('Asia/Makassar');
  const [maxDiscount, setMaxDiscount] = useState('15');
  const [qrisMode, setQrisMode] = useState('SIMULATION');
  const [qrisNmid, setQrisNmid] = useState('ID1020304050607');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
        const map = new Map(data.data.map((s: any) => [s.key, s.value]));
        if (map.has('outlet_name')) setOutletName(map.get('outlet_name') as string);
        if (map.has('outlet_subname')) setOutletSubname(map.get('outlet_subname') as string);
        if (map.has('outlet_address')) setOutletAddress(map.get('outlet_address') as string);
        if (map.has('outlet_phone')) setOutletPhone(map.get('outlet_phone') as string);
        if (map.has('timezone')) setTimezone(map.get('timezone') as string);
        if (map.has('cashier_max_discount_percent')) setMaxDiscount(map.get('cashier_max_discount_percent') as string);
        if (map.has('qris_mode')) setQrisMode(map.get('qris_mode') as string);
        if (map.has('qris_nmid')) setQrisNmid(map.get('qris_nmid') as string);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const updates = [
        { key: 'outlet_name', value: outletName },
        { key: 'outlet_subname', value: outletSubname },
        { key: 'outlet_address', value: outletAddress },
        { key: 'outlet_phone', value: outletPhone },
        { key: 'timezone', value: timezone },
        { key: 'cashier_max_discount_percent', value: maxDiscount },
        { key: 'qris_mode', value: qrisMode },
        { key: 'qris_nmid', value: qrisNmid },
      ];

      for (const item of updates) {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
          Pengaturan Aplikasi & Operasional
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Konfigurasi identitas outlet Kopi Noka, zona waktu Makassar, batas diskon kasir, dan pembayaran
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pengaturan berhasil diperbarui dan tersimpan aman di database!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Outlet Profile */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-stone-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-brand-red" />
            <span>Profil Outlet & Kontak Struk</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Nama Brand Outlet</label>
              <input
                type="text"
                value={outletName}
                onChange={(e) => setOutletName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Sub-judul / Tagline</label>
              <input
                type="text"
                value={outletSubname}
                onChange={(e) => setOutletSubname(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-stone-700 block mb-1">Alamat Outlet (Muncul di Struk)</label>
              <input
                type="text"
                value={outletAddress}
                onChange={(e) => setOutletAddress(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Nomor Kontak WhatsApp / Telp</label>
              <input
                type="text"
                value={outletPhone}
                onChange={(e) => setOutletPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Zona Waktu Operasional</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red font-medium bg-white"
              >
                <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8) - Default</option>
                <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card 2: Cashier Rules & Discount Limit */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-stone-900 flex items-center space-x-2">
            <Tag className="w-4 h-4 text-brand-red" />
            <span>Batasan Diskon Kasir (Section 14)</span>
          </h3>

          <div className="text-xs">
            <label className="font-bold text-stone-700 block mb-1">
              Batas Maksimum Diskon Kasir (%)
            </label>
            <div className="flex items-center space-x-3 max-w-xs">
              <input
                type="number"
                min="0"
                max="100"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                className="w-24 px-3 py-2 border rounded-xl font-black text-brand-red outline-none focus:border-brand-red text-center"
              />
              <span className="text-stone-500 font-semibold">% per transaksi</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Kasir tidak dapat memberikan diskon melampaui batas ini tanpa otorisasi akun Admin.
            </p>
          </div>
        </div>

        {/* Card 3: QRIS Gateway Settings */}
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-stone-900 flex items-center space-x-2">
            <QrCode className="w-4 h-4 text-brand-red" />
            <span>Konfigurasi Integrasi QRIS & Keamanan Webhook</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Mode Pembayaran QRIS</label>
              <select
                value={qrisMode}
                onChange={(e) => setQrisMode(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-bold bg-white outline-none focus:border-brand-red"
              >
                <option value="SIMULATION">SIMULATION (Uji Coba & Demo Aman)</option>
                <option value="PRODUCTION">PRODUCTION (Memerlukan Kredensial Merchant)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">NMID Merchant Resmi</label>
              <input
                type="text"
                value={qrisNmid}
                onChange={(e) => setQrisNmid(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-mono text-stone-700 outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-stone-500 space-y-1">
            <p>
              <strong>Keamanan Webhook:</strong> Webhook menerima payload dari payment gateway dengan validasi signature HMAC SHA-256. Secret Key tidak pernah diekspos ke frontend.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-brand-red hover:bg-brand-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
