"use client";
import { useState } from "react";
import { Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PRICE_GROUPS, PRICES_KILOAN, LAUNDRY_INFO, DELIVERY_FEE, MIN_ORDER_KG } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

// Cuci regular berlaku sama untuk semua jenis; dry clean punya pengecualian.
const laundryPrice = PRICES_KILOAN[0]?.laundry ?? 7000;
const dryCleanCounts = PRICES_KILOAN.reduce<Record<number, number>>((acc, p) => {
  acc[p.dryClean] = (acc[p.dryClean] ?? 0) + 1;
  return acc;
}, {});
const baseDryClean =
  Number(
    Object.entries(dryCleanCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 10000
  ) || 10000;
const dryCleanExceptions = PRICES_KILOAN.filter((p) => p.dryClean !== baseDryClean);

function PriceRow({ name, price }: { name: string; price: number | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm text-muted-foreground">{name}</span>
      {price === null ? (
        <span className="text-sm text-muted-foreground/70">Hubungi kami</span>
      ) : (
        <span className="tabular text-sm font-medium">{formatCurrency(price)}</span>
      )}
    </div>
  );
}

export function PriceTable() {
  const [tab, setTab] = useState("kiloan");

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="max-w-[62ch]">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Daftar harga</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Harga terbuka, tanpa biaya tersembunyi. Berlaku sepanjang tahun.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="kiloan">Kiloan</TabsTrigger>
          <TabsTrigger value="satuan">Satuan</TabsTrigger>
        </TabsList>

        <TabsContent value="kiloan" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="rounded-xl border border-border bg-card p-6 lg:col-span-5">
              <p className="text-sm font-medium text-muted-foreground">Cuci regular</p>
              <p className="tabular mt-3 text-4xl font-semibold tracking-tight">
                {formatCurrency(laundryPrice)}
                <span className="ml-2 text-lg font-normal text-muted-foreground">/ kg</span>
              </p>
              <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
                Berlaku untuk seluruh jenis pakaian di daftar kiloan. Tidak ada harga
                per-kategori.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 lg:col-span-7">
              <p className="text-sm font-medium text-muted-foreground">Dry clean</p>
              <p className="tabular mt-3 text-4xl font-semibold tracking-tight">
                {formatCurrency(baseDryClean)}
                <span className="ml-2 text-lg font-normal text-muted-foreground">/ kg</span>
              </p>

              {dryCleanExceptions.length > 0 && (
                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Pengecualian
                  </p>
                  <ul className="mt-3 space-y-2">
                    {dryCleanExceptions.map((p) => (
                      <li key={p.name} className="flex items-baseline justify-between gap-4">
                        <span className="text-sm">{p.name}</span>
                        <span className="tabular text-sm font-medium">
                          {formatCurrency(p.dryClean)} <span className="font-normal text-muted-foreground">/ kg</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="satuan" className="mt-6">
          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            {PRICE_GROUPS.map((group) => (
              <div key={group.label} className="border-t border-border pt-6">
                <h3 className="text-base font-semibold">
                  {group.label}{" "}
                  <span className="tabular ml-1 text-sm font-normal text-muted-foreground">
                    {group.items.length} item
                  </span>
                </h3>
                <div className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <PriceRow key={item.name} name={item.name} price={item.price} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Alert className="mt-8">
        <Info size={16} />
        <AlertTitle>Syarat pesanan</AlertTitle>
        <AlertDescription>
          Minimal order kiloan {MIN_ORDER_KG} kg. Diskon 10% untuk order di atas 10 kg.
          Ongkos antar {DELIVERY_FEE > 0 ? formatCurrency(DELIVERY_FEE) : "gratis"}. Jam
          operasional {LAUNDRY_INFO.hours}.
        </AlertDescription>
      </Alert>
    </section>
  );
}
