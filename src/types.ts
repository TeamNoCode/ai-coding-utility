export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  imageUrl?: string;
}

export interface ChatHistory {
    id: string;
    title: string;
    user_id: string;
    created_at: string;
}

export type ProviderKey = 'google' | 'openai' | 'anthropic' | 'mistral' | 'deepseek';

export interface LLMSettings {
  provider: ProviderKey;
  model: string;
  apiKey: string;
  useBuiltInKey?: boolean;
}
