export const PRICE_KILOAN = [
  { name: "Kemeja", laundry: 7000, dryclean: 12000 },
  { name: "Kaos", laundry: 6000, dryclean: 10000 },
  { name: "Blouse", laundry: 7000, dryclean: 12000 },
  { name: "Celana Panjang", laundry: 7000, dryclean: 12000 },
  { name: "Celana Pendek", laundry: 6000, dryclean: 10000 },
  { name: "Rok", laundry: 6000, dryclean: 10000 },
  { name: "Underware", laundry: 5000, dryclean: 8000 },
  { name: "Bra", laundry: 5000, dryclean: 8000 },
  { name: "Jacket", laundry: 10000, dryclean: 18000 },
  { name: "Jacket Kulit", laundry: 0, dryclean: 35000 },
  { name: "Handuk", laundry: 7000, dryclean: 12000 },
  { name: "Sprei", laundry: 15000, dryclean: 25000 },
];

export const PRICE_SATUAN = [
  { name: "Kemeja", price: 5000 },
  { name: "Kaos", price: 4000 },
  { name: "Blouse", price: 5000 },
  { name: "Celana Panjang", price: 6000 },
  { name: "Celana Pendek", price: 4000 },
  { name: "Rok", price: 5000 },
  { name: "Jas", price: 20000 },
  { name: "Jacket", price: 10000 },
  { name: "Jacket Kulit", price: 30000 },
  { name: "Gaun", price: 15000 },
  { name: "Gamis", price: 10000 },
  { name: "Sarung", price: 7000 },
  { name: "Koko", price: 5000 },
  { name: "Koko Anak", price: 4000 },
  { name: "Kemeja Anak", price: 4000 },
  { name: "Kaos Anak", price: 3000 },
  { name: "Bedcover", price: 25000 },
  { name: "Sprei", price: 15000 },
  { name: "Gorden", price: 20000 },
  { name: "Karpet", price: 0 },
  { name: "Sarung Bantal", price: 5000 },
  { name: "Sarung Guling", price: 7000 },
  { name: "Selimut", price: 15000 },
  { name: "Handuk", price: 7000 },
  { name: "Perlak Bayi", price: 10000 },
  { name: "Bantal", price: 10000 },
  { name: "Guling", price: 12000 },
  { name: "Kasur", price: 35000 },
  { name: "Boneka", price: 15000 },
  { name: "Taplak Meja", price: 10000 },
];

export const CONTACT = {
  phone: "087880568880",
  address: "Jl. Balita 2 No. 85 Kunciran Mas Permai",
  hours: "Senin-Minggu: 08.00 - 22.00",
};

export const SERVICES = [
  { title: "Laundry Kiloan", desc: "Cuci kering setrika per kilogram", icon: "washing" },
  { title: "Laundry Satuan", desc: "Cuci per potong untuk pakaian tertentu", icon: "shirt" },
  { title: "Dry Clean", desc: "Pencucian kering untuk bahan halus", icon: "sparkles" },
  { title: "Antar Jemput", desc: "Layanan penjemputan ke rumah", icon: "truck" },
  { title: "Express 2 Hari", desc: "Selesai dalam 2 hari kerja", icon: "clock" },
  { title: "Press & Rapi", desc: "Setrika rapi dengan standar tinggi", icon: "check" },
];

export const ORDER_STATUSES = [
  { key: "PENDING", label: "Menunggu", color: "bg-yellow-500", desc: "Pesanan diterima, menunggu konfirmasi" },
  { key: "PICKED_UP", label: "Dijemput", color: "bg-blue-500", desc: "Pakaian telah dijemput" },
  { key: "WASHING", label: "Dicuci", color: "bg-indigo-500", desc: "Sedang dalam proses pencucian" },
  { key: "READY", label: "Siap", color: "bg-purple-500", desc: "Selesai dicuci dan disetrika" },
  { key: "DELIVERED", label: "Diantar", color: "bg-cyan-500", desc: "Sedang diantar ke alamat" },
  { key: "COMPLETED", label: "Selesai", color: "bg-green-500", desc: "Pesanan telah diterima" },
];
