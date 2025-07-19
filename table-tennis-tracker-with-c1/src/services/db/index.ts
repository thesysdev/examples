import { PrismaClient } from "../../generated/prisma";
import { initializeDb } from "./init";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();
let initialized = false;

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Initialize the database when this module is imported
(async () => {
  try {
    if (initialized) return;
    console.log("Initializing database...");
    await initializeDb(prisma);
    initialized = true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
})();

export default prisma;
