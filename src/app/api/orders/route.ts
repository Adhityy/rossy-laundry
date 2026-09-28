import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const where = session.user.role === "ADMIN" ? {} : { userId: (session.user as any).id };
  const orders = await prisma.order.findMany({
    where,
    include: { items: true, history: { orderBy: { createdAt: "desc" } }, user: { select: { name: true, phone: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { items, isPickup, pickupAddress, deliveryAddress, notes } = body;
    const userId = (session.user as any).id;
    const totalWeight = items.reduce((s: number, i: any) => s + i.quantity, 0);
    const totalPrice = items.reduce((s: number, i: any) => s + i.subtotal, 0);
    const orderNumber = "RSL-" + Date.now().toString(36).toUpperCase();
    const order = await prisma.order.create({
      data: {
        userId, orderNumber, isPickup, pickupAddress, deliveryAddress, notes,
        totalWeight, totalPrice,
        items: { create: items.map((i: any) => ({ name: i.name, quantity: i.quantity, unit: i.unit, price: i.price, subtotal: i.subtotal })) },
        history: { create: { status: "PENDING", notes: "Pesanan diterima" } },
      },
      include: { items: true },
    });
    return NextResponse.json(order);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}
