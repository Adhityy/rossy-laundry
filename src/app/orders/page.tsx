"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Order } from "@/lib/types";

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="space-y-2.5 text-right">
              <Skeleton className="ml-auto h-5 w-24" />
              <Skeleton className="ml-auto h-8 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/orders")
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

  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Riwayat pesanan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Total pengeluaran{" "}
            <span className="tabular font-medium text-foreground">
              {formatCurrency(totalSpent)}
            </span>
          </p>
        </div>
        <Button asChild>
          <Link href="/orders/new">
            Buat Pesanan <ArrowRight size={15} strokeWidth={2} />
          </Link>
        </Button>
      </header>

      <div className="mt-8">
        {loading ? (
          <ListSkeleton />
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
            <span className="mx-auto grid size-11 place-items-center rounded-md bg-accent text-muted-foreground">
              <Package size={20} strokeWidth={1.75} />
            </span>
            <h2 className="mt-5 text-lg font-semibold">Belum ada pesanan</h2>
            <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
              Semua cucian yang Anda pesan beserta statusnya akan tercatat di sini.
            </p>
            <Button asChild className="mt-6">
              <Link href="/orders/new">
                Buat Pesanan <ArrowRight size={15} strokeWidth={2} />
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order, i) => (
              <li key={order.id}>
                <Card
                  className="transition-shadow hover:shadow-md"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <CardContent className="flex flex-wrap items-start justify-between gap-4 p-5">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tabular text-sm font-medium text-muted-foreground">
                          {order.orderNumber}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(order.createdAt)}
                      </p>
                      <p className="text-sm">
                        {order.service === "KILOAN" ? "Kiloan" : "Satuan"}
                        {order.service !== "KILOAN" && (
                          <span className="text-muted-foreground">
                            {" · "}
                            {order.washType === "DRY_CLEAN" ? "Dry clean" : "Laundry"}
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {" · "}
                          {order.deliveryType === "DELIVERY" ? "Antar jemput" : "Antar ke toko"}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2.5">
                      <span className="tabular text-lg font-semibold">
                        {formatCurrency(order.total)}
                      </span>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/orders/${order.id}`}>Detail</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
