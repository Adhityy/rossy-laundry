import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      custom_field1, // <-- Ambil ID asli dari sini
    } = body;

    // 1. VERIFIKASI KEAMANAN (Wajib!)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const input = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const expectedSignature = crypto
      .createHash("sha512")
      .update(input)
      .digest("hex");

    if (expectedSignature !== signature_key) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // 2. JIKA PEMBAYARAN SUKSES
    if (transaction_status === "settlement" || transaction_status === "capture") {
      
      // Gunakan custom_field1 (ID Asli) kalau ada. Kalau nggak ada, fallback ke order_id
      const originalOrderNumber = custom_field1 || order_id;

      // Cari pesanan berdasarkan orderNumber yang asli
      const order = await prisma.order.findUnique({
        where: { orderNumber: originalOrderNumber },
      });

      if (order) {
        await prisma.order.update({
          where: { orderNumber: originalOrderNumber },
          data: {
            statusPembayaran: "LUNAS",
            metodePembayaran: "QRIS",
            dibayarPada: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}