// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

interface DbMetrics {
  dbResponseTime: number;
  dbQueries: number;
}

const metrics: DbMetrics = {
  dbResponseTime: 0,
  dbQueries: 0,
};

const createPrismaClient = () => {
  const prisma = new PrismaClient({
    log: ["query", "error", "warn"],
  });

  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    const duration = after - before;

    metrics.dbResponseTime += duration;
    metrics.dbQueries++;

    return result;
  });

  return prisma;
};


const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}


export const getDbMetrics = (): { avgDbResponseTime: number; totalDbQueries: number } => {
  if (metrics.dbQueries === 0) {
    return { avgDbResponseTime: 0, totalDbQueries: 0 };
  }
  return {
    avgDbResponseTime: metrics.dbResponseTime / metrics.dbQueries,
    totalDbQueries: metrics.dbQueries,
  };
};

export const resetDbMetrics = (): void => {
    metrics.dbResponseTime = 0;
    metrics.dbQueries = 0;
}