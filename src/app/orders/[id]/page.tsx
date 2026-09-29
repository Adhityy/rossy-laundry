"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ArrowLeft, Ban, Check, Info, Star, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StrukDialog } from "@/components/StrukDialog";
import { StatusBadge, statusLabel, statusStep } from "@/components/StatusBadge";
import { ORDER_STATUSES, STATUS_CANCELLED, TOTAL_STEPS } from "@/lib/data";
import { formatCurrency, formatDateTime, formatPhone } from "@/lib/utils";
import { parseItems, type Order } from "@/lib/types";

type Detail = Order & {
  user?: { id: string; name: string; email: string; phone: string | null; address: string | null } | null;
};

function Stepper({ current, cancelled }: { current: number; cancelled: boolean }) {
  const progress = ((current - 1) / (TOTAL_STEPS - 1)) * 100;
  const cell = `flex w-[calc(100%/${TOTAL_STEPS})] flex-col items-center gap-2`;

  return (
    <div className="relative py-2">
      <div className="absolute inset-x-0 top-[26px] h-px bg-border" />
      <div
        className={[
          "absolute left-0 top-[26px] h-px transition-all duration-700",
          cancelled ? "bg-border" : "bg-primary",
        ].join(" ")}
        style={{ width: `${cancelled ? 0 : progress}%` }}
      />
      <ol className="relative flex justify-between">
        {ORDER_STATUSES.map((s, i) => {
          const step = i + 1;
          const done = !cancelled && step <= current;
          return (
            <li key={s.key} className={cell}>
              <span
                className={[
                  "grid size-7 place-items-center rounded-full border text-xs font-medium transition-colors",
                  done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground",
                ].join(" ")}
                aria-current={step === current && !cancelled ? "step" : undefined}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : step}
              </span>
              <span className="text-center text-[11px] leading-tight text-muted-foreground">
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
  const [order, setOrder] = useState<Detail | { error: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  // Penilaian - hanya muncul setelah status SELESAI.
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const { data: session } = useSession();
  const isAdmin =
    (session?.user as { role?: string } | undefined | null)?.role === "ADMIN";

  const load = useCallback(async () => {
    if (!id) return;
    try {
      // Tamu membawa nomor yang dipakai saat pencarian; pemilik/admin tidak perlu.
      const q = phone ? `?phone=${encodeURIComponent(phone)}` : "";
      const res = await fetch(`/api/orders/${id}${q}`);
      const data = await res.json();
      setOrder(data as Detail | { error: string });
    } catch {
      /* biarkan state lama, polling berikutnya mencoba lagi */
    } finally {
      setLoading(false);
    }
  }, [id, phone]);

  // Baca ?phone sekali, baru mulai polling - supaya tamu tidak memicu fetch 403.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setPhone(sp.get("phone"));
    setReady(true);
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    load();
    const timer = window.setInterval(load, 5000);
    return () => window.clearInterval(timer);
  }, [ready, load]);

  async function cancelOrder() {
    if (isAdmin && reason.trim().length < 3) {
      toast.error("Alasan pembatalan wajib diisi (minimal 3 karakter).");
      return;
    }
    setCancelling(true);
    try {
      const q = phone && !isAdmin ? `?phone=${encodeURIComponent(phone)}` : "";
      const res = await fetch(`/api/orders/${id}${q}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", reason: reason.trim() || undefined }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Gagal membatalkan pesanan.");
        return;
      }
      toast.success("Pesanan dibatalkan.");
      setReason("");
      await load();
    } catch {
      toast.error("Tidak bisa terhubung ke server.");
    } finally {
      setCancelling(false);
    }
  }

  // Pratinjau nama pengulas, hanya sekali saat pesanan pertama terbaca.
  useEffect(() => {
    if (!order || "error" in order) return;
    const pre = order.customerName || order.user?.name || "";
    setReviewName((prev) => prev || pre);
  }, [order]);

  async function submitReview() {
    if (rating < 1) {
      toast.error("Pilih jumlah bintang dulu.");
      return;
    }
    if (comment.trim().length < 3) {
      toast.error("Tulis ulasan minimal 3 karakter.");
      return;
    }
    setReviewing(true);
    try {
      const res = await fetch(`/api/orders/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
          name: reviewName.trim() || undefined,
          phone: phone || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error || "Gagal mengirim penilaian.");
        return;
      }
      toast.success("Terima kasih atas penilaian Anda.");
      setRating(0);
      setComment("");
      await load();
    } catch {
      toast.error("Tidak bisa terhubung ke server.");
    } finally {
      setReviewing(false);
    }
  }

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
    const serverError = order && "error" in order ? order.error : "";
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <span className="mx-auto grid size-11 place-items-center rounded-md bg-accent text-muted-foreground">
          <Info size={20} strokeWidth={1.75} />
        </span>
        <h1 className="mt-5 text-lg font-semibold">Pesanan tidak bisa dibuka</h1>
        <p className="mx-auto mt-2 max-w-[46ch] text-sm text-muted-foreground">
          {serverError ||
            "Nomor WhatsApp tidak ikut terbawa. Cari ulang di halaman Cek pesanan."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/orders">Cari lagi</Link>
        </Button>
      </div>
    );
  }

  const cancelled = order.status === STATUS_CANCELLED;
  const currentStep = statusStep(order.status);
  const items = parseItems(order.items);
  const logs = [...(order.statusLogs ?? [])];
  const canCancel = !cancelled && (isAdmin || order.status === "MENUNGGU");

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/orders">
          <ArrowLeft size={15} strokeWidth={2} /> Cek pesanan lain
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

          <div className="flex flex-wrap gap-2">
            <StrukDialog order={order} />
          </div>

          <p className="text-sm text-muted-foreground">
            WhatsApp
            <span className="tabular ml-2 text-foreground">{formatPhone(order.whatsapp)}</span>
          </p>

          {order.pickupAddress && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Alamat penjemputan
              </p>
              <p className="mt-1.5 text-sm leading-relaxed">{order.pickupAddress}</p>
            </div>
          )}

          {cancelled && (
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Dibatalkan {order.cancelledAt ? formatDateTime(order.cancelledAt) : ""}
              </p>
              <p className="mt-1.5 text-sm">
                {order.cancelReason || "Tanpa keterangan."}
              </p>
            </div>
          )}

          <Stepper current={currentStep} cancelled={cancelled} />
          <p className="text-sm">
            Tahap sekarang{" "}
            <span className="font-medium">{statusLabel(order.status)}</span>
          </p>
        </CardContent>
      </Card>

      {isAdmin && order.user && (
        <Card>
          <CardHeader className="space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound size={16} strokeWidth={1.75} /> Informasi pelanggan
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nama
              </p>
              <p className="mt-1 text-sm">{order.user.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Nomor WhatsApp
              </p>
              <p className="tabular mt-1 text-sm">{formatPhone(order.whatsapp)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email
              </p>
              <p className="mt-1 text-sm">{order.user.email}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Telepon akun
              </p>
              <p className="tabular mt-1 text-sm">
                {order.user.phone ? formatPhone(order.user.phone) : "-"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Alamat akun
              </p>
              <p className="mt-1 text-sm">{order.user.address || "-"}</p>
            </div>
          </CardContent>
        </Card>
      )}

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

          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <span className="text-sm font-medium">Total</span>
            <span className="tabular text-sm font-semibold">{formatCurrency(order.total)}</span>
          </div>

          {order.notes && (
            <div className="mt-4 rounded-md border border-border bg-muted px-3.5 py-3">
              <p className="text-xs font-medium text-muted-foreground">Catatan</p>
              <p className="mt-1 text-sm">{order.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {order.status === "SELESAI" && !order.review && (
        <Card>
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star size={16} strokeWidth={1.75} /> Beri penilaian
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Pesanan sudah selesai. Penilaian Anda tampil di halaman beranda.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-label={`${v} dari 5 bintang`}
                  aria-pressed={rating === v}
                  onClick={() => setRating(v)}
                  className="rounded p-1 transition-colors hover:bg-accent"
                >
                  <Star
                    size={26}
                    strokeWidth={1.5}
                    className={
                      v <= rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    }
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-muted-foreground">
                {rating > 0 ? `${rating} dari 5` : "Belum dipilih"}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rv-name">Nama (tampil di beranda)</Label>
              <Input
                id="rv-name"
                value={reviewName}
                maxLength={40}
                onChange={(e) => setReviewName(e.target.value)}
                placeholder="Nama Anda"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rv-comment">Ulasan</Label>
              <Textarea
                id="rv-comment"
                rows={3}
                className="resize-none"
                value={comment}
                maxLength={500}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Bagaimana hasil cucian dan pelayanannya?"
              />
              <p className="text-xs text-muted-foreground">{comment.length}/500</p>
            </div>

            <Button
              onClick={submitReview}
              disabled={reviewing || rating < 1 || comment.trim().length < 3}
            >
              {reviewing ? "Mengirim..." : "Kirim penilaian"}
            </Button>
          </CardContent>
        </Card>
      )}

      {order.review && (
        <Card>
          <CardHeader className="space-y-1 pb-3">
            <CardTitle className="text-base">Penilaian Anda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-0.5" aria-label={`${order.review.rating} dari 5 bintang`}>
              {[1, 2, 3, 4, 5].map((v) => (
                <Star
                  key={v}
                  size={17}
                  strokeWidth={1.5}
                  className={
                    v <= order.review!.rating ? "fill-primary text-primary" : "text-muted-foreground"
                  }
                />
              ))}
            </div>
            <p className="text-sm">{order.review.comment}</p>
            <p className="text-xs text-muted-foreground">
              {order.review.name} · {formatDateTime(order.review.createdAt)}
            </p>
          </CardContent>
        </Card>
      )}

      {canCancel && (
        <Card className="border-destructive/40">
          <CardHeader className="space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Ban size={16} strokeWidth={1.75} /> Batalkan pesanan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? "Admin dapat membatalkan pesanan pada tahap mana pun. Alasan wajib dicatat."
                : "Pesanan masih Tahap Menunggu, jadi masih bisa dibatalkan."}
            </p>
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">
                Alasan {isAdmin ? "" : "(opsional)"}
              </Label>
              <Textarea
                id="cancel-reason"
                rows={2}
                className="resize-none"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isAdmin ? "Misal: pelanggan membatalkan lewat telepon" : ""}
              />
            </div>
            <Button
              variant="destructive"
              onClick={cancelOrder}
              disabled={cancelling || (isAdmin && reason.trim().length < 3)}
            >
              {cancelling ? "Membatalkan..." : "Batalkan pesanan"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
