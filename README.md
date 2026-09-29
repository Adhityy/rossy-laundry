# Rossy Laundry

Sistem manajemen laundry: situs publik, pemesanan pelanggan, dan panel admin.

## Fitur

1. **Login & registrasi** — opsional. Pesanan dan pelacakan bisa jalan tanpa akun
   (NextAuth v5, credentials + JWT)
2. **Buat pesanan** — kiloan (per kg) atau satuan (per potong). Tarif per potong diambil
   dari database (`PriceItem`) dan **dihitung ulang di server**, pelanggan pilih jenis
   cucian Laundry / Dry Clean. **Nomor WhatsApp wajib diisi** — itu kunci pelacakan
3. **Cek pesanan** — `/orders` menampilkan **riwayat langsung** kalau sudah login (tanpa
   pencarian), dan **hanya satu kolom cari** (nomor resi atau nomor WhatsApp) kalau belum
   login. Nomor dinormalkan dulu supaya `0878 8056-8880` dan `6287880568880` cocok.
   Riwayat memakai `userId` **atau** nomor WhatsApp profil, jadi pesanan yang dibuat saat
   belum login ikut muncul
4. **Tracking 4 tahap** — Menunggu → Diproses → Siap Diambil → Selesai, plus riwayat
   status, polling tiap 5 detik
5. **Pembatalan** — pelanggan boleh membatalkan selama masih **Menunggu**; admin boleh
   membatalkan kapan pun **dengan alasan wajib**. Status `DIBATALKAN` berdiri di luar
   tahapan, tidak bisa diubah lagi
6. **Pesanan manual (admin)** — pelanggan yang antar ke toko diinput admin lewat tombol
   *Pesanan manual*: isi nomor WhatsApp pelanggan, sisanya seperti form biasa
7. **Informasi pelanggan (admin)** — di halaman `/orders/{id}`, admin melihat nama,
   nomor WhatsApp, email, dan alamat akun. Penampil tamu tidak melihat ini
8. **Kelola harga (admin)** — edit tarif laundry & dry clean inline, sembunyikan item tanpa
   menghapus, tambah dan hapus item, satu tombol simpan untuk semua perubahan
9. **Profil** — foto profil (di-resize 160×160 di browser), nama, alamat, nomor WhatsApp,
   dan ganti password dengan konfirmasi password sekarang
10. **Laporan** — grafik pendapatan per bulan, laba/rugi, diagram pengeluaran per kategori
11. **Notifikasi WhatsApp** — tombol kontak langsung ke WhatsApp (integrasi kirim otomatis belum ada)

Cakupan layanan (ditampilkan di dashboard admin): `SERVICE_AREA` di `src/lib/data.ts`.

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

- **Tahapan status ada 4**: `MENUNGGU`, `DIPROSES`, `SIAP_DIAMBIL`, `SELESAI`, plus
  `DIBATALKAN` sebagai status terminal di luar tahapan (`ORDER_STATUSES` dan
  `STATUS_CANCELLED` di `src/lib/data.ts`).
- **Pencarian nama pemilik nomor (OSINT)** hanya jalan di jalur pesanan datang langsung,
  dan hanya untuk sesi admin. Urutan sumbernya `akun` -> `catatan` -> `osint`:
  1. `User` yang nomornya cocok,
  2. tabel `Contact` (nama yang pernah admin input),
  3. Truecaller lewat `src/lib/osint.ts` (`search5-noneu.truecaller.com/v2/search`).

  Hasil OSINT langsung disimpan ke `Contact`, jadi hitungan berikutnya instan dan kuota
  pencarian tidak terbuang. Tanpa `TRUECALLER_TOKEN`, langkah ketiga diam-diam dibuang dan
  form hanya menampilkan `detail` kenapa tidak ketemu.

  **Kenapa token bukan dari script sendiri:** alur OTP onboarding Truecaller
  (`/v2/sendOnboardingOtp`) sudah mati sejak ~2025 karena di-gate Play Integrity /
  SafetyNet, jadi device-spoof JSON tidak cukup. Semua library rilis 2023
  (`truecallerjs`, `truecallerpy`) gagal dengan `20003 Verification failed`. Riset status
  per April 2026: `AnshumanAtrey/clank/research/03-truecaller-methods.md`. Satu-satunya
  sumber `installationId` yang masih valid adalah onboarding Truecaller asli di HP Android,
  lalu baca SharedPreferences app-nya (butuh root atau ADB `run-as`).
  Endpoints pencarinya sendiri (`/v2/search`, `/v2/bulk` 30 nomor) masih respons normal
  selama token-nya sah.
- **Nomor WhatsApp adalah kunci pelacakan.** `Order.whatsapp` disimpan ternormalisasi
  (`0878 8056-8880` dan `6287880568880` disamakan lewat `normalizePhone`). Kolom punya
  default `""` hanya agar bisa ditambahkan ke tabel berisi data; pencarian menolak nilai
  kosong.
- **Pesanan tanpa login**: `userId` bisa `null`. Kalau admin yang menginput, pesanan tidak
  menempel ke akun admin — dipautkan ke akun pemilik nomor hanya jika akun itu ada.
- **Pencarian terbuka** `GET /api/orders/lookup?q=`: cocok persis setelah dinormalkan,
  maksimal 20 hasil. Data pelanggan (`user`) hanya dikirim saat peminta admin.
- **Halaman Pengeluaran dihapus** dari panel, tapi `Expense` dan `GET/POST /api/expenses`
  masih ada karena dipakai diagram lingkaran di `/admin/reports`.
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
