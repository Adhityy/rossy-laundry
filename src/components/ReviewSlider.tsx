import { prisma } from "@/lib/prisma";
import { ReviewCarousel } from "./ReviewCarousel";

/**
 * Ulasan pelanggan untuk beranda, ditempatkan tepat sebelum daftar harga.
 * Server component: ikut prerender, jadi teks ulasan masuk HTML awal.
 * Bagian ini tidak dirender sama sekali kalau belum ada ulasan.
 */
export async function ReviewSlider() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 12,
    select: { id: true, name: true, rating: true, comment: true, createdAt: true },
  });

  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <section aria-labelledby="ulasan-judul" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:mt-24">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h2 id="ulasan-judul" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Kata pelanggan
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {avg.toFixed(1).replace(".", ",")} dari 5 dari {reviews.length} penilaian.
          </p>
        </div>
      </div>

      <ReviewCarousel reviews={reviews} />
    </section>
  );
}
