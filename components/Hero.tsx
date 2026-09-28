"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, MapPin, Clock, ArrowRight } from "lucide-react";
import { LAUNDRY_INFO } from "@/lib/data";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 text-white">
      <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-32">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center max-w-3xl mx-auto">
          <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur text-sm font-medium mb-6 border border-white/20">
            Laundry Terpercaya
          </motion.span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
            Cuci Bersih, <span className="bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">Harga Hemat</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Rossy Laundry melayani cuci kiloan dan satuan dengan hasil rapi, wangi, dan tepat waktu.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/orders/new" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-blue-700 font-bold text-lg hover:bg-blue-50 transition-all shadow-lg">
              Buat Pesanan <ArrowRight size={20} />
            </Link>
            <a href={"https://wa.me/" + LAUNDRY_INFO.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-green-500 text-white font-bold text-lg hover:bg-green-600 transition-all shadow-lg">
              Chat WhatsApp
            </a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.7 }} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16 max-w-4xl mx-auto">
          {[
            { icon: "phone", label: "Telepon", value: LAUNDRY_INFO.phoneDisplay },
            { icon: "map", label: "Alamat", value: LAUNDRY_INFO.address },
            { icon: "clock", label: "Jam Operasional", value: LAUNDRY_INFO.hours },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur border border-white/20">
              <span className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0 text-lg">
                {item.icon === "phone" ? "\u260E\uFE0F" : item.icon === "map" ? "\U0001F4CD" : "\u23F0"}
              </span>
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-wide">{item.label}</p>
                <p className="text-sm font-medium mt-0.5">{item.value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
