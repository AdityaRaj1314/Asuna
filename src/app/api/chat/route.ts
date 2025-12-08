import { NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// ... (SYSTEM_PROMPT remains the same, I won't repeat it in the tool call if I use replace_file_content with range, but better to be safe and use view_file to get context or just replace the specific function)

const SYSTEM_PROMPT = `You are an expert web developer AI assistant that helps users build complete websites and web applications.

When a user asks you to create a website or web component:
1. **Generate complete, production-ready code**
2. **Always provide HTML, CSS, and JavaScript in separate, correctly labeled code blocks**:
   - \`\`\`html index.html\`\`\`
   - \`\`\`css styles.css\`\`\`
   - \`\`\`javascript script.js\`\`\`
3. **Use Modern Tech Stack via CDN**:
   - Use **Tailwind CSS** for styling: \`<script src="https://cdn.tailwindcss.com"></script>\`
   - Use **Google Fonts** (e.g., Inter, Poppins) for premium typography.
   - Use **FontAwesome** for icons: \`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">\`
   - Use **GSAP** (GreenSock) for complex animations if needed: \`<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>\`

4. **Design Requirements (CRITICAL)**:
   - **Aesthetics**: Create stunning, "dribbble-ready" designs. Use deep gradients, glassmorphism, subtle borders, and glow effects.
   - **Interactivity**: The app MUST feel alive. Add hover effects, smooth transitions, and entry animations for all elements.
   - **Layout**: Fully responsive, mobile-first, and polished.
   - **Theme**: Default to a premium Dark Mode or a vibrant, modern palette.
   - **Content**: NO placeholders like "Lorem Ipsum". Use realistic, engaging text and data.

Format your code EXACTLY like this:

\`\`\`html index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>App</title>
    <!-- Include CDNs here -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    fontFamily: { sans: ['Inter', 'sans-serif'] },
                    colors: {
                        primary: '#8b5cf6', // Example modern color
                        secondary: '#ec4899',
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gray-900 text-white font-sans antialiased">
    <!-- Your Content -->
</body>
</html>
\`\`\`

\`\`\`css styles.css
/* Custom animations or utilitarian overrides */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

body {
    font-family: 'Inter', sans-serif;
}
/* Add smooth scrolling and custom scrollbars */
\`\`\`

\`\`\`javascript script.js
// Logic and Animations
// Example of entry animation
document.addEventListener('DOMContentLoaded', () => {
    gsap.from("body", { opacity: 0, duration: 1, ease: "power2.out" });
});
\`\`\`

Key principles:
- **WOW Factor**: The user must be impressed immediately.
- **Completeness**: All buttons must work (even if just alerting), forms should validate, navigation should be responsive.
- **Clean Code**: Write semantic, accessible HTML.
- **No Chatty Commentary**: After generating the code, stop. Do not explain the code unless asked.`;

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: "Messages array is required" },
                { status: 400 }
            );
        }

        // Get the Gemini model with system instruction
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: SYSTEM_PROMPT,
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
        });

        // Convert messages to Gemini format
        // Filter to only user and assistant messages, ensuring we start with user
        const geminiMessages = messages
            .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
            .map((msg: any) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
            }));

        // Gemini requires history to start with user message
        // If the first message isn't from user, we have a problem
        if (geminiMessages.length > 0 && geminiMessages[0].role !== "user") {
            return NextResponse.json(
                { error: "Chat must start with a user message" },
                { status: 400 }
            );
        }

        // Split into history (all but last) and current message (last)
        const chatHistory = geminiMessages.slice(0, -1);
        const lastMessage = geminiMessages[geminiMessages.length - 1];

        if (!lastMessage || lastMessage.role !== "user") {
            return NextResponse.json(
                { error: "Last message must be from user" },
                { status: 400 }
            );
        }

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 8000,
                temperature: 0.7,
            },
        });

        // Call Gemini API with the last user message
        const result = await chat.sendMessage(lastMessage.parts[0].text);
        const response = await result.response;

        console.log("Finish Reason:", response.candidates?.[0]?.finishReason);
        console.log("Usage:", response.usageMetadata);

        const assistantMessage = response.text();

        return NextResponse.json({
            message: assistantMessage,
            usage: {
                prompt_tokens: result.response.usageMetadata?.promptTokenCount || 0,
                completion_tokens: result.response.usageMetadata?.candidatesTokenCount || 0,
                total_tokens: result.response.usageMetadata?.totalTokenCount || 0,
            },
        });
    } catch (error: any) {
        console.error("Error calling Gemini API:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get response from AI" },
            { status: 500 }
        );
    }
}
