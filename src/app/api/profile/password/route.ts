import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  currentPassword: z.string().min(1, "Password sekarang wajib diisi"),
  newPassword: z.string().min(8, "Password baru minimal 8 karakter"),
});

/**
 * Ganti password saat sudah masuk.
 * Memakai password sekarang sebagai verifikasi, bukan OTP: akun sudah terotentikasi,
 * dan ini jalur yang tidak butuh layanan eksternal.
 */
export async function POST(req: Request) {
  const session = await auth();
  const id = session?.user ? (session.user as { id?: string }).id : undefined;
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!ok) {
    return NextResponse.json({ error: "Password sekarang salah" }, { status: 400 });
  }

  if (parsed.data.currentPassword === parsed.data.newPassword) {
    return NextResponse.json(
      { error: "Password baru tidak boleh sama dengan yang sekarang" },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({ where: { id }, data: { password: hash } });

  return NextResponse.json({ ok: true });
}
