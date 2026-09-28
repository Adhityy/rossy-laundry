import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@rossy.com" },
    update: {},
    create: { name: "Admin Rossy", email: "admin@rossy.com", phone: "087880568880", password: hash, role: "ADMIN" },
  });

  const custHash = await bcrypt.hash("customer123", 10);
  await prisma.user.upsert({
    where: { email: "customer@rossy.com" },
    update: {},
    create: { name: "Pelanggan Demo", email: "customer@rossy.com", phone: "081234567890", password: custHash, role: "CUSTOMER" },
  });

  console.log("Seeded!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
