import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { description, amount, category } = body;

  if (!description || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }

  const expense = await prisma.expense.create({
    data: {
      description,
      amount,
      category: category || "OPERASIONAL",
    },
  });

  return NextResponse.json(expense, { status: 201 });
}