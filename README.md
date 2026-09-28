# Rossy Laundry

Sistem manajemen laundry: situs publik, pemesanan pelanggan, dan panel admin.

## Fitur

1. **Login & registrasi** — autentikasi pelanggan dan admin (NextAuth v5, credentials + JWT)
2. **Buat pesanan** — kiloan (per kg) atau satuan (per potong). Tarif per potong diambil
   dari database (`PriceItem`), pelanggan pilih jenis cucian Laundry / Dry Clean dan
   totalnya dihitung otomatis
3. **Tracking status** — stepper 7 tahap dengan riwayat status, polling tiap 5 detik
4. **Riwayat transaksi** — daftar pesanan pelanggan dan total pengeluaran
5. **Notifikasi WhatsApp** — tombol kontak langsung ke WhatsApp (integrasi kirim otomatis belum ada)
6. **Laporan pendapatan** — grafik batang per bulan dan diagram lingkaran per kategori pengeluaran
7. **Laporan pengeluaran & laba rugi** — input pengeluaran, total, dan laba/rugi
8. **Profil** — foto profil (di-resize 160×160 di browser), nama, alamat, nomor WhatsApp,
   dan ganti password dengan konfirmasi password sekarang
9. **Kelola harga (admin)** — edit tarif laundry & dry clean inline, sembunyikan item tanpa
   menghapus, tambah dan hapus item, satu tombol simpan untuk semua perubahan

## Stack

- Next.js 15 (App Router) + TypeScript (`strict`)
- Tailwind CSS **v4** (`@tailwindcss/postcss`, token di `@theme inline`)
- shadcn/ui primitives (registry `new-york-v4`) di `src/components/ui/`
- Prisma + **PostgreSQL** (Neon) — SQLite tidak didukung Vercel
- NextAuth v5 (credentials, strategi JWT)
- Recharts, Framer Motion, Lucide, Sonner, Zod
- Font Outfit lewat `next/font`

## Setup

`.env` butuh empat variabel:

```bash
DATABASE_URL="postgresql://..."   # pooled    - query runtime
DIRECT_URL="postgresql://..."     # unpooled  - prisma db push
NEXTAUTH_SECRET=*** rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"
```

Kalau pakai Vercel + Neon: `vercel env pull` menarik semuanya otomatis.

```bash
# 1. Dependensi (postinstall menjalankan prisma generate)
npm install

# 2. Buat tabel
npm run db:push

# 3. Data awal (admin@rossy.com / admin123, customer@rossy.com / customer123)
npm run db:seed

# 4. Jalankan
npm run dev
```

Buka http://localhost:3000

## Struktur

```
src/
├── app/
│   ├── page.tsx              # Landing: Hero, Layanan, Fitur, Harga, CTA, Footer
│   ├── layout.tsx            # Font, tema, navbar, toaster
│   ├── (auth)/login/         # Masuk
│   ├── (auth)/register/      # Daftar
│   ├── orders/new/           # Buat pesanan
│   ├── orders/               # Riwayat
│   ├── orders/[id]/          # Tracking
│   ├── admin/                # Dashboard
│   ├── admin/reports/        # Laporan pendapatan
│   ├── admin/expenses/       # Pengeluaran & laba rugi
│   └── api/                  # Route handler (orders, expenses, reports, auth)
├── components/               # Komponen situs + 21 primitif shadcn (ui/)
├── lib/                      # auth, prisma, data, types, utils, theme
└── ../prisma/                # schema.prisma, seed.ts
```

## Tema

- Palet: netral **zinc** + satu aksen **teal** (`#0f766e` light / `#2dd4bf` dark).
- Mode gelap/terang lewat toggle di navbar, disimpan di `localStorage` (`rossy-theme`),
  script anti-flash di `src/lib/theme.ts`.
- Kontras: aksen light 5.27:1, aksen dark 10.7:1 (lolos WCAG AA).

## Catatan pengembangan

- `POST /api/orders` menyimpan `items` sebagai string JSON, karena itu yang dibaca UI.
- Ongkos antar jemput: **Rp 0 (gratis)**, diatur lewat `DELIVERY_FEE` di `src/lib/data.ts`.
- **Tarif per potong** ada di tabel `PriceItem` (60 baris), diketik ulang dari struk cetak
  Rossy. Sumber: `prisma/prices.ts`, masuk lewat `npm run db:seed`, dibaca lewat
  `GET /api/prices`. Empat sel tarif memang kosong di struk (Karpet Tebal/Tipis, Kasur
  Lantai Kecil/Besar) sehingga disimpan `null` dan tampil "Hubungi kami" — tidak bisa
  dipesan online.
- **Harga dihitung di server.** `POST /api/orders` mengambil tarif dari tabel `PriceItem`
  berdasarkan nama item dan `washType`, lalu menghitung ulang `subtotal` dan `deliveryFee`.
  Angka `price`/`deliveryFee` dari klien diabaikan — pelanggan dengan halaman basi tetap
  dibebankan harga terbaru, dan harga bisa tidak dikirim sama sekali dari sisi klien.
  Item yang dinonaktifkan atau tarifnya kosong akan ditolak dengan pesan jelas.
- **Tarif kiloan per kg tidak ada di struk.** Nilai `LAUNDRY_INFO.kiloanRate` di
  `src/lib/data.ts` masih angka lama (Rp 7.000/kg) — sesuaikan kalau beda.
- **Alamat penjemputan** ada di kolom `Order.pickupAddress`. Isi lewat tombol "Gunakan
  lokasi saya" (reverse geocode) atau ketik manual, lalu tetap bisa disunting. Geocoder
  default: Photon (`photon.komoot.io`, komoot, open source) — gratis tanpa API key,
  tanpa SLA, akan men-throttle pemakaian berat.
  - Hasil **search** cukup bagus untuk alamat Tangerang.
  - Hasil **reverse geocode** kasar (tingkat kelurahan, sering tanpa nomor rumah) —
    memang harus diedit manual.
  - Untuk hasil yang lebih lengkap: set `GOOGLE_MAPS_API_KEY` lalu ganti provider di
    `src/app/api/geocode/route.ts`. Google: 10.000 geocoding/bulan gratis (skema per-SKU
    sejak Maret 2025), tapi butuh akun billing + kartu.
- Belum ada alur OTP. Ganti password memakai konfirmasi password sekarang (jalur yang
  tidak butuh layanan eksternal). Email login tidak bisa diubah sendiri, lewat admin.
- Foto profil disimpan sebagai data URL di kolom `User.avatar`. Serverless Vercel tidak
  bisa menulis file ke disk; kalau nanti butuh foto besar, pindah ke Vercel Blob.
- Foto di `public/` dari Wikimedia Commons (lihat kredit di footer).
