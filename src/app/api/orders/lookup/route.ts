import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const raw = (url.searchParams.get("q") ?? "").trim();

  if (raw.length < 4) {
    return NextResponse.json({ error: "Masukkan nomor resi atau nomor WhatsApp." }, { status: 400 });
  }

  const phone = normalizePhone(raw);
  const resi = /^RL-\d{6}-\d{4}$/i.test(raw) ? raw.toUpperCase() : null;

  if (!phone && !resi) {
    return NextResponse.json(
      { error: "Format tidak dikenali. Gunakan nomor resi atau nomor WhatsApp." },
      { status: 400 }
    );
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        ...(resi ? [{ orderNumber: resi }] : []),
        ...(phone ? [{ whatsapp: phone }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
      whatsapp: true,
      service: true,
      washType: true,
      status: true,
      cancelReason: true,
      cancelledAt: true,
      deliveryType: true,
      pickupAddress: true,
      deliveryFee: true,
      items: true,
      weight: true,
      total: true,
      notes: true,
      createdAt: true,
      statusLogs: { orderBy: { createdAt: "asc" }, select: { id: true, status: true, note: true, createdAt: true } },
    },
  });

  return NextResponse.json({ orders, matchedBy: resi ? "resi" : "whatsapp" });
}
