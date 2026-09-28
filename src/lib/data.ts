// Info Laundry
export const LAUNDRY_INFO = {
  name: "Rossy Laundry",
  phone: "087880568880",
  phoneDisplay: "0878-8056-8880",
  whatsapp: "6287880568880",
  address: "Jl. Balita 2 No. 85 Kunciran Mas Permai",
  hours: "Senin-Minggu: 08.00 - 22.00",
  hoursShort: "08.00 - 22.00",
};

// Harga Kiloan (per Kg)
export const PRICES_KILOAN = [
  { name: "Kemeja", laundry: 7000, dryClean: 10000 },
  { name: "Kaos", laundry: 7000, dryClean: 10000 },
  { name: "Blouse", laundry: 7000, dryClean: 10000 },
  { name: "Celana Panjang", laundry: 7000, dryClean: 10000 },
  { name: "Celana Pendek", laundry: 7000, dryClean: 10000 },
  { name: "Rok", laundry: 7000, dryClean: 10000 },
  { name: "Underware", laundry: 7000, dryClean: 10000 },
  { name: "Bra", laundry: 7000, dryClean: 10000 },
  { name: "Jacket", laundry: 7000, dryClean: 15000 },
  { name: "Jacket Kulit", laundry: 7000, dryClean: 25000 },
  { name: "Handuk", laundry: 7000, dryClean: 10000 },
  { name: "Sprei", laundry: 7000, dryClean: 10000 },
];

// Harga Satuan (per Potong), dipecah per kelompok tampilan.
// PRICES_SATUAN tetap urut persis seperti daftar aslinya.
export const PRICES_PAKAIAN = [
  { name: "Kemeja", price: 7000 },
  { name: "Kaos", price: 7000 },
  { name: "Blouse", price: 7000 },
  { name: "Celana Panjang", price: 7000 },
  { name: "Celana Pendek", price: 5000 },
  { name: "Rok", price: 7000 },
  { name: "Underware", price: 5000 },
  { name: "Bra", price: 5000 },
  { name: "Jacket", price: 15000 },
  { name: "Jacket Kulit", price: 50000 },
  { name: "Dress", price: 15000 },
  { name: "Gamis", price: 15000 },
  { name: "Jas", price: 25000 },
  { name: "Kebaya", price: 15000 },
  { name: "Koko", price: 7000 },
  { name: "Sarung", price: 7000 },
  { name: "Kaos Kaki", price: 3000 },
  { name: "Topi", price: 5000 },
  { name: "Dasli", price: 5000 },
  { name: "Daster", price: 7000 },
  { name: "Mukena", price: 10000 },
  { name: "Hijab", price: 5000 },
  { name: "Selendang", price: 5000 },
  { name: "Rompi", price: 10000 },
  { name: "Cardigan", price: 10000 },
  { name: "Sweater", price: 10000 },
  { name: "Kaos Lengan Panjang", price: 7000 },
  { name: "Legging", price: 7000 },
  { name: "Kulot", price: 7000 },
  { name: "Overall", price: 15000 },
];

export const PRICES_RUMAH_TANGGA = [
  { name: "Sprei", price: 20000 },
  { name: "Selimut", price: 20000 },
  { name: "Bantal", price: 10000 },
  { name: "Guling", price: 10000 },
  { name: "Kasur", price: 50000 },
  { name: "Karpet", price: null },
  { name: "Tirai", price: 20000 },
  { name: "Taplak Meja", price: 10000 },
  { name: "Sarung Kursi", price: 10000 },
  { name: "Sarung Bantal", price: 5000 },
  { name: "Handuk Besar", price: 10000 },
  { name: "Handuk Kecil", price: 5000 },
  { name: "Alas Kasur", price: 15000 },
  { name: "Boneka", price: null },
  { name: "Perlengkapan Bayi", price: 5000 },
  { name: "Sepatu", price: 25000 },
  { name: "Tas", price: 25000 },
  { name: "Dompet", price: 10000 },
  { name: "Helm", price: 15000 },
  { name: "Sarung Tangan", price: 5000 },
  { name: "Taplak", price: 10000 },
  { name: "Kasur Lantai", price: null },
];

export const PRICES_SATUAN = [...PRICES_PAKAIAN, ...PRICES_RUMAH_TANGGA];

export const PRICE_GROUPS = [
  { label: "Pakaian", items: PRICES_PAKAIAN },
  { label: "Rumah tangga", items: PRICES_RUMAH_TANGGA },
] as const;

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
