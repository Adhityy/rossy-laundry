"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { PackageOpen, ArrowRight, ClipboardList, Search, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { STATUS_CANCELLED } from "@/lib/data"; // Import status batal

export default function OrdersPage() {
  const { status } = useSession();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
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
        if (alive) setHistory(Array.isArray(d) ? d : []);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [status]);

  async function search(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 4) {
      setError("Masukkan nomor resi atau WhatsApp minimal 4 karakter.");
      setResults([]); setSearched(true); return;
    }
    setError(null); setSearching(true); setSearched(true);
    try {
      const res = await fetch(`/api/orders/lookup?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Pencarian gagal."); setResults([]); return; }
      setResults(data.orders ?? []);
    } catch {
      setError("Tidak bisa terhubung ke server."); setResults([]);
    } finally { setSearching(false); }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  // Filter data: Buang pesanan yang statusnya DIBATALKAN
  const filteredHistory = history.filter((o) => o.status !== STATUS_CANCELLED);
  const filteredResults = results.filter((o) => o.status !== STATUS_CANCELLED);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {status === "authenticated" ? (
        <>
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Riwayat pesanan</h1>
            <p className="mt-2 text-sm text-muted-foreground">Pesanan yang dibuat dengan akun ini, terbaru di atas.</p>
          </header>
          <div className="space-y-4">
            {loading ? (
              <><Skeleton className="h-32 w-full rounded-xl" /><Skeleton className="h-32 w-full rounded-xl" /></>
            ) : filteredHistory.length === 0 ? (
              <Card className="border-dashed shadow-none">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <ClipboardList size={32} strokeWidth={1.5} className="text-muted-foreground" />
                  <p className="text-base font-medium">Belum ada pesanan aktif</p>
                  <Button asChild size="sm" className="mt-2"><Link href="/orders/new">Buat pesanan pertama</Link></Button>
                </CardContent>
              </Card>
            ) : (
              filteredHistory.map((o, i) => <OrderCard key={o.id} order={o} index={i} />)
            )}
          </div>
        </>
      ) : (
        <>
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Cek pesanan</h1>
            <p className="mt-2 text-sm text-muted-foreground">Masukkan nomor nota atau nomor WhatsApp yang dipakai saat memesan.</p>
          </header>
          <form onSubmit={search} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="RL-260928-1234 atau 08xxxxxxxxxx" className="h-11 pl-9" />
            </div>
            <Button type="submit" size="lg" disabled={searching} className="h-11">{searching ? "Mencari..." : "Cari"}</Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-8 space-y-4">
            {searching && <Skeleton className="h-32 w-full rounded-xl" />}
            {!searching && searched && !error && filteredResults.length === 0 && (
              <Card className="border-dashed shadow-none">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <PackageOpen size={32} strokeWidth={1.5} className="text-muted-foreground" />
                  <p className="text-base font-medium">Pesanan tidak ditemukan atau sudah dibatalkan</p>
                </CardContent>
              </Card>
            )}
            {filteredResults.map((o, i) => <OrderCard key={o.id} order={o} index={i} />)}
          </div>
        </>
      )}
    </div>
  );
}

function OrderCard({ order, index }: { order: any; index: number }) {
  const isLunas = order.statusPembayaran === "LUNAS";
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: "easeOut" }}
    >
      <Card className="overflow-hidden hover:border-primary/50 transition-colors">
        <CardContent className="p-0">
          <div className="bg-muted/50 p-4 border-b flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Nomor Order</p>
              <p className="font-semibold tabular">{order.orderNumber}</p>
            </div>
            <div className="text-right"><p className="text-sm text-muted-foreground">Total Tagihan</p><p className="font-bold text-lg tabular">{formatCurrency(order.total)}</p></div>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={order.status} />
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isLunas ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {isLunas ? <CheckCircle2 size={12} className="mr-1" /> : <Clock size={12} className="mr-1" />}
                {isLunas ? "Lunas" : "Belum Lunas"}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Dibuat pada {formatDateTime(order.createdAt)}</div>
            <div className="flex items-center justify-between pt-2">
              <Link href={`/orders/${order.id}?phone=${encodeURIComponent(order.whatsapp)}`} className="text-sm font-medium text-primary hover:underline inline-flex items-center">
                Lihat Detail <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}