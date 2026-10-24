import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !isOwnerRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: session?.user ? 403 : 401 });
  }

  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !isOwnerRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: session?.user ? 403 : 401 });
  }

  const body = await req.json();
  const { description, amount, category, date } = body;

  if (!description || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const expenseDate =
    typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00.000Z`)
      : date === undefined
        ? new Date()
        : null;
  if (
    !expenseDate ||
    Number.isNaN(expenseDate.getTime()) ||
    (typeof date === "string" && expenseDate.toISOString().slice(0, 10) !== date)
  ) {
    return NextResponse.json({ error: "Tanggal tidak valid" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      description,
      amount,
      category: category || "OPERASIONAL",
      date: expenseDate,
    },
  });

  return NextResponse.json(expense, { status: 201 });
}