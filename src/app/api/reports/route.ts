import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const orders = await prisma.order.findMany({ where: { status: "COMPLETED" } });
  const expenses = await prisma.expense.findMany();

  const totalIncome = orders.reduce((s, o) => s + o.totalPrice, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExpense;

  // Monthly breakdown
  const monthly: Record<string, { income: number; expense: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const key = String(m).padStart(2, "0");
    monthly[key] = { income: 0, expense: 0 };
  }
  for (const o of orders) {
    const key = String(o.createdAt.getMonth() + 1).padStart(2, "0");
    monthly[key].income += o.totalPrice;
  }
  for (const e of expenses) {
    const key = String(e.date.getMonth() + 1).padStart(2, "0");
    monthly[key].expense += e.amount;
  }
  const chartData = Object.entries(monthly).map(([month, data]) => ({
    month: "Bulan " + month, ...data, profit: data.income - data.expense,
  }));

  return NextResponse.json({ totalIncome, totalExpense, profit, totalOrders: orders.length, totalExpenses: expenses.length, chartData });
}
