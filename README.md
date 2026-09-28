# Rossy Laundry — Full-Stack Sistem Manajemen Laundry

Sistem manajemen laundry lengkap dengan 7 fitur utama.

## Fitur

1. **Login & Registrasi** — Autentikasi pelanggan & admin
2. **Buat Pesanan** — Kiloan/Satuan + opsi antar-jemput
3. **Tracking Real-Time** — Progress bar visual + detail order
4. **Riwayat Transaksi** — History pesanan + total pengeluaran
5. **Notifikasi WhatsApp** — Siap integrasi (demo mode)
6. **Laporan Pendapatan** — Tabel + grafik (Recharts)
7. **Laporan Pengeluaran & Laba Rugi** — Input + perhitungan laba

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4 + Framer Motion
- Prisma + SQLite
- NextAuth.js v5 (credentials)
- Recharts (grafik)
- Lucide React (icons)
- Sonner (toast notifications)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup database
npx prisma db push
npx prisma generate

# 3. Seed data
npx tsx prisma/seed.ts

# 4. Jalankan dev server
npm run dev
```

Buka http://localhost:3000

## Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rossy.com | admin123 |
| Customer | customer@rossy.com | customer123 |

## Struktur

```
app/
├── page.tsx              # Landing page
├── layout.tsx            # Root layout
├── (auth)/login/         # Halaman login
├── (auth)/register/      # Halaman registrasi
├── orders/new/           # Buat pesanan
├── orders/               # Riwayat pesanan
├── orders/[id]/          # Tracking real-time
├── admin/                # Dashboard admin
├── admin/reports/        # Laporan pendapatan
├── admin/expenses/       # Laporan pengeluaran
└── api/                  # API routes
components/               # Komponen React
lib/                      # Utility & data
prisma/                   # Database schema & seed
```

## Info Laundry

- **No. Telp:** 087880568880
- **Alamat:** Jl. Balita 2 No. 85 Kunciran Mas Permai
- **Operasional:** Senin-Minggu: 08.00 - 22.00

## Deploy

```bash
# Vercel
npx vercel
```

Ubah DATABASE_URL ke PostgreSQL untuk production:
```
DATABASE_URL="postgresql://user:pass@host:5432/rossy"
```
