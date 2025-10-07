import OpenAI from 'openai';
import { Message, MessageRole, LLMSettings } from '../types';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
    console.warn("VITE_OPENAI_API_KEY environment variable not set. The built-in key will not be available.");
}

const builtInAi = apiKey ? new OpenAI({ apiKey, dangerouslyAllowBrowser: true }) : null;

const roleToOpenAI = (role: MessageRole): 'user' | 'assistant' => {
    if (role === MessageRole.USER) return 'user';
    if (role === MessageRole.MODEL) return 'assistant';
    throw new Error(`Unsupported role for OpenAI history: ${role}`);
};

interface ChatOptions {
  language: string;
  temperature: number;
  llmSettings: LLMSettings;
}

// A mock ChatSession-like object to maintain compatibility with the existing UI
const createOpenAIChatSession = (ai: OpenAI, options: ChatOptions, history: Message[], systemInstruction: string) => {
    const { temperature, llmSettings } = options;

    const formattedHistory: { role: "user" | "assistant"; content: string; }[] = history.map(msg => ({
        role: roleToOpenAI(msg.role),
        content: msg.content || '',
    }));

    return {
        async sendMessageStream(messageParts: (string | { inlineData: { mimeType: string, data: string }})[]) {
            const latestMessageText = messageParts
                .map(part => (typeof part === 'string' ? part : ''))
                .join('');

            const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
                { role: 'system', content: systemInstruction },
                ...formattedHistory,
                { role: 'user', content: latestMessageText }
            ];

            const stream = await ai.chat.completions.create({
                model: llmSettings.model,
                messages: messages,
                temperature,
                stream: true,
            });

            return {
                stream: (async function*() {
                    for await (const chunk of stream) {
                        yield {
                            text: () => chunk.choices[0]?.delta?.content || ''
                        };
                    }
                })()
            };
        }
    };
};

export const startChatSession = (
    options: ChatOptions,
    history: Message[],
    customPrompt?: string
): any => {
    const { language, llmSettings } = options;

    let ai: OpenAI | null;

    if (!llmSettings.useBuiltInKey && llmSettings.apiKey) {
        ai = new OpenAI({ apiKey: llmSettings.apiKey, dangerouslyAllowBrowser: true });
    } else {
        ai = builtInAi;
    }

    if (!ai) {
        throw new Error("OpenAI API key is not configured. Please set it in the settings.");
    }

    let systemInstruction = `You are an elite AI frontend architect and engineer...`; // Keeping this short for brevity

    if (customPrompt && customPrompt.trim().length > 0) {
        systemInstruction += `\n\n- **Custom User Instructions:**\n${customPrompt}`;
    }

    return createOpenAIChatSession(ai, options, history, systemInstruction);
};
