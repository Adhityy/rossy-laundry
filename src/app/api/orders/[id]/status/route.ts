import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const { status, notes } = await req.json();
  const valid = ["PENDING","PICKED_UP","WASHING","READY","DELIVERED","COMPLETED"];
  if (!valid.includes(status)) return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  const order = await prisma.order.update({
    where: { id },
    data: { status, history: { create: { status, notes: notes || "" } } },
    include: { items: true, history: { orderBy: { createdAt: "desc" } } },
  });
  return NextResponse.json(order);
}
