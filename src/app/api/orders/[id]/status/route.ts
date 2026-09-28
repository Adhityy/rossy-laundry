import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  status: z.string(),
  note: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data = schema.parse(body);

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: data.status,
        statusLogs: { create: { status: data.status, note: data.note || "" } },
      },
      include: { statusLogs: true },
    });

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: "Gagal update status" }, { status: 400 });
  }
}
