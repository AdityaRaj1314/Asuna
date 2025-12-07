import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { helloWorld, lifeCoacAgent } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [helloWorld, lifeCoacAgent],
});
