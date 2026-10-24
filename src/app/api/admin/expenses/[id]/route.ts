import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isOwnerRole } from "@/lib/roles";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !isOwnerRole(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: session?.user ? 403 : 401 });
  }

  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}