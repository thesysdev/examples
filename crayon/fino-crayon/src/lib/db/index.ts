import { PrismaClient } from "@prisma/client";
import { initializeDb } from "./init";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Initialize the database when this module is imported
(async () => {
  try {
    await initializeDb(prisma);
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
})();

export default prisma;
