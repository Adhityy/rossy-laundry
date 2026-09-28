# Rossy Laundry

Sistem manajemen laundry: situs publik, pemesanan pelanggan, dan panel admin.

## Fitur

1. **Login & registrasi** — autentikasi pelanggan dan admin (NextAuth v5, credentials + JWT)
2. **Buat pesanan** — kiloan (per kg) atau satuan (per potong), pilihan antar ke toko / antar jemput
3. **Tracking status** — stepper 7 tahap dengan riwayat status, polling tiap 5 detik
4. **Riwayat transaksi** — daftar pesanan pelanggan dan total pengeluaran
5. **Notifikasi WhatsApp** — tombol kontak langsung ke WhatsApp (integrasi kirim otomatis belum ada)
6. **Laporan pendapatan** — grafik batang per bulan dan diagram lingkaran per kategori pengeluaran
7. **Laporan pengeluaran & laba rugi** — input pengeluaran, total, dan laba/rugi

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
- Alamat jemput/antar belum ada di schema maupun form. Opsi antar jemput hanya memilih
  cara pengangkutan, penjemputan diatur lewat WhatsApp.
- Foto di `public/` dari Wikimedia Commons (lihat kredit di footer).
