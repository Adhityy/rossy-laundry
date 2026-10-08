"use client";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { UserPlus, MousePointerClick, Radar, ReceiptText, MessageCircle, Calculator } from "lucide-react";

const features = [
  {
    icon: UserPlus,
    title: "Buat akun sendiri",
    desc: "Satu akun pelanggan. Pesanan dan riwayat tersimpan otomatis.",
  },
  {
    icon: MousePointerClick,
    title: "Pesan sekali klik",
    desc: "Pilih kiloan atau satuan, isi alamat antar jemput, pesanan terkirim.",
  },
  {
    icon: Radar,
    title: "Lacak status cucian",
    desc: "Bergerak dari Menunggu sampai Siap Diambil, terlihat langsung di layar.",
  },
  {
    icon: ReceiptText,
    title: "Riwayat lengkap",
    desc: "Semua pesanan beserta total belanja tercatat dalam satu daftar.",
  },
  {
    icon: MessageCircle,
    title: "Kabari lewat WhatsApp",
    desc: "Notifikasi perubahan status dikirim ke nomor Anda.",
  },
  {
    icon: Calculator,
    title: "Hitung laba rugi",
    desc: "Pemilik mencatat bahan, gaji, dan operasional. Laba dihitung otomatis.",
  },
] as const;

export function Features() {
  const reduce = useReducedMotion();
  const reveal = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.5, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-14 lg:py-28">
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Yang Anda dapat
          </h2>
          <p className="mt-4 max-w-[42ch] text-base leading-relaxed text-muted-foreground">
            Sistem yang sama dipakai pelanggan untuk memesan dan memantau, dan pemilik
            untuk menghitung untung.
          </p>
          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
            <Image
              src="/clothespins.jpg"
              alt="Jepitan kayu pada rak jemuran"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
          </div>
        </div>

        <ul className="grid gap-x-10 gap-y-8 border-t border-border pt-8 sm:grid-cols-2 lg:col-span-8">
          {features.map((f, i) => (
            <motion.li key={f.title} {...reveal(i)}>
              <span className="grid size-9 place-items-center rounded-md bg-accent text-foreground">
                <f.icon size={17} strokeWidth={1.75} />
              </span>
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 max-w-[36ch] text-sm leading-relaxed text-muted-foreground">
                {f.desc}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
