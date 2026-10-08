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

export const CATEGORY_LABELS: Record<string, string> = {
  PAKAIAN: "Pakaian",
  RUMAH_TANGGA: "Rumah tangga",
};

// Urutan tahap yang dipakai API dan stepper pelanggan.
// Empat tahap saja. Pembatalan bukan tahap: statusnya DIBATALKAN dan berdiri sendiri.
// Warna tidak disimpan di sini: satu aksen (primary) dipakai untuk semua status,
// tahap dibedakan lewat langkah (step) dan label.
export const ORDER_STATUSES = [
  { key: "MENUNGGU", label: "Menunggu", step: 1 },
  { key: "DIPROSES", label: "Diproses", step: 2 },
  { key: "SIAP_DIAMBIL", label: "Siap Diambil", step: 3 },
  { key: "SELESAI", label: "Selesai", step: 4 },
] as const;

export const TOTAL_STEPS = ORDER_STATUSES.length;

/** Status terminal di luar tahapan. */
export const STATUS_CANCELLED = "DIBATALKAN";

/** Cakupan layanan antar-jemput. */
export const SERVICE_AREA = "Hanya melayani antar-jemput wilayah Kunciran Indah, Kunciran Jaya, dan sekitarnya.";

export type OrderStatusKey = (typeof ORDER_STATUSES)[number]["key"];

export const STATUS_IN_PROGRESS: readonly string[] = ORDER_STATUSES.map((s) => s.key).filter(
  (k) => k !== "SELESAI"
);

// Ongkos antar jemput. 0 = gratis. Tampil di UI sebagai "Gratis", bukan "Rp 0".
export const DELIVERY_FEE = 0;

// Minimum order kiloan (kg)
export const MIN_ORDER_KG = 3;
