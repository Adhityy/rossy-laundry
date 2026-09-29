import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ORDER_STATUSES, STATUS_CANCELLED } from "@/lib/data";
import { z } from "zod";

const ALLOWED = ORDER_STATUSES.map((s) => s.key) as readonly string[];

const schema = z.object({
  status: z.string(),
  note: z.string().optional(),
});

/**
 * Admin hanya boleh MENJURU satu langkah ke depan.
 * Tidak boleh mundur, tidak boleh melompat - supaya riwayat tahapan tidak bisa dimanipulasi.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data = schema.parse(body);

    if (!ALLOWED.includes(data.status)) {
      return NextResponse.json(
        { error: `Status tidak dikenal. Pilihan: ${ALLOWED.join(", ")}.` },
        { status: 400 }
      );
    }

    const current = await prisma.order.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }
    if (current.status === STATUS_CANCELLED) {
      return NextResponse.json(
        { error: "Pesanan dibatalkan, statusnya tidak bisa diubah." },
        { status: 400 }
      );
    }

    const from = ALLOWED.indexOf(current.status);
    const to = ALLOWED.indexOf(data.status);

    if (from < 0) {
      return NextResponse.json({ error: "Status pesanan tidak dikenal." }, { status: 400 });
    }
    if (to === from) {
      return NextResponse.json(
        { error: "Pesanan sudah berada di tahap itu." },
        { status: 400 }
      );
    }
    if (to !== from + 1) {
      const nextLabel = ORDER_STATUSES[from + 1]?.label ?? "tahap berikutnya";
      const hint =
        to < from
          ? "Status tidak bisa mundur."
          : `Hanya boleh maju satu langkah, yaitu ${nextLabel}.`;
      return NextResponse.json({ error: hint }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        statusLogs: { create: { status: data.status, note: data.note || "" } },
      },
      include: { statusLogs: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Gagal update status" }, { status: 400 });
  }
}
