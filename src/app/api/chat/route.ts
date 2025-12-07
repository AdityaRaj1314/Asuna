import { NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an expert web developer AI assistant that helps users build complete websites and web applications. 

When a user asks you to create a website or web component:
1. Generate complete, production-ready code
2. Always provide HTML, CSS, and JavaScript in separate code blocks
3. Use modern web standards and best practices
4. Make designs beautiful, responsive, and visually appealing
5. Include all necessary code - don't use placeholders

Format your code like this:
\`\`\`html index.html
<!DOCTYPE html>
<html>
...
</html>
\`\`\`

\`\`\`css styles.css
/* Your CSS here */
\`\`\`

\`\`\`javascript script.js
// Your JavaScript here
\`\`\`

Key principles:
- Create stunning, modern designs with gradients, animations, and visual appeal
- Make all code fully functional - no placeholders or TODOs
- Use semantic HTML and clean, maintainable code
- Ensure responsive design that works on all devices
- Add interactivity and smooth user experiences

When users ask for changes, update the relevant code sections and provide the complete updated code blocks.`;

// Initialize Grok API client
const grok = new OpenAI({
    apiKey: process.env.XAI_API_KEY,
    baseURL: "https://api.x.ai/v1",
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Messages array is required" },
                { status: 400 }
            );
        }

        // Add system prompt at the beginning
        const messagesWithSystem = [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages
        ];

        // Call Grok API
        const completion = await grok.chat.completions.create({
            model: "grok-beta",
            messages: messagesWithSystem,
            temperature: 0.7,
            max_tokens: 4000,
        });

        const assistantMessage = completion.choices[0]?.message?.content || "I couldn't generate a response.";

        return NextResponse.json({
            message: assistantMessage,
            usage: completion.usage,
        });
    } catch (error: any) {
        console.error("Error calling Grok API:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get response from AI" },
            { status: 500 }
        );
    }
}
