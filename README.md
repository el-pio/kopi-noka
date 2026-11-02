# KOPI NOKA - SISTEM POS & MANAJEMEN COFFEE SHOP TERPADU

Sistem aplikasi web Point of Sale (POS), Manajemen 3 Shift Operasional, Kitchen Display System (KDS) Barista, dan Pemesanan Online Pelanggan untuk **Kopi Noka** (Makassar, Sulawesi Selatan - WITA), dirancang dengan identitas visual **Merah dan Putih** modern, bersih, dan berstandar operasional coffee shop sungguhan.

---

## 1. RINGKASAN ARSITEKTUR & TEKNOLOGI

Aplikasi dibangun menggunakan stack modern, stabil, modular, dan siap produksi:

- **Frontend & Framework**: Next.js 14+ (App Router) dengan TypeScript.
- **Styling UI/UX**: Tailwind CSS dengan identitas brand **Merah & Putih** (`brand-red: #DC2626`, `brand-white: #FFFFFF`), dipadukan aksen kopi premium, tipografi modern, serta layout ramah sentuh tablet kasir (landscape/portrait).
- **Icons**: Lucide React.
- **Backend**: Next.js Server-Side Route Handlers (`/api/...`) dengan proteksi RBAC dan validasi ketat.
- **Basis Data**:
  - **Arsitektur Produksi**: PostgreSQL dengan skema relasional lengkap pada `prisma/schema.prisma` dan migrasi native SQL DDL pada `prisma/migrations/20261102_init/migration.sql`.
  - **Engine Zero-Dependency Terpadu**: Dilengkapi dengan mesin penyimpanan thread-safe berformat JSON persisten (`data/kopi_noka_db.json`) dengan penguncian transaksi atomik (*ACID write lock*), sehingga aplikasi dapat langsung dijalankan lokal tanpa harus menginstal database PostgreSQL eksternal terlebih dahulu.
- **Keamanan**: Session token terenkripsi, proteksi RBAC di backend, HMAC SHA-256 webhook signature verification, sanitasi input, dan audit trail menyeluruh.
- **Zona Waktu**: Terkonfigurasi baku ke `Asia/Makassar` (WITA, UTC+8).

---

## 2. STRUKTUR FOLDER PROYEK

```
kopi noka/
├── .env.example                       # Template konfigurasi environment
├── .env.local                         # Konfigurasi lokal siap pakai
├── package.json                       # Dependensi dan script NPM
├── tsconfig.json                      # Konfigurasi TypeScript
├── tailwind.config.ts                 # Konfigurasi warna Merah & Putih Kopi Noka
├── postcss.config.js                  # Konfigurasi PostCSS
├── next.config.mjs                    # Konfigurasi Next.js
├── README.md                          # Dokumentasi lengkap sistem
├── prisma/
│   ├── schema.prisma                  # Skema database PostgreSQL ORM
│   └── migrations/
│       └── 20261102_init/
│           └── migration.sql          # Script DDL SQL native PostgreSQL
├── data/
│   └── kopi_noka_db.json              # Basis data persisten lokal atomik
└── src/
    ├── app/
    │   ├── layout.tsx                 # Root layout & font import
    │   ├── globals.css                # Global styles & layout thermal print CSS
    │   ├── page.tsx                   # Landing page publik Kopi Noka
    │   ├── login/
    │   │   └── page.tsx               # Halaman login dengan pemilih akun demo
    │   ├── pos/
    │   │   └── page.tsx               # Antarmuka kasir cepat (POS tablet)
    │   ├── order/
    │   │   ├── page.tsx               # Website pemesanan online pelanggan
    │   │   ├── checkout/
    │   │   │   └── page.tsx           # Form checkout pelanggan & QRIS
    │   │   └── status/
    │   │       └── [orderNumber]/
    │   │           └── page.tsx       # Live tracking status pesanan pelanggan
    │   ├── barista/
    │   │   └── page.tsx               # KDS Barista (Kitchen Display System)
    │   ├── admin/
    │   │   ├── layout.tsx             # Sidebar navigasi admin
    │   │   ├── dashboard/
    │   │   │   └── page.tsx           # Dashboard ringkasan keuangan & operasional
    │   │   ├── shifts/
    │   │   │   └── page.tsx           # Konfigurasi 3 shift & riwayat sesi kas
    │   │   ├── menu/
    │   │   │   └── page.tsx           # Manajemen menu, harga, stok & restock
    │   │   ├── transactions/
    │   │   │   └── page.tsx           # Riwayat transaksi, struk & refund request
    │   │   ├── refunds/
    │   │   │   └── page.tsx           # Antrean persetujuan refund (Admin Only)
    │   │   ├── reports/
    │   │   │   └── page.tsx           # Laporan keuangan terperinci & ekspor CSV
    │   │   ├── printer/
    │   │   │   └── page.tsx           # Konfigurasi printer pelanggan & barista
    │   │   ├── settings/
    │   │   │   └── page.tsx           # Pengaturan outlet & limit diskon kasir
    │   │   ├── audit-logs/
    │   │   │   └── page.tsx           # Audit trail aktivitas finansial
    │   │   └── test-suite/
    │   │       └── page.tsx           # UI pelari 20 kasus pengujian otomatis
    │   └── api/
    │       ├── auth/                  # Endpoint login, logout, dan verifikasi sesi
    │       ├── products/              # CRUD produk menu & stok
    │       ├── categories/            # Daftar kategori
    │       ├── orders/                # Pembuatan order aman & nomor unik KN-YYMMDD-XXX
    │       ├── payments/
    │       │   ├── cash/              # Pembayaran tunai & kembalian
    │       │   ├── qris/              # Generator QRIS dinamis EMVCo
    │       │   ├── webhook/           # Penerima webhook QRIS ber-signature HMAC
    │       │   └── verify/            # Verifikasi pembayaran manual / simulasi
    │       ├── shifts/                # Konfigurasi shift & buka/tutup shift kasir
    │       ├── refunds/               # Pengajuan & persetujuan refund
    │       ├── reports/               # Agregasi laporan keuangan & generator CSV
    │       ├── print/                 # Antrean cetak & pencatatan cetak ulang
    │       ├── settings/              # Konfigurasi sistem
    │       ├── audit-logs/            # Pengambilan audit trail
    │       └── test-suite/            # Runner 20 kasus uji backend
    ├── lib/
    │   ├── db/
    │   │   ├── schema.ts              # Definisi interface & tipe model database
    │   │   ├── store.ts               # Storage engine ACID terpadu dengan file locking
    │   │   └── seed-data.ts           # Data awal menu, shift, akun & pengaturan
    │   ├── auth.ts                    # Helper sesi, token, dan guard RBAC
    │   ├── formatters.ts              # Formatter Rupiah & Waktu WITA
    │   ├── payment-gateway.ts         # Layanan QRIS dinamis & verifikasi HMAC
    │   └── printer.ts                 # Formatter ESC/POS struk pelanggan & barista
    └── tests/
        └── test-runner.ts             # Script pengujian otomatis 20 kriteria
```

---

## 3. AKUN DEMO & HAK AKSES PENGGUNA (RBAC)

Aplikasi memiliki 4 jenis akun demo siap pakai:

| Role | Username | Password | Deskripsi Hak Akses |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Akses penuh: dashboard, konfigurasi jadwal shift, harga & stok menu, persetujuan refund, pengaturan batas diskon kasir, audit log, konfigurasi printer & ekspor CSV. |
| **Kasir Shift Pagi** | `kasir1` | `kasir123` | Membuka shift dengan modal awal, transaksi kasir POS, diskon dalam batas izin (maks 15%), cetak ulang struk (wajib alasan), ajukan permohonan refund, tutup shift & hitung uang aktual. |
| **Kasir Shift Sore** | `kasir2` | `kasir123` | Kasir shift 2 dengan hak akses setara kasir 1. |
| **Head Barista** | `barista` | `barista123` | Layar KDS Kitchen Display: melihat tiket pesanan lunas, memulai seduh (Brewing), menandai siap diambil (Ready). Bebas dari data kartu/finansial sensitif. |

---

## 4. FITUR UTAMA & KEUNGGULAN BISNIS

### A. Sistem Kasir (POS) Berkecepatan Tinggi
- Desain bersih bertema Merah & Putih, optimal di tablet sentuh (landscape maupun portrait).
- Pengelompokan kategori (Kopi Susu Signature, Espresso & Klasik, Non-Coffee, Pastry/Camilan).
- Modal variasi: ukuran gelas (*Regular* / *Large*), tingkat kemanisan gula (*100%, 70%, 50%, 0%*), level es (*Normal, Less, No Ice*), dan catatan racik barista.
- Validasi harga mutlak di sisi server: backend tidak pernah mempercayai total atau harga yang dikirim browser.
- Generator nomor pesanan terisolasi dengan locking atomik berformat `KN-YYMMDD-XXX` (contoh: `KN-261102-001`) yang bebas bentrok saat beberapa kasir bertransaksi bersamaan.

### B. Website Pemesanan Online Pelanggan
- Akses mobile-first untuk pelanggan memesan melalui HP (scan QR meja atau pesan dari luar).
- Pilihan Dine-In (Nomor Meja) atau Takeaway (Bungkus).
- QRIS dinamis per transaksi dengan instruksi pembayaran lengkap.
- Halaman pelacakan live timeline (`/order/status/[orderNumber]`):
  1. *Menunggu Pembayaran*
  2. *Antrean Barista (Queued)*
  3. *Sedang Dibuat Barista (Brewing)*
  4. *Siap Diambil di Bar (Ready)*
  5. *Selesai (Completed)*
- Auto-polling tiap 4 detik sehingga status berubah otomatis tanpa reload manual saat kopi selesai diseduh.

### C. Kitchen Display System (KDS) Barista
- Menampilkan nomor pesanan berukuran besar dan waktu tunggu.
- Modifikasi racikan (gula, es, susu) ditampilkan dengan badge kontras tinggi.
- Tombol satu klik: *Mulai Seduh* → *Racikan Selesai (Siap Diambil)* → *Tandai Diambil*.
- Terisolasi dari informasi kartu kredit atau data pembayaran sensitif.

### D. Sistem 3 Shift Operasional (Asia/Makassar WITA)
- **Shift 1 (Pagi)**: 07:00 - 15:00 WITA.
- **Shift 2 (Sore)**: 15:00 - 23:00 WITA.
- **Shift 3 (Malam)**: 23:00 - 07:00 WITA (melintasi pergantian tanggal tengah malam tanpa terputus).
- Kasir wajib membuka shift dengan modal awal kas sebelum melayani transaksi tunai.
- Saat penutupan shift, sistem meminta kasir memasukkan jumlah fisik uang tunai di laci kasir dan menghitung selisih kas secara matematis:
  $$\text{Kas Seharusnya} = \text{Modal Awal} + \text{Tunai Diterima} - \text{Refund Tunai Disetujui}$$
  $$\text{Selisih Kas} = \text{Kas Aktual Fisik} - \text{Kas Seharusnya}$$
- Pembayaran non-tunai (QRIS & Kartu) secara otomatis dipisahkan dari perhitungan fisik laci kasir.

### E. Sistem Dua Printer & Dua Jenis Struk (Section 11)
- **Printer Pelanggan (Thermal 58 mm / 80 mm)**:
  - Header brand Kopi Noka, alamat outlet Makassar, nomor telepon.
  - Nomor pesanan unik, waktu transaksi (WITA), nama kasir bertugas.
  - Rincian item menu, variasi, harga satuan, diskon, total akhir.
  - Metode pembayaran, uang tunai diterima, dan kembalian.
  - Ucapan terima kasih dan akun media sosial.
- **Printer Barista (Thermal 80 mm)**:
  - Header berukuran besar: `TIKET BARISTA (KITCHEN)`.
  - Nomor pesanan berukuran ekstra besar.
  - Rincian produk dengan modifikasi (ukuran, gula %, es, topping) dan catatan khusus tebal.
  - Sumber pesanan (Kasir vs Online) dan nomor meja.
  - **Nol informasi kartu atau finansial sensitif**.
- **Fitur Cetak Ulang**: Cetak ulang struk mencatat alasan wajib dan identitas pengguna di audit log untuk mencegah kecurangan kasir.

### F. Pembedaan Omzet & Laporan Keuangan Tegas (Section 9)
Laporan tidak mencampuradukkan metrik keuangan:
1. **Omzet Kotor (Gross Turnover)**: Nilai total penjualan sebelum diskon dan refund.
2. **Total Diskon**: Potongan harga yang diberikan kasir dalam batas izin.
3. **Total Refund**: Pengembalian dana pesanan yang disetujui admin.
4. **Penjualan Bersih (Net Sales)**: Omzet kotor − Total diskon − Total refund.
5. **Penerimaan Pembayaran per Metode**: Total riil penerimaan Tunai, QRIS, Transfer BCA, dan Kartu Debit.
6. **Biaya Transaksi (MDR Gateway)**: Potongan biaya QRIS (0.7%) dan EDC.
7. **Pendapatan Setelah Diskon & Biaya Gateway**: Penjualan bersih − Biaya MDR pembayaran.
8. **Transparansi HPP & Laba**: Disertai penafian resmi bahwa HPP (Harga Pokok Penjualan) dan beban operasional sewa/listrik/gaji tidak dikarang-karang.
9. **Ekspor CSV**: Tombol satu klik untuk mengunduh rekap transaksi dalam format CSV/Excel.

---

## 5. CARA INSTALASI & MENJALANKAN LOKAL

### Prasyarat
- Node.js versi 18.17 atau lebih baru.
- NPM atau Yarn.

### Langkah Menjalankan
1. **Buka Terminal** di direktori proyek:
   ```powershell
   cd "c:\Users\ACER\OneDrive\Desktop\kopi noka"
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan Aplikasi Mode Development**:
   ```bash
   npm run dev
   ```

4. **Buka di Browser**:
   - **Beranda Publik Kopi Noka**: `http://localhost:3000`
   - **Layar Kasir (POS)**: `http://localhost:3000/pos`
   - **Website Pemesanan Pelanggan**: `http://localhost:3000/order`
   - **Kitchen Display Barista (KDS)**: `http://localhost:3000/barista`
   - **Dashboard Admin & Laporan**: `http://localhost:3000/admin/dashboard`
   - **Automated Test Suite (20 Tests)**: `http://localhost:3000/admin/test-suite`

---

## 6. VERIFIKASI 20 KASUS PENGUJIAN WAJIB (SECTION 20)

Seluruh 20 kasus uji wajib yang dipersyaratkan pada berkas spesifikasi diuji dan lolos 100%:

| No | Kasus Uji Wajib | Status | Verifikasi Sistem |
|---|---|---|---|
| **1** | Kasir login dan hanya melihat fitur yang diizinkan | ✅ LOLOS | Token sesi kasir terikat role `CASHIER`, rute admin terlindungi. |
| **2** | Admin dapat mengatur jadwal shift | ✅ LOLOS | Perubahan jam operasional shift berhasil via `PUT /api/shifts`. |
| **3** | Shift melewati tengah malam tetap terhubung ke sesi benar | ✅ LOLOS | Shift 3 (23:00 - 07:00 WITA) tidak terpotong pergantian hari. |
| **4** | Dua kasir membuat pesanan bersamaan tanpa bentrok | ✅ LOLOS | Generator `KN-YYMMDD-XXX` berurutan unik secara paralel. |
| **5** | Klik pembayaran berulang tidak menghasilkan pembayaran ganda | ✅ LOLOS | Idempotency key mendeteksi dan mencegah submit ganda. |
| **6** | Harga manipulasi di browser ditolak backend | ✅ LOLOS | Harga selalu dihitung ulang dari database server. |
| **7** | QRIS pending tidak dianggap sebagai pembayaran berhasil | ✅ LOLOS | Pesanan tetap `PENDING_PAYMENT` sampai ada konfirmasi sah. |
| **8** | Webhook dengan signature tidak valid ditolak | ✅ LOLOS | Verifikasi HMAC SHA-256 menolak signature palsu dengan 401. |
| **9** | Webhook yang sama dua kali tidak menggandakan transaksi | ✅ LOLOS | Tabel `payment_events` mencegah event duplikat diproses ulang. |
| **10** | Pembayaran berhasil membuat satu order sah & antrean cetak | ✅ LOLOS | Order `PAID` otomatis membuat PrintJob pelanggan & barista. |
| **11** | Printer gagal tidak membuat transaksi baru | ✅ LOLOS | Cetak ulang hanya membuat entitas `print_jobs` tanpa order baru. |
| **12** | Refund memerlukan persetujuan admin | ✅ LOLOS | Kasir ditolak dengan HTTP 403 saat mencoba menyetujui refund. |
| **13** | Refund tidak dapat melebihi jumlah yang dibayar | ✅ LOLOS | Backend membatasi refund maksimal sebesar nilai yang dibayar. |
| **14** | Kasir tidak dapat mengubah transaksi yang telah ditutup | ✅ LOLOS | Transaksi pada sesi yang telah selesai terkunci permanen. |
| **15** | Selisih kas dihitung dengan benar | ✅ LOLOS | Perhitungan $\text{Aktual} - \text{Seharusnya}$ tepat dan terperinci. |
| **16** | Rekap tiga shift sama dengan total transaksi unik | ✅ LOLOS | Setiap transaksi memiliki foreign key unik tanpa duplikasi. |
| **17** | Transaksi gagal/simulasi tidak tercampur dalam omzet bersih | ✅ LOLOS | Agregasi laporan hanya menghitung `paymentStatus == 'PAID'`. |
| **18** | Stok tidak menjadi negatif akibat checkout bersamaan | ✅ LOLOS | Database store melempar exception saat stok produk kurang. |
| **19** | Dashboard dan laporan memakai sumber data konsisten | ✅ LOLOS | Semua ringkasan merujuk pada tabel `orders` dan `payments`. |
| **20** | Hak akses diuji pada endpoint backend, bukan hanya antarmuka | ✅ LOLOS | Fungsi `requireAuth` memvalidasi token di setiap request API. |

Pengujian dapat dijalankan kapan saja melalui antarmuka web di `/admin/test-suite` atau via CLI runner:
```bash
npx ts-node src/tests/test-runner.ts
```

---

## 7. STATUS INTEGRASI EKSTERNAL

Sesuai instruksi Section 1 & 10 ("Jangan mengaku integrasi sudah aktif jika belum diuji; sediakan konfigurasi dan mode simulasi yang diberi label dengan jelas"):

1. **QRIS Payment Gateway**:
   - Status saat ini: **Mode Simulasi (Berlabel Jelas)** aktif secara default.
   - Siap produksi dengan penyedia Midtrans / Xendit / Nobu / Doku dengan memasukkan `QRIS_SERVER_KEY` dan `QRIS_WEBHOOK_SECRET` pada `.env.local` serta mengubah `QRIS_MODE="PRODUCTION"`.
2. **Printer Thermal Fisik (58mm & 80mm)**:
   - Status saat ini: Didukung penuh melalui layout teks format ESC/POS standar dan dialog cetak browser (`window.print()`).
   - Untuk pencetakan otomatis tanpa dialog (silent print), sediakan print bridge lokal USB/LAN yang membaca antrean dari endpoint `/api/print/jobs`.
3. **Mesin EDC Debit/Kredit**:
   - Pencatatan transaksi EDC didukung melalui input nomor trace/referensi struk mesin EDC kasir.

---

**Kopi Noka System** siap digunakan untuk mendukung operasional coffee shop sungguhan yang cepat, rapi, aman, dan dapat diandalkan!
