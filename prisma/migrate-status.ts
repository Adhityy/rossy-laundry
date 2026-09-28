import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

/** 0878... -> 628788... ; hasil "" kalau tidak valid */
function normalizePhone(raw: string | null | undefined): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

// Tahap lama (7) -> tahap baru (4)
const STATUS_MAP: Record<string, string> = {
  PENDING: "MENUNGGU",
  WASHING: "DIPROSES",
  DRYING: "DIPROSES",
  IRONING: "DIPROSES",
  PACKING: "DIPROSES",
  READY: "SIAP_DIAMBIL",
  COMPLETED: "SELESAI",
};

async function main() {
  const orders = await p.order.findMany({
    include: { user: { select: { phone: true, name: true } } },
  });
  console.log(` pesanan ditemukan: ${orders.length}\n`);

  let waFilled = 0;
  let waMissing: string[] = [];
  let statusChanged = 0;
  let logsChanged = 0;

  for (const o of orders) {
    const updates: Record<string, unknown> = {};

    // 1) whatsapp
    if (!o.whatsapp) {
      const phone = normalizePhone(o.user?.phone);
      if (phone) {
        updates.whatsapp = phone;
        waFilled++;
      } else {
        waMissing.push(`${o.orderNumber} (${o.user?.name ?? "tanpa akun"})`);
      }
    }

    // 2) status pesanan
    const mapped = STATUS_MAP[o.status];
    if (mapped && mapped !== o.status) {
      updates.status = mapped;
      statusChanged++;
      console.log(`  status ${o.orderNumber}: ${o.status} -> ${mapped}`);
    }

    if (Object.keys(updates).length > 0) {
      await p.order.update({ where: { id: o.id }, data: updates });
    }

    // 3) status log
    const logs = await p.orderStatusLog.findMany({ where: { orderId: o.id } });
    for (const log of logs) {
      const m = STATUS_MAP[log.status];
      if (m && m !== log.status) {
        await p.orderStatusLog.update({ where: { id: log.id }, data: { status: m } });
        logsChanged++;
      }
    }
  }

  console.log(`\n whatsapp diisi dari akun : ${waFilled}`);
  console.log(` status pesanan dipetakan  : ${statusChanged}`);
  console.log(` status log dipetakan      : ${logsChanged}`);
  if (waMissing.length) {
    console.log(`\n PERLU TANGAN - whatsapp kosong, tidak ada nomor di akunnya:`);
    for (const s of waMissing) console.log(`   - ${s}`);
  }

  const stillEmpty = await p.order.count({ where: { whatsapp: "" } });
  const badStatus = await p.order.count({
    where: { status: { notIn: ["MENUNGGU", "DIPROSES", "SIAP_DIAMBIL", "SELESAI", "DIBATALKAN"] } },
  });
  console.log(`\n sisa whatsapp kosong     : ${stillEmpty}`);
  console.log(` sisa status di luar daftar: ${badStatus}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
