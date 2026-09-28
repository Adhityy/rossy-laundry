"use client";
import { motion } from "framer-motion";
import { PackageCheck, BarChart3, Bell, History, UserCog, Wallet } from "lucide-react";

const features = [
  { icon: UserCog, title: "Login & Registrasi", desc: "Akun pelanggan & admin dengan autentikasi aman." },
  { icon: PackageCheck, title: "Buat Pesanan", desc: "Pilih kiloan/satuan, opsi antar-jemput, catatan." },
  { icon: BarChart3, title: "Tracking Real-Time", desc: "Pantau status cucian dari mulai hingga selesai." },
  { icon: History, title: "Riwayat Transaksi", desc: "Lihat semua pesanan sebelumnya & total pengeluaran." },
  { icon: Bell, title: "Notifikasi WhatsApp", desc: "Update status otomatis via WhatsApp." },
  { icon: Wallet, title: "Laporan Keuangan", desc: "Pendapatan, pengeluaran, dan laba rugi untuk admin." },
];

export function Features() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Fitur Unggulan</h2>
          <p className="text-blue-200 max-w-2xl mx-auto">Sistem manajemen laundry lengkap untuk pelanggan dan admin.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur border border-white/20 hover:bg-white/15 hover:-translate-y-1 transition-all">
              <span className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <f.icon size={24} />
              </span>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-blue-200 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
