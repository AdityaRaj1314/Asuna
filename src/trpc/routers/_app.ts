import { router } from '../init';
import { userRouter } from './user';
import { messagesRouter } from "@/modules/messages/server/procedures";

export const appRouter = router({
    user: userRouter,
    messages: messagesRouter,
});

export type AppRouter = typeof appRouter;
