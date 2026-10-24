import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaffRole } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !isStaffRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: session?.user ? 403 : 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true, phone: true } }, statusLogs: true },
  });

  return NextResponse.json(orders);
}
