"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, statusLabel, statusStep } from "@/components/StatusBadge";
import { ORDER_STATUSES } from "@/lib/data";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { parseItems, type Order } from "@/lib/types";

const LAST_STEP = ORDER_STATUSES.length;

function Stepper({ current }: { current: number }) {
  const progress = ((current - 1) / (LAST_STEP - 1)) * 100;

  return (
    <div className="relative py-2">
      <div className="absolute inset-x-0 top-[26px] h-px bg-border" />
      <div
        className="absolute left-0 top-[26px] h-px bg-primary transition-all duration-700"
        style={{ width: `${progress}%` }}
      />
      <ol className="relative flex justify-between">
        {ORDER_STATUSES.map((s, i) => {
          const step = i + 1;
          const done = step <= current;
          return (
            <li key={s.key} className="flex w-[14.28%] flex-col items-center gap-2">
              <span
                className={[
                  "grid size-7 place-items-center rounded-full border text-xs font-medium transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                ].join(" ")}
                aria-current={step === current ? "step" : undefined}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : step}
              </span>
              <span className="hidden text-center text-[10px] leading-tight text-muted-foreground sm:block">
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function TrackingPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [order, setOrder] = useState<Order | { error: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    const load = () => {
      fetch(`/api/orders/${id}`)
        .then((r) => r.json())
        .then((d: unknown) => {
          if (!alive) return;
          setOrder(d as Order | { error: string });
          setLoading(false);
        })
        .catch(() => {
          if (alive) setLoading(false);
        });
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (!order || "error" in order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto grid size-11 place-items-center rounded-md bg-accent text-muted-foreground">
          <Info size={20} strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 text-lg font-semibold">Pesanan tidak ditemukan</h1>
        <p className="mx-auto mt-2 max-w-[40ch] text-sm text-muted-foreground">
          Pesanan mungkin sudah dihapus atau bukan milik akun Anda.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/orders">Lihat riwayat</Link>
        </Button>
      </div>
    );
  }

  const currentStep = statusStep(order.status);
  const items = parseItems(order.items);
  const logs = [...(order.statusLogs ?? [])];

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/orders">
          <ArrowLeft size={15} strokeWidth={2} /> Kembali
        </Link>
      </Button>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-xl tracking-tight">Tracking pesanan</CardTitle>
            <p className="tabular mt-1 text-sm text-muted-foreground">{order.orderNumber}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={order.status} />
            <span className="tabular text-lg font-semibold">{formatCurrency(order.total)}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {formatDateTime(order.createdAt)}
            <span className="mx-1.5">·</span>
            {order.service === "KILOAN" ? "Kiloan" : "Satuan"}
            {order.service !== "KILOAN" && (
              <>
                <span className="mx-1.5">·</span>
                {order.washType === "DRY_CLEAN" ? "Dry clean" : "Laundry"}
              </>
            )}
            <span className="mx-1.5">·</span>
            {order.deliveryType === "DELIVERY" ? "Antar jemput" : "Antar ke toko"}
          </p>

          <Stepper current={currentStep} />
          <p className="text-sm">
            Tahap sekarang{" "}
            <span className="font-medium">{statusLabel(order.status)}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-base">Riwayat status</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada perubahan status.</p>
          ) : (
            <ol className="space-y-4">
              {logs.map((log, i) => (
                <li key={log.id} className="flex items-start gap-3">
                  <span
                    className={[
                      "mt-1.5 size-2 shrink-0 rounded-full",
                      i === logs.length - 1 ? "bg-primary" : "bg-border",
                    ].join(" ")}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{statusLabel(log.status)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                      {log.note ? ` · ${log.note}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-base">Detail item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {items.map((item, i) => (
            <div key={`${item.name}-${i}`} className="flex items-baseline justify-between gap-4">
              <span className="text-sm">
                {item.name}
                <span className="tabular ml-1.5 text-muted-foreground">× {item.qty}</span>
              </span>
              <span className="tabular text-sm font-medium">
                {formatCurrency(item.price * item.qty)}
              </span>
            </div>
          ))}

          {order.notes && (
            <div className="mt-4 rounded-md border border-border bg-muted px-3.5 py-3">
              <p className="text-xs font-medium text-muted-foreground">Catatan</p>
              <p className="mt-1 text-sm">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
