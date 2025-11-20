import { appRouter } from './routers/_app';
import { createTRPCContext } from './init';
import { headers } from 'next/headers';

export const serverClient = async () => {
    return appRouter.createCaller(
        await createTRPCContext({
            headers: await headers(),
        })
    );
};
