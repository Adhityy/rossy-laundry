import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, normalizePhone } from "@/lib/utils";
import { LAUNDRY_INFO, DELIVERY_FEE, MIN_ORDER_KG } from "@/lib/data";
import { z } from "zod";

const orderSchema = z.object({
  service: z.enum(["KILOAN", "SATUAN"]),
  washType: z.enum(["LAUNDRY", "DRY_CLEAN"]).default("LAUNDRY"),
  items: z.array(z.object({
    name: z.string(),
    qty: z.number().min(1),
    // Nilai dari klien dipakai hanya untuk tampilan sementara; server menghitung ulang.
    price: z.number().min(0),
  })),
  weight: z.number().optional(),
  // Wajib untuk semua pesanan, termasuk yang tidak login - inilah kunci pencariannya.
  whatsapp: z.string().min(1, "Nomor WhatsApp wajib diisi"),
  deliveryType: z.enum(["PICKUP", "DELIVERY"]),
  pickupAddress: z.string().max(300).optional().or(z.literal("").transform(() => undefined)),
  deliveryFee: z.number().default(0),
  notes: z.string().optional(),
  // Nama pelanggan - diisi admin pada mode manual, atau dari profil pelanggan.
  customerName: z.string().trim().max(80).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = (session.user as { id: string }).id;

  // Riwayat = milik akun ini, plus pesanan yang tercatat dengan nomor WhatsApp profil
  // (misal pesanan yang dibuat saat belum login, atau input manual admin).
  const profile = await prisma.user.findUnique({
    where: { id: me },
    select: { phone: true },
  });
  const phone = normalizePhone(profile?.phone ?? "");

  const orders = await prisma.order.findMany({
    where: {
      OR: [{ userId: me }, ...(phone ? [{ whatsapp: phone }] : [])],
    },
    orderBy: { createdAt: "desc" },
    include: { statusLogs: { orderBy: { createdAt: "desc" } } },
  });

  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  // Login opsional: pesanan tamu sah selama nomor WhatsApp diisi.
  const session = await auth();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan salah" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first ? `${first.path.join(".")}: ${first.message}` : "Data tidak valid" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const whatsapp = normalizePhone(data.whatsapp);
  if (!whatsapp) {
    return NextResponse.json(
      { error: "Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx." },
      { status: 400 }
    );
  }

  // Ongkos dihitung di server, bukan dari klien.
  const deliveryFee = data.deliveryType === "DELIVERY" ? DELIVERY_FEE : 0;

  let items: { name: string; qty: number; price: number }[];
  let weight: number | null = null;

  if (data.service === "KILOAN") {
    const kg = data.weight ?? 0;
    if (!Number.isFinite(kg) || kg < MIN_ORDER_KG) {
      return NextResponse.json({ error: `Minimal order ${MIN_ORDER_KG} kg.` }, { status: 400 });
    }
    weight = kg;
    items = [{ name: "Laundry kiloan", qty: kg, price: LAUNDRY_INFO.kiloanRate }];
  } else {
    const names = [...new Set(data.items.map((i) => i.name))];
    const rows = await prisma.priceItem.findMany({
      where: { name: { in: names }, active: true },
      select: { name: true, laundryPrice: true, dryCleanPrice: true },
    });
    const byName = new Map(rows.map((r) => [r.name, r]));

    const priced: { name: string; qty: number; price: number }[] = [];
    const unavailable: string[] = [];

    for (const i of data.items) {
      const row = byName.get(i.name);
      const unit = row ? (data.washType === "LAUNDRY" ? row.laundryPrice : row.dryCleanPrice) : null;
      if (unit === null) {
        unavailable.push(i.name);
        continue;
      }
      if (!Number.isFinite(i.qty) || i.qty < 1 || i.qty > 999) {
        return NextResponse.json({ error: `Jumlah untuk ${i.name} tidak valid.` }, { status: 400 });
      }
      priced.push({ name: i.name, qty: Math.floor(i.qty), price: unit });
    }

    if (priced.length === 0 || unavailable.length > 0) {
      const msg =
        priced.length === 0
          ? "Pilih minimal satu item yang bisa dipesan."
          : `Harga untuk ${unavailable.join(", ")} tidak tersedia. Muat ulang halaman lalu coba lagi.`;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    items = priced;
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  // Pelanggan: kaitkan ke akunnya sendiri.
  // Admin: pesanan ini dibuat atas nama pelanggan lain, jadi jangan menempel ke akun admin -
  // kaitkan hanya kalau memang ada pemilik nomor yang punya akun.
  let userId: string | null = null;
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    if (role === "ADMIN") {
      const owner = await prisma.user.findFirst({ where: { phone: whatsapp } });
      userId = owner?.id ?? null;
    } else {
      userId = (session.user as { id: string }).id;
    }
  }

  try {
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        whatsapp,
        service: data.service,
        washType: data.washType,
        items: JSON.stringify(items),
        weight,
        total: subtotal + deliveryFee,
        deliveryType: data.deliveryType,
        pickupAddress: data.deliveryType === "DELIVERY" ? data.pickupAddress ?? null : null,
        deliveryFee,
        notes: data.notes,
        customerName: data.customerName || null,
        statusLogs: { create: { status: "MENUNGGU", note: "Pesanan dibuat" } },
      },
      include: { statusLogs: true },
    });

    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}
