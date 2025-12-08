import { createAgent } from "@inngest/agent-kit";
import { gemini } from "@inngest/agent-kit";
import { inngest } from "./client";

export const agent = createAgent({
    name: "Life Coach",
    description: "A helpful life coach that assists users with their goals and motivation.",
    system: "You are a supportive and encouraging life coach. Help the user with their questions, offer advice, and keep them motivated.",
    model: gemini({
        model: "gemini-2.0-flash-exp",
    }),
});

export const lifeCoachAgent = inngest.createFunction(
    {
        id: "life-coach-agent",
        name: "Life Coach Agent",
    },
    {
        event: "app/chat.message",
    },
    async ({ event, step }) => {
        const result = await agent.run(event.data.message);
        return result;
    }
);
