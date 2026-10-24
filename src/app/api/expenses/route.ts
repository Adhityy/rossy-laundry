import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole } from "@/lib/roles";
import { z } from "zod";

const schema = z.object({
  description: z.string().min(1),
  amount: z.number().min(0),
  category: z.string(),
  date: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !isOwnerRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: session?.user ? 403 : 401 });
  }

  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !isOwnerRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: session?.user ? 403 : 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        amount: data.amount,
        category: data.category,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menambah pengeluaran" }, { status: 400 });
  }
}
