import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  const role = session?.user ? (session.user as { role?: string }).role : undefined;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// Tarif Rupiah bulat. null = sel kosong di struk -> tampil "Hubungi", tidak dipesan online.
const price = z.number().int().min(0).max(10_000_000).nullable();

const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(60).optional(),
  laundryPrice: price.optional(),
  dryCleanPrice: price.optional(),
  active: z.boolean().optional(),
  note: z.string().max(160).nullable().optional(),
});

const bulkSchema = z.array(itemSchema).min(1).max(200);

const createSchema = z.object({
  category: z.enum(["PAKAIAN", "RUMAH_TANGGA"]),
  name: z.string().trim().min(2).max(60),
  laundryPrice: price,
  dryCleanPrice: price,
  note: z.string().max(160).optional(),
});

const select = {
  id: true,
  category: true,
  name: true,
  laundryPrice: true,
  dryCleanPrice: true,
  note: true,
  sortOrder: true,
  active: true,
} as const;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const items = await prisma.priceItem.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    select,
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan salah" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first ? `${first.path.join(".")}: ${first.message}` : "Data tidak valid" },
      { status: 400 }
    );
  }

  const d = parsed.data;
  if (d.laundryPrice === null && d.dryCleanPrice === null) {
    return NextResponse.json(
      { error: "Isi minimal satu tarif, atau ubah nanti kalau belum tahu harganya." },
      { status: 400 }
    );
  }

  try {
    const last = await prisma.priceItem.aggregate({
      where: { category: d.category },
      _max: { sortOrder: true },
    });
    const created = await prisma.priceItem.create({
      data: {
        category: d.category,
        name: d.name,
        laundryPrice: d.laundryPrice,
        dryCleanPrice: d.dryCleanPrice,
        note: d.note || null,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
      select,
    });
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Item dengan nama itu sudah ada di kategori ini." },
      { status: 409 }
    );
  }
}

export async function PATCH(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan salah" }, { status: 400 });
  }

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first ? `${first.path.join(".")}: ${first.message}` : "Data tidak valid" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(
      parsed.data.map((item) => {
        const { id, ...data } = item;
        return prisma.priceItem.update({ where: { id }, data, select });
      })
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan perubahan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan salah" }, { status: 400 });
  }

  const parsed = z.object({ id: z.string().min(1) }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "id wajib diisi" }, { status: 400 });
  }

  try {
    await prisma.priceItem.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }
}
