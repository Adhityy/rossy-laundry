"use client";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAUNDRY_INFO, SERVICE_AREA } from "@/lib/data";

const WA_LINK = `https://wa.me/${LAUNDRY_INFO.whatsapp}`;

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className="relative">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:py-20">
        <div className="lg:col-span-6">
          <motion.h1
            {...rise(0)}
            className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Cuci kiloan,
            <span className="block">selesai dua hari.</span>
          </motion.h1>

          <motion.p
            {...rise(0.08)}
            className="mt-6 max-w-[46ch] text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Antar jemput gratis, harga transparan per kilo.
          </motion.p>

          <motion.div {...rise(0.16)} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/orders/new">
                Buat Pesanan <ArrowRight size={16} strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} strokeWidth={2} /> Chat WhatsApp
              </a>
            </Button>
          </motion.div>

          {/* Info area layanan - kecil, di bawah tombol */}
          <motion.p
            {...rise(0.24)}
            className="mt-8 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground/80"
          >
            <MapPin size={13} className="mt-0.5 shrink-0" strokeWidth={2} />
            <span className="max-w-[46ch]">{SERVICE_AREA}</span>
          </motion.p>
        </div>

        <motion.div
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, y: 28 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] as const },
              })}
          className="relative lg:col-span-6"
        >
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted lg:aspect-auto lg:h-[min(560px,62vh)]">
            <Image
              src="/rossy-laundry.jpg"
              alt="Deretan mesin cuci di ruang laundry"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}