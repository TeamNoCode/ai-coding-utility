import { Message, MessageRole, LLMSettings } from '../Frontend-types';

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;

if (!apiKey) {
    console.warn("VITE_MISTRAL_API_KEY environment variable not set. The built-in key will not be available.");
}

const roleToMistral = (role: MessageRole): 'user' | 'assistant' | 'system' => {
    if (role === MessageRole.USER) return 'user';
    if (role === MessageRole.MODEL) return 'assistant';
    return 'system';
};

interface ChatOptions {
  language: string;
  temperature: number;
  llmSettings: LLMSettings;
}

const createMistralChatSession = (options: ChatOptions, history: Message[], systemInstruction: string) => {
    const { temperature, llmSettings } = options;

    const formattedHistory = [
        { role: 'system', content: systemInstruction },
        ...history.map(msg => ({
            role: roleToMistral(msg.role),
            content: msg.content || '',
        }))
    ].filter(msg => msg.role !== 'system' || msg.content);

    return {
        async sendMessageStream(messageParts: (string | { inlineData: { mimeType: string, data: string }})[]) {
            const latestMessageText = messageParts
                .map(part => (typeof part === 'string' ? part : ''))
                .join('');

            const currentApiKey = llmSettings.useBuiltInKey ? apiKey : llmSettings.apiKey;
            if (!currentApiKey || currentApiKey.trim() === '') {
                throw new Error("Mistral API key is not configured.");
            }

            const response = await fetch(MISTRAL_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentApiKey}`,
                },
                body: JSON.stringify({
                    model: llmSettings.model,
                    messages: [...formattedHistory, { role: 'user', content: latestMessageText }],
                    temperature,
                    stream: true,
                }),
            });

            if (!response.body) {
                throw new Error("Response body is null");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            return {
                stream: (async function*() {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value);
                        const lines = chunk.split('\n\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                const data = line.substring(6);
                                if (data.trim() === '[DONE]') continue;
                                try {
                                    const parsed = JSON.parse(data);
                                    if (parsed.choices[0].delta.content) {
                                        yield { text: () => parsed.choices[0].delta.content };
                                    }
                                } catch (e) {
                                    console.error("Error parsing stream chunk", e);
                                }
                            }
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
    let systemInstruction = `You are an elite AI frontend architect and engineer...`;

    if (customPrompt && customPrompt.trim().length > 0) {
        systemInstruction += `\n\n- **Custom User Instructions:**\n${customPrompt}`;
    }

    return createMistralChatSession(options, history, systemInstruction);
};
