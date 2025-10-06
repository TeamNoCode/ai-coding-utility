// ====================================================
//  VERSION: 007-index
//  FILE: components/007-SettingsPanel.tsx
// ====================================================

import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/007-supabaseClient';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE } from '../007-constants';
import { ChatHistory } from '../007-types';
import { UserIcon, LogoutIcon, ChevronDoubleLeftIcon, ChevronDownIcon, ChevronUpIcon } from './007-icons';

interface SidePanelProps {
  session: Session | null;
  language: string;
  setLanguage: (lang: string) => void;
  temperature: number;
  setTemperature: (temp: number) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onNewChat: () => void;
  onSelectChat: (chatId: string) => void;
  activeChatId: string | null;
  onLoginClick: () => void;
  onToggle: () => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  session,
  language,
  setLanguage,
  temperature,
  setTemperature,
  customPrompt,
  setCustomPrompt,
  onNewChat,
  onSelectChat,
  activeChatId,
  onLoginClick,
  onToggle,
}) => {
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isCustomPromptOpen, setIsCustomPromptOpen] = useState(false);
  
  const fetchHistory = async () => {
    if (!session) return;
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat history:', error);
    } else {
      setHistory(data);
    }
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (session) {
      fetchHistory();
    } else {
      setHistory([]);
      setLoadingHistory(false);
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="w-80 bg-gray-900 border-r border-gray-700 p-4 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-200 truncate">AI Code Assistant</h1>
        <button 
            onClick={onToggle} 
            className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md ml-2 btn-tactile"
            aria-label="Collapse sidebar"
        >
            <ChevronDoubleLeftIcon className="w-6 h-6" />
        </button>
      </div>
      
      <button
        onClick={onNewChat}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 mb-6 btn-tactile"
      >
        + New Chat
      </button>

      <div className="flex-grow overflow-y-auto mb-4">
        <h2 className="text-lg font-semibold text-gray-400 mb-2">History</h2>
        {session ? (
            loadingHistory ? (
                <p className="text-gray-500">Loading history...</p>
            ) : (
                <ul className="space-y-2">
                    {history.map((chat) => (
                        <li key={chat.id}>
                            <button
                                onClick={() => onSelectChat(chat.id)}
                                className={`w-full text-left p-2 rounded-md truncate ${activeChatId === chat.id ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
                            >
                                {chat.title || 'Untitled Chat'}
                            </button>
                        </li>
                    ))}
                </ul>
            )
        ) : (
            <div className="text-center p-4 border border-dashed border-gray-600 rounded-md">
                <p className="text-sm text-gray-400 mb-3">Log in to save your conversations and access your chat history.</p>
                <button
                    onClick={onLoginClick}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 btn-tactile"
                >
                    Log In / Sign Up
                </button>
            </div>
        )}
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-gray-400 mb-4">Settings</h2>
        <div className="space-y-4">
            <div>
                <label htmlFor="language-select" className="block text-sm font-medium text-gray-400 mb-2">
                Language
                </label>
                <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white"
                >
                {/* FIX: Corrected a typo in the variable name from SUPPORTED_ LANGUAGES to SUPPORTED_LANGUAGES. This resolves all errors in this file. */}
                {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                    {lang}
                    </option>
                ))}
                </select>
            </div>

            <div>
              <button
                onClick={() => setIsCustomPromptOpen(!isCustomPromptOpen)}
                className="w-full flex justify-between items-center text-sm font-medium text-gray-400 mb-2"
              >
                Custom Prompt
                {isCustomPromptOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
              {isCustomPromptOpen && (
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g., Always use Vue.js and TypeScript"
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-white text-sm transition-all"
                />
              )}
            </div>

            <div>
                <label htmlFor="temperature-slider" className="block text-sm font-medium text-gray-400 mb-2">
                Creativity (Temperature)
                </label>
                <input
                id="temperature-slider"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center text-gray-400 text-sm mt-1">{temperature.toFixed(1)}</div>
            </div>
        </div>
      </div>
      
      <div className="border-t border-gray-700 mt-6 pt-4">
        {session ? (
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 overflow-hidden">
                    <UserIcon className="w-6 h-6 flex-shrink-0" />
                    <span className="truncate text-sm">{session.user.email}</span>
                </div>
                <button onClick={handleLogout} title="Log out" className="text-gray-400 hover:text-white p-1 rounded-md btn-tactile">
                    <LogoutIcon className="w-6 h-6" />
                </button>
            </div>
        ) : (
            <div className="text-center text-sm text-gray-500">
                You are browsing as a guest.
            </div>
        )}
      </div>
    </div>
  );
};

export default SidePanel;