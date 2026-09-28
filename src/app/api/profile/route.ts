import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Batas avatar: 160x160 WebP sudah ~10 KB. 120 KB memberi ruang untuk foto besar.
const MAX_AVATAR_BYTES = 120_000;

/** Ubah string kosong jadi null sebelum validasi, supaya kolom benar-benar kosong. */
const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === "" ? null : v), schema);

const updateSchema = z.object({
  // Semua opsional: field yang tidak dikirim tidak disentuh.
  name: z.string().min(2, "Nama minimal 2 karakter").max(80).optional(),
  phone: emptyToNull(
    z
      .string()
      .regex(/^[0-9]{10,15}$/, "Nomor WhatsApp hanya angka, 10-15 digit")
      .nullable()
  ).optional(),
  address: emptyToNull(z.string().max(200, "Alamat maksimal 200 karakter").nullable()).optional(),
  // null = hapus foto, undefined = tidak diubah.
  avatar: z
    .string()
    .max(MAX_AVATAR_BYTES, "Foto terlalu besar, maksimal 120 KB")
    .nullable()
    .optional(),
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

  const { name, phone, address, avatar } = parsed.data;

  if (avatar && !/^data:image\/(png|jpe?g|webp);base64,/.test(avatar)) {
    return NextResponse.json({ error: "Format foto tidak didukung" }, { status: 400 });
  }

  const data: Prisma.UserUpdateInput = {};
  if (name !== undefined) data.name = name;
  if (phone !== undefined) data.phone = phone;
  if (address !== undefined) data.address = address;
  if (avatar !== undefined) data.avatar = avatar; // null menghapus foto

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
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
