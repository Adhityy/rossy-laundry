"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, DollarSign, TrendingUp, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statusLabel } from "@/components/StatusBadge";
import { ORDER_STATUSES, STATUS_IN_PROGRESS } from "@/lib/data";

import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/types";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/orders/admin")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (!alive) return;
        setOrders(Array.isArray(d) ? (d as Order[]) : []);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
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
    } catch {
      setOrders(previous);
    } finally {
      setSavingId(null);
    }
  }

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const inProgress = orders.filter((o) => STATUS_IN_PROGRESS.includes(o.status as never));

  const stats = [
    { icon: Package, label: "Pesanan hari ini", value: String(todayOrders.length) },
    { icon: DollarSign, label: "Pendapatan hari ini", value: formatCurrency(todayRevenue) },
    { icon: TrendingUp, label: "Total pendapatan", value: formatCurrency(totalRevenue) },
    { icon: Clock, label: "Sedang diproses", value: String(inProgress.length) },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ringkasan pesanan dan pendapatan.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="mt-3 h-3 w-28" />
                <Skeleton className="mt-2 h-6 w-36" />
              </div>
            ))
          : stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-5">
                <span className="grid size-9 place-items-center rounded-md bg-accent text-foreground">
                  <s.icon size={17} strokeWidth={1.75} />
                </span>
                <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
                <p className="tabular mt-1 text-xl font-semibold">{s.value}</p>
              </div>
            ))}
      </div>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-base">Semua pesanan</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {loading ? (
            <div className="space-y-2 px-6 pb-6">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableCaption>
                {orders.length === 0
                  ? "Belum ada pesanan masuk."
                  : `Total ${orders.length} pesanan.`}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>No. order</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="tabular text-xs">{o.orderNumber}</TableCell>
                    <TableCell>
                      <div>{o.user?.name || "-"}</div>
                      {o.pickupAddress && (
                        <div className="mt-1 max-w-[30ch] truncate text-xs text-muted-foreground">
                          Jemput: {o.pickupAddress}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={o.status}
                        onValueChange={(v) => changeStatus(o.id, v)}
                        disabled={savingId === o.id}
                      >
                        <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Ubah status">
                          <SelectValue placeholder={statusLabel(o.status)} />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s.key} value={s.key}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="tabular text-right font-medium">
                      {formatCurrency(o.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/orders/${o.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Detail
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && orders.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Buat pesanan pertama lewat halaman <Link href="/orders/new" className="text-primary hover:underline">Buat Pesanan</Link>.
        </p>
      )}
    </div>
  );
}
