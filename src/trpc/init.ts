import { initTRPC } from '@trpc/server';
import { prisma } from '@/lib/db';

// Create context for tRPC
export const createTRPCContext = async (opts: { headers: Headers }) => {
    return {
        db: prisma,
        ...opts,
    };
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
