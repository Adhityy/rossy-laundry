"use client";
import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

/** Tab kategori + tabel tarif. Data diserver component, komponen ini cuma interaksi. */
export function PriceTabs({ items, initialCategory }: { items: PriceItem[]; initialCategory?: string }) {
  const grouped = useMemo(() => {
    const map = new Map<string, PriceItem[]>();
    for (const p of items) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return [...map.entries()];
  }, [items]);

  const [active, setActive] = useState(initialCategory ?? grouped[0]?.[0] ?? "");

  if (grouped.length === 0) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList>
        {grouped.map(([category, list]) => (
          <TabsTrigger key={category} value={category}>
            {CATEGORY_LABELS[category] ?? category}
            <span className="tabular ml-1.5 text-muted-foreground">{list.length}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {grouped.map(([category, list]) => (
        // forceMount: semua panel tetap ada di HTML (SEO harga), Radix sembunyikan yang pasif.
        <TabsContent
          key={category}
          value={category}
          forceMount
          className="mt-4 data-[state=inactive]:hidden"
        >
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
                {list.map((item) => (
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
  );
}
