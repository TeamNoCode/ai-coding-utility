import { Message, LLMSettings, ProviderKey } from '../types';
import { startChatSession as startGeminiChat } from './geminiService';
import { startChatSession as startOpenAIChat } from './openaiService';
import { startChatSession as startAnthropicChat } from './anthropicService';
import { startChatSession as startMistralChat } from './mistralService';
import { startChatSession as startDeepSeekChat } from './deepseekService';

interface ChatOptions {
  language: string;
  temperature: number;
  llmSettings: LLMSettings;
}

const providerMap: Record<ProviderKey, Function> = {
    google: startGeminiChat,
    openai: startOpenAIChat,
    anthropic: startAnthropicChat,
    mistral: startMistralChat,
    deepseek: startDeepSeekChat,
};

export const startChatSession = (
    options: ChatOptions,
    history: Message[],
    customPrompt?: string
): any => {
    const { llmSettings } = options;
    const startChatFn = providerMap[llmSettings.provider];

    if (!startChatFn) {
        throw new Error(`Unsupported LLM provider: ${llmSettings.provider}`);
    }

    return startChatFn(options, history, customPrompt);
};
