// lib/prisma.ts
// REFERENCE:
// This Prisma client setup was generated with assistance from ChatGPT (OpenAI GPT-5)
// Prompt: help me with correct integration of PostgreSQL (via pgAdmin) with the backend and frontend.
// Purpose: Initializes and manages a singleton PrismaClient instance to interact with PostgreSQL efficiently.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"], // Logs queries, warnings, and errors
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
