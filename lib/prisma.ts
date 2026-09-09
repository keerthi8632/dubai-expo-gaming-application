import { PrismaClient } from "@prisma/client";

// Prevents creating a new PrismaClient on every hot-reload in dev
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// WAL mode lets reads keep happening while a write is in progress — useful
// with two booth screens hitting the same SQLite file at once. Only needs to
// be set once; SQLite persists the mode in the database file itself.
// PRAGMA returns a result row, so this must use $queryRawUnsafe, not
// $executeRawUnsafe (which errors on statements that return rows).
prisma.$queryRawUnsafe("PRAGMA journal_mode=WAL;").catch(() => {});
