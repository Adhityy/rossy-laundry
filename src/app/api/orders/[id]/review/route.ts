import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3, "Tulis sedikit ulasan").max(500),
  /** Nama yang ditampilkan di beranda. Opsional - kalau kosong, diambil dari pesanan. */
  name: z.string().trim().max(40).optional(),
  /** Dipakai penampil tamu: cocokkan dengan nomor WhatsApp pada pesanan. */
  phone: z.string().optional(),
});

type Ctx = { params: Promise<{ id: string }> };

async function authorize(id: string, phoneHint?: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { review: true },
  });
  if (!order) return { kind: "not_found" as const };

  const session = await auth();
  const userId = session?.user ? (session.user as { id?: string }).id : undefined;
  const role = session?.user ? (session.user as { role?: string }).role : undefined;

  if (role === "ADMIN") return { kind: "admin" as const, order };
  if (userId && order.userId === userId) return { kind: "owner" as const, order };

  const hint = normalizePhone(phoneHint ?? "");
  if (hint && hint === order.whatsapp) return { kind: "phone" as const, order };

  return { kind: "forbidden" as const };
}

/** Ulasan yang sudah ada untuk pesanan ini (untuk menampilkan ulasan lama). */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const phone = new URL(req.url).searchParams.get("phone") ?? undefined;
  const res = await authorize(id, phone);

  if (res.kind === "not_found") {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }
  if (res.kind === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ review: res.order.review ?? null });
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan salah" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first ? first.message : "Data tidak valid" },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const res = await authorize(id, parsed.data.phone ?? url.searchParams.get("phone") ?? undefined);

  if (res.kind === "not_found") {
    return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
  }
  if (res.kind === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const order = res.order;

  if (order.status !== "SELESAI") {
    return NextResponse.json(
      { error: "Penilaian baru bisa diberikan setelah pesanan selesai." },
      { status: 400 }
    );
  }
  if (order.review) {
    return NextResponse.json(
      { error: "Pesanan ini sudah dinilai." },
      { status: 409 }
    );
  }

  // Nama pengulas: dari yang dikirim, lalu pesanan, lalu akun, terakhir nomor tersamar.
  let name = parsed.data.name?.trim() || order.customerName?.trim();
  if (!name && order.userId) {
    const u = await prisma.user.findUnique({
      where: { id: order.userId },
      select: { name: true },
    });
    name = u?.name;
  }
  if (!name) {
    const tail = order.whatsapp.slice(-4);
    name = `Pelanggan ••${tail}`;
  }

  try {
    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        name,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Pesanan ini sudah dinilai." },
      { status: 409 }
    );
  }
}
