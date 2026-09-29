import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Ulasan pelanggan untuk ditampilkan di beranda. Publik, tanpa login. */
export const revalidate = 60;

export async function GET() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 24,
    select: {
      id: true,
      name: true,
      rating: true,
      comment: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ reviews });
}
