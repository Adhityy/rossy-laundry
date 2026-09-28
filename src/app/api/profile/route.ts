import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Batas avatar: 160x160 WebP sudah ~10 KB. 120 KB memberi ruang untuk foto bulat besar.
const MAX_AVATAR_BYTES = 120_000;

const updateSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9]{10,15}$/, "Nomor WhatsApp hanya angka, 10-15 digit")
    .nullable()
    .or(z.literal("").transform(() => null)),
  address: z.string().max(200).nullable().or(z.literal("").transform(() => null)),
  avatar: z
    .string()
    .max(MAX_AVATAR_BYTES, "Foto terlalu besar, maksimal 120 KB")
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export async function GET() {
  const session = await auth();
  const id = session?.user ? (session.user as { id?: string }).id : undefined;
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      avatar: true,
      role: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  const id = session?.user ? (session.user as { id?: string }).id : undefined;
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan salah" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first ? `${first.path.join(".")}: ${first.message}` : "Data tidak valid" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.avatar && !/^data:image\/(png|jpe?g|webp);base64,/.test(data.avatar)) {
    return NextResponse.json({ error: "Format foto tidak didukung" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        ...(data.avatar === null ? {} : { avatar: data.avatar }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan perubahan" }, { status: 500 });
  }
}
