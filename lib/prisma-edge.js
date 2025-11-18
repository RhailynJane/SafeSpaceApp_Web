// lib/prisma-edge.js
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient().$extends(withAccelerate());
} else {
  if (!globalThis.prismaEdge) {
    globalThis.prismaEdge = new PrismaClient().$extends(withAccelerate());
  }
  prisma = globalThis.prismaEdge;
}

export { prisma };
