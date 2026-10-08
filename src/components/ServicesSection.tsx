"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Droplets, Shirt, Truck, Timer, Sparkles, ShieldCheck } from "lucide-react";

const services = [
  {
    icon: Droplets,
    title: "Cuci Kiloan",
    desc: "Per kilogram, mulai Rp 7.000. Cuci regular, bersih dan wangi.",
    cell: "md:col-span-1 md:row-span-2",
  },
  { icon: Shirt, title: "Cuci Satuan", desc: "Per potong untuk kemeja, jas, kebaya, dan barang rumah tangga.", cell: "" },
  { icon: Sparkles, title: "Dry Clean", desc: "Pencucian kering untuk bahan yang tidak boleh terkena air.", cell: "" },
  { icon: Truck, title: "Antar Jemput", desc: "Kami ambil dan antar ke rumah Anda tanpa biaya tambahan.", cell: "" },
  { icon: Timer, title: "Express 1/2 Hari", desc: "Pesanan rampung dalam satu sampai dua hari.", cell: "" },
  {
    icon: ShieldCheck,
    title: "Garansi",
    desc: "Jaminan kepuasan atas hasil cucian.",
    cell: "md:col-span-3",
    tint: true,
  },
] as const;

export function ServicesSection() {
  const reduce = useReducedMotion();
  const reveal = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.25 },
          transition: { duration: 0.55, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section
      id="layanan"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28"
    >
      <motion.div {...reveal(0)} className="max-w-[62ch]">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Layanan kami</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Enam layanan, satu harga terbuka. Pilih yang cocok dengan jenis cucian Anda.
        </p>
      </motion.div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        {services.map((s, i) => {
          if ("tint" in s) {
            return (
              <motion.article
                key={s.title}
                {...reveal(i)}
                className="flex flex-col justify-between gap-6 rounded-xl border border-primary/25 bg-primary/10 p-6 sm:flex-row sm:items-end"
              >
                <div>
                  <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
                    <s.icon size={17} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1.5 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </motion.article>
            );
          }

          return (
            <motion.article
              key={s.title}
              {...reveal(i)}
              className={
                "flex flex-col rounded-xl border border-border bg-card p-5 " + s.cell
              }
            >
              <span className="grid size-9 place-items-center rounded-md bg-accent text-foreground">
                <s.icon size={17} strokeWidth={1.75} />
              </span>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}