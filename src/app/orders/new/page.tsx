"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Package, FileText, Bike, Truck, Minus, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PRICES_KILOAN, PRICES_SATUAN, DELIVERY_FEE, MIN_ORDER_KG } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

type Service = "kiloan" | "satuan";
type Delivery = "PICKUP" | "DELIVERY";
type SelectedItem = { name: string; qty: number; price: number };

const laundryPrice = PRICES_KILOAN[0]?.laundry ?? 7000;
const selectableItems = PRICES_SATUAN.filter((p) => p.price !== null);

const optionCard =
  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors " +
  "has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50";

export default function NewOrderPage() {
  const router = useRouter();
  const { status } = useSession();

  const [service, setService] = useState<Service>("kiloan");
  const [delivery, setDelivery] = useState<Delivery>("PICKUP");
  const [weight, setWeight] = useState(MIN_ORDER_KG);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const subtotal =
    service === "kiloan"
      ? laundryPrice * weight
      : selected.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = delivery === "DELIVERY" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  function toggleItem(name: string, price: number) {
    setSelected((prev) =>
      prev.some((i) => i.name === name)
        ? prev.filter((i) => i.name !== name)
        : [...prev, { name, qty: 1, price }]
    );
  }

  function updateQty(name: string, delta: number) {
    setSelected((prev) =>
      prev.map((i) => (i.name === name ? { ...i, qty: Math.max(1, i.qty + delta) } : i))
    );
  }

  async function handleSubmit() {
    setError(null);

    if (service === "kiloan" && weight < MIN_ORDER_KG) {
      setError(`Minimal order ${MIN_ORDER_KG} kg.`);
      return;
    }
    if (service === "satuan" && selected.length === 0) {
      setError("Pilih minimal satu item.");
      return;
    }

    setLoading(true);
    try {
      const items =
        service === "kiloan"
          ? [{ name: "Laundry kiloan", qty: weight, price: laundryPrice }]
          : selected;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: service.toUpperCase(),
          items,
          weight: service === "kiloan" ? weight : undefined,
          deliveryType: delivery,
          deliveryFee,
          notes: notes || undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error || "Gagal membuat pesanan. Coba lagi.");
        return;
      }
      router.push("/orders");
    } catch {
      setError("Tidak bisa terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
        <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Buat pesanan</h1>
        <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
          Pilih jenis layanan, isi detail cucian, lalu kirim. Statusnya bisa dipantau di
          halaman riwayat.
        </p>
      </header>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-base">Jenis layanan</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={service}
            onValueChange={(v) => setService(v as Service)}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className={optionCard} htmlFor="svc-kiloan">
              <RadioGroupItem id="svc-kiloan" value="kiloan" className="mt-0.5" />
              <span>
                <span className="flex items-center gap-2 font-medium">
                  <Package size={16} strokeWidth={1.75} /> Kiloan
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Dihitung per kilogram, {formatCurrency(laundryPrice)}/kg
                </span>
              </span>
            </label>

            <label className={optionCard} htmlFor="svc-satuan">
              <RadioGroupItem id="svc-satuan" value="satuan" className="mt-0.5" />
              <span>
                <span className="flex items-center gap-2 font-medium">
                  <FileText size={16} strokeWidth={1.75} /> Satuan
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Dihitung per potong
                </span>
              </span>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      {service === "kiloan" ? (
        <Card>
          <CardHeader className="space-y-0 pb-3">
            <CardTitle className="text-base">Berat cucian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Kurangi berat"
                  onClick={() => setWeight((w) => Math.max(MIN_ORDER_KG, w - 1))}
                >
                  <Minus size={15} strokeWidth={2} />
                </Button>
                <input
                  type="number"
                  min={MIN_ORDER_KG}
                  value={weight}
                  aria-label="Berat dalam kilogram"
                  onChange={(e) =>
                    setWeight(Math.max(MIN_ORDER_KG, Number(e.target.value) || MIN_ORDER_KG))
                  }
                  className="tabular h-9 w-20 rounded-md border border-input bg-transparent px-2 text-center text-sm font-medium focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Tambah berat"
                  onClick={() => setWeight((w) => w + 1)}
                >
                  <Plus size={15} strokeWidth={2} />
                </Button>
                <span className="text-sm text-muted-foreground">kg</span>
              </div>

              <p className="text-sm text-muted-foreground">
                Minimum {MIN_ORDER_KG} kg
                {weight > 10 && <span className="text-primary"> · diskon 10% berlaku</span>}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="space-y-0 pb-3">
            <CardTitle className="text-base">Pilih item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {selectableItems.map((item) => {
                const sel = selected.find((i) => i.name === item.name);
                return (
                  <div
                    key={item.name}
                    className={[
                      "rounded-lg border transition-colors",
                      sel ? "border-primary bg-primary/5" : "border-border bg-card",
                    ].join(" ")}
                  >
                    <button
                      type="button"
                      aria-pressed={Boolean(sel)}
                      onClick={() => toggleItem(item.name, item.price ?? 0)}
                      className="w-full rounded-lg px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <span className="block truncate text-sm font-medium">{item.name}</span>
                      <span className="tabular mt-0.5 block text-xs text-muted-foreground">
                        {formatCurrency(item.price ?? 0)}
                      </span>
                    </button>

                    {sel && (
                      <div className="flex items-center justify-between border-t border-primary/20 px-2 py-1.5">
                        <button
                          type="button"
                          aria-label={`Kurangi ${item.name}`}
                          onClick={() => updateQty(item.name, -1)}
                          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <Minus size={14} strokeWidth={2} />
                        </button>
                        <span className="tabular text-sm font-semibold">{sel.qty}</span>
                        <button
                          type="button"
                          aria-label={`Tambah ${item.name}`}
                          onClick={() => updateQty(item.name, 1)}
                          className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <Plus size={14} strokeWidth={2} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {selected.length === 0
                ? "Belum ada item dipilih."
                : `${selected.length} item dipilih.`}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-base">Pengambilan</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={delivery}
            onValueChange={(v) => setDelivery(v as Delivery)}
            className="grid gap-3 sm:grid-cols-2"
          >
            <label className={optionCard} htmlFor="dlv-pickup">
              <RadioGroupItem id="dlv-pickup" value="PICKUP" className="mt-0.5" />
              <span>
                <span className="flex items-center gap-2 font-medium">
                  <Bike size={16} strokeWidth={1.75} /> Antar ke toko
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">Gratis</span>
              </span>
            </label>

            <label className={optionCard} htmlFor="dlv-delivery">
              <RadioGroupItem id="dlv-delivery" value="DELIVERY" className="mt-0.5" />
              <span>
                <span className="flex items-center gap-2 font-medium">
                  <Truck size={16} strokeWidth={1.75} /> Antar jemput
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {DELIVERY_FEE > 0 ? `+${formatCurrency(DELIVERY_FEE)}` : "Gratis"}
                </span>
              </span>
            </label>
          </RadioGroup>

          {delivery === "DELIVERY" && (
            <p className="mt-3 text-sm text-muted-foreground">
              Kami akan menghubungi Anda lewat WhatsApp untuk mengatur jadwal jemput.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="notes">Catatan (opsional)</Label>
        <Textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Misal: baju putih jangan disetrika terlalu panas"
          className="resize-none"
        />
      </div>

      <Card>
        <CardHeader className="space-y-0 pb-3">
          <CardTitle className="text-base">Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="text-muted-foreground">Ongkos antar</span>
            <span className="tabular">
              {deliveryFee > 0 ? formatCurrency(deliveryFee) : "Gratis"}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <span className="font-medium">Total</span>
            <span className="tabular text-lg font-semibold">{formatCurrency(total)}</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Pesanan belum terkirim</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button size="lg" className="w-full" onClick={handleSubmit} disabled={loading}>
        {loading ? (
          "Mengirim..."
        ) : (
          <>
            Kirim Pesanan <Send size={16} strokeWidth={2} />
          </>
        )}
      </Button>
    </div>
  );
}
