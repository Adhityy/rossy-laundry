"use client";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LAUNDRY_INFO } from "@/lib/data";

const WA_LINK = `https://wa.me/${LAUNDRY_INFO.whatsapp}`;

export function ContactCta() {
  const reduce = useReducedMotion();
  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.35 },
        transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <section className="relative isolate overflow-hidden border-y border-border">
      <Image
        src="/washer-room.jpg"
        alt=""
        fill
        aria-hidden
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-zinc-950/80" />

      <motion.div
        {...reveal}
        className="relative mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-20 sm:px-6 lg:py-24"
      >
        <div className="max-w-[46ch]">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
            Antar bajunya, sisanya kami yang urus.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-300">
            Tanya dulu lewat WhatsApp kalau ada yang belum jelas, atau langsung buat
            pesanan sekarang.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/orders/new">
              Buat Pesanan <ArrowRight size={16} strokeWidth={2} />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/50 bg-white/10 text-white backdrop-blur-sm hover:border-white/60 hover:bg-white/20 hover:text-white dark:border-white/50 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={16} strokeWidth={2} /> Chat WhatsApp
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
