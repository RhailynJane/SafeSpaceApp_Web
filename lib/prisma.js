// lib/prisma.js
// Runtime JS fallback that mirrors lib/prisma.ts so routes importing
// `@/lib/prisma` always receive a valid PrismaClient instance.
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

/**
 * Reuse PrismaClient in dev to avoid exhausting DB connections
 */
const prismaClient = globalForPrisma.__PRISMA__ || new PrismaClient({
	log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.__PRISMA__ = prismaClient;
}

export const prisma = prismaClient;
