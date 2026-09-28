"use client";
import { motion } from "framer-motion";
import { Droplets, Shirt, Truck, Clock, Sparkles, Shield } from "lucide-react";

const services = [
  { icon: Droplets, title: "Cuci Kiloan", desc: "Cuci regular per kilogram, bersih dan wangi." },
  { icon: Shirt, title: "Cuci Satuan", desc: "Per potong untuk pakaian & barang rumah tangga." },
  { icon: Truck, title: "Antar Jemput", desc: "Layanan antar jemput ke lokasi Anda." },
  { icon: Clock, title: "Express 2 Hari", desc: "Selesai dalam 2 hari kerja." },
  { icon: Sparkles, title: "Dry Clean", desc: "Pencucian kering untuk bahan sensitif." },
  { icon: Shield, title: "Garansi", desc: "Jaminan kepuasan hasil cucian." },
];

export function ServicesSection() {
  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Layanan Kami</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Kami menyediakan berbagai layanan laundry untuk memenuhi kebutuhan Anda.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all group">
              <span className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <s.icon className="text-blue-600 dark:text-blue-400" size={24} />
              </span>
              <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
