// ====================================================
//  VERSION: codr-src
//  FILE: src/codr-src-types.ts
// ====================================================

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