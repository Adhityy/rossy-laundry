// Info Laundry
export const LAUNDRY_INFO = {
  name: "Rossy Laundry",
  phone: "087880568880",
  phoneDisplay: "0878-8056-8880",
  whatsapp: "6287880568880",
  address: "Jl. Balita 2 No. 85 Kunciran Mas Permai",
  hours: "Senin-Minggu: 08.00 - 22.00",
  hoursShort: "08.00 - 22.00",
  /**
   * Tarif kiloan per kg. Struk cetak tidak mencantumkan tarif per kg
   * (hanya tarif per potong), jadi nilai ini dipertahankan dari pengaturan lama.
   * Ubah di sini kalau tarif kiloan berbeda.
   */
  kiloanRate: 7000,
};

// Daftar tarif per potong ada di database (model PriceItem),
// diisi dari struk cetak lewat prisma/seed.ts dan dibaca lewat GET /api/prices.

// Urutan status yang dipakai API PATCH /api/orders/[id]/status dan dropdown admin.
// Warna tidak disimpan di sini: satu aksen (primary) dipakai untuk semua status,
// tahap dibedakan lewat langkah (step) dan label.
export const ORDER_STATUSES = [
  { key: "PENDING", label: "Menunggu", step: 1 },
  { key: "WASHING", label: "Dicuci", step: 2 },
  { key: "DRYING", label: "Dikeringkan", step: 3 },
  { key: "IRONING", label: "Disetrika", step: 4 },
  { key: "PACKING", label: "Dikemas", step: 5 },
  { key: "READY", label: "Siap Diambil", step: 6 },
  { key: "COMPLETED", label: "Selesai", step: 7 },
] as const;

export type OrderStatusKey = (typeof ORDER_STATUSES)[number]["key"];

export const STATUS_IN_PROGRESS: readonly string[] = ORDER_STATUSES.map((s) => s.key).filter(
  (k) => k !== "COMPLETED"
);

// Ongkos antar jemput. 0 = gratis. Tampil di UI sebagai "Gratis", bukan "Rp 0".
export const DELIVERY_FEE = 0;

// Minimum order kiloan (kg)
export const MIN_ORDER_KG = 3;
