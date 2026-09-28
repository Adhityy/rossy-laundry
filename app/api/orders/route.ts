import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { z } from "zod";

const orderSchema = z.object({
  service: z.enum(["KILOAN", "SATUAN"]),
  items: z.array(z.object({
    name: z.string(),
    qty: z.number().min(1),
    price: z.number().min(0),
  })),
  weight: z.number().optional(),
  deliveryType: z.enum(["PICKUP", "DELIVERY"]),
  deliveryFee: z.number().default(0),
  notes: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    include: { statusLogs: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = orderSchema.parse(body);

    const total = data.items.reduce((sum, item) => sum + item.price * item.qty, 0);

    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: (session.user as any).id,
        service: data.service,
        items: JSON.stringify(data.items),
        weight: data.weight,
        total: total + data.deliveryFee,
        deliveryType: data.deliveryType,
        deliveryFee: data.deliveryFee,
        notes: data.notes,
        statusLogs: { create: { status: "PENDING", note: "Pesanan dibuat" } },
      },
      include: { statusLogs: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 400 });
  }
}
