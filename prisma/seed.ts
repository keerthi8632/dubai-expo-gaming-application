import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@mhmarkets.com";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";

  if (!process.env.ADMIN_SEED_EMAIL || !process.env.ADMIN_SEED_PASSWORD) {
    console.warn(
      `\n⚠️  ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD not set in .env — using placeholder credentials (${email} / ${password}).\n   Set them in .env and re-run for a real deployment.\n`
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, role: "superadmin" },
  });

  console.log(`Admin ready: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
