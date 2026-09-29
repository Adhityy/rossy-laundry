import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePhone, phoneVariants } from "@/lib/utils";
import { lookupPhoneName } from "@/lib/osint";

/**
 * Ambil nama pemilik nomor WhatsApp - khusus admin, dipakai form pesanan datang langsung.
 *
 * Tiga sumber, berurutan, berhenti di yang pertama cocok:
 *   1. akun      - akun terdaftar di aplikasi ini (dapat email + alamat)
 *   2. catatan   - nama yang pernah admin input untuk nomor itu
 *   3. osint     - Truecaller, untuk nomor yang belum pernah tercatat sama sekali
 *
 * Hasil OSINT disimpan ke Contact supaya hitungan berikutnya instan dan tidak menghabiskan
 * kuota pencarian.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = new URL(req.url).searchParams.get("phone") ?? "";
  const variants = phoneVariants(raw);
  if (variants.length === 0) {
    return NextResponse.json({ error: "Nomor tidak valid" }, { status: 400 });
  }
  const normalized = normalizePhone(raw) || "";

  // 1. akun terdaftar
  const user = await prisma.user.findFirst({
    where: { phone: { in: variants } },
    select: { name: true, email: true, address: true, createdAt: true },
  });
  if (user) {
    return NextResponse.json({ found: true, source: "akun", ...user });
  }

  // 2. catatan lokal
  const contact = normalized
    ? await prisma.contact.findUnique({ where: { phone: normalized } })
    : null;
  if (contact) {
    return NextResponse.json({
      found: true,
      source: "catatan",
      name: contact.name,
      email: null,
      address: null,
      updatedAt: contact.updatedAt,
    });
  }

  // 3. OSINT. Hasilnya dijinakkan ke Contact supaya sekali saja hit Truecaller.
  const hit = await lookupPhoneName(normalized || raw);
  if (hit.name && normalized) {
    await prisma.contact
      .upsert({
        where: { phone: normalized },
        update: { name: hit.name },
        create: { phone: normalized, name: hit.name },
      })
      .catch(() => undefined);
    return NextResponse.json({ found: true, source: "osint", name: hit.name, email: null, address: null });
  }

  return NextResponse.json({
    found: false,
    source: "osint",
    detail: hit.detail ?? null,
  });
}
