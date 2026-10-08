"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Search, PackageOpen, ArrowRight, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/types";

function OrderCard({ order, href }: { order: Order; href: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="tabular text-sm font-medium">{order.orderNumber}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDateTime(order.createdAt)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
          <span className="text-muted-foreground">
            {order.service === "KILOAN" ? "Kiloan" : "Satuan"}
            {order.service !== "KILOAN" &&
              ` · ${order.washType === "DRY_CLEAN" ? "Dry clean" : "Laundry"}`}
            {" · "}
            {order.deliveryType === "DELIVERY" ? "Antar jemput" : "Antar ke toko"}
          </span>
          <span className="tabular font-semibold">{formatCurrency(order.total)}</span>
        </div>

        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href={href}>
              Lihat detail <ArrowRight size={15} strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OrdersPage() {
  const { status } = useSession();

  // Riwayat: hanya untuk yang sudah login.
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Pencarian: hanya untuk tamu.
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Order[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") {
      setLoading(false);
      return;
    }
    let alive = true;
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : []))
      .then((d: unknown) => {
        if (alive) setHistory(Array.isArray(d) ? (d as Order[]) : []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [status]);

  async function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 4) {
      setError("Masukkan nomor resi atau nomor WhatsApp minimal 4 karakter.");
      setResults([]);
      setSearched(true);
      return;
    }

    setError(null);
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { orders?: Order[]; error?: string };
      if (!res.ok) {
        setError(data.error || "Pencarian gagal.");
        setResults([]);
        return;
      }
      setResults(data.orders ?? []);
    } catch {
      setError("Tidak bisa terhubung ke server.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  // ---- Sudah login: riwayat langsung, tanpa pencarian ----
  if (status === "authenticated") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight">Riwayat pesanan</h1>
          <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
            Pesanan yang dibuat dengan akun ini, terbaru di atas.
          </p>
        </header>

        <div className="mt-8 space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </>
          ) : history.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <ClipboardList size={28} strokeWidth={1.5} className="text-muted-foreground" />
                <p className="text-sm font-medium">Belum ada pesanan</p>
                <p className="max-w-[42ch] text-sm text-muted-foreground">
                  Pesanan yang dibuat lewat toko diinput atas nomor WhatsApp Anda dan akan
                  muncul di sini juga.
                </p>
                <Button asChild size="sm">
                  <Link href="/orders/new">Buat pesanan pertama</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            history.map((o) => <OrderCard key={o.id} order={o} href={`/orders/${o.id}`} />)
          )}
        </div>
      </div>
    );
  }

  // ---- Tidak login: satu kolom cari ----
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Cek pesanan</h1>
        <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
          Masukkan nomor resi atau nomor WhatsApp yang dipakai saat memesan. Tidak perlu
          masuk akun.
        </p>
      </header>

      <form onSubmit={search} className="mt-6 flex gap-2">
        <div className="relative flex-1">
          <Search
            size={16}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="RL-260928-1234 atau 08xxxxxxxxxx"
            aria-label="Nomor resi atau nomor WhatsApp"
            className="h-11 pl-9"
            autoComplete="off"
          />
        </div>
        <Button type="submit" size="lg" disabled={searching} className="h-11">
          {searching ? "Mencari..." : "Cari"}
        </Button>
      </form>

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-8 space-y-4">
        {searching && (
          <>
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </>
        )}

        {!searching && searched && !error && results.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <PackageOpen size={28} strokeWidth={1.5} className="text-muted-foreground" />
              <p className="text-sm font-medium">Pesanan tidak ditemukan</p>
              <p className="max-w-[42ch] text-sm text-muted-foreground">
                Periksa kembali nomor yang diketik. Kalau pesanan Anda diantar ke toko,
                nomor WhatsApp-nya dipakai oleh pihak laundry.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/orders/new">Buat pesanan baru</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {results.map((o) => (
          <OrderCard
            key={o.id}
            order={o}
            href={`/orders/${o.id}?phone=${encodeURIComponent(o.whatsapp)}`}
          />
        ))}

        {!searched && (
          <Alert>
            <AlertTitle>Tidak tahu nomor resinya?</AlertTitle>
            <AlertDescription>
              Pakai nomor WhatsApp yang Anda isi saat memesan. Pesanan yang diantar ke toko
              juga tercatat dengan nomor yang sama.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
