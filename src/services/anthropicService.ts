import Anthropic from '@anthropic-ai/sdk';
import { Message, MessageRole, LLMSettings } from '../types';

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!apiKey) {
    console.warn("VITE_ANTHROPIC_API_KEY environment variable not set. The built-in key will not be available.");
}

const builtInAi = apiKey ? new Anthropic({ apiKey }) : null;

const roleToAnthropic = (role: MessageRole): 'user' | 'assistant' => {
    if (role === MessageRole.USER) return 'user';
    if (role === MessageRole.MODEL) return 'assistant';
    throw new Error(`Unsupported role for Anthropic history: ${role}`);
};

interface ChatOptions {
  language: string;
  temperature: number;
  llmSettings: LLMSettings;
}

const createAnthropicChatSession = (ai: Anthropic, options: ChatOptions, history: Message[], systemInstruction: string) => {
    const { temperature, llmSettings } = options;

    const formattedHistory = history.map(msg => ({
        role: roleToAnthropic(msg.role),
        content: msg.content || '',
    }));

    return {
        async sendMessageStream(messageParts: (string | { inlineData: { mimeType: string, data: string }})[]) {
            const latestMessageText = messageParts
                .map(part => (typeof part === 'string' ? part : ''))
                .join('');

            const stream = await ai.messages.stream({
                model: llmSettings.model,
                system: systemInstruction,
                messages: [...formattedHistory, { role: 'user', content: latestMessageText }],
                temperature,
                max_tokens: 4096,
            });

            return {
                stream: (async function*() {
                    for await (const chunk of stream) {
                        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                            yield {
                                text: () => chunk.delta.text
                            };
                        }
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
    const { llmSettings } = options;

    let ai: Anthropic | null;

    if (!llmSettings.useBuiltInKey && llmSettings.apiKey) {
        ai = new Anthropic({ apiKey: llmSettings.apiKey });
    } else {
        ai = builtInAi;
    }

    if (!ai) {
        throw new Error("Anthropic API key is not configured. Please set it in the settings.");
    }

    let systemInstruction = `You are an elite AI frontend architect and engineer...`; // Keeping this short for brevity

    if (customPrompt && customPrompt.trim().length > 0) {
        systemInstruction += `\n\n- **Custom User Instructions:**\n${customPrompt}`;
    }

    return createAnthropicChatSession(ai, options, history, systemInstruction);
};
