// ====================================================
//  VERSION: codr-src
//  FILE: src/components/codr-src-ThinkingMessage.tsx
// ====================================================

import React, { useState, useEffect } from 'react';
import { AiIcon, ThinkingIcon, ChevronDownIcon, ChevronUpIcon } from './codr-src-icons';

interface ThinkingMessageProps {
  streamingContent: string;
}

const buildingSteps = [
  "Sketching out the wireframe...",
  "Choosing a color palette...",
  "Structuring the HTML layout...",
  "Crafting semantic HTML tags...",
  "Building the navigation bar...",
  "Styling the header...",
  "Implementing responsive breakpoints...",
  "Applying Tailwind CSS classes...",
  "Writing custom CSS variables...",
  "Adding a hero section...",
  "Placing call-to-action buttons...",
  "Creating the form elements...",
  "Structuring bento boxes...",
  "Adding margins and padding...",
  "Working on the typography...",
  "Selecting web fonts...",
  "Adding interactive hover effects...",
  "Animating transitions...",
  "Placing the reviews section...",
  "Building the footer...",
  "Ensuring WCAG accessibility...",
  "Adding ARIA attributes...",
  "Writing JavaScript for interactivity...",
  "Optimizing image assets...",
  "Polishing the final details...",
  "Finalizing the component...",
  "Creating the card layout...",
  "Styling buttons...",
  "Adjusting line heights...",
  "Refactoring the CSS...",
];


const ThinkingMessage: React.FC<ThinkingMessageProps> = ({ streamingContent }) => {
  const [currentStep, setCurrentStep] = useState(buildingSteps[0]);
  const [showLiveCode, setShowLiveCode] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prevStep => {
        let newStep;
        do {
          newStep = buildingSteps[Math.floor(Math.random() * buildingSteps.length)];
        } while (newStep === prevStep);
        return newStep;
      });
    }, 1500);
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
            <span className="text-gray-300 italic">{currentStep}</span>
          </div>

          {hasCode && (
             <div className="border-t border-gray-600 pt-3">
                 <button 
                    onClick={() => setShowLiveCode(!showLiveCode)}
                    className="flex items-center text-sm text-gray-400 hover:text-white btn-tactile"
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