// ====================================================
//  VERSION: 007-index
//  FILE: components/Message.tsx
// ====================================================

import React from 'react';
import type { Session } from '@supabase/supabase-js';
import { Message as MessageType, MessageRole } from '../types';
import { UserIcon, AiIcon, PreviewIcon, BrainCircuitIcon, RegenerateIcon, CopyIcon, BookmarkIcon } from './icons';
import CodeBlock from './CodeBlock';

interface MessageProps {
  message: MessageType;
  session: Session | null;
  onFocus: (messageId: string, mode: 'preview' | 'thoughts') => void;
  onRegenerate: (messageId: string) => void;
  onCopy: (messageId: string) => void;
  onBookmark: () => void;
}

interface ParsedTextPart {
  type: 'text';
  content: string;
}

export interface ParsedCodePart {
  type: 'code';
  language: string;
  content: string;
}

interface ParsedThinkingPart {
    type: 'thinking';
    content: string;
}

interface ParsedSuggestionsPart {
    type: 'suggestions';
    content: string[];
}

type ParsedPart = ParsedTextPart | ParsedCodePart | ParsedThinkingPart | ParsedSuggestionsPart;

const parseContent = (content: string): ParsedPart[] => {
    const parts: ParsedPart[] = [];
    let remainingContent = content;

    // 1. Extract thinking block
    const thinkingBlockRegex = /<thinking>([\s\S]*?)<\/thinking>/;
    const thinkingMatch = remainingContent.match(thinkingBlockRegex);
    if (thinkingMatch) {
        parts.push({ type: 'thinking', content: thinkingMatch[1].trim() });
        remainingContent = remainingContent.replace(thinkingBlockRegex, '');
    }
    
    // 2. Extract suggestions block
    const suggestionsBlockRegex = /<suggestions>([\s\S]*?)<\/suggestions>/;
    const suggestionsMatch = remainingContent.match(suggestionsBlockRegex);
    if (suggestionsMatch) {
        const suggestionString = suggestionsMatch[1].trim();
        const suggestions = suggestionString.split('|').map(s => s.trim()).filter(Boolean);
        if (suggestions.length > 0) {
            parts.push({ type: 'suggestions', content: suggestions });
        }
        remainingContent = remainingContent.replace(suggestionsBlockRegex, '');
    }

    // 3. Extract code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(remainingContent)) !== null) {
        // Add text before the code block
        if (match.index > lastIndex) {
            const textPart = remainingContent.substring(lastIndex, match.index).trim();
            if (textPart) parts.push({ type: 'text', content: textPart });
        }
        // Add the code block
        parts.push({ type: 'code', language: match[1] || 'plaintext', content: match[2].trim() });
        lastIndex = match.index + match[0].length;
    }
    
    // 4. Add any remaining text
    if (lastIndex < remainingContent.length) {
        const textPart = remainingContent.substring(lastIndex).trim();
        if (textPart) parts.push({ type: 'text', content: textPart });
    }

    return parts.filter(part => (part.type === 'suggestions' && part.content.length > 0) || (part.type !== 'suggestions' && part.content));
};


const Message: React.FC<MessageProps> = ({ message, session, onFocus, onRegenerate, onCopy, onBookmark }) => {
  const isUser = message.role === MessageRole.USER;
  
  const Icon = isUser ? UserIcon : AiIcon;
  const bgColor = isUser ? 'bg-gray-800' : 'bg-gray-700';

  const parts = parseContent(message.content);
  const textParts = parts.filter(part => part.type === 'text');
  const codeParts = parts.filter(part => part.type === 'code') as ParsedCodePart[];
  const thinkingParts = parts.filter(part => part.type === 'thinking');
  
  const hasCode = codeParts.length > 0;
  const hasThoughts = thinkingParts.length > 0;

  const ActionToolbar = () => (
    <div className="mt-4 flex items-center space-x-2 p-1.5 bg-gray-900/50 rounded-lg border border-gray-600/50 w-fit">
        {hasThoughts && (
            <button
                onClick={() => onFocus(message.id, 'thoughts')}
                className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-md btn-tactile"
                title="Thoughts"
            >
                <BrainCircuitIcon className="w-5 h-5" />
            </button>
        )}
        {hasCode && (
            <button
                onClick={() => onFocus(message.id, 'preview')}
                className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-md btn-tactile"
                title="Preview"
            >
                <PreviewIcon className="w-5 h-5" />
            </button>
        )}
        <button
            onClick={() => onRegenerate(message.id)}
            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-md btn-tactile"
            title="Regenerate"
        >
            <RegenerateIcon className="w-5 h-5" />
        </button>
        {hasCode && (
             <button
                onClick={() => onCopy(message.id)}
                className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-md btn-tactile"
                title="Copy"
            >
                <CopyIcon className="w-5 h-5" />
            </button>
        )}
        {!session && (
             <button
                onClick={onBookmark}
                className="p-2 text-gray-400 hover:text-indigo-400 transition-colors rounded-md btn-tactile"
                title="Bookmark"
            >
                <BookmarkIcon className="w-5 h-5" />
            </button>
        )}
    </div>
  );

  return (
    <div className={`p-4 md:p-6 ${bgColor} message-bubble`}>
      <div className="max-w-4xl mx-auto flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 overflow-hidden">
            {message.imageUrl && isUser && (
                <div className="mb-4">
                    <img src={message.imageUrl} alt="User upload" className="max-w-xs rounded-lg border border-gray-600" />
                </div>
            )}
          <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
              {textParts.map((part, index) => (
                  <p key={`text-${index}`} className="mb-4 last:mb-0">{part.content}</p>
              ))}
          </div>
            {!isUser && (hasCode || hasThoughts) && <ActionToolbar />}
            {isUser && codeParts.length > 0 && <CodeBlock parts={codeParts} />}
        </div>
      </div>
    </div>
  );
};

export default Message;
export { parseContent };