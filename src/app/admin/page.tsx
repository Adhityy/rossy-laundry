"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, DollarSign, TrendingUp, Clock, FilePlus } from "lucide-react";
import { toast } from "sonner";
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { ORDER_STATUSES, STATUS_IN_PROGRESS, STATUS_CANCELLED } from "@/lib/data"; // Tambah STATUS_CANCELLED
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/types";

function nextOf(status: string) {
  const i = ORDER_STATUSES.findIndex((s) => s.key === status);
  return i >= 0 ? ORDER_STATUSES[i + 1] : undefined;
}

const SELESAI_KEY = ORDER_STATUSES.find((s) => s.label === "Selesai")?.key ?? "SELESAI";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const fetchOrders = () => {
    fetch("/api/orders/admin")
      .then((r) => r.json())
      .then((d: unknown) => {
        setOrders(Array.isArray(d) ? (d as Order[]) : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(fetchOrders, 5000);
    return () => clearInterval(timer);
  }, []);

  async function changeStatus(orderId: string, next: string) {
    const previous = orders;
    setSavingId(orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: next } : o)));
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) setOrders(previous);
    } catch { setOrders(previous); }
    finally { setSavingId(null); }
  }

  async function handleTandaiLunas(orderId: string) {
    if (!window.confirm("Tandai pesanan ini sebagai LUNAS (Cash)?")) return;
    
    setPayingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pay" }),
      });

      if (res.ok) {
        toast.success("Pesanan berhasil ditandai LUNAS");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, statusPembayaran: "LUNAS", metodePembayaran: "CASH" } : o))
        );
      } else {
        toast.error("Gagal mengubah status");
      }
    } catch {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setPayingId(null);
    }
  }

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);

  const todayRevenue = todayOrders
    .filter((o) => o.status === SELESAI_KEY)
    .reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = orders
    .filter((o) => o.status === SELESAI_KEY)
    .reduce((sum, o) => sum + o.total, 0);

  const inProgress = orders.filter((o) => STATUS_IN_PROGRESS.includes(o.status as never));

  const stats = [
    { icon: Package, label: "Pesanan hari ini", value: String(todayOrders.length) },
    { icon: DollarSign, label: "Pendapatan hari ini", value: formatCurrency(todayRevenue) },
    { icon: TrendingUp, label: "Total pendapatan", value: formatCurrency(totalRevenue) },
    { icon: Clock, label: "Sedang diproses", value: String(inProgress.length) },
  ];

  // --- FILTER DATA: Hanya tampilkan pesanan yang TIDAK dibatalkan di tabel ---
  const activeOrders = orders.filter((o) => o.status !== STATUS_CANCELLED);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ringkasan pesanan dan pendapatan.</p>
        </div>
        <Button asChild>
          <Link href="/orders/new?manual=1">
            <FilePlus size={15} strokeWidth={2} /> Pesanan manual
          </Link>
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <Skeleton className="h-8 w-8 sm:h-9 sm:w-9" />
                <Skeleton className="mt-2 sm:mt-3 h-3 w-20 sm:w-28" />
                <Skeleton className="mt-2 h-5 sm:h-6 w-24 sm:w-36" />
              </div>
            ))
          : stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-4 sm:p-5">
                <span className="grid size-8 sm:size-9 place-items-center rounded-md bg-accent text-foreground">
                  <s.icon size={16} strokeWidth={1.75} />
                </span>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground leading-tight">{s.label}</p>
                <p className="tabular mt-1 text-lg sm:text-xl font-semibold">{s.value}</p>
              </div>
            ))}
      </div>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-base">Semua pesanan (Aktif)</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="space-y-2 px-6 pb-6">
              {[0, 1, 2, 3, 4].map((i) => (<Skeleton key={i} className="h-11 w-full" />))}
            </div>
          ) : (
            <>
              <div className="md:hidden">
                {activeOrders.length > 0 && (
                  <p className="mb-3 text-sm text-muted-foreground px-4">Total {activeOrders.length} pesanan aktif.</p>
                )}
                <ul className="space-y-3 px-4">
                  {activeOrders.map((o: any) => (
                    <li key={o.id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="tabular text-xs text-muted-foreground">{o.orderNumber}</span>
                        <span className="tabular text-sm font-semibold">{formatCurrency(o.total)}</span>
                      </div>
                      <div className="mt-1.5 font-medium">{o.customerName || o.user?.name || "Tanpa nama"}</div>
                      {o.pickupAddress && (
                        <div className="mt-1 truncate text-xs text-muted-foreground">Jemput: {o.pickupAddress}</div>
                      )}
                      <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(o.createdAt)}</div>
                      
                      <div className="mt-3 flex flex-col gap-2 items-start">
                        {nextOf(o.status) ? (
                          <Button size="sm" variant="outline" disabled={savingId === o.id}
                            onClick={() => changeStatus(o.id, nextOf(o.status)!.key)}>
                            {savingId === o.id ? "Menyimpan..." : `Lanjut ke ${nextOf(o.status)!.label}`}
                          </Button>
                        ) : (<StatusBadge status={o.status} />)}
                        
                        {o.statusPembayaran === 'LUNAS' ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                            Lunas ({o.metodePembayaran || "QRIS"})
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleTandaiLunas(o.id)}
                            disabled={payingId === o.id}
                            className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-200 transition-colors cursor-pointer"
                            title="Klik untuk menandai Lunas (Cash)"
                          >
                            {payingId === o.id ? "Memproses..." : "Belum Lunas"}
                          </button>
                        )}
                      </div>
                      <div className="mt-3 text-right">
                         <Link href={`/orders/${o.id}`} className="text-sm text-primary hover:underline">Detail</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableCaption>
                    {activeOrders.length === 0 ? "Belum ada pesanan aktif." : `Total ${activeOrders.length} pesanan aktif.`}
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">No. order</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="pr-6 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOrders.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="tabular pl-6 text-xs">{o.orderNumber}</TableCell>
                        <TableCell>
                          <div>{o.customerName || o.user?.name || "Tanpa nama"}</div>
                          {o.pickupAddress && (
                            <div className="mt-1 max-w-[30ch] truncate text-xs text-muted-foreground">Jemput: {o.pickupAddress}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(o.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-2">
                            {nextOf(o.status) ? (
                              <Button size="sm" variant="outline" disabled={savingId === o.id}
                                onClick={() => changeStatus(o.id, nextOf(o.status)!.key)}>
                                {savingId === o.id ? "Menyimpan..." : `Lanjut ke ${nextOf(o.status)!.label}`}
                              </Button>
                            ) : (<StatusBadge status={o.status} />)}
                            
                            {o.statusPembayaran === 'LUNAS' ? (
                              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                Lunas ({o.metodePembayaran || "QRIS"})
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleTandaiLunas(o.id)}
                                disabled={payingId === o.id}
                                className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-200 transition-colors cursor-pointer"
                                title="Klik untuk menandai Lunas (Cash)"
                              >
                                {payingId === o.id ? "Memproses..." : "Belum Lunas"}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="tabular text-right font-medium">{formatCurrency(o.total)}</TableCell>
                        <TableCell className="pr-6 text-right">
                          <Link href={`/orders/${o.id}`} className="text-sm text-primary hover:underline">Detail</Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}