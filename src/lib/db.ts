import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }

// Ensure PrismaClient is only used on the server side
if (typeof window !== 'undefined') {
  throw new Error(
    'PrismaClient is only meant to be used on the server side. Please make sure your database operations are in Server Components or Server Actions.'
  )
}