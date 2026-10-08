"use client";
import { MapPin, Truck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const AREAS = [
  "Kelurahan Kunciran Indah",
  "Kelurahan Kunciran Jaya",
  "Kelurahan Kunciran Baru",
  "Kelurahan Pinang",
  "Perumahan Fortune Regency (Kunciran Jaya)",
  "Sekitar Kecamatan Pinang",
];

const MAP_EMBED_SRC =
  "https://www.google.com/maps?q=Kunciran,+Pinang,+Tangerang&output=embed";

export function ServiceArea() {
  const reduce = useReducedMotion();
  const reveal = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.25 },
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
        {/* Kiri: judul + list area */}
        <motion.div {...reveal}>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Area layanan kami
          </h2>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
            Kami melayani antar jemput laundry untuk area berikut. Jika lokasi kamu belum
            tercantum, silakan hubungi kami.
          </p>

          <ul className="mt-8 space-y-4">
            {AREAS.map((area) => (
              <li key={area} className="flex items-start gap-2.5">
                <MapPin
                  size={18}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0 text-primary"
                />
                <span className="text-sm leading-relaxed">{area}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 flex items-start gap-2.5 text-sm text-muted-foreground">
            <Truck size={16} strokeWidth={1.75} className="mt-0.5 shrink-0" />
            Gratis antar jemput untuk radius ±3 km dari toko.
          </p>
        </motion.div>

        {/* Kanan: peta */}
        <motion.div
          {...reveal}
          className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
        >
          <iframe
            title="Peta area layanan Rossy Laundry"
            src={MAP_EMBED_SRC}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full"
            style={{ border: 0 }}
            allowFullScreen
          />
        </motion.div>
      </div>
    </section>
  );
}