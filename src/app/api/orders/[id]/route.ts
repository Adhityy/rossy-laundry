import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { statusLogs: { orderBy: { createdAt: "asc" } } },
  });

  if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

  // Only owner or admin can view
  const role = (session.user as any).role;
  if (order.userId !== (session.user as any).id && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}
