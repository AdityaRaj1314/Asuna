import { PrismaClient } from '../app/generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'


const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

export const prisma = globalForPrisma.prisma || new PrismaClient({
    // @ts-expect-error - Prisma Accelerate requires this property but types might not be generated yet
    accelerateUrl: process.env.DATABASE_URL
}).$extends(withAccelerate())

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
