"use client";

import { LAUNDRY_INFO } from "@/lib/data";
import { formatCurrency, formatDate, formatPhone } from "@/lib/utils";
import { parseItems, type Order } from "@/lib/types";

/**
 * Struk Rossy - mengikuti form cetak asli:
 * slogan vertikal di dua tepi, kop outlet, blok identitas pelanggan, tabel item,
 * dua baris "Jumlah Barang", Total Harga, lalu Syarat & Ketentuan 6 pasal.
 *
 * Dipakai dua jalur: window.print() lewat CSS @media print, dan rasterisasi
 * html-to-image untuk dibagikan / diunduh sebagai foto.
 */
const SLOGAN_KIRI = "KAMI MERAWAT ANDA MEMAKAI";
const SLOGAN_KANAN = "KEPUASAN ANDA ADALAH TUJUAN KAMI";

const SYARAT = [
  "Minimum order adalah 3 Kg, bila order yang diterima kurang dari 3 Kg maka akan diperhitungkan sebagai minimum order.",
  "Rossy berusaha sebaik mungkin untuk memperlakukan cucian anda. Rossy tidak bertanggung jawab bila terjadi kerusakan karena sifat bahan/kain atau luntur yang tidak diberitahukan atau akibat dari benda yang tertinggal dalam cucian.",
  "Demi kebaikan Anda periksa dan hitunglah jumlah cucian Anda. Keluhan setelah meninggalkan outlet tidak dapat dilayani.",
  "Rossy Berkomitmen untuk menjaga milik para pelanggan, namun apabila ada barang/benda berharga yang tertinggal dalam cucian atau rusak maka Rossy tidak bertanggung jawab atas kehilangan atau kerusakan tersebut.",
  "Cucian yang rusak atau hilang yang disebabkan oleh kelalaian Rossy akan diganti maksimum 5 kali dari harga cucian perkilo atau perpotong.",
  "Barang yang tidak diambil lebih dari 30 hari bukan lagi menjadi tanggung jawab Rossy.",
];

/** Tanggal pesanan selesai, diambil dari log status SELESAI terakhir. */
function selesaiPada(order: Order): string {
  const logs = [...(order.statusLogs ?? [])].reverse();
  const done = logs.find((l) => l.status === "SELESAI");
  return done ? formatDate(done.createdAt) : "Belum selesai";
}

export function Struk({ order }: { order: Order }) {
  const items = parseItems(order.items);
  const potong = items.reduce((s, i) => s + i.qty, 0);
  const kilo = order.weight ?? 0;

  const nama = order.customerName || (order.user as { name?: string } | undefined)?.name || "-";
  const alamat = order.pickupAddress || "-";

  return (
    <div
      id="struk"
      className="struk relative mx-auto w-[460px] bg-white text-black"
      style={{ fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Tepi: slogan vertikal seperti di form cetak */}
      <div className="pointer-events-none absolute left-0 top-0 flex h-full w-6 items-center justify-center border-r border-dashed border-black/30">
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/70"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          {SLOGAN_KIRI}
        </span>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 flex h-full w-6 items-center justify-center border-l border-dashed border-black/30">
        <span
          className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/70"
          style={{ writingMode: "vertical-rl" }}
        >
          {SLOGAN_KANAN}
        </span>
      </div>

      <div className="px-7 py-6">
        {/* Kop outlet */}
        <div className="border-b-2 border-black pb-3 text-center">
          <p className="text-[17px] font-bold uppercase leading-tight tracking-wide">
            {LAUNDRY_INFO.name} &amp; Dry Cleaning Service
          </p>
          <p className="mt-1 text-[11px] leading-snug">{LAUNDRY_INFO.address}</p>
          <p className="text-[11px] leading-snug">
            WA {formatPhone(LAUNDRY_INFO.whatsapp)} · Jam buka {LAUNDRY_INFO.hours}
          </p>
        </div>

        {/* Identitas */}
        <dl className="mt-4 space-y-[3px] text-[11.5px]">
          {[
            ["No. Seri", order.orderNumber],
            ["Cabang", "-"],
            ["Nama", nama],
            ["Alamat", alamat],
            ["Terima Tgl.", formatDate(order.createdAt)],
            ["Selesai Tgl.", selesaiPada(order)],
            ["WhatsApp", formatPhone(order.whatsapp)],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="w-[86px] shrink-0">{k} :</dt>
              <dd className="min-w-0 flex-1 border-b border-dotted border-black/40">{v}</dd>
            </div>
          ))}
        </dl>

        {/* Tabel item */}
        <table className="mt-4 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-y border-black">
              <th className="w-7 border-r border-black/40 py-1.5 text-center font-semibold">No</th>
              <th className="border-r border-black/40 py-1.5 text-left font-semibold">
                Jenis Cucian
              </th>
              <th className="w-16 border-r border-black/40 py-1.5 text-center font-semibold">
                Jumlah
              </th>
              <th className="w-24 py-1.5 text-right font-semibold">Harga</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={`${it.name}-${i}`} className="border-b border-dotted border-black/30">
                <td className="border-r border-black/40 py-1.5 text-center">{i + 1}</td>
                <td className="border-r border-black/40 py-1.5">{it.name}</td>
                <td className="tabular border-r border-black/40 py-1.5 text-center">
                  {order.service === "KILOAN" ? `${it.qty} kg` : `× ${it.qty}`}
                </td>
                <td className="tabular py-1.5 text-right">{formatCurrency(it.price)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-center text-black/50">
                  Tidak ada item
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Jumlah barang */}
        <dl className="mt-3 space-y-[3px] text-[11.5px]">
          <div className="flex items-baseline gap-1">
            <dt className="shrink-0">Jumlah Barang</dt>
            <dd className="min-w-0 flex-1 border-b border-dotted border-black/40" />
            <dd className="tabular shrink-0 font-semibold">{potong}</dd>
            <dd className="shrink-0">Potong</dd>
          </div>
          <div className="flex items-baseline gap-1">
            <dt className="shrink-0">Jumlah Barang</dt>
            <dd className="min-w-0 flex-1 border-b border-dotted border-black/40" />
            <dd className="tabular shrink-0 font-semibold">{kilo > 0 ? kilo : 0}</dd>
            <dd className="shrink-0">Kilo</dd>
          </div>
          <div className="mt-2 flex items-baseline gap-1 border-t border-black pt-2">
            <dt className="shrink-0 font-semibold">Total Harga</dt>
            <dt className="shrink-0">Rp.</dt>
            <dd className="min-w-0 flex-1 border-b border-dotted border-black/40" />
            <dd className="tabular shrink-0 text-[13px] font-bold">
              {order.total.toLocaleString("id-ID")}
            </dd>
          </div>
        </dl>

        {/* Syarat & Ketentuan */}
        <div className="mt-4 border-t border-black pt-3">
          <p className="text-[11px] font-semibold">Syarat &amp; Ketentuan :</p>
          <ol className="mt-1.5 space-y-[5px] text-[9.5px] leading-[1.35] text-black/85">
            {SYARAT.map((s, i) => (
              <li key={i} className="flex gap-1.5">
                <span className="shrink-0">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-5 flex items-end justify-between gap-6">
          <p className="text-[9.5px] leading-snug text-black/70">
            Periksa dan hitung jumlah cucian Anda
            <br />
            sebelum meninggalkan outlet.
          </p>
          <div className="text-center">
            <p className="text-[10.5px]">Hormat Kami,</p>
            <div className="h-10" />
            <p className="border-t border-black pt-1 text-[10.5px] font-semibold">
              {LAUNDRY_INFO.name}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
