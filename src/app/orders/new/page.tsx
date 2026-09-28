"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Package, FileText, Bike, Truck, Minus, Plus, Send, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DELIVERY_FEE, MIN_ORDER_KG, LAUNDRY_INFO } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import type { PriceItem } from "@/lib/types";

type Service = "kiloan" | "satuan";
type Delivery = "PICKUP" | "DELIVERY";
type WashType = "LAUNDRY" | "DRY_CLEAN";

const CATEGORY_LABELS: Record<string, string> = {
  PAKAIAN: "Pakaian",
  RUMAH_TANGGA: "Rumah tangga",
};

const optionCard =
  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors " +
  "has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50";

function priceOf(item: PriceItem, wash: WashType): number | null {
  return wash === "LAUNDRY" ? item.laundryPrice : item.dryCleanPrice;
}

export default function NewOrderPage() {
  const router = useRouter();
  const { status } = useSession();

  const [service, setService] = useState<Service>("kiloan");
  const [washType, setWashType] = useState<WashType>("LAUNDRY");
  const [delivery, setDelivery] = useState<Delivery>("PICKUP");
  const [pickupAddress, setPickupAddress] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [addrError, setAddrError] = useState<string | null>(null);
  const [weight, setWeight] = useState(MIN_ORDER_KG);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    let alive = true;
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (!alive) return;
        setPrices(Array.isArray(d) ? (d as PriceItem[]) : []);
        setPricesLoading(false);
      })
      .catch(() => {
        if (alive) setPricesLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Tarif kiloan tidak ada di struk; dipakai tarif tetap per kg.
  const kiloanRate = LAUNDRY_INFO.kiloanRate;

  const selected = useMemo(
    () => prices.filter((p) => (qty[p.id] ?? 0) > 0),
    [prices, qty]
  );

  const subtotal =
    service === "kiloan"
      ? kiloanRate * weight
      : selected.reduce((sum, p) => {
          const unit = priceOf(p, washType);
          return unit === null ? sum : sum + unit * (qty[p.id] ?? 0);
        }, 0);

  const deliveryFee = delivery === "DELIVERY" ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const itemCount = selected.reduce((n, p) => n + (qty[p.id] ?? 0), 0);

  const visiblePrices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prices.filter((p) => (q ? p.name.toLowerCase().includes(q) : true));
  }, [prices, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, PriceItem[]>();
    for (const p of visiblePrices) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return [...map.entries()];
  }, [visiblePrices]);

  function bump(id: string, delta: number) {
    setQty((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      const copy = { ...prev };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
  }

  /** Ambil lokasi perangkat -> terjemahkan jadi alamat lengkap -> isi textarea. */
  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setAddrError("Browser ini tidak mendukung pembacaan lokasi. Isi alamat manual.");
      return;
    }
    setLocating(true);
    setAddrError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const r = await fetch(
            `/api/geocode?lat=${latitude.toFixed(6)}&lon=${longitude.toFixed(6)}`
          );
          const d = (await r.json()) as { address?: string | null; error?: string };
          if (d.address) {
            setPickupAddress(d.address);
            setSuggestions([]);
          } else {
            setAddrError(d.error || "Lokasi tidak ditemukan. Isi alamat manual.");
          }
        } catch {
          setAddrError("Gagal menerjemahkan lokasi. Isi alamat manual.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setAddrError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Isi alamat manual."
            : "Tidak bisa membaca lokasi. Isi alamat manual."
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60_000 }
    );
  }

  // Saran alamat saat mengetik. Sengaja dibatasi 4-60 karakter supaya alamat hasil
  // reverse geocode yang sudah lengkap tidak memicu pencarian ulang.
  useEffect(() => {
    const q = pickupAddress.trim();
    if (delivery !== "DELIVERY" || q.length < 4 || q.length > 60) {
      setSuggestions([]);
      return;
    }
    let alive = true;
    const t = setTimeout(() => {
      fetch(`/api/geocode?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: unknown) => {
          if (!alive) return;
          const items = (d as { items?: { address?: string }[] })?.items;
          if (!Array.isArray(items)) return setSuggestions([]);
          const list = items
            .map((i) => i.address ?? "")
            .filter((a) => a && a !== q)
            .slice(0, 5);
          setSuggestions(list);
        })
        .catch(() => {
          if (alive) setSuggestions([]);
        });
    }, 450);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [pickupAddress, delivery]);

  async function handleSubmit() {
    setError(null);

    if (delivery === "DELIVERY" && pickupAddress.trim().length < 10) {
      setError("Alamat penjemputan wajib diisi, minimal 10 karakter.");
      return;
    }

    if (service === "kiloan" && weight < MIN_ORDER_KG) {
      setError(`Minimal order ${MIN_ORDER_KG} kg.`);
      return;
    }

    if (service === "satuan") {
      const items = selected
        .map((p) => ({ name: p.name, qty: qty[p.id] ?? 0, price: priceOf(p, washType) ?? 0 }))
        .filter((i) => i.qty > 0);
      if (items.length === 0) {
        setError("Pilih minimal satu item.");
        return;
      }
    }

    setLoading(true);
    try {
      const items =
        service === "kiloan"
          ? [{ name: "Laundry kiloan", qty: weight, price: kiloanRate }]
          : selected
              .map((p) => ({ name: p.name, qty: qty[p.id] ?? 0, price: priceOf(p, washType) ?? 0 }))
              .filter((i) => i.qty > 0);

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: service.toUpperCase(),
          washType,
          items,
          weight: service === "kiloan" ? weight : undefined,
          deliveryType: delivery,
          pickupAddress: delivery === "DELIVERY" ? pickupAddress.trim() : undefined,
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

  if (status === "loading" || pricesLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12 sm:px-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-12 sm:px-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Buat pesanan</h1>
        <p className="mt-2 max-w-[56ch] text-sm leading-relaxed text-muted-foreground">
          Tarif diambil langsung dari daftar resmi Rossy. Isi item yang dicuci, totalnya
          dihitung otomatis.
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
                <span className="tabular mt-1 block text-sm text-muted-foreground">
                  {formatCurrency(kiloanRate)}/kg, min {MIN_ORDER_KG} kg
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
                  Per potong, pilih dari daftar tarif
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
              <p className="text-sm text-muted-foreground">Minimum {MIN_ORDER_KG} kg</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="space-y-0 pb-3">
              <CardTitle className="text-base">Jenis cucian</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={washType}
                onValueChange={(v) => setWashType(v as WashType)}
                className="grid gap-3 sm:grid-cols-2"
              >
                <label className={optionCard} htmlFor="wash-laundry">
                  <RadioGroupItem id="wash-laundry" value="LAUNDRY" className="mt-0.5" />
                  <span>
                    <span className="font-medium">Laundry</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Cuci kering, setrika
                    </span>
                  </span>
                </label>
                <label className={optionCard} htmlFor="wash-dry">
                  <RadioGroupItem id="wash-dry" value="DRY_CLEAN" className="mt-0.5" />
                  <span>
                    <span className="font-medium">Dry clean</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      Tanpa air, untuk bahan sensitif
                    </span>
                  </span>
                </label>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-3 pb-3">
              <CardTitle className="text-base">
                Pilih item
                {itemCount > 0 && (
                  <span className="tabular ml-2 text-sm font-normal text-muted-foreground">
                    {itemCount} potong
                  </span>
                )}
              </CardTitle>
              <div className="relative">
                <Search
                  size={15}
                  strokeWidth={1.75}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari jenis cucian"
                  aria-label="Cari jenis cucian"
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {grouped.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tidak ada item yang cocok dengan pencarian.
                </p>
              )}

              {grouped.map(([category, items]) => (
                <div key={category} className="border-t border-border pt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {CATEGORY_LABELS[category] ?? category}
                  </h3>
                  <ul className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                    {items.map((item) => {
                      const unit = priceOf(item, washType);
                      const count = qty[item.id] ?? 0;
                      const orderable = unit !== null;

                      return (
                        <li
                          key={item.id}
                          className={
                            "flex items-center justify-between gap-3 rounded-md px-2 py-1.5 " +
                            (count > 0 ? "bg-primary/5" : "")
                          }
                        >
                          <span
                            className={
                              "min-w-0 truncate text-sm " +
                              (orderable ? "" : "text-muted-foreground/70")
                            }
                            title={item.note ?? undefined}
                          >
                            {item.name}
                          </span>

                          {orderable ? (
                            count > 0 ? (
                              <span className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  aria-label={`Kurangi ${item.name}`}
                                  onClick={() => bump(item.id, -1)}
                                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                  <Minus size={14} strokeWidth={2} />
                                </button>
                                <span className="tabular w-6 text-center text-sm font-semibold">
                                  {count}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Tambah ${item.name}`}
                                  onClick={() => bump(item.id, 1)}
                                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                >
                                  <Plus size={14} strokeWidth={2} />
                                </button>
                                <span className="tabular w-24 text-right text-sm font-medium">
                                  {formatCurrency(unit * count)}
                                </span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => bump(item.id, 1)}
                                className="tabular flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                              >
                                {formatCurrency(unit)}
                                <Plus size={13} strokeWidth={2} />
                              </button>
                            )
                          ) : (
                            <span className="shrink-0 text-xs text-muted-foreground/70">
                              Hubungi kami
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
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
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label htmlFor="o-addr">Alamat penjemputan</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useMyLocation}
                  disabled={locating}
                >
                  <MapPin size={15} strokeWidth={1.75} />
                  {locating ? "Mencari lokasi..." : "Gunakan lokasi saya"}
                </Button>
              </div>

              <Textarea
                id="o-addr"
                rows={3}
                className="resize-none"
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan"
                aria-describedby="o-addr-hint"
              />
              <p id="o-addr-hint" className="text-xs text-muted-foreground">
                Hasil dari lokasi bisa salah atau kurang. Periksa dan sunting sebelum kirim.
              </p>

              {addrError && (
                <p role="alert" className="text-sm text-destructive">
                  {addrError}
                </p>
              )}

              {suggestions.length > 0 && (
                <ul className="overflow-hidden rounded-lg border border-border">
                  {suggestions.map((s, i) => (
                    <li key={`${s}-${i}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setPickupAddress(s);
                          setSuggestions([]);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <p className="text-sm text-muted-foreground">
                Kami akan menghubungi Anda lewat WhatsApp untuk mengatur jadwal jemput.
              </p>
            </div>
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
            <span className="text-muted-foreground">
              {service === "kiloan"
                ? `Kiloan ${weight} kg × ${formatCurrency(kiloanRate)}`
                : `${itemCount} potong, ${
                    washType === "LAUNDRY" ? "laundry" : "dry clean"
                  }`}
            </span>
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
