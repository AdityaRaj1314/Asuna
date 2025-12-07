import { z } from 'zod';
import { router, publicProcedure } from '../init';

export const userRouter = router({
    getAll: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.user.findMany({
            include: { posts: true },
        });
    }),

    getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ ctx, input }) => {
            return ctx.db.user.findUnique({
                where: { id: input.id },
                include: { posts: true },
            });
        }),

    create: publicProcedure
        .input(
            z.object({
                email: z.string().email(),
                name: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            return ctx.db.user.create({
                data: input,
            });
        }),
});
