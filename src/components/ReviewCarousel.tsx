"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
};

/** Dua huruf pertama, bukan ikon orang generik. */
function inisial(nama: string): string {
  const parts = nama.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? "").join("").toUpperCase() || "?";
}

export function ReviewCarousel({ reviews }: { reviews: Item[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const nudge = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative mt-7">
      {reviews.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label="Ulasan sebelumnya"
            disabled={atStart}
            onClick={() => nudge(-1)}
            className="absolute -left-1 top-1/2 z-10 hidden size-9 -translate-y-1/2 rounded-full bg-background shadow-md sm:inline-flex"
          >
            <ChevronLeft size={17} strokeWidth={1.75} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Ulasan berikutnya"
            disabled={atEnd}
            onClick={() => nudge(1)}
            className="absolute -right-1 top-1/2 z-10 hidden size-9 -translate-y-1/2 rounded-full bg-background shadow-md sm:inline-flex"
          >
            <ChevronRight size={17} strokeWidth={1.75} />
          </Button>
        </>
      )}

      <div
        ref={track}
        className="grid snap-x snap-mandatory grid-flow-col gap-4 overflow-x-auto pb-2 auto-cols-[86%] sm:auto-cols-[47%] lg:auto-cols-[calc((100%-2rem)/3)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r) => (
          <figure
            key={r.id}
            className="flex h-full snap-start flex-col justify-between rounded-xl border border-border bg-card p-5"
          >
            <div>
              <div className="flex gap-0.5" aria-label={`${r.rating} dari 5 bintang`}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <Star
                    key={v}
                    size={15}
                    strokeWidth={1.5}
                    className={
                      v <= r.rating ? "fill-primary text-primary" : "text-muted-foreground"
                    }
                  />
                ))}
              </div>

              <blockquote className="mt-3 line-clamp-4 text-sm leading-relaxed">
                &ldquo;{r.comment}&rdquo;
              </blockquote>
            </div>

            <figcaption className="mt-5 flex items-center gap-3 border-t border-border pt-4">
              <span
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                aria-hidden
              >
                {inisial(r.name)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{r.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatDate(r.createdAt)}
                </span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
