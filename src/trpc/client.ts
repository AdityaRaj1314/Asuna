import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './routers/_app';

export const trpc = createTRPCClient<AppRouter>({
    links: [
        httpBatchLink({
            url: '/api/trpc',
        }),
    ],
});
