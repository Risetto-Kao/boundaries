import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const isProduction = process.env.NODE_ENV === "production";
  const primary = isProduction ? process.env.DATABASE_URL : process.env.DIRECT_URL;
  const fallback = isProduction ? process.env.DIRECT_URL : process.env.DATABASE_URL;
  const connectionString = primary ?? fallback;
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL is not set");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
