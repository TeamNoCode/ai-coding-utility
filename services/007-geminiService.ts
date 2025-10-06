// ====================================================
//  VERSION: 007-index
//  FILE: services/007-geminiService.ts
// ====================================================

import { GoogleGenAI, Chat, Content } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../007-constants';
import { Message, MessageRole } from "../007-types";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const roleToPart = (role: MessageRole) => {
    if (role === MessageRole.USER) {
        return "user";
    }
    if (role === MessageRole.MODEL) {
        return "model";
    }
    throw new Error(`Unknown role: ${role}`);
}

export const startChatSession = (
    language: string, 
    temperature: number, 
    history: Message[],
    customPrompt?: string
): Chat => {
  let systemInstruction = `You are a world-class AI frontend development assistant. Your purpose is to help users by generating clean, efficient, and beautiful user interfaces.

- **Core Principles:**
  - **Modern Design:** Focus on creating modern, responsive, and accessible (WCAG) user interfaces.
  - **Styling:** Utilize Tailwind CSS for styling unless otherwise specified.
  - **Code Quality:** Generate clean, semantic HTML5 and write efficient, readable JavaScript/TypeScript.
  - **Image Analysis:** If the user provides an image, use it as the primary visual reference for your code generation. Analyze the layout, color scheme, components, and typography to create a faithful and functional implementation.

- **Response Format (CRITICAL):**
  You MUST follow this structure in your response:
  1. A brief, lighthearted confirmation (e.g., "Sure thing!", "You got it!").
  2. A \`<thinking>\` block that explains your plan for generating the code.
  3. The code itself, wrapped in markdown code blocks.
  4. A \`<suggestions>\` block containing 3-4 pipe-separated follow-up prompts that would enhance the generated code.

- **Example Initial Response:**
"Of course!
<thinking>
The user wants a simple login form. I'll create the basic HTML structure with email and password inputs and a submit button. I'll use Tailwind CSS for a clean, modern style and ensure the form is accessible with proper labels.
</thinking>
\`\`\`html
<!-- HTML code here -->
\`\`\`
<suggestions>Add form validation with JavaScript|Animate the button on hover|Make this a two-column layout with an image</suggestions>"

- **Generation Rules:**
  - ALWAYS generate code in the requested language: ${language === 'Auto-Detect' ? 'the language that best fits the user\'s prompt' : language}.
  - ALWAYS wrap code in a markdown block with the language identifier (e.g., \`\`\`html ... \`\`\`).
  - **Iterative Changes (IMPORTANT):** When a user asks for a change, you MUST take the code from the previous message, apply the user's requested update, and then output the ENTIRE, NEW, UNIFIED code file. DO NOT send back only the changed snippet. The user must always receive the complete code (HTML, CSS, JS) in a single response.`;

  if (customPrompt && customPrompt.trim().length > 0) {
    systemInstruction += `\n\n- **Custom User Instructions:**\n${customPrompt}`;
  }

  const formattedHistory: Content[] = history.map(msg => {
    const parts: any[] = [];
    if (msg.content) {
        parts.push({ text: msg.content });
    }

    if (msg.imageUrl) {
        const match = msg.imageUrl.match(/^data:(.+);base64,(.+)$/);
        if (match) {
            const mimeType = match[1];
            const data = match[2];
            parts.push({ inlineData: { mimeType, data } });
        }
    }

    if (parts.length === 0) {
        parts.push({ text: '' }); 
    }

    return {
        role: roleToPart(msg.role),
        parts: parts,
    };
  });

  const chat: Chat = ai.chats.create({
    model: GEMINI_MODEL_NAME,
    history: formattedHistory,
    config: {
      systemInstruction: systemInstruction,
      temperature: temperature,
    },
  });

  return chat;
};