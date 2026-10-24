"use client";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Droplets, Shirt, Truck, Timer, Sparkles, ShieldCheck } from "lucide-react";

const services = [
  {
    icon: Droplets,
    title: "Cuci Kiloan",
    desc: "Per kilogram, mulai Rp 7.000. Cuci regular, bersih dan wangi.",
    image: "/service-washing-process.jpg",
    imageAlt: "Pekerja memasukkan cucian ke mesin laundry",
  },
  {
    icon: Shirt,
    title: "Cuci Satuan",
    desc: "Per potong untuk kemeja, jas, kebaya, dan barang rumah tangga.",
    image: "/service-folding-clothes.jpg",
    imageAlt: "Pekerja laundry melipat dan menangani pakaian",
  },
  {
    icon: Sparkles,
    title: "Dry Clean",
    desc: "Pencucian kering untuk bahan yang tidak boleh terkena air.",
    image: "/service-washer-closeup.jpg",
    imageAlt: "Handuk bersih di dalam mesin laundry",
  },
  {
    icon: Truck,
    title: "Antar Jemput",
    desc: "Kami ambil dan antar ke rumah Anda tanpa biaya tambahan.",
    image: "/service-laundry-team.jpg",
    imageAlt: "Tim bekerja di fasilitas laundry",
  },
  {
    icon: Timer,
    title: "Express 1/2 Hari",
    desc: "Pesanan rampung dalam satu sampai dua hari.",
    image: "/service-washer-towels.jpg",
    imageAlt: "Beberapa mesin laundry menangani handuk",
  },
  {
    icon: ShieldCheck,
    title: "Garansi",
    desc: "Jaminan kepuasan atas hasil cucian.",
    image: "/hero-laundry-shop.jpg",
    imageAlt: "Deretan mesin cuci di toko laundry",
    tint: true,
  },
] as const;

// Variabel animasi
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15, // Jeda antar kartu biar munculnya bergantian
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  },
};

export function ServicesSection() {
  const reduce = useReducedMotion();

  return (
    <section
      id="layanan"
      className="mx-auto max-w-7xl scroll-mt-0 px-4 py-20 sm:px-6 lg:py-28 overflow-hidden"
    >
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="max-w-[62ch]"
      >
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Layanan kami</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Enam layanan, satu harga terbuka. Pilih yang cocok dengan jenis cucian Anda.
        </p>
      </motion.div>

      <motion.div 
        variants={reduce ? {} : containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {services.map((s) => (
          <motion.article
            key={s.title}
            variants={reduce ? {} : itemVariants}
            className={
              "group overflow-hidden rounded-xl border bg-card " +
              (("tint" in s) ? "border-primary/20 bg-primary/5" : "border-border")
            }
          >
            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
              <Image
                src={s.image}
                alt={s.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="p-5">
              <span className={`grid size-9 place-items-center rounded-md ${("tint" in s) ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"}`}>
                <s.icon size={17} strokeWidth={1.75} />
              </span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}