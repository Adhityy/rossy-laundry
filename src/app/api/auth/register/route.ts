import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, phone, password: hash, role: "CUSTOMER" },
    });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (e) {
    return NextResponse.json({ error: "Gagal mendaftar" }, { status: 500 });
  }
}
