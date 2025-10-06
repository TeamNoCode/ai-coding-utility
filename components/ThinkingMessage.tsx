// ====================================================
//  VERSION: 007-index
//  FILE: components/ThinkingMessage.tsx
// ====================================================

import React, { useState, useEffect } from 'react';
import { AiIcon, ThinkingIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface ThinkingMessageProps {
  streamingContent: string;
}

const thinkingPhases = [
  "Analyzing prompt...",
  "Engaging AI services...",
  "Structuring elements...",
  "Generating code...",
  "Finalizing response..."
];

const ThinkingMessage: React.FC<ThinkingMessageProps> = ({ streamingContent }) => {
  const [phase, setPhase] = useState(0);
  const [showLiveCode, setShowLiveCode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase(prev => (prev + 1) % thinkingPhases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  const hasCode = codeBlockRegex.test(streamingContent);

  return (
    <div className="p-4 md:p-6 bg-gray-700">
      <div className="max-w-4xl mx-auto flex items-start space-x-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
          <AiIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center space-x-3 mb-4">
            <ThinkingIcon className="w-6 h-6 text-indigo-400" />
            <span className="text-gray-300 italic">{thinkingPhases[phase]}</span>
          </div>

          {hasCode && (
             <div className="border-t border-gray-600 pt-3">
                 <button 
                    onClick={() => setShowLiveCode(!showLiveCode)}
                    className="flex items-center text-sm text-gray-400 hover:text-white"
                >
                    {showLiveCode ? <ChevronUpIcon className="w-4 h-4 mr-1"/> : <ChevronDownIcon className="w-4 h-4 mr-1"/>}
                    {showLiveCode ? 'Hide live code' : 'Show live code'}
                 </button>
                 {showLiveCode && (
                    <div className="mt-2 bg-gray-800 rounded-lg my-4 overflow-hidden border border-gray-700">
                        <pre className="p-4 overflow-x-auto text-sm bg-gray-900 rounded-md">
                            <code className="language-auto">
                                {streamingContent.replace('...', '')}
                            </code>
                        </pre>
                    </div>
                 )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThinkingMessage;