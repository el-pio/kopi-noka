'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Plus, Search, Edit3, Trash2, AlertTriangle,
  CheckCircle2, X, PackagePlus, DollarSign, Image as ImageIcon
} from 'lucide-react';
import { formatRupiah } from '@/lib/formatters';

export default function AdminMenuPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(20000);
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [minimumStock, setMinimumStock] = useState<number>(10);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quick Restock Modal
  const [restockProduct, setRestockProduct] = useState<any>(null);
  const [restockAmount, setRestockAmount] = useState<number>(20);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.success) setProducts(prodData.data);
      if (catData.success) setCategories(catData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategoryId(categories[0]?.id || 'cat_kopi_susu');
    setPrice(20000);
    setStockQuantity(50);
    setMinimumStock(10);
    setDescription('');
    setImageUrl('');
    setIsAvailable(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingProduct(p);
    setName(p.name);
    setCategoryId(p.categoryId);
    setPrice(p.price);
    setStockQuantity(p.stockQuantity);
    setMinimumStock(p.minimumStock);
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    setIsAvailable(p.isAvailable);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct?.id,
          name,
          categoryId,
          price: Number(price),
          stockQuantity: Number(stockQuantity),
          minimumStock: Number(minimumStock),
          description,
          imageUrl,
          isAvailable,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleQuickRestock = async () => {
    if (!restockProduct) return;
    try {
      const newStock = restockProduct.stockQuantity + Number(restockAmount);
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...restockProduct,
          stockQuantity: newStock,
        }),
      });
      setRestockProduct(null);
      fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight font-display">
            Manajemen Menu & Stok Produk
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Kelola katalog menu kopi, varian harga, dan peringatan batas minimum stok
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-brand-red hover:bg-brand-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Menu Baru</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk menu..."
            className="w-full text-xs pl-9 pr-4 py-2 border rounded-xl outline-none focus:border-brand-red"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border rounded-xl px-3 py-2 outline-none font-medium bg-white"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Produk</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Harga Jual</th>
                <th className="px-4 py-3">Sisa Stok</th>
                <th className="px-4 py-3">Batas Min</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((product) => {
                const category = categories.find((c) => c.id === product.categoryId);
                const isLow = product.stockQuantity <= product.minimumStock;

                return (
                  <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden flex-shrink-0">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-300">
                              <UtensilsCrossed className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900">{product.name}</div>
                          {product.description && (
                            <div className="text-[10px] text-stone-400 truncate max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-600">{category?.name || '-'}</td>
                    <td className="px-4 py-3 font-black text-brand-red">{formatRupiah(product.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {product.stockQuantity} unit
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">{product.minimumStock} unit</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          product.isAvailable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {product.isAvailable ? 'Tersedia' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setRestockProduct(product);
                            setRestockAmount(25);
                          }}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                          title="Restock Cepat"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
                          title="Ubah Data"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add/Edit Product */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-black text-base text-stone-900">
                {editingProduct ? 'Ubah Data Menu' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Kategori *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red font-medium bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Harga Jual (IDR) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Jumlah Stok Fisik</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Batas Minimum Peringatan</label>
                  <input
                    type="number"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">URL Foto Produk</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border rounded-xl outline-none focus:border-brand-red text-stone-600"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="avail"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 text-brand-red rounded"
                />
                <label htmlFor="avail" className="font-semibold text-stone-800">
                  Produk Aktif dan Dapat Dijual di POS & Online
                </label>
              </div>

              <div className="pt-4 border-t border-stone-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-stone-600 font-bold hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-brand-red text-white font-bold rounded-xl shadow-md hover:bg-brand-red-700"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK RESTOCK MODAL */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <h3 className="font-bold text-sm text-stone-900 mb-1">
              Restock: {restockProduct.name}
            </h3>
            <p className="text-xs text-stone-500 mb-4">
              Stok saat ini: {restockProduct.stockQuantity} unit
            </p>

            <div className="mb-4">
              <label className="font-bold text-stone-700 block mb-1 text-xs">
                Tambah Jumlah Stok (Unit)
              </label>
              <input
                type="number"
                value={restockAmount}
                onChange={(e) => setRestockAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl text-sm font-bold outline-none focus:border-brand-red"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRestockProduct(null)}
                className="px-3 py-1.5 border rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleQuickRestock}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
              >
                Konfirmasi Restock (+{restockAmount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
