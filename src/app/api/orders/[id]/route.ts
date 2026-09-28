import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, history: { orderBy: { createdAt: "desc" } }, user: { select: { name: true, phone: true, email: true } } },
  });
  if (!order) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  if (session.user.role !== "ADMIN" && order.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(order);
}
