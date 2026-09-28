// Daftar tarif Rossy Laundry, diketik ulang dari struk cetak.
// Kolom kiri struk = PAKAIAN, kolom kanan = RUMAH_TANGGA.
// Harga dalam Rupiah utuh, per potong.
// laundryPrice / dryCleanPrice null = sel tarif kosong di struk (tidak dipesan online).

export type PriceRow = {
  category: "PAKAIAN" | "RUMAH_TANGGA";
  name: string;
  laundry: number | null;
  dryClean: number | null;
  note?: string;
};

export const PRICES: PriceRow[] = [
  // --- Tabel kiri: PAKAIAN (30 baris) ---
  { category: "PAKAIAN", name: "York Biasa", laundry: 13000, dryClean: 15000 },
  { category: "PAKAIAN", name: "Mukena/Stel", laundry: 20000, dryClean: 22000 },
  { category: "PAKAIAN", name: "Rok Pendek", laundry: 11000, dryClean: 13000 },
  { category: "PAKAIAN", name: "Rok Panjang", laundry: 13000, dryClean: 15000 },
  { category: "PAKAIAN", name: "Long Dress", laundry: 18000, dryClean: 20000 },
  { category: "PAKAIAN", name: "Blouse", laundry: 11000, dryClean: 13000 },
  { category: "PAKAIAN", name: "Kebaya", laundry: 13000, dryClean: 15000 },
  { category: "PAKAIAN", name: "Korset", laundry: 10000, dryClean: 12000 },
  {
    category: "PAKAIAN",
    name: "Pakaian Pengantin",
    laundry: 75000,
    dryClean: 75000,
    note: "Satu sel tarif di struk, berlaku untuk semua layanan.",
  },
  { category: "PAKAIAN", name: "Jacket Kulit", laundry: 25000, dryClean: 27000 },
  { category: "PAKAIAN", name: "Jas", laundry: 16000, dryClean: 18000 },
  { category: "PAKAIAN", name: "Safari", laundry: 14000, dryClean: 16000 },
  { category: "PAKAIAN", name: "Celana Panjang", laundry: 13000, dryClean: 15000 },
  { category: "PAKAIAN", name: "Celana Pendek", laundry: 11000, dryClean: 13000 },
  { category: "PAKAIAN", name: "Kemeja", laundry: 13000, dryClean: 15000 },
  { category: "PAKAIAN", name: "Jacket", laundry: 17000, dryClean: 19000 },
  { category: "PAKAIAN", name: "Gamis", laundry: 18000, dryClean: 20000 },
  { category: "PAKAIAN", name: "Mantel Besar", laundry: 25000, dryClean: 27000 },
  { category: "PAKAIAN", name: "Baju Anak-anak", laundry: 11000, dryClean: 13000 },
  { category: "PAKAIAN", name: "Sarung Songket", laundry: 15000, dryClean: 17000 },
  { category: "PAKAIAN", name: "Dasi", laundry: 10000, dryClean: 12000 },
  { category: "PAKAIAN", name: "Rompi", laundry: 11000, dryClean: 13000 },
  { category: "PAKAIAN", name: "Celana Jeans", laundry: 15000, dryClean: 17000 },
  { category: "PAKAIAN", name: "Baju Kaos", laundry: 11000, dryClean: 13000 },
  { category: "PAKAIAN", name: "Baju Muslim/Stel", laundry: 25000, dryClean: 27000 },
  { category: "PAKAIAN", name: "Selendang", laundry: 10000, dryClean: 12000 },
  { category: "PAKAIAN", name: "Sarung Tangan", laundry: 10000, dryClean: 12000 },
  { category: "PAKAIAN", name: "Sepatu", laundry: 20000, dryClean: 22000 },
  { category: "PAKAIAN", name: "Koper Besar", laundry: 40000, dryClean: 45000 },
  { category: "PAKAIAN", name: "Koper Kecil", laundry: 30000, dryClean: 35000 },

  // --- Tabel kanan: RUMAH_TANGGA (30 baris) ---
  { category: "RUMAH_TANGGA", name: "Selimut Tebal", laundry: 18000, dryClean: 20000 },
  { category: "RUMAH_TANGGA", name: "Selimut Tipis", laundry: 16000, dryClean: 18000 },
  { category: "RUMAH_TANGGA", name: "Taplak Meja", laundry: 11000, dryClean: 13000 },
  { category: "RUMAH_TANGGA", name: "Sprei Panj Biasa", laundry: 14000, dryClean: 16000 },
  { category: "RUMAH_TANGGA", name: "Sprei Panj Rombe", laundry: 17000, dryClean: 19000 },
  { category: "RUMAH_TANGGA", name: "Sarung Bantal", laundry: 4000, dryClean: 5000 },
  { category: "RUMAH_TANGGA", name: "Sarung Bantal Kursi", laundry: 5000, dryClean: 6000 },
  { category: "RUMAH_TANGGA", name: "K. Gordyn Tebal/M2", laundry: 5000, dryClean: 7000 },
  { category: "RUMAH_TANGGA", name: "K. Gordyn Tipis/M2", laundry: 3000, dryClean: 5000 },
  { category: "RUMAH_TANGGA", name: "Rombe Gordyn", laundry: 5000, dryClean: 7000 },
  { category: "RUMAH_TANGGA", name: "Tikar", laundry: 30000, dryClean: 32000 },
  {
    category: "RUMAH_TANGGA",
    name: "Karpet Tebal/M2",
    laundry: null,
    dryClean: null,
    note: "Tarif kosong di struk, harga menyesuaikan.",
  },
  {
    category: "RUMAH_TANGGA",
    name: "Karpet Tipis/M2",
    laundry: null,
    dryClean: null,
    note: "Tarif kosong di struk, harga menyesuaikan.",
  },
  { category: "RUMAH_TANGGA", name: "Boneka Jumbo", laundry: 30000, dryClean: 35000 },
  { category: "RUMAH_TANGGA", name: "Boneka P. Besar", laundry: 17000, dryClean: 19000 },
  { category: "RUMAH_TANGGA", name: "Boneka P. Kecil", laundry: 12000, dryClean: 14000 },
  { category: "RUMAH_TANGGA", name: "Bed Cover Jumbo", laundry: 30000, dryClean: 32000 },
  { category: "RUMAH_TANGGA", name: "Bed Cover", laundry: 25000, dryClean: 27000 },
  { category: "RUMAH_TANGGA", name: "Handuk Besar", laundry: 15000, dryClean: 17000 },
  { category: "RUMAH_TANGGA", name: "Handuk Kecil", laundry: 11000, dryClean: 14000 },
  { category: "RUMAH_TANGGA", name: "Bantal/Guling", laundry: 20000, dryClean: 22000 },
  { category: "RUMAH_TANGGA", name: "Tas Dari Kain", laundry: 15000, dryClean: 17000 },
  { category: "RUMAH_TANGGA", name: "Tas Ransel", laundry: 20000, dryClean: 25000 },
  { category: "RUMAH_TANGGA", name: "Keset", laundry: 10000, dryClean: 12000 },
  { category: "RUMAH_TANGGA", name: "Sajadah", laundry: 13000, dryClean: 15000 },
  { category: "RUMAH_TANGGA", name: "Topi", laundry: 10000, dryClean: 12000 },
  { category: "RUMAH_TANGGA", name: "Stroler", laundry: 50000, dryClean: 55000 },
  { category: "RUMAH_TANGGA", name: "Bemper Bayi", laundry: 15000, dryClean: 17000 },
  {
    category: "RUMAH_TANGGA",
    name: "Kasur Lantai Kecil",
    laundry: null,
    dryClean: null,
    note: "Tarif kosong di struk, harga menyesuaikan.",
  },
  {
    category: "RUMAH_TANGGA",
    name: "Kasur Lantai Besar",
    laundry: null,
    dryClean: null,
    note: "Tarif kosong di struk, harga menyesuaikan.",
  },
];

export const CATEGORY_LABELS: Record<PriceRow["category"], string> = {
  PAKAIAN: "Pakaian",
  RUMAH_TANGGA: "Rumah tangga",
};
