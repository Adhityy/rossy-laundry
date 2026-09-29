import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { STATUS_CANCELLED } from "@/lib/data";
import { z } from "zod";

const cancelSchema = z.object({
  action: z.literal("cancel"),
  reason: z.string().trim().max(300).optional(),
  /** Dipakai penampil tamu: cocokkan dengan nomor WhatsApp pada pesanan. */
  phone: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

/** Siapa yang boleh melihat/menyentuh pesanan ini, dan seberapa jauh. */
async function authorize(id: string, phoneHint?: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { statusLogs: { orderBy: { createdAt: "asc" } }, review: true },
  });
  if (!order) return { kind: "not_found" as const };

  const session = await auth();
  const userId = session?.user ? (session.user as { id?: string }).id : undefined;
  const role = session?.user ? (session.user as { role?: string }).role : undefined;

  if (role === "ADMIN") return { kind: "admin" as const, order };
  if (userId && order.userId === userId) return { kind: "owner" as const, order };

  // Tamu: cocokkan nomor yang dikirimkan viewer dengan nomor pesanan.
  const hint = normalizePhone(phoneHint ?? "");
  if (hint && hint === order.whatsapp) return { kind: "phone" as const, order };

  return { kind: "forbidden" as const };
}

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const url = new URL(req.url);
  const res = await authorize(id, url.searchParams.get("phone") ?? undefined);

  if (res.kind === "not_found") {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }
  if (res.kind === "forbidden") {
    return NextResponse.json(
      { error: "Nomor WhatsApp tidak cocok dengan pesanan ini. Cari ulang lewat /orders." },
      { status: 403 }
    );
  }

  const o = res.order;
  const base = {
    id: o.id,
    orderNumber: o.orderNumber,
    whatsapp: o.whatsapp,
    service: o.service,
    washType: o.washType,
    status: o.status,
    cancelReason: o.cancelReason,
    cancelledAt: o.cancelledAt,
    deliveryType: o.deliveryType,
    pickupAddress: o.pickupAddress,
    deliveryFee: o.deliveryFee,
    items: o.items,
    weight: o.weight,
    total: o.total,
    notes: o.notes,
    createdAt: o.createdAt,
    statusLogs: o.statusLogs,
    review: o.review,
    customerName: o.customerName,
  };

  // Data pelanggan hanya untuk admin.
  if (res.kind === "admin") {
    // Pesanan tamu punya userId null - jangan coba dicari di tabel User.
    const u = o.userId
      ? await prisma.user.findUnique({
          where: { id: o.userId },
          select: { id: true, name: true, email: true, phone: true, address: true, createdAt: true },
        })
      : null;
    return NextResponse.json({ ...base, user: u });
  }

  return NextResponse.json(base);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan salah" }, { status: 400 });
  }

  const parsed = cancelSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Permintaan tidak valid" }, { status: 400 });
  }

  const url = new URL(req.url);
  const phoneHint = parsed.data.phone ?? url.searchParams.get("phone") ?? undefined;
  const res = await authorize(id, phoneHint);

  if (res.kind === "not_found") {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }
  if (res.kind === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = res.order;

  if (order.status === STATUS_CANCELLED) {
    return NextResponse.json({ error: "Pesanan sudah dibatalkan." }, { status: 400 });
  }
  // Pelanggan hanya boleh membatalkan selama masih Menunggu.
  // Admin boleh membatalkan sampai pesanan benar-benar selesai.
  if (res.kind !== "admin" && order.status !== "MENUNGGU") {
    return NextResponse.json(
      { error: "Pesanan sudah diproses dan tidak bisa dibatalkan." },
      { status: 400 }
    );
  }

  const reason = parsed.data.reason?.trim();

  // Admin wajib mencantumkan alasan; pelanggan boleh membatalkan tanpa alasan.
  if (res.kind === "admin" && !reason) {
    return NextResponse.json({ error: "Alasan pembatalan wajib diisi." }, { status: 400 });
  }

  try {
    const updated = await prisma.order.update({
      where: { id },
      data: {
        status: STATUS_CANCELLED,
        cancelReason: reason || null,
        cancelledAt: new Date(),
        statusLogs: {
          create: {
            status: STATUS_CANCELLED,
            note: reason || (res.kind === "admin" ? "Dibatalkan admin" : "Dibatalkan pelanggan"),
          },
        },
      },
      include: { statusLogs: { orderBy: { createdAt: "asc" } } },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Gagal membatalkan pesanan" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
