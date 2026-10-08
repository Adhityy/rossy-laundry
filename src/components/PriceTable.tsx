import { Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { prisma } from "@/lib/prisma";
import { LAUNDRY_INFO, DELIVERY_FEE, MIN_ORDER_KG } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import { PriceTabs } from "@/components/PriceTabs";

// Server component: tarif ikut ter-render di HTML, bukan baru muncul setelah JS jalan.
export async function PriceTable() {
  const prices = await prisma.priceItem.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      category: true,
      name: true,
      laundryPrice: true,
      dryCleanPrice: true,
      note: true,
    },
  });

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
          <PriceTabs items={prices} />
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
