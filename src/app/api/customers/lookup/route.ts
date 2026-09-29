import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/utils";

/**
 * Ambil nama pemilik nomor WhatsApp - khusus admin, dipakai form pesanan manual.
 *
 * Batasannya jujur: nama hanya bisa diambil dari akun yang terdaftar di aplikasi.
 * Nama tampilan WhatsApp butuh API WhatsApp Cloud (berbayar) atau WhatsApp Web tidak resmi
 * (butuh server always-on, melanggar ToS) - keduanya tidak dipakai di sini.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = new URL(req.url).searchParams.get("phone") ?? "";
  const phone = normalizePhone(raw);
  if (!phone) {
    return NextResponse.json({ error: "Nomor tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: { phone },
    select: { name: true, email: true, address: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ found: false });
  }
  return NextResponse.json({ found: true, ...user });
}
