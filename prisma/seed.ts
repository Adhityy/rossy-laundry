import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PRICES } from "./prices";

const prisma = new PrismaClient();

// Akun pemilik. Ganti password lewat menu profil / ubah di DB setelah dipakai.
const OWNER_EMAIL = "owner@rossy.com";
const OWNER_PASSWORD = "2NbiWqZPxeNl6PT7";

async function seedUsers() {
  const accounts = [
    {
      name: "Admin Rossy",
      email: "admin@rossy.com",
      phone: "087880568880",
      password: "admin123",
      role: "ADMIN",
    },
    {
      name: "Pelanggan Demo",
      email: "customer@rossy.com",
      phone: "081234567890",
      password: "customer123",
      role: "CUSTOMER",
    },
    {
      name: "Pemilik Rossy",
      email: OWNER_EMAIL,
      phone: "087880568880",
      password: OWNER_PASSWORD,
      role: "ADMIN",
    },
  ];

  for (const acc of accounts) {
    const hash = await bcrypt.hash(acc.password, 10);
    await prisma.user.upsert({
      where: { email: acc.email },
      // Jangan timpa password kalau sudah diganti manual.
      update: { name: acc.name, role: acc.role, phone: acc.phone },
      create: { ...acc, password: hash },
    });
  }
}

async function seedPrices() {
  for (const [i, row] of PRICES.entries()) {
    await prisma.priceItem.upsert({
      where: { category_name: { category: row.category, name: row.name } },
      update: {
        laundryPrice: row.laundry,
        dryCleanPrice: row.dryClean,
        note: row.note ?? null,
        sortOrder: i,
        active: true,
      },
      create: {
        category: row.category,
        name: row.name,
        laundryPrice: row.laundry,
        dryCleanPrice: row.dryClean,
        note: row.note ?? null,
        sortOrder: i,
      },
    });
  }
}

async function main() {
  await seedUsers();
  await seedPrices();

  const [users, prices] = await Promise.all([
    prisma.user.count(),
    prisma.priceItem.count(),
  ]);
  const priced = await prisma.priceItem.count({
    where: { laundryPrice: { not: null } },
  });
  console.log(`Seeded! users=${users} priceItems=${prices} (berharga=${priced})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
