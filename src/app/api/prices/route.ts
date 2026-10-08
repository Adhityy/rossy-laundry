import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Daftar tarif untuk form pesanan pelanggan. Publik: dibaca sebelum login.
export const revalidate = 60;

export async function GET() {
  const items = await prisma.priceItem.findMany({
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

  return NextResponse.json(items, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
  });
}
