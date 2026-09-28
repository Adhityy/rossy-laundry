import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const { description, amount, category } = await req.json();
    if (!description || !amount) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    const expense = await prisma.expense.create({ data: { description, amount: Number(amount), category: category || "OPERASIONAL" } });
    return NextResponse.json(expense);
  } catch (e) {
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}
