// ====================================================
//  VERSION: 007-index
//  FILE: components/ChatInterface.tsx
// ====================================================

// FIX: Corrected the React import to include useState, useEffect, and useRef, and fixed the syntax error. This resolves all "Cannot find name" errors in this file.
import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import type { Session } from '@supabase/supabase-js';
import { Message, MessageRole, LLMSettings } from '../types';
import { startChatSession } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import SidePanel from './SettingsPanel';
import MessageComponent, { parseContent, ParsedCodePart } from './Message';
import ThinkingMessage from './ThinkingMessage';
import CodeBlock from './CodeBlock';
import { SendIcon, ChevronDoubleRightIcon, CloseIcon, SparklesIcon, BrainCircuitIcon, PreviewIcon, UndoIcon, RedoIcon, PlusIcon, XCircleIcon } from './icons';
import { DEFAULT_LANGUAGE, DEFAULT_TEMPERATURE } from '../constants';
import SettingsModal from './SettingsModal';

interface ChatInterfaceProps {
    session: Session | null;
    onLoginClick: () => void;
}

type FocusMode = 'preview' | 'thoughts';

interface FocusPanelProps {
    messages: Message[];
    focusedMessageId: string | null;
    focusMode: FocusMode;
    onClose: () => void;
    onUndo: () => void;
    canUndo: boolean;
    onRedo: () => void;
    canRedo: boolean;
}

const WELCOME_PROMPTS = [
    "Design a responsive portfolio with a bento grid.",
    "Create an interactive product card with a 3D hover effect.",
    "Build a modern SaaS landing page with a frosted glass header.",
    "Write a JavaScript function to fetch data from an API and display it."
];

const FocusPanel: React.FC<FocusPanelProps> = ({ messages, focusedMessageId, focusMode, onClose, onUndo, canUndo, onRedo, canRedo }) => {
    const [codeParts, setCodeParts] = useState<ParsedCodePart[]>([]);
    const [thinkingContent, setThinkingContent] = useState<string | null>(null);

    const focusedMessage = messages.find(m => m.id === focusedMessageId);

    useEffect(() => {
        // This effect gets the content for the focus panel.
        // Since the AI now sends the *complete* code every time, we only need to
        // look at the currently focused message. No need to accumulate from history.
        if (!focusedMessage) {
            setCodeParts([]);
            setThinkingContent(null);
            return;
        }

        const parsedContent = parseContent(focusedMessage.content);
        
        const currentThinking = parsedContent.find(p => p.type === 'thinking');
        setThinkingContent(currentThinking ? currentThinking.content as string : null);

        const currentCode = parsedContent.filter(p => p.type === 'code') as ParsedCodePart[];
        setCodeParts(currentCode);

    }, [focusedMessageId, messages]); // Depend on messages to re-render on undo
    
    const panelTitle = focusMode === 'thoughts' ? "AI Thought Process" : "Generated Output";
    const TitleIcon = focusMode === 'thoughts' ? BrainCircuitIcon : PreviewIcon;

    return (
        <div className="flex flex-col h-full bg-gray-800">
            <header className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-900 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <TitleIcon className="w-5 h-5 text-gray-400" />
                    <h2 className="text-lg font-semibold text-gray-300">{panelTitle}</h2>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onUndo} 
                        disabled={!canUndo}
                        className="p-1 text-gray-400 hover:text-white rounded-md disabled:text-gray-600 disabled:cursor-not-allowed btn-tactile"
                        title="Undo last change"
                    >
                        <UndoIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={onRedo} 
                        disabled={!canRedo}
                        className="p-1 text-gray-400 hover:text-white rounded-md disabled:text-gray-600 disabled:cursor-not-allowed btn-tactile"
                        title="Redo last change"
                    >
                        <RedoIcon className="w-5 h-5" />
                    </button>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-md btn-tactile">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
            </header>
            <div className="flex-grow overflow-y-auto p-4">
                {focusMode === 'preview' && (
                    codeParts.length > 0 ? (
                        <CodeBlock parts={codeParts} />
                    ) : (
                        <p className="text-gray-400">No code found in this message.</p>
                    )
                )}
                {focusMode === 'thoughts' && (
                     thinkingContent ? (
                        <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap">
                            <p>{thinkingContent}</p>
                        </div>
                    ) : (
                        <p className="text-gray-400">No thought process was found for this message.</p>
                    )
                )}
            </div>
        </div>
    )
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ session, onLoginClick }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [undoneMessages, setUndoneMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [temperature, setTemperature] = useState<number>(DEFAULT_TEMPERATURE);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidePanelVisible, setIsSidePanelVisible] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<FocusMode>('preview');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  const [llmSettings, setLlmSettings] = useState<LLMSettings>(() => {
    try {
      const saved = localStorage.getItem('llmSettings');
      return saved ? JSON.parse(saved) : { provider: 'google', model: 'gemini-2.5-flash', apiKey: '', useBuiltInKey: true };
    } catch (error) {
      console.error("Failed to parse LLM settings from localStorage", error);
      return { provider: 'google', model: 'gemini-2.5-flash', apiKey: '', useBuiltInKey: true };
    }
  });

  useEffect(() => {
    localStorage.setItem('llmSettings', JSON.stringify(llmSettings));
  }, [llmSettings]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setUndoneMessages([]);
    setInput('');
    setImage(null);
    setFocusedMessageId(null);
    setSuggestedReplies([]);
  };

  const handleSelectChat = async (chatId: string) => {
    if (!session) return;
    setActiveChatId(chatId);
    setMessages([]);
    setUndoneMessages([]);
    setFocusedMessageId(null);
    setSuggestedReplies([]);
    setIsLoading(true);

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at');
    
    setIsLoading(false);
    if (error) {
        console.error("Error fetching messages:", error);
        setMessages([{ id: `err-${Date.now()}`, role: MessageRole.MODEL, content: "Error: Could not load chat history." }]);
    } else {
        const loadedMessages = data.map(msg => ({ id: msg.id, role: msg.role as MessageRole, content: msg.content, imageUrl: msg.image_url }));
        setMessages(loadedMessages);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, focusedMessageId]);
  
  useEffect(() => {
    if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
        textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [input]);
  
  const handleFocus = (messageId: string, mode: FocusMode) => {
    setFocusedMessageId(messageId);
    setFocusMode(mode);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            alert('Only JPEG, PNG, and WEBP images are supported.');
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
      setImage(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  };

  const handleSendMessage = async (messageContent?: string, imageContent?: string | null) => {
    const currentInput = messageContent ?? input;
    const currentImage = imageContent !== undefined ? imageContent : image;
    if ((!currentInput.trim() && !currentImage) || isLoading) return;
    
    if (llmSettings.provider !== 'google') {
        alert(`The ${llmSettings.provider} provider is not yet implemented in this demo. Please select Google Gemini in the provider settings.`);
        return;
    }

    setUndoneMessages([]); // Clear redo stack on new message
    setSuggestedReplies([]);
    const userMessage: Message = { 
        id: `user-${Date.now()}`, 
        role: MessageRole.USER, 
        content: currentInput,
        imageUrl: currentImage || undefined
    };

    if (!messageContent) {
      setInput('');
      removeImage();
    }
    
    let currentChatId = activeChatId;

    if (session) {
        if (!currentChatId) {
            const { data, error } = await supabase
                .from('chats').insert({ user_id: session.user.id, title: currentInput.substring(0, 40) || 'Image Prompt' }).select().single();
            
            if (error) {
                console.error("Error creating new chat:", error);
                setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: MessageRole.MODEL, content: `Error: Could not save chat. ${error.message}` }]);
                return;
            }
            currentChatId = data.id;
            setActiveChatId(currentChatId);
        }
        
        if (!currentChatId) return;

        await supabase.from('messages').insert({ chat_id: currentChatId, role: MessageRole.USER, content: currentInput, image_url: currentImage });
    }
    
    setMessages((prev) => [...prev, userMessage]);
    const historyForAI = [...messages, userMessage];

    const placeholderId = `model-${Date.now()}`;
    setMessages((prev) => [...prev, { id: placeholderId, role: MessageRole.MODEL, content: '' }]);
    setIsLoading(true);

    try {
        const chatOptions = { language, temperature, llmSettings };
        const chatSession = startChatSession(
            chatOptions,
            historyForAI,
            customPrompt
        );

        const messageParts: (string | { inlineData: { mimeType: string, data: string }})[] = [];
        if (currentInput) {
            messageParts.push(currentInput);
        }
        if (currentImage) {
            const match = currentImage.match(/^data:(.+);base64,(.+)$/);
            if (match) {
                const mimeType = match[1];
                const data = match[2];
                messageParts.push({ inlineData: { mimeType, data } });
            }
        }
        
        const stream = await chatSession.sendMessageStream({ message: messageParts.length > 0 ? messageParts : '' });

        let text = '';
        for await (const chunk of stream) {
            text += chunk.text;
            setMessages((prev) => prev.map(m => m.id === placeholderId ? { ...m, content: text + '...' } : m));
        }

        const finalContent = text.trim();
        const finalAiMessage: Message = { id: placeholderId, role: MessageRole.MODEL, content: finalContent };
        
        setMessages((prev) => prev.map(m => m.id === placeholderId ? finalAiMessage : m));
        
        const parsedParts = parseContent(finalContent);
        const codeParts = parsedParts.filter(p => p.type === 'code');
        const suggestionsPart = parsedParts.find(p => p.type === 'suggestions');
        
        if (suggestionsPart) {
            setSuggestedReplies(suggestionsPart.content as string[]);
        }

        if (codeParts.length > 0) {
            handleFocus(finalAiMessage.id, 'preview');
        }

        if (session && currentChatId) {
            await supabase.from('messages').insert({ chat_id: currentChatId, role: MessageRole.MODEL, content: finalContent });
        }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      const errorAiMessage = { id: placeholderId, role: MessageRole.MODEL, content: `Error: ${errorMessage}` };
      setMessages((prev) => prev.map(m => m.id === placeholderId ? errorAiMessage : m));
      setSuggestedReplies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (e.target.value.length > 0) {
        setSuggestedReplies([]);
    }
  };

  const canUndo = !isLoading && messages.length >= 2 && messages[messages.length - 1].role === MessageRole.MODEL && messages[messages.length - 2].role === MessageRole.USER;
  const canRedo = !isLoading && undoneMessages.length > 0;

  const handleUndo = async () => {
    if (!canUndo) return;
    
    const lastTwoMessages = messages.slice(-2);
    setUndoneMessages(prev => [...lastTwoMessages, ...prev]); // Add to redo stack

    const messagesToKeep = messages.slice(0, -2);
    setMessages(messagesToKeep);

    let newFocusId = null;
    let newSuggestions: string[] = [];
    for (let i = messagesToKeep.length - 1; i >= 0; i--) {
        const msg = messagesToKeep[i];
        if (msg.role === MessageRole.MODEL) {
            const parts = parseContent(msg.content);
            if (newFocusId === null && parts.some(p => p.type === 'code' || p.type === 'thinking')) {
                newFocusId = msg.id;
            }
            if(newSuggestions.length === 0) {
                 const suggestionsPart = parts.find(p => p.type === 'suggestions');
                 if(suggestionsPart) newSuggestions = suggestionsPart.content as string[];
            }
            if(newFocusId !== null && newSuggestions.length > 0) break;
        }
    }
    
    setFocusedMessageId(newFocusId);
    setSuggestedReplies(newSuggestions);
  };
  
  const handleRedo = () => {
    if (!canRedo) return;

    const messagesToRestore = undoneMessages.slice(0, 2);
    const remainingUndone = undoneMessages.slice(2);

    const newMessages = [...messages, ...messagesToRestore];
    setMessages(newMessages);
    setUndoneMessages(remainingUndone);

    const restoredAiMessage = messagesToRestore[1];
    const parts = parseContent(restoredAiMessage.content);
    if (parts.some(p => p.type === 'code' || p.type === 'thinking')) {
        const mode = parts.some(p => p.type === 'code') ? 'preview' : 'thoughts';
        handleFocus(restoredAiMessage.id, mode);
    }
    const suggestionsPart = parts.find(p => p.type === 'suggestions');
    if (suggestionsPart) {
        setSuggestedReplies(suggestionsPart.content as string[]);
    } else {
        setSuggestedReplies([]);
    }
  };

  const handleCopy = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const parts = parseContent(message.content);
    const codeParts = parts.filter(p => p.type === 'code') as ParsedCodePart[];

    if (codeParts.length === 0) return;

    const createUnifiedCodeString = (parts: ParsedCodePart[]): string => {
        if (parts.length === 1) return parts[0].content;
        
        const hasWebContent = parts.some(p => ['html', 'javascript', 'css'].includes(p.language.toLowerCase()));
        if (hasWebContent) {
            const html = parts.find(p => p.language.toLowerCase() === 'html')?.content || '<!-- No HTML provided -->';
            const css = parts.filter(p => p.language.toLowerCase() === 'css').map(p => p.content).join('\n\n');
            const js = parts.filter(p => p.language.toLowerCase() === 'javascript').map(p => p.content).join('\n\n');
            
            let content = html;
            if (css) content += `\n\n<style>\n${css}\n</style>`;
            if (js) content += `\n\n<script>\n${js}\n</script>`;
            return content.trim();
        }
        return parts.map(p => `/*--- ${p.language.toUpperCase()} ---*/\n\n${p.content}`).join('\n\n');
    };
    
    const codeToCopy = createUnifiedCodeString(codeParts);

    try {
      await navigator.clipboard.writeText(codeToCopy);
      alert("Code copied to clipboard!"); 
    } catch (err) {
      console.error('Failed to copy text: ', err);
      alert("Failed to copy code.");
    }
  };

  const handleRegenerate = async (messageId: string) => {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex < 1 || messages[messageIndex].role !== MessageRole.MODEL) return;
      
      const userMessage = messages[messageIndex - 1];
      if (userMessage.role !== MessageRole.USER) return;
      
      const historyForNewGeneration = messages.slice(0, messageIndex - 1);
      setMessages(historyForNewGeneration);

      await handleSendMessage(userMessage.content, userMessage.imageUrl || null);
  };
  
  const handleBookmark = () => {
    if (!session) {
        onLoginClick();
    }
  };

  return (
    <>
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSettings={llmSettings}
        onSave={setLlmSettings}
      />
      <div className="flex h-screen">
        <div className={`transition-all duration-300 ease-in-out flex-shrink-0 ${isSidePanelVisible ? 'w-80' : 'w-0'}`}>
          <div className="w-80 h-full overflow-hidden">
              <SidePanel
                  session={session}
                  language={language}
                  setLanguage={setLanguage}
                  temperature={temperature}
                  setTemperature={setTemperature}
                  customPrompt={customPrompt}
                  setCustomPrompt={setCustomPrompt}
                  onNewChat={handleNewChat}
                  onSelectChat={handleSelectChat}
                  activeChatId={activeChatId}
                  onLoginClick={onLoginClick}
                  onToggle={() => setIsSidePanelVisible(false)}
                  onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
              />
          </div>
        </div>
        <div className="flex-1 flex flex-col lg:flex-row bg-gray-800 min-w-0">
          <div className={`flex flex-col h-full relative ${focusedMessageId ? 'w-full lg:w-1/2' : 'w-full'}`}>
              {!isSidePanelVisible && (
                  <button 
                      onClick={() => setIsSidePanelVisible(true)} 
                      className="absolute top-4 left-4 z-20 p-2 bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white rounded-md transition-colors btn-tactile"
                      aria-label="Open sidebar"
                  >
                      <ChevronDoubleRightIcon className="w-6 h-6" />
                  </button>
              )}
              <main className="flex-1 overflow-y-auto">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                    <div className="text-4xl mb-4">🤖</div>
                    <h1 className="text-2xl font-bold mb-6">AI Code Assistant</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                      {WELCOME_PROMPTS.map((prompt, i) => (
                          <button key={i} onClick={() => handleSendMessage(prompt)} className="text-left p-4 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-sm btn-tactile">
                              <p className="font-semibold text-gray-200">{prompt.split('.')[0]}.</p>
                          </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((msg, index) => {
                  const isLastMessage = index === messages.length - 1;
                  if (isLastMessage && isLoading) {
                      return <ThinkingMessage key={msg.id} streamingContent={msg.content} />
                  }
                  return <MessageComponent 
                    key={msg.id} 
                    message={msg}
                    session={session}
                    onFocus={handleFocus}
                    onRegenerate={handleRegenerate}
                    onCopy={handleCopy}
                    onBookmark={handleBookmark}
                  />;
                })}
                <div ref={messagesEndRef} />
              </main>

              <footer className="p-4 bg-gray-800 border-t border-gray-700 flex-shrink-0">
                <div className="max-w-4xl mx-auto">
                  {suggestedReplies.length > 0 && !isLoading && (
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <SparklesIcon className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                          {suggestedReplies.map((reply, index) => (
                              <button
                                  key={index}
                                  onClick={() => handleSendMessage(reply)}
                                  className="px-3 py-1 bg-gray-600 text-gray-200 text-sm rounded-full hover:bg-gray-500 transition-colors btn-tactile"
                              >
                                  {reply}
                              </button>
                          ))}
                      </div>
                  )}
                  {image && (
                      <div className="relative w-fit mb-2 p-2 bg-gray-700 rounded-lg">
                          <img src={image} alt="Upload preview" className="max-h-24 rounded-md" />
                          <button 
                              onClick={removeImage} 
                              className="absolute -top-2 -right-2 bg-gray-900 rounded-full text-gray-400 hover:text-white btn-tactile"
                              aria-label="Remove image"
                          >
                              <XCircleIcon className="w-6 h-6" />
                          </button>
                      </div>
                  )}
                  <div className="flex items-end bg-gray-700 rounded-lg p-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/png, image/jpeg, image/webp"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                      className="p-2 text-gray-400 hover:text-white rounded-md disabled:opacity-50 btn-tactile"
                      aria-label="Attach image"
                    >
                      <PlusIcon className="w-6 h-6" />
                    </button>
                    <textarea
                      ref={textAreaRef}
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Ask me to code anything..."
                      rows={1}
                      className="flex-1 bg-transparent resize-none focus:outline-none p-2 max-h-48"
                      disabled={isLoading}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || (!input.trim() && !image)}
                      className="bg-indigo-600 text-white p-2 rounded-md disabled:bg-gray-500 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors duration-200 ml-2 btn-tactile"
                      aria-label="Send message"
                    >
                      <SendIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </footer>
          </div>
          
          {focusedMessageId && (
              <div className="w-full lg:w-1/2 h-full flex flex-col border-t lg:border-t-0 lg:border-l border-gray-700 flex-shrink-0 focus-panel-animation">
                  <FocusPanel 
                    messages={messages} 
                    focusedMessageId={focusedMessageId} 
                    focusMode={focusMode}
                    onClose={() => setFocusedMessageId(null)}
                    onUndo={handleUndo}
                    canUndo={canUndo}
                    onRedo={handleRedo}
                    canRedo={canRedo}
                  />
              </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ChatInterface;
