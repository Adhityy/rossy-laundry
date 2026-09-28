"use client";
import { useEffect, useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LAUNDRY_INFO, DELIVERY_FEE, MIN_ORDER_KG } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import type { PriceItem } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  PAKAIAN: "Pakaian",
  RUMAH_TANGGA: "Rumah tangga",
};

function Price({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground/60">Hubungi</span>;
  return <span className="tabular">{formatCurrency(value)}</span>;
}

export function PriceTable() {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/prices")
      .then((r) => r.json())
      .then((d: unknown) => {
        if (!alive) return;
        setPrices(Array.isArray(d) ? (d as PriceItem[]) : []);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, PriceItem[]>();
    for (const p of prices) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return [...map.entries()];
  }, [prices]);

  const firstCategory = grouped[0]?.[0] ?? "PAKAIAN";

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
      <div className="max-w-[62ch]">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Daftar harga</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Tarif per potong, berlaku sama dengan struk cetak di outlet. Harga terbuka, tanpa
          biaya tersembunyi.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-5">
          <p className="text-sm font-medium text-muted-foreground">Cuci kiloan</p>
          <p className="tabular mt-3 text-4xl font-semibold tracking-tight">
            {formatCurrency(LAUNDRY_INFO.kiloanRate)}
            <span className="ml-2 text-lg font-normal text-muted-foreground">/ kg</span>
          </p>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
            Minimum {MIN_ORDER_KG} kg per order. Diskon 10% untuk order di atas 10 kg.
          </p>
        </div>

        <div className="lg:col-span-7">
          {loading ? (
            <div className="space-y-2 rounded-xl border border-border bg-card p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <Tabs defaultValue={firstCategory}>
              <TabsList>
                {grouped.map(([category, items]) => (
                  <TabsTrigger key={category} value={category}>
                    {CATEGORY_LABELS[category] ?? category}
                    <span className="tabular ml-1.5 text-muted-foreground">{items.length}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {grouped.map(([category, items]) => (
                <TabsContent key={category} value={category} className="mt-4">
                  <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jenis</TableHead>
                          <TableHead className="text-right">Laundry</TableHead>
                          <TableHead className="text-right">Dry clean</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id} title={item.note ?? undefined}>
                            <TableCell className="text-sm">{item.name}</TableCell>
                            <TableCell className="text-right text-sm">
                              <Price value={item.laundryPrice} />
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              <Price value={item.dryCleanPrice} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </div>

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
